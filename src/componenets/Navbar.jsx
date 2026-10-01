import { Link } from "react-router-dom";
import { ShoppingCart, User, Home, Package } from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🛒 SmartCart
      </Link>

      <div className="nav-links">
        <Link to="/">
          <Home size={18} />
          Home
        </Link>

        <Link to="/products">
          <Package size={18} />
          Products
        </Link>

        <Link to="/cart">
          <ShoppingCart size={18} />
          Cart
        </Link>

        <Link to="/login">
          <User size={18} />
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;