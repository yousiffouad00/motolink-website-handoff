import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Heart, ShoppingCart } from "lucide-react";
import { formatPrice, getPrimaryImage, resolveImageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { items: wishlistItems, addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const [cartBusy, setCartBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState("");

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stockQuantity < 1;
  const onSale = product.onSale && product.salePrice != null;
  const primaryImage = getPrimaryImage(product);

  const handleAddToCart = async () => {
    setCartBusy(true);
    setError("");
    try {
      await addToCart(product, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err) {
      setError(err.message || "Could not add this product.");
    } finally {
      setCartBusy(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setWishBusy(true);
    setError("");
    try {
      if (wishlisted) {
        const existing = wishlistItems.find((item) => item.product.id === product.id);
        if (existing) await removeFromWishlist(existing.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (err) {
      setError(err.body?.message || "Could not update your wishlist.");
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <article className="relative bg-white border border-motolink-blue-light rounded-xl overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
      {onSale && (
        <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[11px] font-display font-bold uppercase tracking-wide px-2 py-1 rounded-md">
          Sale
        </span>
      )}

      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={wishBusy}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        <Heart
          size={16}
          className={wishlisted ? "fill-motolink-blue text-motolink-blue" : "text-motolink-slate"}
        />
      </button>

      <Link to={`/product/${product.id}`} className="block aspect-square bg-motolink-blue-light/40">
        {primaryImage ? (
          <img
            src={resolveImageUrl(primaryImage)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-motolink-slate text-sm">
            No image
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display font-semibold text-sm sm:text-base text-motolink-blue-dark line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto mb-3">
          {onSale ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-red-600 text-sm sm:text-base">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-motolink-slate text-xs sm:text-sm line-through">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="font-display font-bold text-motolink-blue-dark text-sm sm:text-base">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={cartBusy || outOfStock}
          className="w-full flex items-center justify-center gap-1.5 bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white text-xs sm:text-sm font-display font-semibold py-2 rounded-lg cursor-pointer disabled:cursor-default"
        >
          {outOfStock ? (
            "Out of stock"
          ) : justAdded ? (
            <><Check size={14} /> Added</>
          ) : (
            <><ShoppingCart size={14} /> {cartBusy ? "Adding…" : "Add to cart"}</>
          )}
        </button>
        {error && <p className="text-red-600 text-xs mt-2" role="alert">{error}</p>}
      </div>
    </article>
  );
}
