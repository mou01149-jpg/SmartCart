/**
 * Standardized API Gateway JSON response builder with CORS headers.
 */

export function buildResponse(statusCode, body, customHeaders = {}) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*';

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      ...customHeaders,
    },
    body: JSON.stringify(body),
  };
}
