import { useEffect, useState } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { getPrimaryImage, resolveImageUrl, formatPrice } from "../api";

export default function Wishlist() {
  const { items, refreshWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshWishlist().finally(() => setLoading(false));
  }, [refreshWishlist]);

  if (loading) {
    return <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-motolink-slate">Loading wishlist…</main>;
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display font-bold text-2xl text-motolink-blue-dark mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-motolink-slate">Tap the heart icon on any product to save it here.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-motolink-blue-dark mb-6 sm:mb-8">
        Your wishlist
      </h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const onSale = item.product.onSale && item.product.salePrice != null;

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border border-motolink-blue-light rounded-xl p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-motolink-blue-light shrink-0">
                  {onSale && (
                    <span className="absolute top-0.5 left-0.5 z-10 bg-red-600 text-white text-[9px] font-display font-bold uppercase tracking-wide px-1 py-0.5 rounded">
                      Sale
                    </span>
                  )}
                  {getPrimaryImage(item.product) && (
                    <img
                      src={resolveImageUrl(getPrimaryImage(item.product))}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-motolink-blue-dark break-words">
                    {item.product.name}
                  </h3>
                  {onSale ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-red-600 text-sm font-medium">
                        {formatPrice(item.product.salePrice)}
                      </span>
                      <span className="text-motolink-slate text-xs line-through">
                        {formatPrice(item.product.price)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-motolink-slate text-sm">{formatPrice(item.product.price)}</p>
                  )}
                </div>
              </div>


              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => addToCart(item.product, 1)}
                  disabled={item.product.stockQuantity < 1}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-motolink-blue hover:bg-blue-700 transition-colors text-white text-sm font-display font-semibold px-4 py-2 rounded-lg"
                >
                  <ShoppingCart size={16} />
                  {item.product.stockQuantity < 1 ? "Out of stock" : "Add to cart"}
                </button>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  aria-label="Remove from wishlist"
                  className="p-2 shrink-0 text-motolink-slate hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
