import { useEffect, useState } from "react";
import { getProducts } from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts()
      .then((data) => {
        console.log("AWS Products:", data);
        setProducts(data);
      })
      .catch((err) => {
        console.error("AWS API Error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>SmartCart</h1>

      {loading && <p>Loading products from AWS...</p>}

      {error && (
        <div>
          <h3>API Error</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2>Products</h2>

          {products.length === 0 ? (
            <p>No products found in DynamoDB.</p>
          ) : (
            products.map((product) => (
              <div key={product.id || product.productId}>
                <h3>{product.name || product.title}</h3>
                <p>Price: ₹{product.price}</p>
                <button>Add to Cart</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;