import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
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
      const res: any = await adminApi.post('admin-auth/login', { username, password });
      
      if (res.data.requires2FA) {
        setTempToken(res.data.tempToken);
        setStep(2);
      } else {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUsername', res.data.username);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await adminApi.post('admin-auth/verify-2fa', { tempToken, code: otpCode });
      
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUsername', res.data.username);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid 2FA code.');
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
        
        {/* 3D Spinning Logo - Direct request from user specs */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-pink-500/20 blur-[30px] rounded-full scale-150 animate-pulse-glow" />
          <img 
            src="/logo.jpeg" 
            alt="WedTrack 3D Logo" 
            className="w-28 h-28 rounded-3xl object-cover shadow-[0_20px_50px_rgba(244,114,182,0.3)] border-[2px] border-white/10 animate-spin-3d relative z-10" 
          />
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8 transition-all duration-300">
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {step === 1 ? 'Superuser Portal' : 'Two-Factor Authentication'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {step === 1 ? 'Authenticate to access the admin dashboard' : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium mb-6 animate-fade-up">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-right">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Identity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Access Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
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
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-5 animate-fade-in-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">6-Digit Authenticator Code</label>
                <div className="relative flex justify-center">
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-48 text-center px-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner font-mono text-2xl tracking-[0.5em]"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otpCode.length !== 6}
                className="w-full relative mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm tracking-widest uppercase overflow-hidden shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} className="relative z-10" />
                    <span className="relative z-10 drop-shadow-sm">Verify & Login</span>
                  </>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => { setStep(1); setOtpCode(''); setError(''); }}
                className="w-full text-center text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
