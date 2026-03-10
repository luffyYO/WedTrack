import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authService } from '@/api/authService';
import type { LoginCredentials, SignupData } from '@/types';

/**
 * Hook that wraps auth store actions with API calls.
 * Provides login, signup, logout, and current user state.
 */
export function useAuth() {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();

    const handleLogin = useCallback(
        async (credentials: LoginCredentials) => {
            setLoading(true);
            try {
                const { data } = await authService.login(credentials);
                login(data.data.user, data.data.token);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        },
        [login, navigate, setLoading]
    );

    const handleSignup = useCallback(
        async (signupData: SignupData) => {
            setLoading(true);
            try {
                const { data } = await authService.signup(signupData);
                login(data.data.user, data.data.token);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        },
        [login, navigate, setLoading]
    );

    const handleLogout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            logout();
            navigate('/login');
        }
    }, [logout, navigate]);

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
    };
}
