import { useEffect, useCallback } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore, useWishStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import type { Wish } from '@/api/wishService';
import API_BASE_URL from '@/config/api';

interface TopBarProps {
    pageTitle?: string;
    onMenuToggle?: () => void;
}

// Smart Gender Detection Heuristic based on Indian/Western common names ending
function guessGender(name: string): 'male' | 'female' {
    if (!name) return 'male';
    const lower = name.toLowerCase().trim();
    if (lower.match(/[aeiyü]$/i) || lower.includes("bride")) return 'female';
    return 'male';
}

function FemaleAvatar() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-pink-500">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M15.5 10c0 4.14-3.5 7.5-3.5 14" />
            <path d="M8.5 10c0 4.14 3.5 7.5 3.5 14" />
            <path d="M4 22h16" />
        </svg>
    );
}

function MaleAvatar() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-600">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M6 22v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4" />
        </svg>
    );
}

export default function TopBar({ pageTitle, onMenuToggle }: TopBarProps) {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const { unreadCount, fetchWishes, addWish } = useWishStore();

    useEffect(() => {
        fetchWishes();
    }, [fetchWishes]);

    useEffect(() => {
        if (!user) return;
        const socket = socketIO(API_BASE_URL, { transports: ['websocket', 'polling'] });
        socket.on('new_wish', (wish: Wish) => {
            addWish(wish);
        });
        return () => {
            socket.disconnect();
        };
    }, [user, addWish]);

    const handleBellClick = useCallback(() => {
        navigate('/wishes');
    }, [navigate]);

    const userFirstName = user?.user_metadata?.first_name || user?.user_metadata?.name || 'User';
    const gender = guessGender(userFirstName);

    return (
        <header
            className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-colors"
            style={{ height: 'var(--topbar-height)' }}
        >
            {/* ── Left: Hamburger + Title ── */}
            <div className="flex items-center gap-4 min-w-0">
                <button
                    onClick={onMenuToggle}
                    className="md:hidden flex items-center justify-center p-2 rounded-full text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>

                {pageTitle && (
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent truncate tracking-tight">
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
                        className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-pink-500 hover:shadow-sm transition-all"
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
                        className="flex items-center gap-2 px-1 py-1 pr-3 rounded-full bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all group shrink-0"
                        title={userFirstName}
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                            {gender === 'female' ? <FemaleAvatar /> : <MaleAvatar />}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 hidden sm:block group-hover:text-pink-600 transition-colors">
                            {userFirstName}
                        </span>
                    </button>
                )}
            </div>
        </header>
    );
}
