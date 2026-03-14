import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/config/supabaseClient";

export default function LoginPage(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate("/dashboard");
  };

  const googleLogin = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-50)] via-white to-[var(--color-primary-100)]">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-xl border border-[var(--color-border)]">

        {/* Logo / Title (W logo) */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-700 mb-4">
            <svg viewBox="0 0 14 14" fill="none" className="w-5 h-5">
              <path d="M2 4L4.5 10L7 5.5L9.5 10L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">WedTrack</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] text-gray-800 transition"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] text-gray-800 transition"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-semibold rounded-lg transition disabled:opacity-60 mb-3"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Login */}
        <button
          onClick={googleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[var(--color-primary-600)] font-semibold hover:opacity-90 transition">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}