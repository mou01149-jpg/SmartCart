import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">

      <section className="hero">

        <div>
          <p className="small-title">
            WELCOME TO SMARTCART
          </p>

          <h1>
            Shop Smarter.
            <br />
            Live Better.
          </h1>

          <p>
            Discover products personalized for you
            with a simple and modern shopping experience.
          </p>

          <Link
            to="/products"
            className="shop-button"
          >
            Shop Now
          </Link>
        </div>

      </section>

      <section className="features">

        <div>
          <h3>🚚 Fast Delivery</h3>
          <p>Quick and reliable delivery.</p>
        </div>

        <div>
          <h3>🔒 Secure Shopping</h3>
          <p>Safe and secure shopping experience.</p>
        </div>

        <div>
          <h3>🤖 Smart Recommendations</h3>
          <p>Discover products you may love.</p>
        </div>

        <div>
          <h3>📷 Virtual Try-On</h3>
          <p>Preview selected products before buying.</p>
        </div>

      </section>

    </div>
  );
}

export default Home;