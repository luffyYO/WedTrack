import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

interface QR {
  id: string;
  name: string;
  qr_link: string;
  status: string;
}

export default function AdminQrs() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [qrs, setQrs] = useState<QR[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchQrs = async () => {
      setLoading(true);
      try {
        const res = await adminApi.get(`/qrs?filter=${filter}`);
        setQrs(res.data.data || []);
      } catch (err) {
        console.error('Failed to load QRs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQrs();
  }, [filter]);

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : status === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-400';
    return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${cls}`}>{status}</span>;
  };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">QR Distribution Analytics</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monitor the lifecycle of all generated links</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? (isDarkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-white') : (isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50')}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-widest ${isDarkMode ? 'bg-slate-900/50 text-slate-400 border-b border-slate-700' : 'bg-slate-50 text-slate-500 border-b border-slate-100'}`}>
                <th className="py-4 px-6 font-bold">Base UUID</th>
                <th className="py-4 px-6 font-bold">Associated Event</th>
                <th className="py-4 px-6 font-bold">Lifespan Status</th>
                <th className="py-4 px-6 font-bold text-right">Testing Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" /></td></tr>
              ) : qrs.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400">No QR links found for the selected filter.</td></tr>
              ) : (
                qrs.map(qr => (
                  <tr key={qr.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500">{qr.id.substring(0, 13)}...</td>
                    <td className="py-4 px-6 font-bold whitespace-nowrap">{qr.name}</td>
                    <td className="py-4 px-6">{statusBadge(qr.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <a href={qr.qr_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-600 text-xs font-bold uppercase tracking-widest">
                        Verify Link <ExternalLink size={14} />
                      </a>
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
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
        ) : qrs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No QR links found.</div>
        ) : (
          qrs.map(qr => (
            <div 
              key={qr.id} 
              className={`rounded-2xl p-4 border transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: isDarkMode ? '#f5f5f4' : '#1a1917' }}>{qr.name}</p>
                  <p className="font-mono text-[10px] text-slate-500 mt-0.5">{qr.id.substring(0, 18)}...</p>
                </div>
                {statusBadge(qr.status)}
              </div>
              <div className="pt-3 border-t flex justify-end" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e8e2d8' }}>
                <a 
                  href={qr.qr_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-pink-500 hover:text-pink-600 text-xs font-bold uppercase tracking-widest"
                >
                  Verify Link <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
