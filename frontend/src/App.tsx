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
            // Check if URL contains auth potential
            const hasAuthParams = window.location.hash.includes('access_token=') || 
                                window.location.search.includes('type=recovery') ||
                                window.location.search.includes('type=invite') ||
                                window.location.search.includes('type=signup');

            // If we have auth params, wait up to 2 seconds for Supabase to process them
            if (hasAuthParams) {
                console.log("Auth params detected, waiting for session recovery...");
                let retries = 0;
                while (retries < 20) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        setSession(session);
                        return;
                    }
                    await new Promise(r => setTimeout(r, 100));
                    retries++;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };

        // Initial session check
        checkSession();

        // Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AUTH STATE CHANGE - SESSION:", session);
            console.log("AUTH STATE CHANGE - USER:", session?.user);
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [setSession]);

    return <AppRouter />;
}
