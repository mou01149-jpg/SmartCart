import { useState, useRef, useEffect } from 'react';
import './Navbar.css';

export default function Navbar({
  cartCount,
  activeSection,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  wishlistCount = 0,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNav(id) {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
    onNavigate(id);
  }

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner container">
        
        {/* Left: Brand Logo */}
        <button
          className="navbar-logo"
          onClick={() => handleNav('home')}
          aria-label="SmartCart Home"
        >
          <span className="logo-icon" aria-hidden="true">🛒</span>
          <span className="logo-text">Smart<span>Cart</span></span>
          <span className="logo-subtag">Plus</span>
        </button>

        {/* Center: Desktop Navigation Links */}
        <nav className="navbar-links" aria-label="Main navigation">
          <button
            className={`nav-link${activeSection === 'home' ? ' active' : ''}`}
            onClick={() => handleNav('home')}
          >
            Home
          </button>
          
          <button
            className={`nav-link${activeSection === 'products' ? ' active' : ''}`}
            onClick={() => handleNav('products')}
          >
            Products
          </button>

          <button
            className={`nav-link nav-link-ar${activeSection === 'tryon' ? ' active' : ''}`}
            onClick={() => handleNav('tryon')}
          >
            <span className="ar-sparkle-dot" />
            Virtual Try-On
            <span className="ar-tag">AR LIVE</span>
          </button>

          <button
            className={`nav-link${activeSection === 'orders' ? ' active' : ''}`}
            onClick={() => handleNav('orders')}
          >
            Orders
          </button>
        </nav>

        {/* Right Actions: Login/User, Cart, Hamburger */}
        <div className="navbar-actions">
          
          {/* Flipkart-Style User Authentication Button / Dropdown */}
          {!user ? (
            <button
              className="navbar-login-btn"
              onClick={onOpenAuth}
              aria-label="Login to your account"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login
            </button>
          ) : (
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="profile-btn"
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-label="User Account Menu"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80&auto=format&fit=crop'}
                  alt={user.name}
                  className="user-nav-avatar"
                />
                <span className="user-nav-name">{user.name.split(' ')[0]}</span>
                <span className="chevron-down">▾</span>
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-header">
                    <p className="dd-name">{user.name}</p>
                    <p className="dd-phone">{user.phone || user.contact}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    onClick={() => handleNav('orders')}
                  >
                    📦 My Orders
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => handleNav('products')}
                  >
                    ❤️ Wishlist ({wishlistCount})
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => handleNav('tryon')}
                  >
                    📸 Virtual Try-On Studio
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item dd-logout"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Button */}
          <button
            className="cart-btn"
            onClick={() => handleNav('cart')}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cart-text-desktop">Cart</span>
            {cartCount > 0 && (
              <span className="cart-badge" aria-live="polite">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Hamburger Mobile Toggle */}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-menu" role="navigation" aria-label="Mobile navigation">
          {user ? (
            <div className="mobile-user-card">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80&auto=format&fit=crop'}
                alt={user.name}
                className="user-nav-avatar"
              />
              <div>
                <strong>{user.name}</strong>
                <p>{user.phone || user.contact}</p>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block mobile-login-cta"
              onClick={() => {
                setMenuOpen(false);
                onOpenAuth();
              }}
            >
              Login / Sign Up
            </button>
          )}

          <button
            className={`mobile-nav-link${activeSection === 'home' ? ' active' : ''}`}
            onClick={() => handleNav('home')}
          >
            🏠 Home
          </button>

          <button
            className={`mobile-nav-link${activeSection === 'products' ? ' active' : ''}`}
            onClick={() => handleNav('products')}
          >
            🛍️ Products
          </button>

          <button
            className={`mobile-nav-link ar-mobile-link${activeSection === 'tryon' ? ' active' : ''}`}
            onClick={() => handleNav('tryon')}
          >
            📸 Virtual Try-On (Camera AR) <span className="ar-tag">LIVE</span>
          </button>

          <button
            className={`mobile-nav-link${activeSection === 'orders' ? ' active' : ''}`}
            onClick={() => handleNav('orders')}
          >
            📦 My Orders
          </button>

          <button
            className="mobile-nav-link"
            onClick={() => handleNav('cart')}
          >
            🛒 Cart ({cartCount})
          </button>

          {user && (
            <button
              className="mobile-nav-link dd-logout"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
            >
              🚪 Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
