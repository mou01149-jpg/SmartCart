/**
 * CloudWatch Structured Logger for AWS Lambda
 * Formats logs as JSON for CloudWatch Logs Insights.
 * Automatically sanitizes sensitive keys (tokens, cards, auth, passwords).
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'cvv',
  'cardnumber',
  'creditcard',
  'authorization',
  'key',
  'cookie',
  'email',
  'phone',
  'address',
  'customername',
  'shippingaddress',
];

function sanitize(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitize(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...sanitize(meta),
    }));
  },

  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...sanitize(meta),
    }));
  },

  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      errorName: error?.name,
      errorMessage: error?.message,
      errorCode: error?.$metadata?.httpStatusCode || error?.code,
      ...sanitize(meta),
    }));
  },
};
