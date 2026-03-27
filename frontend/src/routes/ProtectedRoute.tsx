import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * Guards routes that require authentication.
 *
 * ─── LCP Critical Fix ────────────────────────────────────────────────────────
 * The previous implementation showed a full-screen spinner while `isLoading`,
 * which blocked ALL content from painting until auth resolved (~200-800ms).
 * This was the primary cause of the 11+ second LCP.
 *
 * New behaviour:
 * • While auth is being resolved (isLoading = true) → render the page content
 *   anyway. TanStack Query's `enabled: !!user?.id` guards will prevent data
 *   fetches from firing until auth resolves.
 * • Once auth resolves as unauthenticated → redirect to /login.
 * • This means the page skeleton/UI appears immediately, and data populates
 *   as soon as the session check completes (~100-200ms).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ProtectedRoute({ redirectTo = '/login' }: { redirectTo?: string }) {
    const { isAuthenticated, isLoading } = useAuthStore();

    // Auth resolved as not logged in → redirect
    if (!isLoading && !isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Render the page immediately — data fetches are guarded by `enabled: !!user`
    return <Outlet />;
}
