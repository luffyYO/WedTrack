/**
 * QRRedirectPage — Universal QR scan landing page
 *
 * This page is intentionally ultra-lightweight. It is the first thing
 * a QR scanner opens when a guest scans the wedding QR code.
 *
 * Strategy:
 * - Immediately redirect via window.location.replace() to the resolve-qr
 *   edge function, which validates the token and issues a 302 to the form.
 * - window.location.replace() is used (not React Router navigate) because
 *   payment app in-app browsers (Paytm, PhonePe, GPay, WhatsApp) sometimes
 *   block programmatic navigation via pushState but always honour
 *   window.location.replace().
 * - No heavy JS bundle is rendered before the redirect fires.
 * - A 1.5-second fallback shows a retry UI in case the redirect stalls
 *   (e.g. edge function cold-start timeout on a slow 2G connection).
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();

export default function QRRedirectPage() {
  const { token } = useParams<{ token: string }>();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!token) {
      window.location.replace('/qr-error?reason=invalid');
      return;
    }

    // Primary redirect — edge function handles all validation and state
    const resolveUrl = `${SUPABASE_URL}/functions/v1/resolve-qr?t=${encodeURIComponent(token)}`;

    // Use replace (not assign) so the back button doesn't loop back here
    window.location.replace(resolveUrl);

    // Fallback: if redirect hasn't fired after 3s (edge function cold start / 2G),
    // show a manual "Open Form" button. The URL is the same — just retries.
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [token]);

  if (showFallback) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        padding: '1.5rem',
        textAlign: 'center',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '3rem' }}>💍</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e1e2e', margin: 0 }}>
          Opening Wedding Form…
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Taking a moment to load. Tap the button if it doesn't open automatically.
        </p>
        <a
          href={`${SUPABASE_URL}/functions/v1/resolve-qr?t=${encodeURIComponent(token || '')}`}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #ec4899, #db2777)',
            color: '#fff',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(236,72,153,0.3)',
          }}
        >
          Open Form
        </a>
      </div>
    );
  }

  // Loading state — renders for at most ~3 seconds before fallback shows
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      gap: '1rem',
    }}>
      {/* Spinner */}
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #fce7f3',
        borderTop: '4px solid #ec4899',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{
        color: '#9d174d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.9rem',
        fontWeight: 600,
        margin: 0,
      }}>
        Opening…
      </p>
    </div>
  );
}
