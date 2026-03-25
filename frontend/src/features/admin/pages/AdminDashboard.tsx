import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, BookHeart, QrCode, ScanEye, 
  MessageSquareHeart, CopyX, TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import adminApi from '@/features/admin/api/adminApi';

interface DashboardStats {
  totalUsers: number;
  totalWeddings: number;
  totalGuests: number;
  totalWishes: number;
  activeQrs: number;
  expiredQrs: number;
}

const PIE_COLORS = ['#75594f', '#d9b5a0'];

export default function AdminDashboard() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#ece0da', borderTopColor: '#75594f' }} />
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#5d605c]'}`}>Loading metrics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#5d605c]'}`}>Failed to load stats. Please refresh.</p>
      </div>
    );
  }

  const s = stats!;

  const statCards = [
    { title: 'Registered Users', value: s.totalUsers, icon: Users, accent: '#75594f', bg: isDarkMode ? 'bg-[#75594f]/20' : 'bg-[#f0e8e4]' },
    { title: 'Weddings Hosted', value: s.totalWeddings, icon: BookHeart, accent: '#8b6a40', bg: isDarkMode ? 'bg-[#8b6a40]/20' : 'bg-[#f2ece3]' },
    { title: 'Total Guests', value: s.totalGuests, icon: ScanEye, accent: '#665d59', bg: isDarkMode ? 'bg-white/10' : 'bg-[#edeae6]' },
    { title: 'Total Wishes', value: s.totalWishes, icon: MessageSquareHeart, accent: '#a83836', bg: isDarkMode ? 'bg-[#a83836]/20' : 'bg-[#f5e8e8]' },
    { title: 'Live Active QRs', value: s.activeQrs, icon: QrCode, accent: '#3a7a5c', bg: isDarkMode ? 'bg-[#3a7a5c]/20' : 'bg-[#e2f0ea]' },
    { title: 'Expired Past QRs', value: s.expiredQrs, icon: CopyX, accent: '#665d59', bg: isDarkMode ? 'bg-white/10' : 'bg-[#edeae6]' },
  ];

  // Real data for QR status pie chart
  const qrData = [
    { name: 'Active QRs', value: s.activeQrs },
    { name: 'Expired QRs', value: s.expiredQrs },
  ];

  // Real data for platform overview bar chart
  const platformData = [
    { name: 'Users', value: s.totalUsers, fill: '#75594f' },
    { name: 'Weddings', value: s.totalWeddings, fill: '#8b6a40' },
    { name: 'Guests', value: s.totalGuests, fill: '#665d59' },
    { name: 'Wishes', value: s.totalWishes, fill: '#a83836' },
  ];

  const cardBg = isDarkMode ? 'bg-[#1e1c1a]' : 'bg-white';
  const chartBg = isDarkMode ? 'bg-[#161412]' : 'bg-[#f4f0eb]';
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#2a1f1b]';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-[#7a726c]';
  const axisFill = isDarkMode ? '#6b7280' : '#7a726c';

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-3xl font-bold tracking-tight ${textPrimary}`}>Platform Overview</h2>
          <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>Real-time WedTrack metrics from your database</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={`${cardBg} rounded-2xl p-4 sm:p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
            style={{ boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(42,31,27,0.07)' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon size={20} style={{ color: stat.accent }} />
            </div>
            <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{stat.title}</p>
            <p className="text-2xl sm:text-4xl font-extrabold" style={{ color: isDarkMode ? '#f5f5f4' : '#2a1f1b' }}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart — Platform Overview */}
        <div className={`${chartBg} rounded-2xl p-6 sm:p-8`}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} style={{ color: '#75594f' }} />
            <h3 className={`text-base font-bold ${textPrimary}`}>Platform Snapshot</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#2a2622' : '#e8e2d8'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisFill, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: axisFill, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(42,31,27,0.04)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    backgroundColor: isDarkMode ? '#1e1c1a' : '#fff',
                    color: isDarkMode ? '#f5f5f4' : '#2a1f1b',
                    fontSize: 13
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart — QR Status */}
        <div className={`${chartBg} rounded-2xl p-6 sm:p-8`}>
          <div className="flex items-center gap-2 mb-6">
            <QrCode size={18} style={{ color: '#75594f' }} />
            <h3 className={`text-base font-bold ${textPrimary}`}>QR Link Status</h3>
          </div>
          {s.activeQrs === 0 && s.expiredQrs === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className={`text-sm ${textMuted}`}>No QR data available yet</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qrData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {qrData.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      backgroundColor: isDarkMode ? '#1e1c1a' : '#fff',
                      color: isDarkMode ? '#f5f5f4' : '#2a1f1b',
                      fontSize: 13
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 12, color: axisFill }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
