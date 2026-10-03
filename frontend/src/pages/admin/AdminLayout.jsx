import { NavLink, Navigate, Outlet } from "react-router-dom";
import { ClipboardList, Users, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { to: "/admin/orders", label: "Manage orders", icon: ClipboardList },
  { to: "/admin/users", label: "Manage users", icon: Users },
  { to: "/admin/products", label: "Manage products", icon: Package },
];

export default function AdminLayout() {
  const { user } = useAuth();

  // AuthContext's refreshUser (run in Layout.jsx) hasn't resolved yet on a hard refresh —
  // user is null both while loading and when logged out, so this guard is intentionally
  // permissive for a beat before redirecting.
  if (user && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-motolink-blue-dark mb-4 sm:mb-6">
        Admin dashboard
      </h1>

      <div className="flex gap-1 border-b border-motolink-blue-light mb-6 sm:mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-display font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? "border-motolink-blue text-motolink-blue"
                    : "border-transparent text-motolink-slate hover:text-motolink-blue-dark"
                }`
              }
            >
              <Icon size={16} />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </main>
  );
}