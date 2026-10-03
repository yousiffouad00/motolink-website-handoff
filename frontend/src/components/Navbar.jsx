import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, User, LayoutDashboard } from "lucide-react";
import logo from "../assets/Logo.jpg";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

function IconButton({ icon: Icon, label, to, badge }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={to}
      className="cursor-pointer relative flex items-center justify-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
    >
      <div className="relative p-1.5 sm:p-2 rounded-full hover:bg-motolink-blue-light transition-colors">
        <Icon
          size={20}
          strokeWidth={2}
          className="text-motolink-blue-dark hover:text-motolink-blue transition-colors sm:w-[22px] sm:h-[22px]"
        />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-motolink-blue text-white text-[10px] font-semibold w-4 h-4 flex items-center justify-center rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Tooltip - hidden on touch/mobile widths */}
      <span
        className={`hidden sm:block absolute top-full mt-1 whitespace-nowrap text-xs font-medium bg-motolink-blue-dark text-white px-2 py-1 rounded-md transition-opacity duration-150 pointer-events-none ${
          hover ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-motolink-blue-light">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 py-3 gap-2">
        {/* Logo - left side */}
        <Link to="/" className="cursor-pointer flex items-center gap-2 group shrink-0">
          <img
            src={logo}
            alt="Motolink logo"
            className="w-9 h-9 object-contain"
          />
          <span className="font-display font-bold text-xl tracking-wide text-motolink-blue-dark">
            Motolink
          </span>
        </Link>

        {/* Icons - right side */}
        <nav className="flex items-center gap-0.5 sm:gap-3 shrink-0">
          <IconButton icon={Heart} label="Wishlist" to="/wishlist" badge={wishlistCount} />
          <IconButton icon={ShoppingCart} label="Cart" to="/cart" badge={cartCount} />

          {user?.role === "ADMIN" && (
            <IconButton icon={LayoutDashboard} label="Admin" to="/admin/orders" badge={0} />
          )}

          <IconButton
            icon={User}
            label={user ? user.name : "Log in"}
            to={user ? "/profile" : "/login"}
            badge={0}
          />
        </nav>
      </div>
    </header>
  );
}