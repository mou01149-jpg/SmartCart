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
          <div className="empty-box-icon">📦</div>
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
                        📸 Try on Camera
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
