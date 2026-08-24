import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../layout/AdminLayout';
import { Loader2, Activity, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_display: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  admin_login:        'text-blue-400 bg-blue-500/10',
  admin_invited:      'text-emerald-400 bg-emerald-500/10',
  admin_deactivated:  'text-amber-400 bg-amber-500/10',
  admin_reactivated:  'text-emerald-400 bg-emerald-500/10',
  admin_role_changed: 'text-purple-400 bg-purple-500/10',
  admin_removed:      'text-rose-400 bg-rose-500/10',
};

const ACTION_LABELS: Record<string, string> = {
  admin_login:        'Login',
  admin_invited:      'Admin Invited',
  admin_deactivated:  'Deactivated',
  admin_reactivated:  'Reactivated',
  admin_role_changed: 'Role Changed',
  admin_removed:      'Admin Removed',
};

function formatMetadata(metadata: Record<string, any>): string {
  const parts: string[] = [];
  if (metadata.email) parts.push(metadata.email);
  if (metadata.role) parts.push(`role: ${metadata.role}`);
  if (metadata.new_role) parts.push(`→ ${metadata.new_role}`);
  if (metadata.new_status) parts.push(`→ ${metadata.new_status}`);
  if (metadata.full_name) parts.push(metadata.full_name);
  return parts.join(' · ');
}

export default function AdminLogs() {
  const { isDarkMode } = useOutletContext<AdminOutletContext>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const LIMIT = 25;

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res: any = await adminApi.get(`admin-activity?page=${p}&limit=${LIMIT}`);
      const { logs: data, pagination: pg } = res.data.data;
      setLogs(data || []);
      setPagination(pg || { total: 0, pages: 0 });
      setPage(p);
    } catch (err: any) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const textPrimary = isDarkMode ? 'text-white' : 'text-[#1a1917]';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-[#7a726c]';
  const cardBg = isDarkMode ? 'bg-[#1a1917] border-white/5' : 'bg-white border-[#e8e2d8]';
  const itemBg = isDarkMode ? 'bg-[#161412] hover:bg-white/5' : 'bg-[#faf9f6] hover:bg-[#f4f4f0]';

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mb-1 ${textPrimary}`}>Activity Log</h2>
          <p className={`text-sm ${textMuted}`}>
            Immutable record of all administrative actions
            {pagination.total > 0 && ` · ${pagination.total} entries`}
          </p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className={`self-start p-2.5 rounded-xl border transition-all ${isDarkMode ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-[#e8e2d8] text-[#7a726c] hover:text-[#1a1917] hover:bg-[#f4f4f0] bg-white shadow-sm'}`}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#75594f' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-[#f4f4f0]'}`}>
              <Activity size={24} className={textMuted} />
            </div>
            <p className={`text-sm font-bold ${textMuted}`}>No activity logged yet</p>
            <p className={`text-xs mt-1 ${textMuted}`}>Admin actions will appear here as they happen</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e8e2d8' }}>
            {logs.map((log) => {
              const colorClass = ACTION_COLORS[log.action] ?? 'text-slate-400 bg-slate-500/10';
              const label = ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ');
              const meta = formatMetadata(log.metadata ?? {});

              return (
                <div key={log.id} className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${itemBg}`}>
                  {/* Action badge */}
                  <div className={`mt-0.5 shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
                    {label}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className={`text-sm font-semibold ${textPrimary}`}>{log.actor_display}</span>
                      {log.target_id && (
                        <span className={`text-xs font-mono ${textMuted}`}>→ {log.target_id.slice(0, 8)}…</span>
                      )}
                    </div>
                    {meta && <p className={`text-xs mt-0.5 ${textMuted}`}>{meta}</p>}
                  </div>
                  {/* Timestamp */}
                  <div className={`text-[11px] font-mono shrink-0 ${textMuted}`}>
                    {new Date(log.created_at).toLocaleString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className={`text-sm ${textMuted}`}>
            Page {page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={loading || page <= 1}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white border border-[#e8e2d8] text-[#303330] hover:bg-[#f4f4f0] shadow-sm'}`}
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={loading || page >= pagination.pages}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white border border-[#e8e2d8] text-[#303330] hover:bg-[#f4f4f0] shadow-sm'}`}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
