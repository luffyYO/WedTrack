import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

export default function AdminLogs() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminApi.get('/logs');
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="animate-fade-up max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">System Action Logs</h2>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Immutable tracking of high-level system mutations</p>
      </div>

      <div className={`rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'} p-2`}>
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">No Activity Logged</div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className={`p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isDarkMode ? 'bg-slate-900/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100/80'} transition-all`}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">{log.action_type.replace('_', ' ')}</span>
                    <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{log.description}</p>
                </div>
                {log.actor_id && <div className="text-[10px] font-mono text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-1 rounded self-start sm:self-auto">Actor: {log.actor_id.substring(0,6)}...</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
