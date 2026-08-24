import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await adminApi.post('admin-auth', {
        action: 'login',
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, refresh_token, expires_at, user, role } = res.data;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminRefreshToken', refresh_token ?? '');
      localStorage.setItem('adminExpiresAt', String(expires_at ?? ''));
      localStorage.setItem('adminRole', role ?? 'admin');
      localStorage.setItem('adminUsername', user?.full_name || user?.email || 'Admin');
      localStorage.setItem('adminEmail', user?.email || '');

      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Invalid credentials or account is deactivated.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-pink-500/20 blur-[30px] rounded-full scale-150 animate-pulse-glow" />
          <img
            src="/logo.jpeg"
            alt="WedTrack Admin"
            className="w-28 h-28 rounded-3xl object-cover shadow-[0_20px_50px_rgba(244,114,182,0.3)] border-[2px] border-white/10 animate-spin-3d relative z-10"
          />
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <ShieldCheck size={12} />
              Secure Admin Portal
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              WedTrack Admin
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Sign in with your administrator credentials
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium mb-6 animate-fade-up">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner font-mono tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-sm tracking-widest uppercase overflow-hidden shadow-[0_8px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_12px_30px_rgba(244,114,182,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 drop-shadow-sm">Authorize Access</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-6">
            WedTrack Admin Portal · Secure Session
          </p>
        </div>
      </div>
    </div>
  );
}
