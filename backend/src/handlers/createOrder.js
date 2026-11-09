/**
 * Lambda Handler: POST /orders
 * Validates and saves orders to the existing DynamoDB table.
 */

import { randomUUID } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamoClient.js';
import { buildResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const ORDERS_PARTITION_KEY = process.env.ORDERS_PARTITION_KEY;
const ORDERS_SORT_KEY = process.env.ORDERS_SORT_KEY;

function isNonEmptyString(value, maxLength = 200) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export async function handler(event, context) {
  logger.info('Received POST /orders request', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });

  if (!ORDERS_TABLE || !ORDERS_PARTITION_KEY) {
    logger.error('Missing order table or partition key configuration');
    return buildResponse(500, {
      error: 'ConfigurationError',
      message: 'DynamoDB order table key configuration is missing.',
    });
  }

  let body;
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body;
    body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (error) {
    logger.warn('Invalid JSON payload in POST /orders', { errorName: error.name });
    return buildResponse(400, {
      error: 'InvalidJSON',
      message: 'Request body must be valid JSON.',
    });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Request body must be a JSON object.',
    });
  }

  const { items, amount, paymentMethod, shippingAddress } = body;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Order must contain between 1 and 100 items.',
    });
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Order amount must be a valid positive number.',
    });
  }

  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'A valid shippingAddress object is required.',
    });
  }

  const validItems = items.every(item =>
    item &&
    typeof item === 'object' &&
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    isNonEmptyString(item.name) &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 1000
  );
  if (!validItems) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Each item must include an id, name, valid price, and positive integer quantity.',
    });
  }

  const addressFields = ['name', 'phone', 'address', 'locality', 'city', 'state', 'pincode', 'type'];
  const requiredAddressFields = ['name', 'phone', 'address', 'pincode'];
  if (requiredAddressFields.some(field => !isNonEmptyString(shippingAddress[field], 500))) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Shipping address must include a name, phone, street address, and postal code.',
    });
  }

  if (addressFields.some(field =>
    shippingAddress[field] !== undefined &&
    (typeof shippingAddress[field] !== 'string' || shippingAddress[field].length > 500)
  )) {
    return buildResponse(400, {
      error: 'ValidationError',
      message: 'Shipping address fields must be strings no longer than 500 characters.',
    });
  }

  const orderId = `OD${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const orderRecord = {
    [ORDERS_PARTITION_KEY]: orderId,
    ...(ORDERS_SORT_KEY ? { [ORDERS_SORT_KEY]: createdAt } : {}),
    orderId,
    items: items.map(item => ({
      id: item.id,
      name: item.name.trim(),
      price: item.price,
      quantity: item.quantity,
      category: isNonEmptyString(item.category) ? item.category.trim() : 'General',
      image: typeof item.image === 'string' ? item.image : '',
      customDeal: typeof item.customDeal === 'string' ? item.customDeal : null,
    })),
    amount,
    paymentMethod: isNonEmptyString(paymentMethod, 100) ? paymentMethod.trim() : 'Online Payment',
    shippingAddress: Object.fromEntries(
      addressFields.map(field => [
        field,
        typeof shippingAddress[field] === 'string' ? shippingAddress[field].trim() : '',
      ])
    ),
    status: 'Order Confirmed',
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    estimatedDelivery: 'Tomorrow, by 8:00 PM',
    createdAt,
  };

  try {
    logger.info('Saving order to DynamoDB', {
      table: ORDERS_TABLE,
      orderId,
      itemCount: items.length,
      requestId: context.awsRequestId,
    });

    await docClient.send(new PutCommand({
      TableName: ORDERS_TABLE,
      Item: orderRecord,
      ConditionExpression: 'attribute_not_exists(#partitionKey)',
      ExpressionAttributeNames: { '#partitionKey': ORDERS_PARTITION_KEY },
    }));

    logger.info('Successfully saved order to DynamoDB', {
      table: ORDERS_TABLE,
      orderId,
      requestId: context.awsRequestId,
    });

    return buildResponse(201, {
      success: true,
      orderId,
      order: orderRecord,
      message: 'Order created and saved successfully in DynamoDB.',
    });
  } catch (error) {
    logger.error('Failed to save order to DynamoDB', error, {
      table: ORDERS_TABLE,
      orderId,
      requestId: context.awsRequestId,
    });

    if (error.name === 'ConditionalCheckFailedException') {
      return buildResponse(409, {
        error: 'DuplicateOrder',
        message: 'An order with this identifier already exists.',
      });
    }

    return buildResponse(500, {
      error: 'DynamoDBError',
      message: 'Failed to record order into DynamoDB.',
    });
  }
}
