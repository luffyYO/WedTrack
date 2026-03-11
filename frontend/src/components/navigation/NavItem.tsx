import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { NavItem } from '@/types';

interface NavItemProps {
    item: NavItem;
    collapsed?: boolean;
    /** Called after navigation — used to close mobile sidebar */
    onNavigate?: () => void;
}

export default function NavItemComponent({ item, collapsed = false, onNavigate }: NavItemProps) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.href}
            end={item.href === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 py-2 rounded-[var(--radius-md)]',
                    'text-[13px] font-medium transition-colors duration-150 group relative',
                    // Touch: minimum 44px height on mobile
                    'min-h-[44px] md:min-h-0',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-neutral-100 hover:text-[var(--color-text-primary)]'
                )
            }
            title={collapsed ? item.label : undefined}
        >
            {Icon && <Icon size={17} className="shrink-0" />}

            {!collapsed && <span className="truncate">{item.label}</span>}

            {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold px-1 bg-primary-100 text-primary-700">
                    {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}

            {/* Tooltip for collapsed desktop state */}
            {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-[var(--radius-sm)] bg-neutral-900 text-white text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                    {item.label}
                </span>
            )}
        </NavLink>
    );
}
