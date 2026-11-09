/**
 * CloudFront Image URL Resolver
 * Connects product images to your existing Amazon CloudFront distribution.
 *
 * Rules:
 * 1. If VITE_CLOUDFRONT_URL is defined and image is an S3 object key (e.g. 'products/item.png'),
 *    it prepends the CloudFront distribution domain.
 * 2. If image is an S3 direct URL (e.g. 'https://mybucket.s3.amazonaws.com/item.png'),
 *    it rewrites to the secure CloudFront distribution URL.
 * 3. Preserves existing full external URLs (e.g. Unsplash, placeholder, or already full CloudFront URLs).
 */

const CLOUDFRONT_DOMAIN = (import.meta.env.VITE_CLOUDFRONT_URL || '').replace(/\/$/, '');

export function resolveProductImage(imageUri, fallbackName = 'Product') {
  if (!imageUri) {
    return `https://via.placeholder.com/600x600/f3f4f6/9ca3af?text=${encodeURIComponent(fallbackName)}`;
  }

  // Already a full CloudFront URL
  if (CLOUDFRONT_DOMAIN && imageUri.startsWith(CLOUDFRONT_DOMAIN)) {
    return imageUri;
  }

  // Rewrite direct S3 URL to CloudFront if CloudFront is configured
  if (CLOUDFRONT_DOMAIN && imageUri.includes('.s3.') && imageUri.includes('amazonaws.com')) {
    try {
      const url = new URL(imageUri);
      return `${CLOUDFRONT_DOMAIN}${url.pathname}`;
    } catch {
      // Fallback to original
      return imageUri;
    }
  }

  // If it's a relative S3 key (e.g. "products/classic-tee.jpg" or "/sunglasses.png")
  if (!imageUri.startsWith('http://') && !imageUri.startsWith('https://')) {
    const cleanKey = imageUri.startsWith('/') ? imageUri.slice(1) : imageUri;
    if (CLOUDFRONT_DOMAIN) {
      return `${CLOUDFRONT_DOMAIN}/${cleanKey}`;
    }
    // If no CloudFront URL configured yet, fallback to root asset
    return `/${cleanKey}`;
  }

  // Preserves existing full URL (Unsplash or external)
  return imageUri;
}

