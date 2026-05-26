/**
 * QRErrorPage — Branded error states for QR scan failures
 *
 * ?reason=expired  → Wedding form is closed
 * ?reason=invalid  → QR code not recognized
 * ?reason=inactive → QR not yet active (before activation time)
 * ?reason=deleted  → Invitation no longer available
 */

import { useSearchParams } from 'react-router-dom';

type ErrorConfig = {
  emoji: string;
  title: string;
  subtitle: string;
  hint: string;
};

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  expired: {
    emoji: '🌸',
    title: 'Wedding Form Closed',
    subtitle: 'The registration period for this wedding has ended.',
    hint: 'Thank you for celebrating with us!',
  },
  inactive: {
    emoji: '⏳',
    title: 'Not Yet Active',
    subtitle: 'This QR code will be active on the day of the wedding.',
    hint: 'Please try again closer to the wedding date.',
  },
  invalid: {
    emoji: '🔍',
    title: 'Invalid QR Code',
    subtitle: 'This QR code could not be recognised.',
    hint: 'Please scan the QR code printed on the wedding invitation.',
  },
  deleted: {
    emoji: '🌿',
    title: 'Invitation Unavailable',
    subtitle: 'This wedding invitation is no longer available.',
    hint: 'Please contact the wedding hosts for assistance.',
  },
};

export default function QRErrorPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'invalid';
  const config = ERROR_CONFIGS[reason] ?? ERROR_CONFIGS.invalid;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(160deg, #fdf4ff 0%, #fce7f3 50%, #fff1f2 100%)',
      padding: '2rem 1.5rem',
      textAlign: 'center',
    }}>
      {/* Decorative top flourish */}
      <div style={{ fontSize: '0.75rem', letterSpacing: '0.25em', color: '#f9a8d4', marginBottom: '2rem', textTransform: 'uppercase', fontWeight: 700 }}>
        WedTrack ✦
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '2rem',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 20px 60px rgba(236,72,153,0.12), 0 4px 20px rgba(0,0,0,0.04)',
        padding: '2.5rem 2rem',
        maxWidth: '360px',
        width: '100%',
      }}>
        {/* Emoji */}
        <div style={{ fontSize: '4rem', marginBottom: '1.25rem', lineHeight: 1 }}>
          {config.emoji}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#1e1e2e',
          margin: '0 0 0.75rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}>
          {config.title}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: '#4b5563',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          margin: '0 0 1.5rem',
        }}>
          {config.subtitle}
        </p>

        {/* Divider */}
        <div style={{
          width: '40px',
          height: '2px',
          background: 'linear-gradient(90deg, #f9a8d4, #ec4899)',
          borderRadius: '999px',
          margin: '0 auto 1.5rem',
        }} />

        {/* Hint */}
        <p style={{
          color: '#9ca3af',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          margin: 0,
          fontStyle: 'italic',
        }}>
          {config.hint}
        </p>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: '2rem',
        color: '#d1d5db',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        WedTrack Guest System
      </p>
    </div>
  );
}
