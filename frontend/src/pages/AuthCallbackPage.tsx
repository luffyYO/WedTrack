import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabaseClient';

/**
 * Handles the Supabase OAuth redirect callback.
 * Supabase PKCE flow redirects back with ?code=... which must be
 * exchanged for a session here before navigating to the app.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeCode = async () => {
      // Supabase JS v2 automatically handles the code exchange when
      // getSession() is called on the callback URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/login', { replace: true });
        return;
      }

      if (data.session) {
        // Session established — navigate to dashboard
        navigate('/home', { replace: true });
      } else {
        // No session yet (token might still be in hash), wait for onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            navigate('/home', { replace: true });
          } else if (event === 'SIGNED_OUT') {
            subscription.unsubscribe();
            navigate('/login', { replace: true });
          }
        });

        // Fallback: if nothing happens in 5s, redirect to login
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }, 5000);
      }
    };

    exchangeCode();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
