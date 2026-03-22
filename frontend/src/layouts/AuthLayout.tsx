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
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
                    <img
                        src="/logo.jpeg"
                        alt="WedTrack logo"
                        className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-neutral-200 dark:ring-neutral-800" 
                    />
                    <span className="text-2xl font-bold tracking-tight">
                        WedTrack
                    </span>
                </div>

                <div className="animate-fade-in-up delay-100">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
