import React from 'react';
import './OrdersView.css';

export default function OrdersView({
  orders,
  onNavigate,
  onTryOnProduct,
}) {
  return (
    <section className="orders-section container">
      <div className="orders-header">
        <h2 className="section-title">My Orders ({orders.length})</h2>
        <p className="section-subtitle">Track, return, or reorder your recent purchases</p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-box-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Discover items and try them on live with your camera!</p>
          <button className="btn btn-primary" onClick={() => onNavigate('products')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.orderId} className="order-card">
              {/* Order Header */}
              <div className="order-card-header">
                <div>
                  <span className="order-label">ORDER PLACED</span>
                  <div className="order-val">{order.date}</div>
                </div>
                <div>
                  <span className="order-label">TOTAL</span>
                  <div className="order-val">₹{order.amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="order-label">SHIP TO</span>
                  <div className="order-val">{order.shippingAddress.name}</div>
                </div>
                <div className="order-id-col">
                  <span className="order-label">ORDER # {order.orderId}</span>
                  <span className="order-payment-tag">{order.paymentMethod}</span>
                </div>
              </div>

              {/* Order Status Bar */}
              <div className="order-status-bar">
                <span className="status-dot-green" />
                <strong>{order.status || 'Order Confirmed'}</strong>
                <span className="delivery-expected">• Expected Delivery: {order.estimatedDelivery}</span>
              </div>

              {/* Items in this order */}
              <div className="order-items-wrapper">
                {order.items.map((it) => (
                  <div key={it.id} className="order-product-row">
                    <img src={it.image} alt={it.name} className="order-prod-thumb" />
                    <div className="order-prod-meta">
                      <h4>{it.name}</h4>
                      <p>Qty: {it.quantity} • Price: ₹{it.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="order-prod-actions">
                      <button
                        className="btn btn-sm btn-outline ar-again-btn"
                        onClick={() => onTryOnProduct(it.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                        </svg>
                        Try Now
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onNavigate('products')}
                      >
                        Buy Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
