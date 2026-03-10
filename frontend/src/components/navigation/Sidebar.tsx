import { LayoutDashboard, CheckSquare, User, Settings, Home } from 'lucide-react';
import NavItemComponent from './NavItem';
import type { NavItem } from '@/types';

const NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
    return (
        <aside
            className="fixed left-0 top-0 h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-40 transition-all duration-200"
            style={{ width: collapsed ? '60px' : 'var(--sidebar-width)' }}
            aria-label="Main navigation"
        >
            {/* ── Logo ── */}
            <div className="flex items-center gap-2.5 px-4 h-[var(--topbar-height)] border-b border-[var(--color-border)] shrink-0">
                <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                        <path
                            d="M2 4L4.5 10L7 5.5L9.5 10L12 4"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                {!collapsed && (
                    <span className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight">
                        WedTrack
                    </span>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                    <NavItemComponent key={item.href} item={item} collapsed={collapsed} />
                ))}
            </nav>

            {/* ── Footer ── */}
            <div className="p-2 border-t border-[var(--color-border)] shrink-0">
                <p className="text-caption text-[var(--color-text-muted)] text-center px-2">
                    {!collapsed ? 'v0.1.0' : '▲'}
                </p>
            </div>
        </aside>
    );
}
