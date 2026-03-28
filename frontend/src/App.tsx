import { useEffect } from 'react';
import AppRouter from '@/routes/router';
import { supabase } from '@/config/supabaseClient';
import { useAuthStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';

/**
 * App root — thin wrapper that mounts the router.
 * Global providers (theme, notifications, query client) can be added here later.
 */
export default function App() {
    const setSession = useAuthStore((state) => state.setSession);
    const queryClient = useQueryClient();

    useEffect(() => {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('bg-white', 'text-black');
        document.body.classList.remove('bg-black', 'text-white');
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const hasAuthParams = window.location.hash.includes('access_token=') ||
                                window.location.search.includes('type=recovery') ||
                                window.location.search.includes('type=invite') ||
                                window.location.search.includes('type=signup');

            // For auth callback URLs, give Supabase a moment to process the token
            if (hasAuthParams) {
                await new Promise(r => setTimeout(r, 300));
            }

            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };

        checkSession();

        // Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);

            // ── Cache isolation: clear ALL cached queries on sign-out ──────────
            // Prevents previous user's data (weddings, guests) from leaking to
            // the next user who logs in on the same browser session.
            if (event === 'SIGNED_OUT') {
                queryClient.clear();
            }
        });

        return () => subscription.unsubscribe();
    }, [setSession, queryClient]);

    return <AppRouter />;
}
