/**
 * SmartCart API Module
 * Handles all communication with the backend / AWS services.
 * AWS credentials are NEVER stored here – only in server-side Lambda functions.
 */

const API_URL = import.meta.env.VITE_API_URL || '';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function isAwsConfigured() {
  return Boolean(API_URL && API_URL.trim() !== '');
}

async function apiRequest(path, options = {}) {
  if (!isAwsConfigured()) {
    throw new Error('AWS API URL is not configured. Set VITE_API_URL in your .env file.');
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ──────────────────────────────────────────────
// Products API
// ──────────────────────────────────────────────

/**
 * Fetch product list from the backend.
 * Falls back to static local data if AWS isn't configured.
 */
export async function getProducts() {
  if (!isAwsConfigured()) {
    // Return local static data (imported at call-site from data/products.js)
    return null;
  }
  return apiRequest('/products');
}

// ──────────────────────────────────────────────
// Image Upload API
// ──────────────────────────────────────────────

/**
 * Upload a captured/uploaded image to AWS S3 via Lambda.
 * @param {Blob|File} imageBlob - The image to upload
 * @returns {Promise<{ imageUrl: string, key: string }>}
 */
export async function uploadImage(imageBlob) {
  if (!isAwsConfigured()) {
    throw new Error(
      'Camera is working locally. AWS analysis is not configured yet.'
    );
  }

  // Convert Blob → base64
  const base64 = await blobToBase64(imageBlob);
  return apiRequest('/upload', {
    method: 'POST',
    body: JSON.stringify({ image: base64, contentType: imageBlob.type || 'image/jpeg' }),
  });
}

// ──────────────────────────────────────────────
// Virtual Try-On / AI Analysis API
// ──────────────────────────────────────────────

/**
 * Send an uploaded image + product selection to AWS Rekognition/AI service.
 * The actual AI processing happens in Lambda – never in this frontend file.
 *
 * Flow:
 *   Camera → React → AWS Lambda → S3 → Rekognition/AI → Result → SmartCart UI
 *
 * @param {string} imageKey   - S3 key of the uploaded image
 * @param {string} productId  - ID of the selected product
 * @returns {Promise<{ resultUrl: string, analysis: object }>}
 */
export async function analyzeImage(imageKey, productId) {
  if (!isAwsConfigured()) {
    throw new Error(
      'Camera is working locally. AWS analysis is not configured yet.'
    );
  }
  return apiRequest('/analyze', {
    method: 'POST',
    body: JSON.stringify({ imageKey, productId }),
  });
}

// ──────────────────────────────────────────────
// Orders API (future use)
// ──────────────────────────────────────────────

/**
 * Submit an order to the backend.
 * @param {object} orderData
 */
export async function submitOrder(orderData) {
  if (!isAwsConfigured()) {
    throw new Error('AWS API URL is not configured.');
  }
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { isAwsConfigured };
