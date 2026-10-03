import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "ADMIN" ? "/admin/orders" : "/", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      const loggedInUser = await loginUser(form.email, form.password);
      navigate(loggedInUser.role === "ADMIN" ? "/admin/orders" : "/", { replace: true });
    } catch (err) {
      // Validation errors come back as a flat { field: message } map.
      // Anything else (401, 500) comes back as { message, status, timestamp }.
      if (err.body && !err.body.message) {
        setFieldErrors(err.body);
      } else {
        setGeneralError(err.body?.message || "Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-motolink-blue-light px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="font-display font-bold text-3xl text-motolink-blue-dark mb-1">
          Welcome back
        </h1>
        <p className="text-motolink-slate text-sm mb-8">
          Log in to manage your orders and bike profile.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-motolink-blue-dark">
              Email
            </label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-motolink-blue">
              <Mail size={18} className="text-motolink-slate" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full outline-none text-sm"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-motolink-blue-dark">
              Password
            </label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-motolink-blue">
              <Lock size={18} className="text-motolink-slate" />
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full outline-none text-sm"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {generalError && (
            <p className="text-red-600 text-sm">{generalError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white font-display font-semibold py-2.5 rounded-lg mt-2"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-motolink-slate text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-motolink-blue font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}