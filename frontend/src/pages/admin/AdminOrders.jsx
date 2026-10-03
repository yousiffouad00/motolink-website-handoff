import { useEffect, useState } from "react";
import { Check, Mail, Phone, MapPin, PackageCheck, Truck, X } from "lucide-react";
import * as api from "../../api";
import { formatPrice } from "../../api";

const STATUS_STYLES = {
  PLACED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  PLACED: "order placed",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const FILTERS = [
  { value: "ALL", label: "all" },
  { value: "PLACED", label: "order placed" },
  { value: "CONFIRMED", label: "confirmed" },
  { value: "SHIPPED", label: "shipped" },
  { value: "DELIVERED", label: "delivered" },
  { value: "CANCELLED", label: "cancelled" },
];

const PAYMENT_LABELS = {
  CASH_ON_DELIVERY: "Cash on delivery",
  INSTAPAY: "InstaPay",
  MOBILE_WALLET: "Mobile wallet",
};

// Returns something like "2 hours ago", "3 days ago", "Just now"
function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .getAdminOrders()
      .then(setOrders)
      .catch((err) => setError(err.body?.message || "Couldn't load orders."))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (orderId, status) => {
    setBusyId(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setError(err.body?.message || "Couldn't update the order. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-motolink-slate">Loading orders…</p>;
  }

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide rounded-lg border transition-colors cursor-pointer ${
              filter === f.value
                ? "bg-motolink-blue text-white border-motolink-blue"
                : "bg-white text-motolink-slate border-gray-200 hover:border-motolink-blue"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {visible.length === 0 ? (
        <p className="text-motolink-slate text-center py-16">No orders here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-motolink-blue-light rounded-xl p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-motolink-blue-dark">
                    Order #{order.id}
                  </h3>
                  <p className="text-motolink-slate text-xs mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()}
                    {" · "}
                    {timeAgo(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-display font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                >
                  {STATUS_LABELS[order.status] || order.status.toLowerCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4 text-sm">
                <div>
                  <p className="text-motolink-slate text-xs uppercase tracking-wide mb-1">
                    Customer
                  </p>
                  <p className="font-medium text-motolink-blue-dark">{order.userName}</p>
                </div>
                <div>
                  <p className="text-motolink-slate text-xs uppercase tracking-wide mb-1">Email</p>
                  <p className="flex items-center gap-1.5 text-motolink-blue-dark break-all">
                    <Mail size={14} className="text-motolink-slate shrink-0" />
                    {order.userEmail}
                  </p>
                </div>
                <div>
                  <p className="text-motolink-slate text-xs uppercase tracking-wide mb-1">Phone</p>
                  <p className="flex items-center gap-1.5 text-motolink-blue-dark">
                    <Phone size={14} className="text-motolink-slate shrink-0" />
                    {order.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-motolink-slate text-xs uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="flex items-center gap-1.5 text-motolink-blue-dark">
                    <MapPin size={14} className="text-motolink-slate shrink-0" />
                    {order.address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-motolink-slate text-xs uppercase tracking-wide mb-1">
                    Payment
                  </p>
                  <p className="text-motolink-blue-dark">
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—"}
                  </p>
                </div>
              </div>

              <div className="border-t border-motolink-blue-light pt-3 mb-4">
                <ul className="space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="text-motolink-blue-dark">
                        {item.productName || item.product?.name || "Archived product"}{" "}
                        <span className="text-motolink-slate">x{item.quantity}</span>
                      </span>
                      <span className="text-motolink-slate shrink-0">
                        {formatPrice(item.priceAtPurchase * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="font-display font-bold text-lg text-motolink-blue-dark">
                  {formatPrice(order.totalAmount)}
                </p>

                {order.status === "PLACED" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(order.id, "CANCELLED")}
                      disabled={busyId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-display font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={() => setStatus(order.id, "CONFIRMED")}
                      disabled={busyId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-display font-semibold text-white bg-motolink-blue rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <Check size={14} /> Confirm
                    </button>
                  </div>
                ) : order.status === "CONFIRMED" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(order.id, "CANCELLED")}
                      disabled={busyId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-display font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={() => setStatus(order.id, "SHIPPED")}
                      disabled={busyId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-display font-semibold text-white bg-motolink-blue rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <Truck size={14} /> Ship
                    </button>
                  </div>
                ) : order.status === "SHIPPED" ? (
                  <button
                    onClick={() => setStatus(order.id, "DELIVERED")}
                    disabled={busyId === order.id}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-display font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                  >
                    <PackageCheck size={14} /> Mark delivered
                  </button>
                ) : (
                  <p className="text-motolink-slate text-xs italic">No actions available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
