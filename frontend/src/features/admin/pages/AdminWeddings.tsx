import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Loader2, Trash2, MapPin, Calendar } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

interface Wedding {
  id: string;
  bride_name: string;
  groom_name: string;
  location: string;
  wedding_date: string;
  qr_status: string;
}

export default function AdminWeddings() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchW = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/weddings?search=${search}`);
      setWeddings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load weddings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchW();
  }, [search]);

  const handleDelete = async (id: string, couple: string) => {
    if (!window.confirm(`Are you sure you want to delete the wedding for ${couple}? This will also delete all guests and wishes.`)) return;
    
    try {
      await adminApi.delete(`/weddings/${id}`);
      setWeddings(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      alert('Failed to delete wedding');
      console.error(err);
    }
  };

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : status === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-400';
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cls}`}>{status}</span>;
  };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">Hosted Weddings</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review all created wedding tracks</p>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search couples or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-widest ${isDarkMode ? 'bg-slate-900/50 text-slate-400 border-b border-slate-700' : 'bg-slate-50 text-slate-500 border-b border-slate-100'}`}>
                <th className="py-4 px-6 font-bold">Couple</th>
                <th className="py-4 px-6 font-bold">Venue</th>
                <th className="py-4 px-6 font-bold">Event Date</th>
                <th className="py-4 px-6 font-bold">QR Status</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" /></td></tr>
              ) : weddings.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">No weddings found.</td></tr>
              ) : (
                weddings.map(w => (
                  <tr key={w.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-6 font-bold text-pink-500 whitespace-nowrap">{w.bride_name} & {w.groom_name}</td>
                    <td className="py-4 px-6 text-sm">{w.location}</td>
                    <td className="py-4 px-6 text-sm">{new Date(w.wedding_date).toLocaleDateString()}</td>
                    <td className="py-4 px-6">{statusBadge(w.qr_status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(w.id, `${w.bride_name} & ${w.groom_name}`)}
                        className="text-rose-500 hover:text-rose-600 text-sm font-bold tracking-widest uppercase transition-colors"
                      >
                        Delete
                      </button>
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
        ) : weddings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No weddings found.</div>
        ) : (
          weddings.map(w => (
            <div 
              key={w.id} 
              className={`rounded-2xl p-4 border transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-pink-500 truncate">{w.bride_name} & {w.groom_name}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: isDarkMode ? '#94a3b8' : '#7a726c' }}>
                    <MapPin size={12} /> <span className="truncate">{w.location}</span>
                  </div>
                </div>
                {statusBadge(w.qr_status)}
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e8e2d8' }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: isDarkMode ? '#94a3b8' : '#5d605c' }}>
                  <Calendar size={12} /> {new Date(w.wedding_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <button 
                  onClick={() => handleDelete(w.id, `${w.bride_name} & ${w.groom_name}`)}
                  className="p-2 rounded-xl transition-all hover:bg-red-500/10 text-red-500/70 hover:text-red-500"
                  title="Delete Wedding"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
