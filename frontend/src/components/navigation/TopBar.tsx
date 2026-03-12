import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store';
import { getInitials } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
    pageTitle?: string;
    onMenuToggle?: () => void;
}

export default function TopBar({ pageTitle, onMenuToggle }: TopBarProps) {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

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

                {/* Notifications */}
                <button
                    className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-neutral-100 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell size={17} />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary-600" />
                </button>
 
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
