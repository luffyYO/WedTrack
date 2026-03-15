import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/navigation/TopBar';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const PAGE_TITLES: Record<string, string> = {
    '/home': 'Home',
    '/dashboard': 'Dashboard',
    '/tasks': 'Tasks',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/wedding-track/new': 'Create Wedding Track',
};

export default function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] ?? '';

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            {/* ── Mobile backdrop overlay ── */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-[2px] animate-fade-in"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar ── */}
            <Sidebar
                collapsed={sidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {/* ── Main content — offset on desktop, full-width on mobile ── */}
            <div
                className={cn(
                    'flex flex-col min-h-screen transition-[margin] duration-200',
                    // Desktop: offset by sidebar width
                    sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[240px]'
                )}
            >
                <TopBar
                    pageTitle={pageTitle}
                    onMenuToggle={() => setMobileSidebarOpen((o) => !o)}
                />

                {/* Desktop sidebar collapse toggle */}
                <button
                    onClick={() => setSidebarCollapsed((c) => !c)}
                    className={cn(
                        'hidden md:flex fixed bottom-4 z-50',
                        'w-6 h-6 items-center justify-center rounded-full',
                        'bg-[var(--color-surface)] border border-[var(--color-border)]',
                        'shadow-[var(--shadow-md)] text-[var(--color-text-muted)]',
                        'hover:text-[var(--color-text-primary)] transition-colors'
                    )}
                    style={{ left: `calc(${sidebarCollapsed ? '60px' : '240px'} - 12px)` }}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        viewBox="0 0 8 8"
                        className={cn('w-3 h-3 transition-transform duration-200', sidebarCollapsed ? '' : 'rotate-180')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 1L2 4l3 3" />
                    </svg>
                </button>

                {/* Page content */}
                <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
