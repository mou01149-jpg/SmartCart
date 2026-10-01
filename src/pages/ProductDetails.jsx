import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../services/api";

function ProductDetails() {

  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadProduct() {

      const data = await getProductById(id);

      setProduct(data);
      setLoading(false);

    }

    loadProduct();

  }, [id]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!product) {
    return <h2>Product not found</h2>;
  }

  return (
    <div className="product-details">

      <img
        src={
          product.image ||
          "https://via.placeholder.com/500"
        }
        alt={product.name}
      />

      <div>

        <h1>{product.name}</h1>

        <h2>
          ₹{Number(product.price || 0).toLocaleString("en-IN")}
        </h2>

        <p>
          {product.description ||
            "Premium product available on SmartCart."}
        </p>

        <button
          className="add-button"
          onClick={() => alert("Product added to cart")}
        >
          Add to Cart
        </button>

        <button
          className="try-button"
          onClick={() => alert("Virtual Try-On coming next")}
        >
          📷 Try Product
        </button>

      </div>

    </div>
  );
}

export default ProductDetails;