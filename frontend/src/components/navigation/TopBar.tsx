import { useEffect, useCallback } from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { useAuthStore, useWishStore, useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';


interface TopBarProps {
    pageTitle?: string;
    onMenuToggle?: () => void;
}

export default function TopBar({ pageTitle, onMenuToggle }: TopBarProps) {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const { activeWedding } = useAppStore();
    const { unreadCount, fetchWishes } = useWishStore();

    useEffect(() => {
        if (activeWedding?.nanoid) {
            fetchWishes(activeWedding.nanoid);
        }
    }, [fetchWishes, activeWedding?.nanoid]);


    const handleBellClick = useCallback(() => {
        navigate('/wishes');
    }, [navigate]);

    const userFirstName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <header
            className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 bg-white/80 dark:bg-[#161b22] backdrop-blur-xl dark:backdrop-blur-none border-b border-slate-200/60 dark:border-[rgba(99,120,150,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors"
            style={{ height: 'var(--topbar-height)' }}
        >
            {/* ── Left: Hamburger + Title ── */}
            <div className="flex items-center gap-4 min-w-0">
                <button
                    onClick={onMenuToggle}
                    className="md:hidden flex items-center justify-center p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white hover:shadow-sm transition-all shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>

                {pageTitle && (
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-[#e6edf3] truncate tracking-tight">
                        {pageTitle}
                    </h2>
                )}
            </div>

            {/* ── Right: Notifications + Smart Avatar ── */}
            <div className="flex items-center gap-3 sm:gap-5">
                
                <div className="relative">
                    <button
                        id="notification-bell"
                        onClick={handleBellClick}
                        className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-pink-500 dark:hover:text-pink-400 hover:shadow-sm transition-all"
                        aria-label={unreadCount > 0 ? `${unreadCount} unread wishes` : 'Notifications'}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex items-center justify-center">
                                <span className="absolute w-3 h-3 rounded-full bg-pink-400 opacity-60 animate-ping" />
                                <span className="relative w-2 h-2 rounded-full bg-pink-500" />
                            </span>
                        )}
                    </button>
                </div>

                {/* Smart User Avatar based on detected gender */}
                {user && (
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-1 py-1 pr-3 rounded-full bg-white/50 dark:bg-white/5 border border-white/60 dark:border-[rgba(99,120,150,0.35)] hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all group shrink-0"
                        title={userFirstName}
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1c2333] flex items-center justify-center shadow-inner text-slate-600 dark:text-[#8b97a8]">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-[#e6edf3] hidden sm:block group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                            {userFirstName}
                        </span>
                    </button>
                )}
            </div>
        </header>
    );
}
