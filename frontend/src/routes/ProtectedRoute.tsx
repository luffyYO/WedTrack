import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
    redirectTo?: string;
}

/**
 * Guards routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 */
export default function ProtectedRoute({ redirectTo = '/login' }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return <LoadingSpinner fullScreen label="Authenticating…" />;
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}
