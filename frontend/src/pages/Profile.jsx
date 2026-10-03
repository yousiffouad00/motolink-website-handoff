import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Package, Pencil, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";
import { formatPrice } from "../api";

const STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES = {
  PLACED: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-emerald-50 text-emerald-700",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function Profile() {
  const { user, initializing, logoutUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      navigate("/login");
      return;
    }
    api
      .getOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.warn("Failed to load orders:", err.message))
      .finally(() => setLoading(false));
  }, [user, initializing, navigate]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const openEdit = () => {
    setName(user.name);
    setCurrentPassword("");
    setNewPassword("");
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);

    if (name.trim() === "") {
      setSaveError("Name can't be empty.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setSaveError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword && !currentPassword) {
      setSaveError("Enter your current password to set a new one.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(name.trim(), currentPassword || undefined, newPassword || undefined);
      setSaveSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setEditing(false);
        setSaveSuccess(false);
      }, 1200);
    } catch (err) {
      setSaveError(err.body?.message || "Couldn't save changes. Check your current password.");
    } finally {
      setSaving(false);
    }
  };

  if (initializing || !user) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* User info */}
      <div className="bg-white border border-motolink-blue-light rounded-xl p-5 sm:p-6 mb-8">
        {!editing ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-motolink-blue-dark break-words">
                {user.name}
              </h1>
              <p className="text-motolink-slate text-sm break-all">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openEdit}
                className="cursor-pointer flex items-center justify-center gap-2 text-motolink-blue hover:text-blue-700 font-display font-semibold text-sm border border-motolink-blue-light hover:bg-motolink-blue-light transition-colors px-4 py-2 rounded-lg w-full sm:w-auto"
              >
                <Pencil size={16} /> Edit profile
              </button>
              <button
                onClick={handleLogout}
                className="cursor-pointer flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-display font-semibold text-sm border border-red-200 hover:bg-red-50 transition-colors px-4 py-2 rounded-lg w-full sm:w-auto"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-motolink-blue-dark">
                Edit profile
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel"
                className="text-motolink-slate hover:text-motolink-blue-dark cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>

            <p className="text-motolink-slate text-xs -mb-2">
              Leave the password fields empty to keep your current password.
            </p>

            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required only to change password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>

            {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
            {saveSuccess && <p className="text-emerald-600 text-sm">Profile updated.</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white font-display font-semibold py-2.5 rounded-lg cursor-pointer disabled:cursor-default"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </div>

      {/* Order history */}
      <h2 className="font-display font-bold text-xl text-motolink-blue-dark mb-4">
        Your orders
      </h2>

      {loading ? (
        <p className="text-motolink-slate">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-motolink-slate">You haven't placed any orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-motolink-blue-light rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-motolink-blue" />
                  <span className="font-display font-semibold text-motolink-blue-dark">
                    Order #{order.id}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                    STATUS_STYLES[order.status] || "bg-motolink-blue-light text-motolink-blue"
                  }`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <p className="text-motolink-slate text-sm mb-2">
                {new Date(order.createdAt).toLocaleDateString()} · {formatPrice(order.totalAmount)}
              </p>

              <ul className="text-sm text-motolink-blue-dark">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.productName || item.product?.name || "Archived product"}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
