import './Cart.css';

function formatPrice(p) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(p);
}

export default function Cart({ cart, onUpdateQty, onRemove, onClose, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="cart-section section" id="cart" aria-label="Shopping cart">
      <div className="container">
        {/* Header */}
        <div className="cart-header">
          <div>
            <h2 className="section-title">Shopping Cart</h2>
            <p className="section-subtitle">
              {totalItems > 0
                ? `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`
                : 'Your cart is empty'}
            </p>
          </div>
          <button className="btn btn-outline" onClick={onClose} aria-label="Continue shopping">
            ← Continue Shopping
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty" role="status">
            <div className="cart-empty-icon" aria-hidden="true">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started!</p>
            <button className="btn btn-primary" onClick={onClose}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items list */}
            <div className="cart-items" role="list" aria-label="Cart items">
              {cart.map(item => (
                <div key={item.id} className="cart-item" role="listitem">
                  {/* Image */}
                  <div className="cart-item-img-wrapper">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-item-img"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/100x100/f3f4f6/9ca3af?text=${encodeURIComponent(item.name.charAt(0))}`;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="cart-item-info">
                    <div className="cart-item-category">{item.category}</div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{formatPrice(item.price)}</div>
                  </div>

                  {/* Qty controls */}
                  <div className="cart-qty-control" role="group" aria-label={`Quantity for ${item.name}`}>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      disabled={item.quantity <= 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                    <span className="qty-value" aria-live="polite">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="cart-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>

                  {/* Remove */}
                  <button
                    className="cart-remove-btn"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="cart-summary" aria-label="Order summary">
              <h3 className="cart-summary-title">Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className={total >= 999 ? 'free-shipping' : ''}>
                  {total >= 999 ? 'FREE' : formatPrice(99)}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax (18% GST)</span>
                <span>{formatPrice(Math.round(total * 0.18))}</span>
              </div>
              <div className="summary-divider" aria-hidden="true" />
              <div className="summary-total-row">
                <span>Total</span>
                <span>{formatPrice(Math.round(total + (total >= 999 ? 0 : 99) + total * 0.18))}</span>
              </div>

              {total < 999 && (
                <div className="free-shipping-note" role="note">
                  Add {formatPrice(999 - total)} more for <strong>FREE shipping</strong>!
                </div>
              )}

              <button
                className="btn btn-primary checkout-btn"
                onClick={onCheckout}
                aria-label={`Proceed to checkout, total ${formatPrice(total)}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Proceed to Checkout
              </button>

              <div className="secure-badges" aria-label="Security and payment information">
                <span title="Secure payment">🔒 Secure</span>
                <span title="Easy returns">↩ Easy Returns</span>
                <span title="24/7 support">💬 24/7 Support</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
