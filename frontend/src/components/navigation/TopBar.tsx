import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store';
import { getInitials } from '@/utils/formatters';

interface TopBarProps {
    pageTitle?: string;
}

export default function TopBar({ pageTitle }: TopBarProps) {
    const user = useAuthStore((s) => s.user);

    return (
        <header
            className="sticky top-0 z-30 flex items-center justify-between px-6 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]"
            style={{ height: 'var(--topbar-height)' }}
        >
            {/* Left: Page Title */}
            <div>
                {pageTitle && (
                    <h2 className="text-heading-sm text-[var(--color-text-primary)]">{pageTitle}</h2>
                )}
            </div>

            {/* Right: Search + Notifications + Avatar */}
            <div className="flex items-center gap-2">
                {/* Search trigger */}
                <button
                    className="flex items-center gap-2 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[13px] hover:border-[var(--color-border-strong)] transition-colors duration-150"
                    aria-label="Open search"
                >
                    <Search size={13} />
                    <span className="hidden sm:block">Search…</span>
                </button>

                {/* Notifications */}
                <button
                    className="relative w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-neutral-100 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell size={17} />
                    {/* Unread indicator */}
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-600" />
                </button>

                {/* User Avatar */}
                {user && (
                    <button
                        className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-[12px] font-semibold hover:ring-2 hover:ring-primary-300 transition-all"
                        aria-label={`User menu for ${user.name}`}
                    >
                        {getInitials(user.name)}
                    </button>
                )}
            </div>
        </header>
    );
}
