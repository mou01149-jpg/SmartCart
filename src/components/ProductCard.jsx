import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({
  product,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onTryOn,
}) {
  const [imgError, setImgError] = useState(false);
  const isWishlisted = wishlist.includes(product.id);

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span className="stars" aria-label={`Rating: ${rating} out of 5`}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(empty)}
      </span>
    );
  }

  function formatPrice(p) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(p);
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <article className="product-card" aria-label={product.name}>
      {/* Badge */}
      {product.badge && (
        <div className="product-badge">{product.badge}</div>
      )}

      {/* Wishlist */}
      <button
        className={`wishlist-btn${isWishlisted ? ' wishlisted' : ''}`}
        onClick={() => onToggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={isWishlisted}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Image with Try-On Overlay button */}
      <div className="product-img-wrapper">
        <img
          src={imgError
            ? `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`
            : product.image}
          alt={`${product.name} – ${product.category}`}
          className="product-img"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="product-img-overlay">
          <button
            className="quick-tryon-btn"
            onClick={() => onTryOn(product.id)}
            title="Try this item live on your camera"
          >
            📸 Try on Camera
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          {renderStars(product.rating)}
          <span className="rating-value">{product.rating}</span>
          <span className="rating-count">({product.reviews.toLocaleString('en-IN')})</span>
        </div>

        {/* Pricing with Flipkart-style discount */}
        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="product-original-price">{formatPrice(product.originalPrice)}</span>
          )}
          {discountPercent && (
            <span className="product-discount-pill">{discountPercent}% off</span>
          )}
        </div>

        {/* Action Buttons: Try On Camera + Add to Cart */}
        <div className="product-footer-actions">
          <button
            className="btn btn-outline btn-sm card-tryon-btn"
            onClick={() => onTryOn(product.id)}
            aria-label={`Try ${product.name} on camera`}
          >
            📸 Try On
          </button>

          <button
            className="btn btn-primary btn-sm add-cart-btn"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
