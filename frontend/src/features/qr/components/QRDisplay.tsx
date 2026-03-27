import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/utils/cn';

interface QRDisplayProps {
    status: 'loading' | 'success' | 'error';
    /** The URL to encode into the QR code (e.g. https://wedtrackss.in/guest-form/abc123) */
    qrImageUrl?: string;
    weddingTitle: string;
    errorMessage?: string;
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function QRSkeleton() {
    return (
        <div className="w-full aspect-square max-w-[260px] rounded-[var(--radius-lg)] bg-neutral-100 relative overflow-hidden">
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                }}
            />
            {/* Placeholder QR pattern */}
            <div className="absolute inset-6 grid grid-cols-7 grid-rows-7 gap-1 opacity-10">
                {Array.from({ length: 49 }).map((_, i) => (
                    <div key={i} className={cn('rounded-[2px] bg-neutral-400', Math.random() > 0.5 && 'opacity-0')} />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QRDisplay({ status, qrImageUrl, weddingTitle, errorMessage }: QRDisplayProps) {
    const qrRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className={cn(
                'relative flex items-center justify-center',
                'w-full max-w-[320px] mx-auto',
                'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
                'border border-[var(--color-border)]',
                'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.10),_0_2px_8px_-2px_rgba(0,0,0,0.06)]',
                'p-7'
            )}
            role="img"
            aria-label={`QR code for ${weddingTitle}`}
        >
            {status === 'loading' && <QRSkeleton />}

            {status === 'success' && qrImageUrl && (
                <div ref={qrRef} className="flex items-center justify-center w-full">
                    <QRCodeSVG
                        value={qrImageUrl}
                        size={240}
                        level="H"
                        includeMargin={true}
                        style={{ width: '100%', maxWidth: '260px', height: 'auto', borderRadius: '8px' }}
                    />
                </div>
            )}

            {status === 'success' && !qrImageUrl && (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-[var(--color-text-muted)]">
                    <p className="text-body-sm">No QR link available yet.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-[var(--color-text-muted)]">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14h.01M14 14h.01M20 14h.01M14 17h.01M17 17h.01M20 17h.01M14 20h7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-body-sm">{errorMessage ?? 'Failed to load QR code.'}</p>
                </div>
            )}
        </div>
    );
}
