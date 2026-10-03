import { useEffect, useState } from "react";
import { Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import * as api from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    return api
      .getAdminUsers()
      .then(setUsers)
      .catch((err) => setError(err.body?.message || "Couldn't load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (u) => {
    const newRole = u.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    setBusyId(u.id);
    setError("");
    try {
      const updated = await api.updateUserRole(u.id, newRole);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      setError(err.body?.message || "Couldn't update the user's role.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}? They will no longer be able to sign in.`)) return;
    setBusyId(u.id);
    setError("");
    try {
      await api.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.body?.message || "Couldn't deactivate the user.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-motolink-slate">Loading users…</p>;
  if (users.length === 0) {
    return <p className="text-motolink-slate text-center py-16">No users yet.</p>;
  }

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {users.map((u) => {
          const isSelf = currentUser?.id === u.id;
          return (
            <div key={u.id} className="bg-white border border-motolink-blue-light rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-motolink-blue-dark break-words">
                    {u.name} {isSelf && <span className="text-motolink-slate font-normal">(you)</span>}
                  </p>
                  <p className="text-motolink-slate text-xs break-all">{u.email}</p>
                </div>
                <span
                  className={`text-xs font-display font-semibold uppercase px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    u.role === "ADMIN"
                      ? "bg-motolink-blue-light text-motolink-blue"
                      : "bg-gray-100 text-motolink-slate"
                  }`}
                >
                  {u.role}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-motolink-slate mb-3">
                <span>{u.orderCount} orders</span>
                <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
              </div>

              {!isSelf && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRole(u)}
                    disabled={busyId === u.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-display font-semibold text-motolink-blue border border-motolink-blue-light rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {u.role === "ADMIN" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    {u.role === "ADMIN" ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={busyId === u.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-display font-semibold text-red-600 border border-red-200 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Deactivate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-white border border-motolink-blue-light rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-motolink-blue-light/60 text-left text-xs font-display font-semibold uppercase tracking-wide text-motolink-slate">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Orders</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              return (
                <tr key={u.id} className="border-t border-motolink-blue-light">
                  <td className="px-5 py-3 font-medium text-motolink-blue-dark whitespace-nowrap">
                    {u.name} {isSelf && <span className="text-motolink-slate font-normal">(you)</span>}
                  </td>
                  <td className="px-5 py-3 text-motolink-slate">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-display font-semibold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                        u.role === "ADMIN"
                          ? "bg-motolink-blue-light text-motolink-blue"
                          : "bg-gray-100 text-motolink-slate"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-motolink-slate">{u.orderCount}</td>
                  <td className="px-5 py-3 text-motolink-slate whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {isSelf ? (
                      <p className="text-motolink-slate text-xs italic text-right">No actions</p>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={busyId === u.id}
                          aria-label={u.role === "ADMIN" ? "Demote to customer" : "Promote to admin"}
                          title={u.role === "ADMIN" ? "Demote to customer" : "Promote to admin"}
                          className="p-2 text-motolink-slate hover:text-motolink-blue transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                          {u.role === "ADMIN" ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          aria-label="Deactivate user"
                          className="p-2 text-motolink-slate hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
