import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../layout/AdminLayout';
import {
  Shield, ShieldCheck, ShieldAlert, UserPlus, Search, Loader2,
  Mail, Calendar, Clock, MoreVertical, CheckCircle2, XCircle,
  AlertTriangle, X, ChevronDown, RefreshCw
} from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

type ConfirmAction =
  | { type: 'deactivate'; target: AdminUser }
  | { type: 'reactivate'; target: AdminUser }
  | { type: 'remove'; target: AdminUser }
  | { type: 'changeRole'; target: AdminUser; newRole: 'admin' | 'super_admin' };

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: 'admin' | 'super_admin' }) {
  return role === 'super_admin' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500">
      <ShieldCheck size={11} /> Super Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400">
      <Shield size={11} /> Admin
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
      <CheckCircle2 size={11} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400">
      <XCircle size={11} /> Inactive
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Confirmation Dialog ────────────────────────────────────────────────────────

function ConfirmDialog({
  action,
  loading,
  onConfirm,
  onCancel,
}: {
  action: ConfirmAction;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { type, target } = action;
  const newRole = (action as any).newRole;

  const configs: Record<string, { icon: React.ReactNode; title: string; desc: string; confirmLabel: string; danger: boolean }> = {
    deactivate: {
      icon: <ShieldAlert size={32} />,
      title: 'Deactivate Admin',
      desc: `"${target.full_name || target.email}" will immediately lose admin access. They can be reactivated later.`,
      confirmLabel: 'Deactivate',
      danger: true,
    },
    reactivate: {
      icon: <ShieldCheck size={32} />,
      title: 'Reactivate Admin',
      desc: `"${target.full_name || target.email}" will regain admin access immediately.`,
      confirmLabel: 'Reactivate',
      danger: false,
    },
    remove: {
      icon: <AlertTriangle size={32} />,
      title: 'Remove Admin',
      desc: `"${target.full_name || target.email}" will be removed from admin access. Their Supabase user account will NOT be deleted, only their admin privileges will be revoked.`,
      confirmLabel: 'Remove Admin',
      danger: true,
    },
    changeRole: {
      icon: <Shield size={32} />,
      title: 'Change Role',
      desc: `Change "${target.full_name || target.email}" from "${target.role}" to "${newRole}"?`,
      confirmLabel: 'Change Role',
      danger: newRole === 'super_admin',
    },
  };

  const cfg = configs[type];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-[2rem] p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cfg.danger ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {cfg.icon}
          </div>
          <h3 className="text-xl font-black text-white mb-2">{cfg.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{cfg.desc}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-400 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-[2] py-3.5 rounded-xl font-bold text-sm text-white tracking-widest uppercase shadow-lg transition-all disabled:opacity-50 flex items-center justify-center ${cfg.danger ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Admin Modal ────────────────────────────────────────────────────────────

function AddAdminModal({
  isDarkMode,
  onClose,
  onSuccess,
}: {
  isDarkMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res: any = await adminApi.post('admin-manage', { email: email.trim().toLowerCase(), full_name: fullName.trim(), role });
      setSuccess(res.data?.message || `Invitation sent to ${email}`);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to invite admin. They may already be an admin.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-[#75594f]/50 text-sm ${isDarkMode ? 'bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600' : 'bg-[#f4f4f0] border border-[#e8e2d8] text-[#1a1917] placeholder-[#9d9d97]'}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md rounded-[2rem] p-8 border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-[#e8e2d8]'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#1a1917]'}`}>Add Administrator</h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>They'll receive an email to set their password</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-[#7a726c] hover:text-[#1a1917] hover:bg-[#f4f4f0]'}`}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              >
                <option value="admin">Admin — View and manage platform data</option>
                <option value="super_admin">Super Admin — Full access including admin management</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {role === 'super_admin' && (
              <p className="mt-2 ml-1 text-[10px] font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={11} /> Super admins can add, remove, and manage other administrators
              </p>
            )}
          </div>

          <div className={`rounded-2xl p-4 border mt-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-[#f8f6f2] border-[#e8e2d8]'}`}>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>
              <strong className={isDarkMode ? 'text-slate-300' : 'text-[#303330]'}>How this works:</strong> A password reset email will be sent to this address. The new administrator clicks the link and sets their own password — no password is ever created or stored by you.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-[#7a726c] hover:bg-[#f4f4f0]'}`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !fullName}
              className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white tracking-widest uppercase shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-[#75594f] hover:bg-[#5d4439] shadow-[#75594f]/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={16} /> Send Invitation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Row Actions Dropdown ──────────────────────────────────────────────────────

function ActionMenu({
  admin,
  currentUserId,
  isDarkMode,
  onAction,
}: {
  admin: AdminUser;
  currentUserId: string;
  isDarkMode: boolean;
  onAction: (action: ConfirmAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSelf = admin.user_id === currentUserId;

  if (isSelf) {
    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${isDarkMode ? 'text-slate-600 bg-slate-800' : 'text-[#b0a89e] bg-[#f4f4f0]'}`}>
        You
      </span>
    );
  }

  const menuBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#e8e2d8]';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-[#7a726c] hover:text-[#1a1917] hover:bg-[#f4f4f0]'}`}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-1 w-52 rounded-2xl border shadow-xl z-[60] overflow-hidden ${menuBg}`}>
            {/* Change role */}
            {admin.role === 'admin' && (
              <button
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-[#303330] hover:bg-[#f4f4f0]'}`}
                onClick={() => { setOpen(false); onAction({ type: 'changeRole', target: admin, newRole: 'super_admin' }); }}
              >
                <ShieldCheck size={15} className="text-amber-500" /> Promote to Super Admin
              </button>
            )}
            {admin.role === 'super_admin' && (
              <button
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-[#303330] hover:bg-[#f4f4f0]'}`}
                onClick={() => { setOpen(false); onAction({ type: 'changeRole', target: admin, newRole: 'admin' }); }}
              >
                <Shield size={15} className="text-blue-400" /> Demote to Admin
              </button>
            )}

            <div className={`h-px mx-3 ${isDarkMode ? 'bg-slate-700' : 'bg-[#e8e2d8]'}`} />

            {/* Activate / Deactivate */}
            {admin.status === 'active' ? (
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 text-amber-500 hover:bg-amber-500/5 transition-colors"
                onClick={() => { setOpen(false); onAction({ type: 'deactivate', target: admin }); }}
              >
                <XCircle size={15} /> Deactivate
              </button>
            ) : (
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 text-emerald-500 hover:bg-emerald-500/5 transition-colors"
                onClick={() => { setOpen(false); onAction({ type: 'reactivate', target: admin }); }}
              >
                <CheckCircle2 size={15} /> Reactivate
              </button>
            )}

            <div className={`h-px mx-3 ${isDarkMode ? 'bg-slate-700' : 'bg-[#e8e2d8]'}`} />

            {/* Remove */}
            <button
              className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 text-rose-500 hover:bg-rose-500/5 transition-colors"
              onClick={() => { setOpen(false); onAction({ type: 'remove', target: admin }); }}
            >
              <ShieldAlert size={15} /> Remove Admin Access
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAdmins() {
  const { isDarkMode, adminRole } = useOutletContext<AdminOutletContext>();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? '';
    } catch { return ''; }
  })();

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.get('admin-manage');
      setAdmins(res.data.data || []);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);

    try {
      const { type, target } = confirmAction;
      const newRole = (confirmAction as any).newRole;

      if (type === 'deactivate') {
        await adminApi.patch('admin-manage', { target_user_id: target.user_id, status: 'inactive' });
        showToast('success', `${target.full_name || target.email} has been deactivated`);
      } else if (type === 'reactivate') {
        await adminApi.patch('admin-manage', { target_user_id: target.user_id, status: 'active' });
        showToast('success', `${target.full_name || target.email} has been reactivated`);
      } else if (type === 'changeRole') {
        await adminApi.patch('admin-manage', { target_user_id: target.user_id, role: newRole });
        showToast('success', `Role changed to ${newRole}`);
      } else if (type === 'remove') {
        await adminApi.delete(`admin-manage?id=${target.user_id}`);
        showToast('success', `${target.full_name || target.email} has been removed from admins`);
      }

      setConfirmAction(null);
      fetchAdmins();
    } catch (err: any) {
      showToast('error', err?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Guard: only super_admin can access this page
  if (adminRole !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-up">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
          <ShieldAlert size={32} className="text-rose-500" />
        </div>
        <div className="text-center">
          <h2 className={`text-lg font-black mb-1 ${isDarkMode ? 'text-white' : 'text-[#1a1917]'}`}>Access Restricted</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#7a726c]'}`}>Only Super Admins can manage other administrators.</p>
        </div>
      </div>
    );
  }

  const filtered = admins.filter(a =>
    (a.full_name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
    (a.email?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const textPrimary = isDarkMode ? 'text-white' : 'text-[#1a1917]';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-[#7a726c]';
  const cardBg = isDarkMode ? 'bg-[#1a1917] border-white/5' : 'bg-white border-[#e8e2d8]';
  const tableHeadBg = isDarkMode ? '#161412' : '#faf9f6';
  const tableHeadText = isDarkMode ? '#94a3b8' : '#5d605c';
  const rowHover = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-[#f4f4f0]';
  const divider = isDarkMode ? 'divide-white/5' : 'divide-[#e8e2d8]';

  return (
    <div className="animate-fade-up">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[80] max-w-sm p-4 rounded-2xl shadow-xl border flex items-start gap-3 text-sm font-medium animate-fade-in ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mb-1 ${textPrimary}`}>
            Admin Management
          </h2>
          <p className={`text-sm ${textMuted}`}>
            Manage administrator accounts and roles — Super Admin access only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-[#e8e2d8] text-[#7a726c] hover:text-[#1a1917] hover:bg-[#f4f4f0] bg-white shadow-sm'}`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-[#75594f] hover:bg-[#5d4439] transition-all shadow-sm"
          >
            <UserPlus size={16} /> Add Admin
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Admins', value: admins.length, icon: Shield, color: 'text-[#75594f]', bg: isDarkMode ? 'bg-[#75594f]/10' : 'bg-[#f0e8e4]' },
          { label: 'Super Admins', value: admins.filter(a => a.role === 'super_admin').length, icon: ShieldCheck, color: 'text-amber-500', bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50' },
          { label: 'Active', value: admins.filter(a => a.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50' },
          { label: 'Inactive', value: admins.filter(a => a.status === 'inactive').length, icon: XCircle, color: 'text-rose-500', bg: isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${cardBg}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{stat.label}</p>
            <p className={`text-2xl font-extrabold ${textPrimary}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:w-72">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${textMuted}`}>
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#75594f]/20 ${isDarkMode ? 'bg-white/5 text-white border border-white/10 placeholder-slate-600' : 'bg-white text-[#1a1917] border border-[#e8e2d8] placeholder-[#9d9d97] shadow-sm'}`}
        />
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-[#161412] border-white/5 shadow-2xl' : 'bg-white border-[#e8e2d8] shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ backgroundColor: tableHeadBg, color: tableHeadText }}>
                <th className="py-5 px-6">Administrator</th>
                <th className="py-5 px-6">Role</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6">Added</th>
                <th className="py-5 px-6">Last Login</th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto" style={{ color: '#75594f' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-20 text-center text-sm ${textMuted}`}>
                    {search ? `No admins matching "${search}"` : 'No admin accounts found'}
                  </td>
                </tr>
              ) : (
                filtered.map(admin => (
                  <tr key={admin.id} className={`transition-colors group ${rowHover}`}>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9927c] to-[#75594f] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                          {(admin.full_name || admin.email || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate ${textPrimary}`}>
                            {admin.full_name || 'No name'}
                            {admin.user_id === currentUserId && <span className="ml-2 text-[10px] font-bold text-[#75594f] uppercase tracking-widest">(You)</span>}
                          </p>
                          <div className={`flex items-center gap-1 mt-0.5 ${textMuted}`}>
                            <Mail size={11} />
                            <span className="text-xs truncate">{admin.email ?? '—'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6"><RoleBadge role={admin.role} /></td>
                    <td className="py-5 px-6"><StatusBadge status={admin.status} /></td>
                    <td className="py-5 px-6">
                      <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                        <Calendar size={12} />
                        {formatDate(admin.created_at)}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                        <Clock size={12} />
                        {formatDateTime(admin.last_sign_in_at)}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <ActionMenu admin={admin} currentUserId={currentUserId} isDarkMode={isDarkMode} onAction={setConfirmAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin" style={{ color: '#75594f' }} /></div>
        ) : filtered.length === 0 ? (
          <div className={`py-16 text-center text-sm ${textMuted}`}>
            {search ? `No admins matching "${search}"` : 'No admin accounts found'}
          </div>
        ) : (
          filtered.map(admin => (
            <div key={admin.id} className={`rounded-2xl p-4 border ${cardBg}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9927c] to-[#75594f] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  {(admin.full_name || admin.email || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${textPrimary}`}>{admin.full_name || 'No name'}</p>
                      <p className={`text-xs truncate ${textMuted}`}>{admin.email ?? '—'}</p>
                    </div>
                    <ActionMenu admin={admin} currentUserId={currentUserId} isDarkMode={isDarkMode} onAction={setConfirmAction} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={admin.role} />
                <StatusBadge status={admin.status} />
              </div>
              <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${textMuted} ${isDarkMode ? 'border-white/5' : 'border-[#e8e2d8]'}`}>
                <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(admin.created_at)}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {formatDateTime(admin.last_sign_in_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddAdminModal
          isDarkMode={isDarkMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchAdmins}
        />
      )}
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
