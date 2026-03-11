import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

import Button from '@/components/ui/Button';
import { qrService } from '../services/qrService';
import QRDisplay from '../components/QRDisplay';
import QRActionButtons from '../components/QRActionButtons';
import type { QRFetchState, QRData } from '../types/qr.types';

// ─── Decorative ring divider (SVG, theme-neutral) ────────────────────────────

function RingDivider() {
    return (
        <div className="flex items-center justify-center gap-3 my-5 select-none" aria-hidden="true">
            <span className="flex-1 max-w-[80px] h-px bg-[var(--color-border)]" />
            <svg viewBox="0 0 48 20" fill="none" className="w-12 h-5 text-neutral-300">
                <circle cx="14" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="34" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="flex-1 max-w-[80px] h-px bg-[var(--color-border)]" />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeddingQRPage() {
    const { trackId } = useParams<{ trackId: string }>();
    const navigate = useNavigate();
    const [fetchState, setFetchState] = useState<QRFetchState>({ status: 'loading' });

    const fetchQR = async () => {
        if (!trackId) {
            setFetchState({ status: 'error', message: 'Invalid wedding track ID.' });
            return;
        }
        setFetchState({ status: 'loading' });
        try {
            const { data: res } = await qrService.getByTrackId(trackId);
            const qrData = (res as any).data ?? res;
            setFetchState({ status: 'success', data: qrData as QRData });
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: string }).message)
                    : 'Failed to load QR code. Please try again.';
            setFetchState({ status: 'error', message });
        }
    };

    useEffect(() => {
        fetchQR();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackId]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const isSuccess = fetchState.status === 'success';
    const isLoading = fetchState.status === 'loading';
    const qrData = isSuccess ? fetchState.data : null;

    const weddingTitle = qrData
        ? `${qrData.brideName} & ${qrData.groomName}`
        : 'Wedding Track';

    return (
        <div className="min-h-[calc(100vh-var(--topbar-height))] flex flex-col items-center justify-start py-8 px-4">

            {/* ── Back button ── */}
            <div className="w-full max-w-[400px] mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowLeft size={15} />}
                    onClick={() => navigate('/dashboard')}
                >
                    Back to Dashboard
                </Button>
            </div>

            {/* ── Wedding Header ── */}
            <div className="text-center mb-2 w-full max-w-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-64 rounded-[var(--radius-md)] bg-neutral-100 animate-pulse mx-auto" />
                        <div className="h-4 w-40 rounded-[var(--radius-md)] bg-neutral-100 animate-pulse mx-auto" />
                    </div>
                ) : isSuccess ? (
                    <>
                        <h1 className="text-display-sm text-[var(--color-text-primary)] tracking-tight">
                            {weddingTitle}
                        </h1>
                        {qrData?.venue && (
                            <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                                {qrData.venue}{qrData?.date ? ` · ${new Date(qrData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                            </p>
                        )}
                    </>
                ) : null}

                <RingDivider />
            </div>

            {/* ── QR Display ── */}
            <div className="w-full max-w-[400px]">
                <QRDisplay
                    status={fetchState.status}
                    qrImageUrl={qrData?.qrImageUrl}
                    weddingTitle={weddingTitle}
                    errorMessage={fetchState.status === 'error' ? fetchState.message : undefined}
                />
            </div>

            {/* ── Share link label ── */}
            {isSuccess && qrData?.shareLink && (
                <div className="mt-4 max-w-[320px] w-full">
                    <p className="text-caption text-[var(--color-text-muted)] text-center truncate px-2">
                        {qrData.shareLink}
                    </p>
                </div>
            )}

            {/* ── Action Buttons or Error retry ── */}
            <div className="mt-5 w-full max-w-[400px]">
                {fetchState.status === 'error' ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[var(--color-danger)] text-body-sm">
                            <AlertCircle size={15} />
                            <span>{fetchState.message}</span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<RefreshCw size={14} />}
                            onClick={fetchQR}
                        >
                            Try again
                        </Button>
                    </div>
                ) : (
                    <QRActionButtons
                        shareLink={qrData?.shareLink ?? ''}
                        qrImageUrl={qrData?.qrImageUrl ?? ''}
                        weddingTitle={weddingTitle}
                        disabled={isLoading}
                    />
                )}
            </div>

            {/* ── Track ID note ── */}
            {isSuccess && (
                <p className="text-caption text-[var(--color-text-muted)] mt-6">
                    Track ID: <span className="text-mono">{trackId}</span>
                </p>
            )}
        </div>
    );
}
