import './Hero.css';

export default function Hero({ onExplore, onTryCamera }) {
  return (
    <section className="hero section" id="home" aria-label="SmartCart hero">
      <div className="container hero-inner">
        {/* Text side */}
        <div className="hero-content">
          <div className="badge hero-badge">
            <span aria-hidden="true">✨</span> New: Virtual Try-On is here
          </div>

          <h1 className="hero-heading">
            Shop smarter.{' '}
            <span className="hero-heading-accent">See it before</span>{' '}
            you buy it.
          </h1>

          <p className="hero-subheading">
            Explore thousands of products and use your camera to preview yourself
            before making a purchase. Fashion, electronics, accessories — all in one place.
          </p>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value">50K+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value">4.8★</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>

          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onExplore}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Explore Products
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onTryCamera}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Try Camera
            </button>
          </div>
        </div>

        {/* Image side */}
        <div className="hero-image-wrapper" aria-hidden="true">
          <div className="hero-image-bg" />
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=85&auto=format&fit=crop"
            alt="Woman shopping online, surrounded by premium fashion products"
            className="hero-img"
            loading="eager"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=85&auto=format&fit=crop';
            }}
          />
          <div className="hero-float-card hero-float-1">
            <span>🎉</span>
            <div>
              <div className="float-title">Free Delivery</div>
              <div className="float-sub">On orders ₹999+</div>
            </div>
          </div>
          <div className="hero-float-card hero-float-2">
            <span>🔒</span>
            <div>
              <div className="float-title">Secure Payment</div>
              <div className="float-sub">100% Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 0 C360 80 1080 80 1440 0 L1440 80 L0 80 Z" fill="#fafafa"/>
        </svg>
      </div>
    </section>
  );
}
