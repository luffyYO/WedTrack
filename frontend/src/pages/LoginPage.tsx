import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/config/supabaseClient";

type LoginMode = "initial" | "email_otp" | "phone_otp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<LoginMode>("initial");
  const navigate = useNavigate();

  const sendEmailOtp = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMode("email_otp");
      setMessage("Check your email for the code!");
    }
  };

  const sendPhoneOtp = async () => {
    if (!phone) {
      setError("Please enter your mobile number");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    // Strip any leading '+' from phone if user accidentally typed it, and combine with country code
    const cleanPhone = phone.replace(/^\+/, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMode("phone_otp");
      setMessage("Check your phone for the SMS code!");
    }
  };

  const verifyEmailOtp = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'magiclink'
    });

    if (error) {
      const { error: error2 } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      
      setLoading(false);
      if (error2) {
        setError(error2.message);
      } else {
        navigate("/home");
      }
    } else {
      setLoading(false);
      navigate("/home");
    }
  };

  const verifyPhoneOtp = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }
    setLoading(true);
    setError("");

    const cleanPhone = phone.replace(/^\+/, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms'
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/home");
    }
  };

  const googleLogin = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="w-full max-w-[440px] px-5 sm:px-10 py-10 sm:py-12 glass-panel rounded-[2.5rem] shadow-[0_20px_60px_rgba(244,114,182,0.15)] border border-white/80 ring-4 ring-white/50 relative overflow-hidden group mx-auto animate-fade-up">
      {/* Soft decorative background in login panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-300/20 blur-[50px] rounded-full pointer-events-none" />

      {/* Subtitle / Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="mx-auto w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-pink-100">
          <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 object-contain rounded-md" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">Welcome to WedTrack</h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          {mode === "initial" ? 'Sign in to manage your events' : 'Enter the verification code'}
        </p>
      </div>

      {/* Error/Success Messages */}
      <div className="relative z-10">
        {error && (
          <div className="mb-5 px-4 py-3 bg-rose-50/80 text-rose-600 text-sm rounded-xl border border-rose-200/50 shadow-sm backdrop-blur-sm animate-fade-up">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-5 px-4 py-3 bg-emerald-50/80 text-emerald-600 text-sm rounded-xl border border-emerald-200/50 shadow-sm backdrop-blur-sm animate-fade-up">
            {message}
          </div>
        )}
      </div>

      {mode === "initial" ? (
        <div className="relative z-10 animate-fade-up">
          {/* Phone Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Mobile Number</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-2 py-3.5 rounded-2xl border border-slate-200/60 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 bg-white/70 backdrop-blur-sm transition-all shadow-inner text-slate-700 font-medium appearance-none text-center cursor-pointer"
                style={{ backgroundImage: 'none' }}
              >
                <option value="+91">+91 🇮🇳</option>
                <option value="+1">+1 🇺🇸</option>
                <option value="+44">+44 🇬🇧</option>
                <option value="+61">+61 🇦🇺</option>
                <option value="+971">+971 🇦🇪</option>
                <option value="+65">+65 🇸🇬</option>
              </select>
              <input
                type="tel"
                value={phone}
                className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200/60 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 bg-white/70 backdrop-blur-sm transition-all shadow-inner text-slate-700 placeholder:text-slate-400"
                placeholder="9149891771"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={sendPhoneOtp}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_12px_25px_rgba(244,114,182,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg mb-6 tracking-wide"
          >
            {loading ? 'Sending Verification...' : 'Send SMS Code'}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6 relative z-10 w-full opacity-60">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 bg-white/70 backdrop-blur-sm transition-all shadow-inner text-slate-700 placeholder:text-slate-400"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={sendEmailOtp}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg mb-2 tracking-wide"
          >
            {loading ? 'Sending Verification...' : 'Send Email Code'}
          </button>
        </div>
      ) : mode === "phone_otp" ? (
        <div className="relative z-10 animate-fade-up">
          {/* OTP Input for Phone */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Secure Passcode</label>
            <input
              type="text"
              value={otp}
              autoFocus
              className="w-full px-4 sm:px-5 py-4 rounded-2xl border border-slate-200/60 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 tracking-[0.3em] sm:tracking-[0.6em] text-center text-2xl sm:text-3xl font-black bg-white/70 backdrop-blur-sm transition-all shadow-inner text-slate-800 placeholder:text-slate-300"
              placeholder="000000"
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button
            onClick={verifyPhoneOtp}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_12px_25px_rgba(244,114,182,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 mb-5 tracking-wide"
          >
            {loading ? 'Verifying...' : 'Verify & Secure Login'}
          </button>
          
          <div className="flex justify-between items-center w-full">
            <button
                onClick={sendPhoneOtp}
                disabled={loading}
                className="text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors disabled:opacity-60"
            >
                Resend Code
            </button>
            <button
                onClick={() => { setMode("initial"); setOtp(""); setError(""); setMessage(""); }}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-60"
            >
                Change Number
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 animate-fade-up">
          {/* OTP Input for Email */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Secure Passcode</label>
            <input
              type="text"
              value={otp}
              autoFocus
              className="w-full px-4 sm:px-5 py-4 rounded-2xl border border-slate-200/60 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 tracking-[0.3em] sm:tracking-[0.6em] text-center text-2xl sm:text-3xl font-black bg-white/70 backdrop-blur-sm transition-all shadow-inner text-slate-800 placeholder:text-slate-300"
              placeholder="000000"
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button
            onClick={verifyEmailOtp}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg mb-5 tracking-wide"
          >
            {loading ? 'Verifying...' : 'Verify & Secure Login'}
          </button>
          
          <div className="flex justify-between items-center w-full">
             <button
                onClick={sendEmailOtp}
                disabled={loading}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors disabled:opacity-60"
            >
                Resend Code
            </button>
            <button
                onClick={() => { setMode("initial"); setOtp(""); setError(""); setMessage(""); }}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-60"
            >
                Change Email Address
            </button>
          </div>
        </div>
      )}

      {mode === "initial" && (
        <>
          {/* Divider */}
          <div className="flex items-center my-8 relative z-10 w-full opacity-60">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or connect with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Login */}
          <button
            onClick={googleLogin}
            className="w-full relative z-10 flex items-center justify-center gap-3 py-4 border border-slate-200/60 bg-white/80 rounded-2xl hover:bg-white transition-all font-bold text-slate-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}
