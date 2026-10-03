import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signupUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
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
      await signupUser(form.name, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.body && !err.body.message) {
        setFieldErrors(err.body);
      } else {
        setGeneralError(err.body?.message || "Could not create your account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-motolink-blue-light px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="font-display font-bold text-3xl text-motolink-blue-dark mb-1">
          Create your account
        </h1>
        <p className="text-motolink-slate text-sm mb-8">
          Create an optional account to save favorites and view your order history.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-motolink-blue-dark">
              Full name
            </label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-motolink-blue">
              <User size={18} className="text-motolink-slate" />
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full outline-none text-sm"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

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
                placeholder="At least 8 characters"
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
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-motolink-slate text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-motolink-blue font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
