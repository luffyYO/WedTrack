import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../layout/AdminLayout';
import {
  KeyRound, User, Mail, Shield, ShieldCheck,
  CheckCircle2, AlertCircle, Loader2, ExternalLink
} from 'lucide-react';
import { supabase } from '@/config/supabaseClient';

export default function AdminSettings() {
  const { isDarkMode, adminRole } = useOutletContext<AdminOutletContext>();

  // Profile info from localStorage
  const username = localStorage.getItem('adminUsername') || 'Admin';
  const email    = localStorage.getItem('adminEmail') || '';
  const role     = localStorage.getItem('adminRole') || 'admin';

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (newPassword.length < 8) {
      setPwStatus({ type: 'error', msg: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }

    setPwLoading(true);
    try {
      // Use Supabase Auth directly — the admin is a real Supabase user
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwStatus({ type: 'success', msg: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwStatus({ type: 'error', msg: err.message || 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const cardStyle = isDarkMode
    ? 'bg-[#1a1917] border border-white/5'
    : 'bg-white border border-[#e8e2d8] shadow-[0_4px_20px_rgba(42,31,27,0.06)]';
  const labelStyle = `block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`;
  const inputStyle = `w-full px-4 py-3.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-[#75594f]/40 text-sm ${isDarkMode ? 'bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600' : 'bg-[#f4f4f0] border border-[#e8e2d8] text-[#1a1917] placeholder-[#9d9d97]'}`;
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#1a1917]';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-[#7a726c]';

  return (
    <div className="animate-fade-up max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mb-1 ${textPrimary}`}>Settings</h2>
        <p className={`text-sm ${textMuted}`}>Manage your admin profile and account security</p>
      </div>

      <div className="space-y-6">

        {/* ── Profile Card ──────────────────────────────────────────────────── */}
        <div className={`rounded-[2rem] p-6 sm:p-8 ${cardStyle}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#75594f]/10 text-[#75594f]">
              <User size={20} />
            </div>
            <h3 className={`font-bold text-lg ${textPrimary}`}>Admin Profile</h3>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9927c] to-[#75594f] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className={`font-bold text-base ${textPrimary}`}>{username}</p>
                <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${textMuted}`}>
                  <Mail size={12} /> {email || 'No email on record'}
                </div>
              </div>
            </div>

            <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-[#e8e2d8]'}`} />

            {/* Role */}
            <div className="flex items-center justify-between">
              <div>
                <p className={labelStyle.replace('block ', '')}>Admin Role</p>
                <p className={`text-sm mt-0.5 ${textMuted}`}>Your current permission level</p>
              </div>
              <div>
                {role === 'super_admin' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500">
                    <ShieldCheck size={12} /> Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400">
                    <Shield size={12} /> Admin
                  </span>
                )}
              </div>
            </div>

            {adminRole === 'super_admin' && (
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  You have <strong>Super Admin</strong> access. You can manage all admin accounts. Use this privilege responsibly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Change Password Card ──────────────────────────────────────────── */}
        <div className={`rounded-[2rem] p-6 sm:p-8 ${cardStyle}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#75594f]/10 text-[#75594f]">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textPrimary}`}>Change Password</h3>
              <p className={`text-xs ${textMuted}`}>Your password is managed by Supabase Auth</p>
            </div>
          </div>

          {pwStatus && (
            <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border ${pwStatus.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {pwStatus.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
              <span>{pwStatus.msg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputStyle} font-mono tracking-widest`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputStyle} font-mono tracking-widest`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className={`mt-2 ml-1 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Minimum 8 characters</p>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#75594f] hover:bg-[#5d4439] text-white font-bold text-sm tracking-widest uppercase shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwLoading ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* ── Supabase Security Card ────────────────────────────────────────── */}
        <div className={`rounded-[2rem] p-6 sm:p-8 ${cardStyle}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textPrimary}`}>Advanced Security</h3>
              <p className={`text-xs ${textMuted}`}>Manage MFA and security settings in Supabase</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${textMuted}`}>
            For advanced security settings including Multi-Factor Authentication (MFA/TOTP), login history, and session management, use the Supabase Auth dashboard.
          </p>
          <a
            href="https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/auth/users"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-[#f4f4f0] text-[#303330] hover:bg-[#e8e2d8] border border-[#e8e2d8]'}`}
          >
            Open Supabase Auth Dashboard <ExternalLink size={14} />
          </a>
        </div>

      </div>
    </div>
  );
}
