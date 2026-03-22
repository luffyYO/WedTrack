import { useEffect } from 'react';
import AppRouter from '@/routes/router';
import { supabase } from '@/config/supabaseClient';
import { useAuthStore } from '@/store';
import type { Session } from '@supabase/supabase-js';

/**
 * App root — thin wrapper that mounts the router.
 * Global providers (theme, notifications, query client) can be added here later.
 */
export default function App() {
    const setSession = useAuthStore((state) => state.setSession);
   useEffect(() => {
  console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
}, []);
    useEffect(() => {
        const syncUser = async (session: Session | null) => {
            setSession(session);
        };
        // useEffect(() => {
        //     console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
        //     console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
        //     }, []);

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            syncUser(session);
        });

        // Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            syncUser(session);
        });

        return () => subscription.unsubscribe();
    }, [setSession]);

    return <AppRouter />;
}
