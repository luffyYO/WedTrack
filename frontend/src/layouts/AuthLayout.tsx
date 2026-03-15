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
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center">
                        <svg viewBox="0 0 14 14" fill="none" className="w-5 h-5">
                            <path
                                d="M2 4L4.5 10L7 5.5L9.5 10L12 4"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                        WedTrack
                    </span>
                </div>

                <Outlet />
            </div>
        </div>
    );
}
