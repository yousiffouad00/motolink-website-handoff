import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import * as api from "../api";
import { formatPrice, getPrimaryImage, resolveImageUrl } from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { trackViewContent } from "../analytics/metaPixel";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { items: wishlistItems, isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .getProduct(id)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setSelectedImage(getPrimaryImage(data));
        trackViewContent(data);
      })
      .catch((err) => { if (active) setError(err.body?.message || "Couldn't load this product."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    setError("");
    try {
      await addToCart(product, quantity);
    } catch (err) {
      setError(err.message || "Could not add this product.");
    } finally {
      setAdding(false);
    }
  };

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setWishBusy(true);
    try {
      if (wishlisted) {
        const existing = wishlistItems.find((item) => item.product.id === product.id);
        if (existing) await removeFromWishlist(existing.id);
      } else {
        await addToWishlist(product.id);
      }
    } finally {
      setWishBusy(false);
    }
  };

  if (loading) {
    return <main className="max-w-5xl mx-auto px-6 py-10 text-motolink-slate">Loading product…</main>;
  }

  if (error || !product) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-red-600 text-sm mb-4">{error || "Product not found."}</p>
        <Link to="/products" className="text-motolink-blue font-display font-semibold text-sm hover:underline">
          Back to all products
        </Link>
      </main>
    );
  }

  const onSale = product.onSale && product.salePrice != null;
  const displayImages = (product.imageUrls || []).filter((url) => resolveImageUrl(url));
  const selectedImageUrl = resolveImageUrl(selectedImage);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm font-display font-semibold text-motolink-blue hover:underline mb-6 whitespace-nowrap"
      >
        <ArrowLeft size={16} className="shrink-0" />
        <span>Back to all products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image */}
        <div>
          <div className="relative aspect-square bg-motolink-blue-light/40 rounded-xl overflow-hidden">
            {onSale && (
              <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-display font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
                Sale
              </span>
            )}
            {selectedImageUrl ? (
              <img src={selectedImageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-motolink-slate text-sm">
                No image
              </div>
            )}
          </div>
          {displayImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {displayImages.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View product image ${index + 1}`}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === image ? "border-motolink-blue" : "border-transparent"
                  }`}
                >
                  <img
                    src={resolveImageUrl(image)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="text-motolink-slate text-sm font-medium mb-1">{product.brand}</p>
          )}

          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-motolink-blue-dark">
              {product.name}
            </h1>
            <button
              onClick={handleToggleWishlist}
              disabled={wishBusy}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="p-2 rounded-full border border-motolink-blue-light hover:bg-motolink-blue-light shrink-0 transition-colors cursor-pointer disabled:cursor-default"
            >
              <Heart
                size={20}
                className={wishlisted ? "fill-motolink-blue text-motolink-blue" : "text-motolink-slate"}
              />
            </button>
          </div>

          {onSale ? (
            <div className="flex items-center gap-3 mb-4">
              <span className="font-display font-bold text-red-600 text-2xl">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-motolink-slate text-lg line-through">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <p className="font-display font-bold text-motolink-blue-dark text-2xl mb-4">
              {formatPrice(product.price)}
            </p>
          )}

          {product.description && (
            <p className="text-motolink-slate text-sm leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          <p className="text-sm mb-6">
            {product.stockQuantity > 0 ? (
              <span className={product.stockQuantity < 10 ? "text-red-600 font-medium" : "text-motolink-slate"}>
                {product.stockQuantity < 10
                  ? `Only ${product.stockQuantity} left in stock`
                  : "In stock"}
              </span>
            ) : (
              <span className="text-red-600 font-medium">Out of stock</span>
            )}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="p-2.5 text-motolink-blue-dark hover:bg-motolink-blue-light disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer rounded-l-lg"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                disabled={quantity >= product.stockQuantity}
                aria-label="Increase quantity"
                className="p-2.5 text-motolink-blue-dark hover:bg-motolink-blue-light disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer rounded-r-lg"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || product.stockQuantity === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white font-display font-semibold py-3 rounded-lg cursor-pointer disabled:cursor-default"
            >
              <ShoppingCart size={18} />
              {adding ? "Adding…" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
