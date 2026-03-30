import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { weddingTrackService } from '../services/weddingTrackService';
import Button from '@/components/ui/Button';

export default function WeddingTrackVerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('order_id');
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!orderId) {
            setStatus('failed');
            setErrorMsg('No order ID found');
            return;
        }

        const verify = async () => {
            try {
                const res = await weddingTrackService.verifyPayment(orderId);
                const data = res.data?.data;
                if (data?.nanoid) {
                    setStatus('success');
                    // short delay for UX
                    setTimeout(() => {
                        navigate(`/wedding-track/qr/${data.nanoid}`, { replace: true });
                    }, 1500);
                } else {
                    setStatus('failed');
                    setErrorMsg('Verification failed or incomplete.');
                }
            } catch (err: any) {
                setStatus('failed');
                setErrorMsg(err.response?.data?.error || err.message || 'Payment verification failed');
            }
        };

        verify();
    }, [orderId, navigate]);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-up min-h-[60vh] flex flex-col items-center justify-center">
            {status === 'verifying' && (
                <div className="flex flex-col items-center text-primary-600">
                    <Loader2 className="w-16 h-16 animate-spin mb-6" />
                    <h2 className="text-2xl font-semibold opacity-90">Verifying Payment...</h2>
                    <p className="text-slate-500 mt-2">Please do not close this window</p>
                </div>
            )}
            
            {status === 'success' && (
                <div className="flex flex-col items-center text-green-600 animate-fade-up">
                    <CheckCircle2 className="w-20 h-20 mb-6" />
                    <h2 className="text-3xl font-bold">Payment Successful!</h2>
                    <p className="text-slate-600 mt-3 font-medium text-lg">Redirecting to your QR code...</p>
                </div>
            )}
            
            {status === 'failed' && (
                <div className="flex flex-col items-center text-center animate-fade-up bg-white/50 backdrop-blur-md p-10 rounded-3xl border border-red-100 shadow-xl shadow-red-900/5">
                    <XCircle className="w-20 h-20 text-red-500 mb-6 mx-auto" />
                    <h2 className="text-3xl font-bold text-slate-800">Payment Failed</h2>
                    <p className="text-slate-600 mt-3 max-w-sm mb-8">{errorMsg}</p>
                    <div className="flex gap-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/wedding-track/new')}
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
