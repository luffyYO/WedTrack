import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/navigation/TopBar';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/tasks': 'Tasks',
    '/profile': 'Profile',
    '/settings': 'Settings',
};

export default function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] ?? '';
    const sidebarWidth = sidebarCollapsed ? '60px' : 'var(--sidebar-width)';

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Sidebar collapsed={sidebarCollapsed} />

            {/* Main content — offset by sidebar */}
            <div
                className="flex flex-col min-h-screen transition-all duration-200"
                style={{ marginLeft: sidebarWidth }}
            >
                <TopBar pageTitle={pageTitle} />

                {/* Sidebar collapse toggle */}
                <button
                    onClick={() => setSidebarCollapsed((c) => !c)}
                    className="fixed bottom-4 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    style={{ left: `calc(${sidebarWidth} - 12px)` }}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        viewBox="0 0 8 8"
                        className={`w-3 h-3 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`}
                        fill="currentColor"
                    >
                        <path d="M5 1L2 4l3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Page content */}
                <main className="flex-1 px-6 py-6">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
