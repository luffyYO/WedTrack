import { LayoutDashboard, CheckSquare, Settings, Home, X, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/utils/cn';
import NavItemComponent from './NavItem';
import type { NavItem } from '@/types';

const NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Wishes', href: '/wishes', icon: MessageSquareHeart },
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
    const width = collapsed ? 'md:w-[80px]' : 'md:w-[260px]'; // Slightly wider for airy feel

    return (
        <aside
            className={cn(
                // Base: fixed, full height, above content, premium glassmorphism
                'fixed left-0 top-0 h-screen z-[100]',
                'bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
                'flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',

                // Mobile: 260px wide, slide in/out
                'w-[260px]',
                mobileOpen ? 'translate-x-0' : '-translate-x-full',

                // Desktop: always visible, controlled by collapsed state
                'md:translate-x-0',
                width
            )}
            aria-label="Main navigation"
        >
            {/* ── Logo Area ── */}
            <div className="flex items-center justify-between px-5 h-[auto] py-6 border-b border-slate-200/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src="/logo.jpeg"
                        alt="WedTrack logo"
                        className="w-10 h-10 rounded-[12px] object-cover shrink-0 shadow-sm"
                    />
                    {/* Hide label when desktop-collapsed */}
                    <span className={cn('text-[18px] font-bold text-slate-800 tracking-tight truncate', collapsed && 'md:hidden')}>
                        WedTrack
                    </span>
                </div>

                {/* Mobile: close button */}
                <button
                    onClick={onMobileClose}
                    className="md:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 transition-colors"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-hide">
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
            <div className="p-4 border-t border-slate-200/50 shrink-0">
                <p className={cn('text-xs font-semibold text-slate-400 text-center tracking-wider', collapsed && 'md:hidden')}>
                    v1.0.0
                </p>
            </div>
        </aside>
    );
}
