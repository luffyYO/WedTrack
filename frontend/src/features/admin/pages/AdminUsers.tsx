import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Loader2, User as UserIcon, Mail, BookHeart, Trash2 } from 'lucide-react';
import adminApi from '@/features/admin/api/adminApi';

interface User {
  user_id: string;
  email: string;
  full_name: string;
  first_wedding: string;
  wedding_count: number;
}

export default function AdminUsers() {
  const { isDarkMode } : { isDarkMode: boolean } = useOutletContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user: User) => {
    if (!window.confirm(`⚠️ DANGER: Delete user "${user.full_name}" (${user.email})? \n\nThis will permanently delete their account AND all ${user.wedding_count} weddings/guest lists. This cannot be undone.`)) return;
    
    try {
      await adminApi.delete(`/users/${user.user_id}`);
      setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
    } catch (err) {
      alert('Failed to delete user');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id?.includes(searchTerm)
  );

  const headerColor = isDarkMode ? '#ffffff' : '#1a1917';
  const subheaderColor = isDarkMode ? '#94a3b8' : '#7a726c';
  const tableHeadBg = isDarkMode ? '#1a1917' : '#faf9f6';
  const tableHeadText = isDarkMode ? '#94a3b8' : '#5d605c';
  const rowHover = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-[#f4f4f0]';

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 mb-6 sm:mb-12">
        <div>
          <h2 className="font-serif text-2xl sm:text-5xl mb-1 sm:mb-3 tracking-tight" style={{ color: headerColor }}>
            Platform Users
          </h2>
          <p className="font-sans text-sm sm:text-lg" style={{ color: subheaderColor }}>
            Manage all registered accounts and their event data
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: subheaderColor }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-2xl text-sm font-sans transition-all focus:outline-none focus:ring-4 ${
              isDarkMode 
                ? 'bg-white/5 text-white focus:bg-white/10 focus:ring-white/5 border border-white/10' 
                : 'bg-[#f4f4f0] text-[#1a1917] focus:bg-white focus:ring-[#75594f]/10 border border-[#e8e2d8]'
            }`}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-[#161412] border-white/5 shadow-2xl' : 'bg-white border-[#e8e2d8] shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ backgroundColor: tableHeadBg, color: tableHeadText }}>
                <th className="py-5 px-8">User Details</th>
                <th className="py-5 px-8">Platform Usage</th>
                <th className="py-5 px-8">First Activity</th>
                <th className="py-5 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-[#e8e2d8]'}`}>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#75594f' }} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center text-sm" style={{ color: subheaderColor }}>
                    {searchTerm ? `No users matching "${searchTerm}"` : 'No registered users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.user_id} className={`transition-colors group ${rowHover}`}>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-[#f4f4f0]'}`}>
                          <UserIcon size={18} className={isDarkMode ? 'text-white/60' : 'text-[#75594f]'} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base truncate" style={{ color: isDarkMode ? '#f5f5f4' : '#1a1917' }}>
                            {u.full_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5" style={{ color: subheaderColor }}>
                            <Mail size={12} />
                            <span className="text-xs truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-1.5 font-serif text-2xl font-bold" style={{ color: isDarkMode ? '#f5f5f4' : '#75594f' }}>
                        {u.wedding_count}
                        <BookHeart size={16} className="opacity-40" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Events Created</span>
                    </td>
                    <td className="py-6 px-8">
                      <span className="text-sm font-medium" style={{ color: isDarkMode ? '#94a3b8' : '#303330' }}>
                        {new Date(u.first_wedding).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <br/>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Join Date</span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <button 
                        onClick={() => handleDelete(u)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent transition-all hover:bg-red-500/10 hover:border-red-500/20 text-red-500/70 hover:text-red-500"
                      >
                        Terminate Account
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
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#75594f' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: subheaderColor }}>
            {searchTerm ? `No users matching "${searchTerm}"` : 'No registered users found'}
          </div>
        ) : (
          filteredUsers.map(u => (
            <div 
              key={u.user_id} 
              className={`rounded-2xl p-4 border transition-all ${isDarkMode ? 'bg-[#161412] border-white/5' : 'bg-white border-[#e8e2d8]'}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-[#f4f4f0]'}`}>
                  <UserIcon size={18} className={isDarkMode ? 'text-white/60' : 'text-[#75594f]'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ color: isDarkMode ? '#f5f5f4' : '#1a1917' }}>
                    {u.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5" style={{ color: subheaderColor }}>
                    <Mail size={11} />
                    <span className="text-xs truncate">{u.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e8e2d8'}}>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-1 font-serif text-lg font-bold" style={{ color: isDarkMode ? '#f5f5f4' : '#75594f' }}>
                      {u.wedding_count} <BookHeart size={14} className="opacity-40" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Events</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium" style={{ color: isDarkMode ? '#94a3b8' : '#303330' }}>
                      {new Date(u.first_wedding).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <br/>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Joined</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(u)}
                  className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 text-red-500/70 hover:text-red-500"
                  title="Terminate Account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
