import { useEffect, useCallback } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore, useWishStore } from '@/store';
import { getInitials } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import type { Wish } from '@/api/wishService';
import API_BASE_URL from '@/config/api';

interface TopBarProps {
    pageTitle?: string;
    onMenuToggle?: () => void;
}

export default function TopBar({ pageTitle, onMenuToggle }: TopBarProps) {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const { unreadCount, fetchWishes, addWish } = useWishStore();

    // ── Fetch wishes on mount ─────────────────────────────────────────────────
    useEffect(() => {
        fetchWishes();
    }, [fetchWishes]);

    // ── Socket.io real-time connection ────────────────────────────────────────
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

    // ── Navigate to wishes page ───────────────────────────────────────────────
    const handleBellClick = useCallback(() => {
        navigate('/wishes');
    }, [navigate]);

    return (
        <header
            className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]"
            style={{ height: 'var(--topbar-height)' }}
        >
            {/* ── Left: Hamburger (mobile) + Page title ── */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onMenuToggle}
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-neutral-100 transition-colors shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={20} />
                </button>

                {pageTitle && (
                    <h2 className="text-heading-sm text-[var(--color-text-primary)] truncate">
                        {pageTitle}
                    </h2>
                )}
            </div>

            {/* ── Right: Notifications + Avatar ── */}
            <div className="flex items-center gap-1.5 sm:gap-2">

                {/* Notifications bell — relative wrapper for panel */}
                <div className="relative">
                    <button
                        id="notification-bell"
                        onClick={handleBellClick}
                        className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-neutral-100 transition-colors"
                        aria-label={unreadCount > 0 ? `${unreadCount} unread wishes` : 'Notifications'}
                    >
                        <Bell size={17} />
                        {/* Red dot — only shown when there are unread wishes */}
                        {unreadCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 flex items-center justify-center"
                                aria-hidden="true"
                            >
                                {/* Pulse ring */}
                                <span className="absolute w-3 h-3 rounded-full bg-red-400 opacity-60 animate-ping" />
                                <span className="relative w-2 h-2 rounded-full bg-red-500" />
                            </span>
                        )}
                    </button>
                </div>

                {/* User Avatar */}
                {user && (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-[12px] font-semibold hover:ring-2 hover:ring-primary-300 transition-all shrink-0"
                        aria-label={`User menu for ${user.user_metadata?.name || user.email || 'User'}`}
                    >
                        {getInitials(user.user_metadata?.name || user.email || 'U')}
                    </button>
                )}
            </div>
        </header>
    );
}
