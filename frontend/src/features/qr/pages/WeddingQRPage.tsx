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
            <div className="w-full max-w-[420px] mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowLeft size={15} />}
                    onClick={() => navigate('/dashboard')}
                >
                    Back to Dashboard
                </Button>
            </div>

            {/* ── Unified QR Pass Card ── */}
            <div className="w-full max-w-[420px] relative mt-2 mb-6">
                <div id="qr-pass-card" className="glass-panel p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden group border-white/80 shadow-[0_20px_60px_rgba(244,114,182,0.15)] ring-4 ring-white/50 bg-gradient-to-br from-[#fdfbfb] to-[#fdeff2]">
                    
                    {/* Inner Premium Line */}
                    <div className="absolute inset-3 border-2 border-pink-200/60 rounded-[2rem] pointer-events-none z-10" />

                    {/* ── Floral Frame Accents Inside Card ── */}
                    {isSuccess && (
                        <>
                            <div className="absolute -top-6 -left-6 text-6xl opacity-80 z-20 drop-shadow-sm select-none">🌸</div>
                            <div className="absolute -bottom-6 -right-6 text-6xl opacity-80 z-20 drop-shadow-sm select-none" style={{ transform: 'rotate(180deg)'}}>🌸</div>
                            <div className="absolute top-4 right-4 text-3xl opacity-60 z-20 drop-shadow-sm select-none">🌿</div>
                            <div className="absolute bottom-4 left-4 text-3xl opacity-60 z-20 drop-shadow-sm select-none" style={{ transform: 'rotate(180deg)'}}>🌿</div>
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-2xl opacity-70 z-20 select-none animate-bounce" style={{animationDuration: '3s'}}>💖</div>
                        </>
                    )}

                    <div className="relative z-20 w-full flex flex-col items-center pt-8 pb-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-3 mb-6 w-full">
                                <div className="h-8 w-64 rounded-full bg-pink-100/50 animate-pulse mx-auto" />
                                <div className="h-4 w-40 rounded-full bg-pink-100/50 animate-pulse mx-auto" />
                                <div className="w-[260px] h-[260px] bg-pink-50 rounded-2xl animate-pulse mt-4" />
                            </div>
                        ) : isSuccess && qrData ? (
                            <>
                                {/* Names Inside the Card */}
                                <div className="text-center mb-6 w-full px-4">
                                    <WeddingNameDisplay 
                                        brideName={qrData.brideName} 
                                        groomName={qrData.groomName} 
                                        size="xl" 
                                        className="mb-1 text-slate-800 drop-shadow-sm font-serif"
                                    />
                                    {(qrData?.village || qrData?.venue || qrData?.date) && (
                                        <div className="text-[15px] text-slate-500 mt-2 font-medium tracking-wide flex items-center justify-center gap-[4px] flex-wrap">
                                            <span>{[qrData.village, qrData.venue].filter(Boolean).join(', ')}</span>
                                            {qrData.date && (
                                                <>
                                                    <span className="text-slate-400">·</span>
                                                    <span>{formatDate(qrData.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* QR Code Container */}
                                <div className="relative rounded-[1.5rem] overflow-hidden bg-white shadow-sm p-3 border border-pink-100 mb-2">
                                    <QRDisplay
                                        status="success"
                                        qrImageUrl={qrData.qrImageUrl}
                                        weddingTitle={weddingTitle}
                                    />
                                </div>

                                {/* Status Badge */}
                                {timeLeft && (
                                    <div className={`mt-6 px-5 py-2 rounded-full text-[11px] font-black inline-block uppercase tracking-widest shadow-sm border relative z-10 ${
                                        isExpired 
                                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                            : isInactive
                                                ? 'bg-slate-50 text-slate-500 border-slate-200/60'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                        {timeLeft}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-[260px] h-[260px] bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                <AlertCircle size={40} className="opacity-20" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Share link label ── */}
            {isSuccess && qrData?.shareLink && (
                <div className="mb-6 max-w-[360px] w-full">
                    <p className="text-[12px] text-slate-400 text-center truncate px-4 py-2 bg-white/60 border border-slate-200/60 rounded-xl shadow-sm">
                        {qrData.shareLink}
                    </p>
                </div>
            )}

            {/* ── Action Buttons or Error retry ── */}
            <div className="mt-2 w-full max-w-[420px]">
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
                                className={!isExpired ? 'glass-panel text-slate-600 hover:text-slate-800 border-[1.5px] border-white/80' : ''}
                            >
                                {isExpired ? "Re-activate QR for 24 Hours" : "Extend Link Validity (+24hrs)"}
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {/* ── Track ID note ── */}
            {isSuccess && (
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-300 mt-8 mb-4">
                    Track ID: <span className="font-mono text-slate-400">{trackId}</span>
                </p>
            )}
        </div>
    );
}
