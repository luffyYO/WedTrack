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
            const { data: { session } } = await supabase.auth.getSession();
            console.log("SESSION:", session);
            console.log("USER:", session?.user);
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
