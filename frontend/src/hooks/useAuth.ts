import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { supabase } from '@/config/supabaseClient';

/**
 * Hook that wraps auth store actions with API calls.
 * Provides logout and current user state.
 * Login/Signup are typically handled directly by the auth pages using supabase-js.
 */
export function useAuth() {
    const navigate = useNavigate();
    const { user, session, isAuthenticated, isLoading, logout: clearStore } = useAuthStore();

    const handleLogout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            clearStore();
            navigate('/');
        }
    }, [clearStore, navigate]);

    return {
        user,
        session,
        isAuthenticated,
        isLoading,
        logout: handleLogout,
    };
}
