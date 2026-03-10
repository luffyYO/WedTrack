import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthActions {
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const TOKEN_KEY = 'wedtrack_token';

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            // Actions
            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setToken: (token) => {
                if (token) localStorage.setItem(TOKEN_KEY, token);
                else localStorage.removeItem(TOKEN_KEY);
                set({ token });
            },

            setLoading: (isLoading) => set({ isLoading }),

            login: (user, token) => {
                localStorage.setItem(TOKEN_KEY, token);
                set({ user, token, isAuthenticated: true });
            },

            logout: () => {
                localStorage.removeItem(TOKEN_KEY);
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'wedtrack-auth-store',
            // Only persist the token — re-fetch user on app load
            partialize: (state) => ({ token: state.token }),
        }
    )
);
