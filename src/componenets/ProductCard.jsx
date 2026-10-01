import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <div className="product-card">

      <img
        src={
          product.image ||
          "https://via.placeholder.com/300x220?text=SmartCart"
        }
        alt={product.name}
      />

      <div className="product-info">

        <h3>{product.name}</h3>

        <p className="description">
          {product.description || "Quality product from SmartCart"}
        </p>

        <h2>
          ₹{Number(product.price || 0).toLocaleString("en-IN")}
        </h2>

        <Link
          to={`/products/${product.id}`}
          className="view-button"
        >
          View Product
        </Link>

      </div>
    </div>
  );
}

export default ProductCard;