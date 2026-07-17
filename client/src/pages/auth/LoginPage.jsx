import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already authenticated — redirect
  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-lime/10 blur-[100px] top-[-100px] left-[-100px] animate-pulse" />
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-brand-lime/5 blur-[80px] bottom-[-50px] right-[-50px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="w-full max-w-md bg-[#0e2a2c]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-brand-lime/20 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center text-2xl font-bold mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-gray-50 mb-1">Forti Foods</h1>
          <p className="text-sm text-gray-400">Internal Management Dashboard</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-lg flex items-center justify-center text-center"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="login-email"
                type="email"
                placeholder="you@fortifoods.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a1e1f] border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-4 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-colors"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a1e1f] border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                id="login-toggle-password"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit-btn"
            className="w-full bg-brand-lime text-brand-dark font-semibold py-2.5 rounded-lg shadow-lg hover:bg-[#c4cf5b] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={submitting || !email || !password}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
