import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthActions {
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    // State
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true, // start loading to check session on mount

    // Actions
    setSession: (session) =>
        set({
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: () => set({ user: null, session: null, isAuthenticated: false }),
}));
