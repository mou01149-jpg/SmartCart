/**
 * AWS SDK for JavaScript v3 DynamoDB Document Client
 * Utilizes execution role credentials automatically provided by AWS Lambda (SmartCartLambdaRole).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

const client = new DynamoDBClient(region ? { region } : {});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});
