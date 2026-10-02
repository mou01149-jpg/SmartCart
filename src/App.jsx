import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import ProductsSection from './components/ProductsSection.jsx';
import CameraPreview from './components/CameraPreview.jsx';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import OrdersView from './components/OrdersView.jsx';
import AuthModal from './components/AuthModal.jsx';
import './App.css';

/* ─── LocalStorage Persistence Keys ───────────────────────── */
const CART_KEY = 'smartcart_cart';
const WISHLIST_KEY = 'smartcart_wishlist';
const USER_KEY = 'smartcart_user';
const ORDERS_KEY = 'smartcart_orders';

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  /* ─── Routing & Navigation ────────────────────────────── */
  // home | products | tryon | cart | checkout | orders
  const [section, setSection] = useState('home');

  /* ─── Global State ────────────────────────────────────── */
  const [cart, setCart] = useState(() => loadFromStorage(CART_KEY, []));
  const [wishlist, setWishlist] = useState(() => loadFromStorage(WISHLIST_KEY, []));
  const [user, setUser] = useState(() => loadFromStorage(USER_KEY, null));
  const [orders, setOrders] = useState(() => loadFromStorage(ORDERS_KEY, []));

  // Virtual Try-On selected product ID (default to Sunglasses #8)
  const [activeTryOnId, setActiveTryOnId] = useState(8);

  // Auth modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  /* ─── Sync LocalStorage ───────────────────────────────── */
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {}
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch {}
  }, [orders]);

  /* ─── Navigation Helper ───────────────────────────────── */
  const navigate = useCallback((id) => {
    setSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ─── Toast System ────────────────────────────────────── */
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  /* ─── Try-On Handlers ─────────────────────────────────── */
  const handleTryOn = useCallback((productId) => {
    setActiveTryOnId(productId);
    navigate('tryon');
  }, [navigate]);

  /* ─── Cart Handlers ───────────────────────────────────── */
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        showToast(`${product.name} quantity increased! 🛒`, 'info');
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showToast(`${product.name} added to cart! 🛍️`, 'success');
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [showToast]);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (item) showToast(`${item.name} removed from cart.`, 'info');
      return prev.filter(i => i.id !== id);
    });
  }, [showToast]);

  /* ─── Instant Buy Now Handler ─────────────────────────── */
  const handleBuyNow = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
    navigate('checkout');
  }, [navigate]);

  /* ─── Wishlist Handlers ───────────────────────────────── */
  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('Removed from wishlist.', 'info');
        return prev.filter(id => id !== productId);
      }
      showToast('Added to wishlist! ❤️', 'success');
      return [...prev, productId];
    });
  }, [showToast]);

  /* ─── Order & Payment Handlers ────────────────────────── */
  const handleOrderPlaced = useCallback((order) => {
    setOrders(prev => [order, ...prev]);
    setCart([]); // Clear cart upon successful order
    showToast(`Order #${order.orderId} Placed Successfully! 🎉`, 'success');
  }, [showToast]);

  /* ─── Auth Handlers ───────────────────────────────────── */
  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
    showToast(`Welcome back, ${userData.name}! 👋`, 'success');
  }, [showToast]);

  const handleLogout = useCallback(() => {
    setUser(null);
    showToast('Logged out of SmartCart.', 'info');
  }, [showToast]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      {/* Flipkart-Style Navbar */}
      <Navbar
        cartCount={cartCount}
        activeSection={section}
        onNavigate={navigate}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        wishlistCount={wishlist.length}
      />

      <main id="main-content">
        {/* HOME SECTION */}
        {section === 'home' && (
          <>
            <Hero
              onExplore={() => navigate('products')}
              onTryCamera={() => {
                setActiveTryOnId(8); // Default to sunglasses
                navigate('tryon');
              }}
            />
            <ProductsSection
              onAddToCart={addToCart}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onTryOn={handleTryOn}
            />
          </>
        )}

        {/* PRODUCTS CATALOG SECTION */}
        {section === 'products' && (
          <ProductsSection
            onAddToCart={addToCart}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onTryOn={handleTryOn}
          />
        )}

        {/* LIVE VIRTUAL TRY-ON ON CAMERA */}
        {section === 'tryon' && (
          <CameraPreview
            selectedProductId={activeTryOnId}
            onAddToCart={addToCart}
            onBuyNow={handleBuyNow}
          />
        )}

        {/* CART SECTION */}
        {section === 'cart' && (
          <Cart
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onClose={() => navigate('products')}
            onCheckout={() => navigate('checkout')}
          />
        )}

        {/* FLIPKART STYLE CHECKOUT & PAYMENT GATEWAY */}
        {section === 'checkout' && (
          <Checkout
            cart={cart}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOrderPlaced={handleOrderPlaced}
            onCancel={() => navigate('cart')}
          />
        )}

        {/* MY ORDERS SECTION */}
        {section === 'orders' && (
          <OrdersView
            orders={orders}
            onNavigate={navigate}
            onTryOnProduct={handleTryOn}
          />
        )}
      </main>

      {/* Login & Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="logo-text" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              🛒 Smart<span style={{ color: 'var(--primary)' }}>Cart</span>
            </span>
            <p>Shop smarter with real-time AR Camera Virtual Try-On and Flipkart-grade checkout.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Shop & Try-On</h4>
              <button onClick={() => navigate('products')}>All Products</button>
              <button onClick={() => { setActiveTryOnId(8); navigate('tryon'); }}>
                Camera Virtual Try-On
              </button>
              <button onClick={() => navigate('cart')}>Shopping Cart</button>
              <button onClick={() => navigate('orders')}>My Orders</button>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              {!user ? (
                <button onClick={() => setIsAuthOpen(true)}>Login / Register</button>
              ) : (
                <button onClick={handleLogout}>Logout ({user.name})</button>
              )}
              <button onClick={() => navigate('orders')}>Track Orders</button>
              <button onClick={() => showToast('Help center active 24/7', 'info')}>Help & Support</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 SmartCart. Built with React + Vite. 100% Genuine Products • Secure Payments.</p>
        </div>
      </footer>

      {/* Floating Toast Alerts */}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`} role="alert">
            <span aria-hidden="true">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error'   && '❌'}
              {toast.type === 'info'    && 'ℹ️'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
