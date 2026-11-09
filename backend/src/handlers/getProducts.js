/**
 * Lambda Handler: GET /products
 * Reads products from existing DynamoDB table and attaches CloudFront URLs.
 */

import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamoClient.js';
import { buildResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const CLOUDFRONT_URL = (process.env.CLOUDFRONT_URL || '').replace(/\/$/, '');

export async function handler(event, context) {
  logger.info('Received GET /products request', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });

  if (!PRODUCTS_TABLE) {
    logger.error('Missing PRODUCTS_TABLE environment variable configuration');
    return buildResponse(500, {
      error: 'ConfigurationError',
      message: 'DynamoDB products table name is not configured on the backend Lambda.',
    });
  }

  try {
    const scanParams = {
      TableName: PRODUCTS_TABLE,
    };

    // Optional category filtering via query string (?category=Fashion)
    const category = event.queryStringParameters?.category;
    if (category && category !== 'All') {
      scanParams.FilterExpression = '#cat = :cat';
      scanParams.ExpressionAttributeNames = { '#cat': 'category' };
      scanParams.ExpressionAttributeValues = { ':cat': category };
    }

    logger.info('Querying DynamoDB for products', {
      table: PRODUCTS_TABLE,
      filteredCategory: category || 'All',
    });

    const rawItems = [];
    let lastEvaluatedKey;
    do {
      const result = await docClient.send(new ScanCommand({
        ...scanParams,
        ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
      }));
      rawItems.push(...(result.Items || []));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Format products and resolve CloudFront image URLs if an S3 key is stored
    const formattedProducts = rawItems.map(item => {
      let imageUrl = item.image;

      // If the image is stored as an S3 key (e.g. "products/shirt.png") and CloudFront is configured:
      if (CLOUDFRONT_URL && imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        const cleanKey = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        imageUrl = `${CLOUDFRONT_URL}/${cleanKey}`;
      }

      return {
        ...item,
        // Ensure id is a number if numeric
        id: typeof (item.id ?? item.productId) === 'string' && !isNaN(Number(item.id ?? item.productId))
          ? Number(item.id ?? item.productId)
          : item.id ?? item.productId,
        image: imageUrl,
      };
    });

    // Sort by id for consistent catalog ordering
    formattedProducts.sort((a, b) => {
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return a.id - b.id;
      }
      return String(a.id).localeCompare(String(b.id));
    });

    logger.info('Successfully retrieved products from DynamoDB', {
      table: PRODUCTS_TABLE,
      count: formattedProducts.length,
      requestId: context.awsRequestId,
    });

    return buildResponse(200, {
      products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    logger.error('Failed to retrieve products from DynamoDB', error, {
      table: PRODUCTS_TABLE,
      requestId: context.awsRequestId,
    });

    return buildResponse(500, {
      error: 'DynamoDBError',
      message: 'Failed to retrieve products from DynamoDB.',
    });
  }
}
