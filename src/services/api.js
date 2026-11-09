/**
 * SmartCart AWS API Client
 * Connects frontend to AWS Lambda & API Gateway backed by Amazon DynamoDB.
 *
 * Rules:
 * - Uses VITE_API_BASE_URL environment variable.
 * - Does NOT hardcode credentials or IAM keys.
 * - Never reports an order as saved unless the backend confirms it.
 */

import { resolveProductImage } from '../utils/imageResolver.js';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/+$/, '');

function endpointUrl(path) {
  return API_BASE_URL.endsWith(path)
    ? API_BASE_URL
    : `${API_BASE_URL}${path}`;
}

async function getErrorMessage(response) {
  const body = await response.text();

  if (body) {
    try {
      const data = JSON.parse(body);
      if (data.message) return data.message;
      if (data.error) return data.error;
    } catch {
      return body;
    }
  }

  return `Request failed with status ${response.status}.`;
}

/**
 * Fetch products from DynamoDB via the existing Lambda API
 * GET /products
 */
export async function fetchProducts({ signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      'The product API is not configured. Set VITE_API_BASE_URL to your existing Lambda Function URL or API base URL.'
    );
  }

  let response;
  try {
    response = await fetch(endpointUrl('/products'), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'Could not reach the product API. Check the Lambda URL, network connection, and API CORS settings.'
    );
  }

  if (!response.ok) {
    throw new Error(`Could not load products: ${await getErrorMessage(response)}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The product API returned an invalid response.');
  }

  const fetchedList = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : null;

  if (!fetchedList) {
    throw new Error('The product API response did not contain a product list.');
  }

  return fetchedList.map((item, index) => {
    const name = item.name ?? item.productName;
    const category = item.category;
    const price = Number(item.price);
    const id = item.id ?? item.productId ?? item.sku ?? name;

    if (
      !name ||
      !category ||
      item.price === null ||
      item.price === undefined ||
      item.price === '' ||
      !Number.isFinite(price) ||
      price < 0 ||
      !id
    ) {
      throw new Error(
        `Product record ${index + 1} is missing a valid id, name, category, or price.`
      );
    }

    return {
      ...item,
      id: typeof id === 'string' && !Number.isNaN(Number(id)) ? Number(id) : id,
      name,
      category,
      price,
      image: resolveProductImage(item.image ?? item.imageUrl, name),
      rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : 0,
      reviews: Number.isFinite(Number(item.reviews)) ? Number(item.reviews) : 0,
    };
  });
}

/**
 * Submit customer order to Amazon DynamoDB via AWS API Gateway
 * POST /orders
 */
export async function submitOrder(orderData) {
  if (!API_BASE_URL) {
    throw new Error('Checkout is unavailable until VITE_API_BASE_URL is configured.');
  }

  const response = await fetch(endpointUrl('/orders'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}
