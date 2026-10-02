import { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleSendOtp(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter a valid mobile number or email.');
      return;
    }
    setError('');
    setIsOtpStep(true);
    // Pre-fill demo OTP code 1234
    setOtp(['1', '2', '3', '4']);
  }

  function handleVerifyOtp(e) {
    e.preventDefault();
    const entered = otp.join('');
    if (entered.length < 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    const userData = {
      name: isSignUp && fullName ? fullName : identifier.includes('@') ? identifier.split('@')[0] : 'Rahul Sharma',
      contact: identifier,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80&auto=format&fit=crop',
      joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      phone: identifier.match(/^\d{10}$/) ? identifier : '+91 98765 43210',
      email: identifier.includes('@') ? identifier : 'rahul.sharma@example.com',
    };

    onLoginSuccess(userData);
    onClose();
  }

  function handleQuickDemoLogin() {
    const demoUser = {
      name: 'Rahul Sharma',
      contact: '+91 98765 43210',
      phone: '+91 98765 43210',
      email: 'rahul.sharma@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80&auto=format&fit=crop',
      joinedAt: 'Oct 2024',
    };
    onLoginSuccess(demoUser);
    onClose();
  }

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Close dialog">
          ✕
        </button>

        {/* Left Side: Flipkart style Banner */}
        <div className="auth-banner">
          <div>
            <div className="auth-brand">
              🛒 Smart<span>Cart</span>
            </div>
            <h2 className="auth-banner-title">
              {isSignUp ? 'Looks like you’re new here!' : 'Login'}
            </h2>
            <p className="auth-banner-desc">
              {isSignUp
                ? 'Sign up with your mobile number or email to get started'
                : 'Get access to your Orders, Wishlist and Personalized Try-On Recommendations'}
            </p>
          </div>
          <div className="auth-banner-art">
            <span className="art-icon">🛍️</span>
            <span className="art-badge">100% Genuine Products</span>
          </div>
        </div>

        {/* Right Side: Form & Inputs */}
        <div className="auth-form-side">
          
          {/* Quick 1-Click Demo Login Button */}
          <div className="quick-demo-box">
            <span>Want a fast test?</span>
            <button
              type="button"
              className="btn btn-outline quick-login-btn"
              onClick={handleQuickDemoLogin}
            >
              ⚡ Instant Demo Login (Rahul Sharma)
            </button>
          </div>

          <div className="auth-divider">
            <span>OR ENTER DETAILS</span>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}

          {!isOtpStep ? (
            <form onSubmit={handleSendOtp} className="auth-form">
              {isSignUp && (
                <div className="auth-input-group">
                  <label htmlFor="auth-name">Your Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Priya Patel"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="auth-input-group">
                <label htmlFor="auth-identifier">
                  Enter Email / Mobile Number
                </label>
                <input
                  id="auth-identifier"
                  type="text"
                  placeholder="e.g. 9876543210 or name@mail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <p className="auth-terms">
                By continuing, you agree to SmartCart's{' '}
                <a href="#terms">Terms of Use</a> and{' '}
                <a href="#privacy">Privacy Policy</a>.
              </p>

              <button type="submit" className="btn btn-primary auth-submit-btn">
                {isSignUp ? 'CONTINUE' : 'REQUEST OTP'}
              </button>

              <div className="auth-switch-row">
                {isSignUp ? (
                  <span>
                    Existing User?{' '}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => { setIsSignUp(false); setError(''); }}
                    >
                      Log in
                    </button>
                  </span>
                ) : (
                  <span>
                    New to SmartCart?{' '}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => { setIsSignUp(true); setError(''); }}
                    >
                      Create an account
                    </button>
                  </span>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="otp-info">
                <span>Please enter the OTP sent to</span>
                <strong>{identifier}</strong>
                <button
                  type="button"
                  className="link-btn change-id-btn"
                  onClick={() => setIsOtpStep(false)}
                >
                  Change
                </button>
              </div>

              <div className="otp-inputs-row">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    className="otp-digit-box"
                    onChange={(e) => {
                      const val = e.target.value;
                      const next = [...otp];
                      next[idx] = val;
                      setOtp(next);
                      if (val && e.target.nextElementSibling) {
                        e.target.nextElementSibling.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div className="otp-demo-hint">
                💡 Demo OTP auto-filled with <strong>1234</strong>
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn">
                VERIFY & LOGIN
              </button>

              <div className="resend-row">
                <span>Didn't receive the code? </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => alert('New OTP has been sent: 1234')}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
