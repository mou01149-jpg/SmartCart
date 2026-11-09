# SmartCart AWS backend

## Connect the existing Lambda without deploying new AWS resources

For an existing Lambda Function URL or API Gateway endpoint, no SAM deployment or ZIP upload is needed:

1. In the AWS Lambda console, open the existing API function and update its code with the contents of the repository-root `index.mjs`. Set the handler to `index.handler` if that matches the function's entry point. The handler uses the existing `SmartCartProducts` table by default; otherwise set `PRODUCTS_TABLE=SmartCartProducts` in the function's environment. Keep the function in the same AWS Region as the table.
2. Keep the function's existing execution role. Ensure it has `dynamodb:Scan` permission on the existing `SmartCartProducts` table ARN and normal CloudWatch Logs permissions. Do not put AWS credentials in the frontend.
3. Configure CORS on the existing endpoint to allow the Amplify site origin and the `Content-Type` and `Authorization` headers. For the Lambda handler, set `CORS_ALLOW_ORIGIN` to the exact Amplify origin (no trailing slash). For a Function URL, configure that origin, `GET`/`POST`, and those headers in its console settings (the URL handles OPTIONS preflight). For API Gateway, configure the existing API to allow `GET`/`POST`/`OPTIONS` and those headers.
4. Set `VITE_API_BASE_URL` to the existing Function URL (for example `https://abc.lambda-url.ap-south-1.on.aws`) or API Gateway base URL including its stage (for example `https://abc.execute-api.ap-south-1.amazonaws.com/prod`). Set it in local `.env` for development and in **Amplify Console → App settings → Environment variables** for the hosted site. Optionally set `VITE_CLOUDFRONT_URL` to the existing image distribution if DynamoDB stores S3 object keys.
5. Rebuild/redeploy the frontend through the existing Amplify hosting workflow after changing Amplify environment variables.

The Products page requests `GET /products` from the configured endpoint every time it loads and when **Refresh products** is selected. The Lambda scans all pages of the existing table and returns the product records. Each record must have `id` (or `productId`/`sku`), `name` (or `productName`), `category`, and numeric `price`; `image` or `imageUrl` can be a full URL or an object key served through the existing CloudFront distribution. An absent image displays a placeholder. The original eight frontend catalog products are also retained: database records replace matching IDs, while new database products are added. If the API is unavailable, the original catalog remains visible with an error and retry option; an empty table returns the empty state.

## Optional SAM deployment guide

The remaining sections describe the separate SAM template. They are not required when updating and reusing an existing Lambda/API.

This SAM application adds API Gateway and two Node.js 22 Lambda functions to the existing SmartCart deployment. It does not create DynamoDB tables, S3 buckets, or CloudFront distributions. Lambda uses the existing `SmartCartLambdaRole`; the stack attaches a policy limited to `Scan` on the configured products table, `PutItem` on the configured orders table, and CloudWatch Logs for the two named functions.

Product images remain private in the existing S3 bucket and should be served through the existing CloudFront distribution with its origin access configured. Lambda does not need S3 access to return image keys/URLs, and this project does not add a public bucket policy or a new upload route.

## Prerequisites

- AWS CLI configured with a profile allowed to deploy CloudFormation/SAM and attach a policy to `SmartCartLambdaRole`.
- AWS SAM CLI and Node.js installed.
- Existing `SmartCartLambdaRole` in the same AWS account and region as the DynamoDB tables. Its trust policy must allow `lambda.amazonaws.com` to assume it.
- The existing products and orders table names and key schemas.

Use the AWS CLI to inspect table schemas before deploying; these commands do not change resources:

```powershell
$env:AWS_REGION = "your-region"
aws dynamodb describe-table --table-name "your-products-table" --region $env:AWS_REGION --query "Table.{KeySchema:KeySchema,AttributeDefinitions:AttributeDefinitions}" --output json
aws dynamodb describe-table --table-name "your-orders-table" --region $env:AWS_REGION --query "Table.{KeySchema:KeySchema,AttributeDefinitions:AttributeDefinitions}" --output json
aws iam get-role --role-name SmartCartLambdaRole --query "Role.Arn" --output text
```

`OrdersPartitionKeyName` must be the existing order table partition key attribute that can contain the generated string order ID. If the table has a sort key, this implementation supports a String sort key storing the server-generated ISO `createdAt` value; set `OrdersSortKeyName` to that attribute. If the existing sort key has a different type or purpose, adapt the order record to that schema before deploying.

## Build and deploy

Run from the repository root in PowerShell. The script asks for the existing table names, reads their key schemas and the IAM role ARN using AWS CLI, validates that the order table has supported String keys, then builds and deploys with SAM. No manual ZIP creation or upload is needed.

```powershell
$env:AWS_REGION = "your-region"
npm run deploy
```

If you use a named AWS CLI profile:

```powershell
npm run deploy -- -Profile your-aws-profile
```

The script defaults CORS to `https://main.d24nduuqu9magt.amplifyapp.com`; it also asks for the image CloudFront URL. The SAM `--resolve-s3` option manages a private deployment-artifact bucket for Lambda packages; this is separate from the existing product-image bucket and does not change its access settings.

The deploying AWS identity must be authorized to update the existing role's inline policies (`iam:PutRolePolicy` and `iam:DeleteRolePolicy`). Review the CloudFormation change set; the stack adds only the API, Lambdas, and the scoped policy. It does not alter existing data tables or buckets.

After deployment, copy the `SmartCartApiEndpoint` output. Set the following build-time variables in the local `.env` for development and in **Amplify Console → App settings → Environment variables** for the hosted site:

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.your-region.amazonaws.com/prod
VITE_CLOUDFRONT_URL=https://your-existing-cloudfront-distribution.cloudfront.net
```

The CloudFront value is separate from the Amplify website origin. It can be left empty if product records already contain their final image URLs.

## API behavior

- `GET /products` scans and paginates the existing products table. Product records should include the fields used by the current UI (`id` or `productId`, `name`, `category`, `price`, `image`); an S3 object key in `image` is resolved through `CloudFrontUrl`.
- `POST /orders` validates the checkout payload and stores it in the existing orders table using the configured key attributes. The API does not process payments; the existing checkout payment UI remains a client-side simulation.
- Errors are returned without internal AWS exception details. CloudWatch logs include request IDs and operation metadata, not address, phone, card, or other customer details.
- Product listing can use the current local catalog when the API is not yet available. Checkout requires the API and will report an error rather than showing a false successful order.

Do not put AWS credentials in frontend environment variables. AWS CLI profiles are for local deployment only; Lambda obtains AWS credentials from `SmartCartLambdaRole`.
