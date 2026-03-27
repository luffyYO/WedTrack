import { useEffect } from 'react';
import AppRouter from '@/routes/router';
import { supabase } from '@/config/supabaseClient';
import { useAuthStore } from '@/store';

/**
 * App root — thin wrapper that mounts the router.
 * Global providers (theme, notifications, query client) can be added here later.
 */
export default function App() {
    const setSession = useAuthStore((state) => state.setSession);

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
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (import.meta.env.DEV) {
                console.log("[Auth] State change:", _event, !!session);
            }
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [setSession]);

    return <AppRouter />;
}
