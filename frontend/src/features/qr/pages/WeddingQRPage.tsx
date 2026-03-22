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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeddingQRPage() {
    const { trackId } = useParams<{ trackId: string }>();
    const navigate = useNavigate();
    const [fetchState, setFetchState] = useState<QRFetchState>({ status: 'loading' });
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [isInactive, setIsInactive] = useState(false);
    const [isExtending, setIsExtending] = useState(false);

    const calculateTimeLeft = (expiry: string, activation?: string) => {
        const now = new Date().getTime();
        const activationTime = activation ? new Date(activation).getTime() : 0;
        const expirationTime = new Date(expiry).getTime();

        if (activationTime > now) {
            setIsInactive(true);
            setIsExpired(false);
            return 'QR Code Not Yet Active';
        }

        setIsInactive(false);
        const difference = expirationTime - now;

        if (difference <= 0) {
            setIsExpired(true);
            return 'QR Code Expired';
        }

        setIsExpired(false);
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return `QR expires in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
                setTimeLeft(calculateTimeLeft(qrData.qrExpiresAt, qrData.qrActivationTime));
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
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft(fetchState.data.qrExpiresAt!, fetchState.data.qrActivationTime));
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
        <div className="min-h-[calc(100vh-var(--topbar-height))] flex flex-col items-center justify-start py-8 px-4 animate-fade-up">

            {/* ── Back button ── */}
            <div className="w-full max-w-[420px] mb-6">
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
            <div className="text-center mb-6 w-full max-w-[420px] relative">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-64 rounded-full bg-slate-200/50 animate-pulse mx-auto" />
                        <div className="h-4 w-40 rounded-full bg-slate-200/50 animate-pulse mx-auto" />
                    </div>
                ) : isSuccess && qrData ? (
                    <div className="relative inline-block mt-4 px-8">
                        {/* ── Floral Name Decorations ── */}
                        <div className="absolute -top-5 -left-2 text-3xl animate-bounce" style={{animationDuration: '3s'}}>💖</div>
                        <div className="absolute -top-5 -right-2 text-3xl animate-bounce" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}>💖</div>
                        
                        <WeddingNameDisplay 
                            brideName={qrData.brideName} 
                            groomName={qrData.groomName} 
                            size="xl" 
                            className="mb-1 text-slate-800 drop-shadow-sm font-serif"
                        />
                        {qrData?.venue && (
                            <p className="text-sm text-slate-500 mt-2 font-medium">
                                {qrData.venue}{qrData?.date ? ` · ${formatDate(qrData.date)}` : ''}
                            </p>
                        )}
                        
                        {/* ── Status Badge ── */}
                        {timeLeft && (
                            <div className={`mt-4 px-5 py-2 rounded-full text-[11px] font-black inline-block uppercase tracking-widest shadow-sm border relative z-10 ${
                                isExpired 
                                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                    : isInactive
                                        ? 'bg-slate-50 text-slate-500 border-slate-200/60'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                                {timeLeft}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* ── QR Display ── */}
            <div className="w-full max-w-[420px] relative mt-2 mb-4">
                {/* ── Floral Frame Accents ── */}
                {isSuccess && (
                    <>
                        <div className="absolute -top-8 -left-8 text-5xl opacity-90 z-20 hover:scale-110 transition-transform cursor-default drop-shadow-md">🌸</div>
                        <div className="absolute -bottom-8 -right-8 text-5xl opacity-90 z-20 hover:scale-110 transition-transform cursor-default drop-shadow-md">🌸</div>
                        <div className="absolute -top-4 -right-4 text-4xl opacity-70 z-20 drop-shadow-sm">🌿</div>
                        <div className="absolute -bottom-4 -left-4 text-4xl opacity-70 z-20 drop-shadow-sm">🌿</div>
                        <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-3xl opacity-60 z-20">✨</div>
                        <div className="absolute top-1/2 -right-6 -translate-y-1/2 text-3xl opacity-60 z-20">✨</div>
                    </>
                )}

                <div className="glass-panel p-4 rounded-[2.5rem] relative overflow-hidden group border-white/80 shadow-[0_20px_60px_rgba(244,114,182,0.15)] ring-4 ring-white/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 pointer-events-none" />
                    
                    {/* Inner Premium Line */}
                    <div className="absolute inset-2 border-2 border-pink-200/50 rounded-[2rem] pointer-events-none z-10" />

                    <div className="relative z-10 w-full rounded-[2rem] overflow-hidden bg-white shadow-inner p-2">
                        <QRDisplay
                            status={fetchState.status}
                            qrImageUrl={qrData?.qrImageUrl}
                            weddingTitle={weddingTitle}
                            errorMessage={fetchState.status === 'error' ? fetchState.message : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* ── Share link label ── */}
            {isSuccess && qrData?.shareLink && (
                <div className="mt-6 max-w-[360px] w-full">
                    <p className="text-[12px] text-slate-400 text-center truncate px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                        {qrData.shareLink}
                    </p>
                </div>
            )}

            {/* ── Action Buttons or Error retry ── */}
            <div className="mt-6 w-full max-w-[420px]">
                {fetchState.status === 'error' ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-lg font-medium text-sm border border-rose-100">
                            <AlertCircle size={15} />
                            <span>{fetchState.message}</span>
                        </div>
                        <Button
                            variant="primary"
                            size="md"
                            icon={<RefreshCw size={14} />}
                            onClick={fetchQR}
                        >
                            Retry Loading Code
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="relative z-20">
                            <QRActionButtons
                                shareLink={qrData?.shareLink ?? ''}
                                qrImageUrl={qrData?.qrImageUrl ?? ''}
                                weddingTitle={weddingTitle}
                                disabled={isLoading}
                            />
                        </div>

                        {/* ── Extend Button ── */}
                        {isSuccess && (
                            <Button
                                variant={isExpired ? "primary" : "secondary"}
                                size="md"
                                fullWidth
                                onClick={handleExtend}
                                isLoading={isExtending}
                                icon={<RefreshCw size={16} />}
                                className={!isExpired ? 'glass-panel text-slate-600 hover:text-slate-800' : ''}
                            >
                                {isExpired ? "Re-activate QR for 24 Hours" : "Extend Link Validity (+24hrs)"}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Track ID note ── */}
            {isSuccess && (
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-8 mb-4">
                    Track ID: <span className="font-mono text-slate-400">{trackId}</span>
                </p>
            )}
        </div>
    );
}
