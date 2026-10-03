import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import CheckoutModal from "../components/CheckoutModal";
import * as api from "../api";
import { formatPrice } from "../api";
import { trackInitiateCheckout, trackPurchase } from "../analytics/metaPixel";

// A product counts as "on sale" only if it has a salePrice lower than its regular price -
// mirrors the same check the backend does in ProductResponse.
function getEffectivePrice(product) {
  const onSale = product.onSale && product.salePrice != null;
  return onSale ? product.salePrice : product.price;
}

export default function Cart() {
  const { items, refreshCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [checkoutKey, setCheckoutKey] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart().finally(() => setLoading(false));
  }, [refreshCart]);

  const total = items.reduce(
    (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
    0
  );

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    setBusyId(item.id);
    try {
      await updateQuantity(item.id, newQty);
      setError("");
    } catch (err) {
      setError(err.message || "Could not update quantity.");
    } finally {
      setBusyId(null);
    }
  };

  const openCheckout = () => {
    trackInitiateCheckout(items);
    setCheckoutKey(
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    setShowModal(true);
  };

  const handleCheckout = async (details) => {
    setError("");
    setCheckingOut(true);
    try {
      const order = await api.checkout({ ...details, items, idempotencyKey: checkoutKey });
      trackPurchase(order);
      clearCart();
      setShowModal(false);
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      const validationMessage = err.body && !err.body.message ? Object.values(err.body)[0] : null;
      setError(validationMessage || err.body?.message || "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-motolink-slate">Loading cart…</main>;
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display font-bold text-2xl text-motolink-blue-dark mb-2">
          Your cart is empty
        </h1>
        <p className="text-motolink-slate">Browse the catalog and add something you like.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-motolink-blue-dark mb-6 sm:mb-8">
        Your cart
      </h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const onSale = item.product.onSale && item.product.salePrice != null;
          const unitPrice = getEffectivePrice(item.product);

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border border-motolink-blue-light rounded-xl p-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-motolink-blue-dark break-words">
                  {item.product.name}
                </h3>
                {onSale ? (
                  <p className="text-sm">
                    <span className="text-red-600 font-medium">{formatPrice(unitPrice)}</span>{" "}
                    <span className="text-motolink-slate line-through">
                      {formatPrice(item.product.price)}
                    </span>
                  </p>
                ) : (
                  <p className="text-motolink-slate text-sm">{formatPrice(unitPrice)}</p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg shrink-0">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    disabled={busyId === item.id || item.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="p-2 text-motolink-blue-dark hover:bg-motolink-blue-light disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer rounded-l-lg"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    disabled={busyId === item.id || item.quantity >= item.product.stockQuantity}
                    aria-label="Increase quantity"
                    className="p-2 text-motolink-blue-dark hover:bg-motolink-blue-light disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer rounded-r-lg"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="font-display font-semibold text-motolink-blue-dark w-24 shrink-0 text-right">
                  {formatPrice(unitPrice * item.quantity)}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove item"
                  className="p-2 shrink-0 text-motolink-slate hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 border-t border-motolink-blue-light pt-6">
        <span className="font-display font-bold text-xl text-motolink-blue-dark">
          Total: {formatPrice(total)}
        </span>
        <button
          onClick={openCheckout}
          className="bg-motolink-blue hover:bg-blue-700 transition-colors text-white font-display font-semibold px-6 py-3 rounded-lg cursor-pointer w-full sm:w-auto"
        >
          Checkout
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {showModal && (
        <CheckoutModal
          onConfirm={handleCheckout}
          onClose={() => setShowModal(false)}
          submitting={checkingOut}
        />
      )}
    </main>
  );
}
