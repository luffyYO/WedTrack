import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';
import { qrService } from '../services/qrService';
import QRDisplay from '../components/QRDisplay';
import QRActionButtons from '../components/QRActionButtons';
import type { QRFetchState, QRData } from '../types/qr.types';
import { WeddingNameDisplay } from '@/components/ui';

// ─── Decorative ring divider (SVG, theme-neutral) ────────────────────────────

function RingDivider() {
    return (
        <div className="flex items-center justify-center gap-3 my-6 select-none" aria-hidden="true">
            <span className="flex-1 max-w-[120px] h-[1.5px] bg-gray-100" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 opacity-50" />
            <span className="flex-1 max-w-[120px] h-[1.5px] bg-gray-100" />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeddingQRPage() {
    const { trackId } = useParams<{ trackId: string }>();
    const navigate = useNavigate();
    const [fetchState, setFetchState] = useState<QRFetchState>({ status: 'loading' });
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [isExtending, setIsExtending] = useState(false);

    const calculateTimeLeft = (expiry: string) => {
        const now = new Date().getTime();
        const expirationTime = new Date(expiry).getTime();
        const difference = expirationTime - now;

        if (difference <= 0) {
            setIsExpired(true);
            return 'QR Code Expired';
        }

        setIsExpired(false);
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // TEST MODE: Show seconds for easier testing
        return `[TEST MODE] QR expires in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

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
            
            if (qrData.qrExpiresAt) {
                setTimeLeft(calculateTimeLeft(qrData.qrExpiresAt));
            }
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

    useEffect(() => {
        if (fetchState.status === 'success' && fetchState.data.qrExpiresAt) {
            // TEST MODE: Update every second for a smooth countdown
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft(fetchState.data.qrExpiresAt!));
            }, 1000); 

            return () => clearInterval(timer);
        }
    }, [fetchState]);

    const handleExtend = async () => {
        if (!trackId) return;
        setIsExtending(true);
        try {
            await qrService.extend(trackId);
            await fetchQR(); // Refresh to get new expiry
        } catch (err) {
            console.error('Failed to extend QR:', err);
        } finally {
            setIsExtending(false);
        }
    };

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
                ) : isSuccess && qrData ? (
                    <>
                        <WeddingNameDisplay 
                            brideName={qrData.brideName} 
                            groomName={qrData.groomName} 
                            size="xl" 
                            className="mb-1"
                        />
                        {qrData?.venue && (
                            <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                                {qrData.venue}{qrData?.date ? ` · ${formatDate(qrData.date)}` : ''}
                            </p>
                        )}
                        
                        {/* ── Countdown Timer ── */}
                        {timeLeft && (
                            <div className={`mt-3 px-3 py-1 rounded-full text-caption font-bold inline-block animate-fade-in ${
                                isExpired 
                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                    : 'bg-primary-50 text-primary-600 border border-primary-100'
                            }`}>
                                {timeLeft}
                            </div>
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
                    <div className="flex flex-col gap-4">
                        <QRActionButtons
                            shareLink={qrData?.shareLink ?? ''}
                            qrImageUrl={qrData?.qrImageUrl ?? ''}
                            weddingTitle={weddingTitle}
                            disabled={isLoading}
                        />

                        {/* ── Extend Button (Only if Success and TrackId exists) ── */}
                        {isSuccess && (
                            <Button
                                variant={isExpired ? "primary" : "outline"}
                                size="md"
                                fullWidth
                                onClick={handleExtend}
                                isLoading={isExtending}
                                icon={<RefreshCw size={16} />}
                            >
                                {isExpired ? "Re-activate QR for 2 Minutes (TEST)" : "Extend QR for 2 Minutes (TEST)"}
                            </Button>
                        )}
                    </div>
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
