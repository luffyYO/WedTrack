import { useEffect } from 'react';
import AppRouter from '@/routes/router';
import { supabase } from '@/config/supabaseClient';
import { useAuthStore } from '@/store';
import { useThemeStore } from '@/store/themeStore';
import { useQueryClient } from '@tanstack/react-query';
import { onMessage } from 'firebase/messaging';
import { messaging, isFirebaseEnabled } from '@/config/firebaseConfig';

/**
 * App root — thin wrapper that mounts the router.
 * Global providers (theme, notifications, query client) can be added here later.
 */
export default function App() {
    const setSession = useAuthStore((state) => state.setSession);
    const queryClient = useQueryClient();
    const applyToDOM = useThemeStore((s) => s.applyToDOM);

    // Sync persisted theme → DOM classes on every mount
    useEffect(() => {
        applyToDOM();
    }, [applyToDOM]);

    // Foreground Notification Handler (For Desktop / Active Tabs)
    useEffect(() => {
        if (!isFirebaseEnabled || !messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('[App] Foreground message received:', payload);
            
            if (Notification.permission === 'granted' && payload.notification) {
                const title = payload.notification.title || 'New Notification';
                const options = {
                    body: payload.notification.body,
                    icon: '/logo.jpeg',
                    data: payload.data
                };
                
                const notification = new Notification(title, options);
                
                notification.onclick = (event) => {
                    event.preventDefault();
                    const url = payload.data?.url;
                    if (url) {
                        window.focus(); // Focus current window if possible
                        // Only open a new tab if it's a completely different URL
                        if (!window.location.href.includes(url)) {
                            window.location.href = url;
                        }
                    }
                    notification.close();
                };
            }
        });

        return () => {
            unsubscribe();
        };
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
