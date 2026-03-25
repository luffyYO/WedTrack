import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle2, ShieldCheck, ShieldAlert, KeyRound, Loader2, X } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

interface AdminProfile {
  username: string;
  is2faEnabled: boolean;
}

export default function AdminSettings() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 2FA Setup State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [setupData, setSetupData] = useState<{qrCodeUrl: string, secret: string} | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // 2FA Disable State
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await adminApi.get('/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch admin profile', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const payload: any = {};
      if (username) payload.newUsername = username;
      if (password) payload.newPassword = password;

      await adminApi.put('/settings', payload);
      
      setStatus({ type: 'success', msg: 'Superuser credentials updated securely.' });
      if (username) {
        localStorage.setItem('adminUsername', username);
        setProfile(prev => prev ? { ...prev, username } : null);
      }
      
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to update credentials' });
    } finally {
      setLoading(false);
    }
  };

  const start2FASetup = async () => {
    setSetupLoading(true);
    setStatus(null);
    try {
      const res = await adminApi.post('/2fa/generate');
      setSetupData(res.data);
      setShow2FASetup(true);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to start 2FA setup' });
    } finally {
      setSetupLoading(false);
    }
  };

  const confirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      await adminApi.post('/2fa/enable', { code: otpCode });
      setProfile(prev => prev ? { ...prev, is2faEnabled: true } : null);
      setShow2FASetup(false);
      setOtpCode('');
      setStatus({ type: 'success', msg: 'Two-Factor Authentication is now ENABLED.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Invalid 2FA code' });
    } finally {
      setSetupLoading(false);
    }
  };

  const confirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      await adminApi.post('/2fa/disable', { password: disablePassword });
      setProfile(prev => prev ? { ...prev, is2faEnabled: false } : null);
      setShowDisableConfirm(false);
      setDisablePassword('');
      setStatus({ type: 'success', msg: 'Two-Factor Authentication has been DISABLED.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Incorrect password' });
    } finally {
      setSetupLoading(false);
    }
  };

  const cardStyle = isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]';
  const labelStyle = `block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const inputStyle = `w-full px-4 py-4 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'}`;

  return (
    <div className="animate-fade-up max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight mb-1">Security & Settings</h2>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage your superuser authentication and 2FA settings</p>
      </div>

      {status && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-4 text-sm font-medium border animate-fade-in ${status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          {status.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
          <span>{status.msg}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Core Credentials Card */}
        <div className={`rounded-[1.5rem] sm:rounded-[2rem] border p-6 sm:p-10 ${cardStyle}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
              <KeyRound size={20} />
            </div>
            <h3 className="font-bold text-lg">Core Credentials</h3>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className={labelStyle}>Admin Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputStyle}
                placeholder={profile?.username || "Current Username"}
              />
            </div>

            <div>
              <label className={labelStyle}>New Admin Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputStyle} font-mono tracking-widest`}
                placeholder="••••••••"
              />
              <p className={`mt-2 ml-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Min 8 characters. Will encrypt using Bcrypt cost-factor 12.</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading || (!username && !password)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <Save size={18} className="group-hover:scale-110 transition-transform" /> Save Credentials
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2FA Security Card */}
        <div className={`rounded-[1.5rem] sm:rounded-[2rem] border p-6 sm:p-10 ${cardStyle}`}>
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${profile?.is2faEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {profile?.is2faEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-lg">Two-Factor Authentication</h3>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Extra Layer of Protection</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${profile?.is2faEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {profile?.is2faEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="bg-slate-400/5 rounded-2xl p-6 mb-8 border border-slate-400/10">
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {profile?.is2faEnabled 
                ? "Your account is secured with 2FA. You'll need to enter a 6-digit code from your authenticator app (e.g., Microsoft Authenticator) whenever you login."
                : "Add an extra layer of security to your account by requiring a 6-digit verification code from your authenticator app at login."}
            </p>
          </div>

          {!profile?.is2faEnabled ? (
            <button 
              onClick={start2FASetup}
              disabled={setupLoading}
              className="w-full py-4 rounded-2xl border-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/5 font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {setupLoading ? <Loader2 size={20} className="animate-spin" /> : <>Setup 2FA Authentication <ArrowRightIcon /></>}
            </button>
          ) : (
            <button 
              onClick={() => setShowDisableConfirm(true)}
              className="w-full py-4 rounded-2xl border-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/5 font-bold text-sm tracking-widest uppercase transition-all"
            >
              Disable Two-Factor Authentication
            </button>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && setupData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 border shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setShow2FASetup(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <h3 className="text-xl font-black mb-2">Enable 2FA</h3>
              <p className="text-sm text-slate-500">Scan this code in Microsoft Authenticator</p>
            </div>

            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-inner border border-slate-100 scale-100 sm:scale-110">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 sm:w-48 sm:h-48" />
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Secret Key</p>
              <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg select-all">{setupData.secret}</code>
            </div>

            <form onSubmit={confirmEnable2FA} className="space-y-4">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verify 6-Digit Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-2xl font-mono tracking-[0.3em] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="000000"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={setupLoading || otpCode.length !== 6}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold tracking-widest uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {setupLoading ? <Loader2 size={20} className="animate-spin" /> : "Verify and Enable"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-[2rem] p-8 border shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">Disable 2FA?</h3>
              <p className="text-sm text-slate-500">Enter your password to confirm this high-risk action.</p>
            </div>

            <form onSubmit={confirmDisable2FA} className="space-y-4">
              <input 
                type="password" 
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className={inputStyle}
                placeholder="Admin Password"
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDisableConfirm(false)} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={setupLoading} className="flex-[2] py-3.5 rounded-xl bg-rose-500 text-white font-bold text-sm tracking-widest uppercase shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50">
                  {setupLoading ? <Loader2 size={20} className="animate-spin" /> : "Disable 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
