param(
  [string]$Profile = $env:AWS_PROFILE
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-AwsJson {
  param([string[]]$Arguments)

  $awsArguments = @()
  if ($Profile) {
    $awsArguments += @('--profile', $Profile)
  }
  $awsArguments += $Arguments

  $output = & aws @awsArguments
  if ($LASTEXITCODE -ne 0) {
    throw "AWS CLI command failed: aws $($Arguments -join ' ')"
  }
  return ($output -join "`n") | ConvertFrom-Json
}

function Get-TableKey {
  param(
    [string]$TableName,
    [string]$KeyType,
    [object[]]$AttributeDefinitions
  )

  $key = $script:TableSchemas[$TableName].Table.KeySchema |
    Where-Object { $_.KeyType -eq $KeyType } |
    Select-Object -First 1
  if (-not $key) {
    if ($KeyType -eq 'RANGE') {
      return $null
    }
    throw "Could not determine the $KeyType key for DynamoDB table '$TableName'."
  }

  $definition = $AttributeDefinitions |
    Where-Object { $_.AttributeName -eq $key.AttributeName } |
    Select-Object -First 1
  if (-not $definition -or $definition.AttributeType -ne 'S') {
    throw "Table '$TableName' key '$($key.AttributeName)' must have DynamoDB type String (S) for this integration."
  }

  return $key.AttributeName
}

foreach ($tool in @('aws', 'sam')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool is not installed or is not on PATH. Install the AWS CLI and AWS SAM CLI, then reopen the terminal."
  }
}

$region = $env:AWS_REGION
if (-not $region -and $Profile) {
  $region = (& aws configure get region --profile $Profile).Trim()
}
if (-not $region) {
  $region = Read-Host 'AWS region (for example ap-south-1)'
}
if ($region -notmatch '^[a-z]{2}(-gov)?-[a-z]+-\d$') {
  throw "Invalid AWS region '$region'. Set AWS_REGION or enter a valid region."
}

$productsTable = Read-Host 'Existing products table name'
$ordersTable = Read-Host 'Existing orders table name'
if (-not $productsTable -or -not $ordersTable -or $productsTable -eq $ordersTable) {
  throw 'Enter two distinct, non-empty existing DynamoDB table names.'
}

$originDefault = 'https://main.d24nduuqu9magt.amplifyapp.com'
$originInput = Read-Host "Amplify website origin [$originDefault]"
$origin = if ($originInput) { $originInput.TrimEnd('/') } else { $originDefault }
$originUri = $null
if (-not [Uri]::TryCreate($origin, [UriKind]::Absolute, [ref]$originUri) -or
    $originUri.Scheme -ne 'https' -or $originUri.AbsolutePath -ne '/') {
  throw 'CORS origin must be an HTTPS origin without a path, for example https://main.example.amplifyapp.com.'
}

$cloudFrontUrlInput = Read-Host 'Existing product-image CloudFront URL (press Enter to skip)'
$cloudFrontUrl = $cloudFrontUrlInput.TrimEnd('/')
if ($cloudFrontUrl) {
  $cloudFrontUri = $null
  if (-not [Uri]::TryCreate($cloudFrontUrl, [UriKind]::Absolute, [ref]$cloudFrontUri) -or
      $cloudFrontUri.Scheme -ne 'https' -or $cloudFrontUri.AbsolutePath -ne '/') {
    throw 'CloudFront URL must be an HTTPS distribution origin without a path.'
  }
  if ($cloudFrontUrl -eq $origin) {
    throw 'The CloudFront image URL must be the image distribution, not the Amplify website origin.'
  }
}

$awsRegionArgs = @('--region', $region)
if ($Profile) {
  $awsRegionArgs += @('--profile', $Profile)
}
$script:TableSchemas = @{}
foreach ($tableName in @($productsTable, $ordersTable)) {
  $describeArgs = @('dynamodb', 'describe-table', '--table-name', $tableName) + $awsRegionArgs
  $script:TableSchemas[$tableName] = Invoke-AwsJson -Arguments $describeArgs
}

$ordersHashKey = Get-TableKey -TableName $ordersTable -KeyType 'HASH' `
  -AttributeDefinitions $script:TableSchemas[$ordersTable].Table.AttributeDefinitions
$ordersRangeKey = Get-TableKey -TableName $ordersTable -KeyType 'RANGE' `
  -AttributeDefinitions $script:TableSchemas[$ordersTable].Table.AttributeDefinitions

$roleArgs = @('iam', 'get-role', '--role-name', 'SmartCartLambdaRole', '--query', 'Role.Arn', '--output', 'text')
if ($Profile) {
  $roleArgs += @('--profile', $Profile)
}
$roleArn = (& aws @roleArgs).Trim()
if ($LASTEXITCODE -ne 0 -or -not $roleArn.StartsWith('arn:')) {
  throw 'Unable to retrieve the existing SmartCartLambdaRole ARN.'
}

Write-Host "Using region: $region"
Write-Host "Products table: $productsTable (partition key: $productsHashKey)"
Write-Host "Orders table: $ordersTable (partition key: $ordersHashKey; sort key: $(if ($ordersRangeKey) { $ordersRangeKey } else { 'none' }))"
Write-Host "Lambda execution role: $roleArn"

$samProfileArgs = @()
if ($Profile) {
  $samProfileArgs += @('--profile', $Profile)
}
$buildArgs = @('build', '--template-file', 'backend\template.yaml') + $samProfileArgs
& sam @buildArgs
if ($LASTEXITCODE -ne 0) {
  throw 'SAM build failed. Review the build output above.'
}

$sortKeyValue = if ($ordersRangeKey) { $ordersRangeKey } else { '' }
$parameterOverrides = @(
  "ParameterKey=ExistingLambdaRoleArn,ParameterValue=$roleArn"
  'ParameterKey=ExistingLambdaRoleName,ParameterValue=SmartCartLambdaRole'
  "ParameterKey=ProductsTableName,ParameterValue=$productsTable"
  "ParameterKey=OrdersTableName,ParameterValue=$ordersTable"
  "ParameterKey=OrdersPartitionKeyName,ParameterValue=$ordersHashKey"
  "ParameterKey=OrdersSortKeyName,ParameterValue=$sortKeyValue"
  "ParameterKey=CloudFrontUrl,ParameterValue=$cloudFrontUrl"
  "ParameterKey=CorsAllowOrigin,ParameterValue=$origin"
)
$deployArgs = @(
  'deploy',
  '--template-file', '.aws-sam\build\template.yaml',
  '--stack-name', 'smartcart-backend',
  '--region', $region,
  '--capabilities', 'CAPABILITY_IAM',
  '--resolve-s3',
  '--parameter-overrides'
) + $parameterOverrides + $samProfileArgs

& sam @deployArgs
if ($LASTEXITCODE -ne 0) {
  throw 'SAM deployment failed. Review the deployment output above.'
}
