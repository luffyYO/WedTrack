import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * Minimal centered layout for public pages (login, signup, etc.)
 * Does not include the sidebar or topbar.
 */
export default function AuthLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return null; // Or a simple spinner
    if (isAuthenticated) return <Navigate to="/home" replace />;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md">

                <div className="animate-fade-in-up delay-100">
                    <Outlet />
                </div>

                <footer className="mt-12 text-center" style={{ fontSize: '14px' }}>
                    <a href="/privacy" className="text-slate-400 hover:text-pink-500 transition-colors">Privacy policy</a>
                    <span className="mx-2 text-slate-300">|</span>
                    <a href="/terms" className="text-slate-400 hover:text-pink-500 transition-colors">Terms of Service</a>
                </footer>
            </div>
        </div>
    );
}
