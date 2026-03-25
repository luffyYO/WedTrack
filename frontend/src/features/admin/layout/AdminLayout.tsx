import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookHeart, QrCode, ScrollText, 
  Settings, LogOut, Menu, X, Sun, Moon, Bell,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/weddings', icon: BookHeart, label: 'Weddings' },
  { path: '/admin/qrs', icon: QrCode, label: 'QR Analytics' },
  { path: '/admin/logs', icon: ScrollText, label: 'Activity Logs' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  const username = localStorage.getItem('adminUsername') || 'Admin';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-[#0f0e0d] text-slate-100' : 'bg-[#f8f6f2] text-[#303330]'}`}>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════════ */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isDarkMode ? 'bg-[#1a1917]' : 'bg-[#2a1f1b]'}`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              alt="WedTrack" 
              className="w-10 h-10 rounded-xl shadow-lg animate-spin-3d" 
              style={{ animationDuration: '8s' }}
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">WedTrack</p>
              <p className="text-[#a07060] text-[10px] font-semibold uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white/80 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/10 mb-4" />

        {/* Navigation Label */}
        <p className="px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a07060]/60 mb-2">Navigation</p>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <item.icon size={18} className={isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 mt-auto">
          <div className="mx-3 h-px bg-white/10 mb-4" />
          {/* User Badge */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9927c] to-[#75594f] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{username}</p>
              <p className="text-[#a07060] text-[10px] font-bold uppercase tracking-widest">Superuser</p>
            </div>
          </div>
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#e07060]/80 hover:bg-[#e07060]/10 hover:text-[#e07060] transition-colors"
          >
            <LogOut size={18} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 sm:px-8 z-30 sticky top-0 border-b ${isDarkMode ? 'bg-[#0f0e0d]/90 border-white/5' : 'bg-[#f8f6f2]/90 border-[#e8e2d8]'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors lg:hidden ${isDarkMode ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-[#2a1f1b]/10 text-[#2a1f1b] hover:bg-[#2a1f1b]/15'}`}
            >
              <Menu size={18} />
            </button>
            <h1 className={`text-sm sm:text-base font-bold tracking-tight capitalize ${isDarkMode ? 'text-white' : 'text-[#303330]'}`}>
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-lg relative transition-all ${isDarkMode ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-white text-[#5d605c] border border-[#e8e2d8] shadow-sm hover:border-[#d4cfc5]'}`}>
              <Bell size={17} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#c9927c] border border-white" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-white/5 text-amber-400 hover:bg-white/10' : 'bg-white text-indigo-500 border border-[#e8e2d8] shadow-sm hover:border-[#d4cfc5]'}`}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8">
          <Outlet context={{ isDarkMode }} />
        </main>
      </div>
    </div>
  );
}
