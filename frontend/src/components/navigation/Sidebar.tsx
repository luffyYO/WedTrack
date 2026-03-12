import { LayoutDashboard, CheckSquare, Settings, Home, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import NavItemComponent from './NavItem';
import type { NavItem } from '@/types';

const NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    collapsed?: boolean;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({
    collapsed = false,
    mobileOpen = false,
    onMobileClose,
}: SidebarProps) {
    const width = collapsed ? 'md:w-[60px]' : 'md:w-[240px]';

    return (
        <aside
            className={cn(
                // Base: fixed, full height, above content
                'fixed left-0 top-0 h-screen z-40',
                'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
                'flex flex-col transition-all duration-200',

                // Mobile: always 240px wide, slide in/out with transform
                'w-[240px]',
                mobileOpen ? 'translate-x-0 shadow-[var(--shadow-lg)]' : '-translate-x-full',

                // Desktop: always visible, width depends on collapsed state
                'md:translate-x-0',
                width
            )}
            aria-label="Main navigation"
        >
            {/* ── Logo ── */}
            <div className="flex items-center justify-between px-4 h-[60px] border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                            <path d="M2 4L4.5 10L7 5.5L9.5 10L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    {/* Hide label when desktop-collapsed */}
                    <span className={cn('text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight truncate', collapsed && 'md:hidden')}>
                        WedTrack
                    </span>
                </div>

                {/* Mobile: close button */}
                <button
                    onClick={onMobileClose}
                    className="md:hidden p-1 rounded-md text-[var(--color-text-muted)] hover:bg-neutral-100 transition-colors"
                    aria-label="Close menu"
                >
                    <X size={18} />
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                    <NavItemComponent
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onMobileClose}
                    />
                ))}
            </nav>

            {/* ── Footer ── */}
            <div className="p-2 border-t border-[var(--color-border)] shrink-0">
                <p className={cn('text-caption text-[var(--color-text-muted)] text-center px-2', collapsed && 'md:hidden')}>
                    v0.1.0
                </p>
            </div>
        </aside>
    );
}
