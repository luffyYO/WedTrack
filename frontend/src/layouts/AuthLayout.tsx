import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * Minimal centered layout for public pages (login, signup, etc.)
 * Does not include the sidebar or topbar — and no branding of its own.
 * Each auth page (LoginPage, etc.) is responsible for its own logo / title.
 */
export default function AuthLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/home" replace />;

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    );
}

