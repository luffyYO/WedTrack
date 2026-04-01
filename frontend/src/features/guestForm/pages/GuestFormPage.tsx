import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import apiClient from '@/api/client';
import { supabase } from '@/config/supabaseClient';
import { WeddingNameDisplay } from '@/components/ui';
import FloatingHearts from '@/components/ui/FloatingHearts';
import AutoScrollGallery from '../components/AutoScrollGallery';
import { requestForToken } from '@/config/firebaseConfig';

export default function GuestFormPage() {
    const { weddingId: weddingNanoId } = useParams<{ weddingId: string }>();
    const [wedding, setWedding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isInactive, setIsInactive] = useState(false);

    const [heartsActive, setHeartsActive] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullname: '',
        father_fullname: '',
        village: '',
        amount: '',
        payment_type: 'Cash',
        phone_number: '',
        gift_side: '',
        wish: ''
    });

    useEffect(() => {
        const fetchWedding = async () => {
            if (!weddingNanoId) return;
            try {
                // Try direct Supabase query first (fast path — no Edge Function latency)
                // Requires the public anon read policy on weddings table.
                const { data: directData, error: directError } = await supabase
                    .from('weddings')
                    .select('*')
                    .eq('nanoid', weddingNanoId)
                    .maybeSingle();

                let data: any;
                if (directError || !directData) {
                    // Fallback: use Edge Function (works before public RLS policy is applied)
                    const response = await apiClient.get(`get-wedding-details?wedding_nanoid=${weddingNanoId}`);
                    data = response.data.data;
                } else {
                    data = directData;
                }

                setWedding(data);

                const now = new Date();
                if (data.qr_status === 'inactive') {
                    setIsInactive(true);
                } else if (data.qr_status === 'expired') {
                    setIsExpired(true);
                } else {
                    if (data.qr_activation_time && now < new Date(data.qr_activation_time)) {
                        setIsInactive(true);
                    } else if (data.qr_expires_at && now >= new Date(data.qr_expires_at)) {
                        setIsExpired(true);
                    }
                }
            } catch (err: any) {
                if (import.meta.env.DEV) console.error('Fetch wedding failed:', err);
                const isNetworkError = err.message?.toLowerCase().includes('network error') || !err.response;
                setError(isNetworkError
                    ? 'Network Connection Issue: Cannot reach the server.'
                    : (err.response?.data?.message || err.message || 'Failed to load event details.')
                );
            } finally {
                setLoading(false);
            }
        };

        fetchWedding();
        
        // Sync UI with actual browser permission on mount
        if (typeof Notification !== 'undefined') {
            const currentPermission = Notification.permission as NotificationPermission;
            setNotificationPermission(currentPermission);

            // Auto-fetch token if permission is already granted
            if (currentPermission === 'granted') {
                requestForToken().then(token => {
                    if (token) setFcmToken(token);
                }).catch(console.error);
            }
        }
    }, [weddingNanoId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEnableNotifications = async () => {
        try {
            const token = await requestForToken();
            // Update permission state from the real browser value (requestForToken
            // calls Notification.requestPermission() internally)
            if (typeof Notification !== 'undefined') {
                setNotificationPermission(Notification.permission as NotificationPermission);
            }
            if (token) {
                setFcmToken(token);
            }
        } catch (err) {
            console.error('[FCM] Failed to enable notifications:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        // Use pre-captured token or try one last time
        const finalToken = fcmToken || await requestForToken();
        
        const payload = {
            wedding_nanoid: weddingNanoId,
            ...formData,
            amount: Number(formData.amount),
            fcm_token: finalToken
        };
        
        try {
            // Use the new submit-wish Edge Function
            await apiClient.post('submit-wish', payload);
            setSuccess(true);
            setHeartsActive(true);
        } catch (err: any) {
            console.error('Guest submission failed:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Submission failed. Please try again.';
            setError(errorMsg);
            
            if (err.response?.status === 403 && (errorMsg.includes('Expired') || err.response?.data?.error?.includes('Expired'))) {
                setIsExpired(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfbfb]">
                <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isInactive) {
        const displayDate = wedding?.date 
            ? new Date(wedding.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'the event date';

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans animate-fade-up">
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-white/60">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Access Not Yet Open</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        This registry will securely open on the date of the celebration. 
                        Please check back on <strong className="text-slate-700">{displayDate}</strong>.
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-6 border-t border-slate-200/50">
                        Secure Wedding Registry
                    </div>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans animate-fade-up">
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-rose-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner border border-rose-100">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Link Expired</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        This submission channel is now securely closed. 
                        Please contact the event organizers if you need further assistance.
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-6 border-t border-slate-200/50">
                        Secure Wedding Registry
                    </div>
                </div>
            </div>
        );
    }

    if (error && !wedding) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-rose-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-100 text-rose-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Interrupted</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        {error}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        Try connecting again
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbfb] p-4 animate-fade-up relative overflow-hidden">
                <FloatingHearts active={heartsActive} />
                <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-md w-full text-center relative z-10 border-white/60">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200/50">
                        <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3 tracking-tight">Blessings Received!</h2>
                    <p className="text-slate-500 mb-8 text-sm sm:text-base leading-relaxed">
                        Your details and heartfelt wishes have been securely sent to the couple. Thank you for your presence and contribution.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-pink-500 font-bold uppercase tracking-widest text-xs hover:text-pink-600 pb-1 border-b-2 border-transparent hover:border-pink-300 transition-all"
                    >
                        Register another gift
                    </button>
                </div>
            </div>
        );
    }    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fdfbfb] to-[#feeef1] flex items-start justify-center overflow-y-auto sm:py-12 px-0 sm:px-4">
            <div className="w-full sm:max-w-[480px] bg-white/80 backdrop-blur-xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] sm:border border-white/60 overflow-hidden animate-fade-in relative min-h-screen sm:min-h-0">
                
                {/* ── Visual Backdrop ── */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <AutoScrollGallery images={
                    wedding?.gallery_images?.length > 0 
                        ? wedding.gallery_images 
                        : [
                            'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
                            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
                            'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80',
                            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
                        ]
                } />

                {/* ── Soft Premium Header ── */}
                <div className="h-48 bg-gradient-to-b from-transparent to-pink-50/30 flex flex-col items-center justify-center text-slate-800 p-8 text-center relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
                        <Heart size={160} className="fill-rose-500" />
                    </div>
                    <WeddingNameDisplay 
                        brideName={wedding?.bride_name} 
                        groomName={wedding?.groom_name} 
                        size="lg" 
                        className="mb-1 relative z-10 font-bold tracking-tight text-slate-900" 
                    />
                    <div className="flex items-center gap-2 mt-4 relative z-10">
                        <div className="h-[1px] w-4 bg-rose-200" />
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-rose-400">
                            Secure Guest Registry
                        </p>
                        <div className="h-[1px] w-4 bg-rose-200" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-7 relative z-10">
                    
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-start gap-3 text-sm border border-rose-100/50 font-medium animate-shake">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name <span className="text-rose-400">*</span></label>
                                <input required type="text" name="fullname" value={formData.fullname} onChange={handleChange} 
                                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Father's Full Name <span className="text-rose-400">*</span></label>
                                <input required type="text" name="father_fullname" value={formData.father_fullname} onChange={handleChange} 
                                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm"
                                    placeholder="Enter your father's name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Town / Village <span className="text-rose-400">*</span></label>
                                <input required type="text" name="village" value={formData.village} onChange={handleChange} 
                                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                                    placeholder="City or Village"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp No <span className="text-rose-400">*</span></label>
                                <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} 
                                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                                    placeholder="+91 XXXXX XXXXX" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Gift Amount (₹) <span className="text-rose-400">*</span></label>
                            <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleChange} 
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-xl font-black text-slate-800 shadow-sm" 
                                placeholder="0" 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                                <div className="relative">
                                    <select name="payment_type" value={formData.payment_type} onChange={handleChange} 
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/50 bg-white/80 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="GPay">GPay</option>
                                        <option value="PhonePe">PhonePe</option>
                                        <option value="PayTM">PayTM</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Guest Alignment <span className="text-rose-400">*</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer font-black text-[10px] tracking-[0.1em] ${formData.gift_side === 'bride' ? 'border-pink-400 bg-pink-50 text-pink-600 shadow-sm' : 'border-slate-100 bg-slate-50/30 text-slate-400 hover:border-pink-100'}`}>
                                        <input required type="radio" name="gift_side" value="bride" checked={formData.gift_side === 'bride'} onChange={handleChange} className="opacity-0 absolute" />
                                        <span>BRIDE'S</span>
                                    </label>
                                    <label className={`flex items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer font-black text-[10px] tracking-[0.1em] ${formData.gift_side === 'groom' ? 'border-pink-400 bg-pink-50 text-pink-600 shadow-sm' : 'border-slate-100 bg-slate-50/30 text-slate-400 hover:border-pink-100'}`}>
                                        <input required type="radio" name="gift_side" value="groom" checked={formData.gift_side === 'groom'} onChange={handleChange} className="opacity-0 absolute" />
                                        <span>GROOM'S</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Stay Updated Card ── */}
                        <div className={`p-5 rounded-3xl border-2 transition-all shadow-sm ${notificationPermission === 'granted' ? 'border-emerald-100 bg-emerald-50/30' : 'border-pink-100 bg-pink-50/20'}`}>
                            <div className="flex items-center justify-between gap-5">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${notificationPermission === 'granted' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                                        <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                            Live Verification
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-snug max-w-[200px]">
                                        {notificationPermission === 'granted' 
                                            ? 'Notifications active. We will notify you once confirmed.' 
                                            : 'Receive a real-time push notification once verified by the host.'}
                                    </p>
                                </div>
                                {notificationPermission !== 'granted' ? (
                                    <button 
                                        type="button"
                                        onClick={handleEnableNotifications}
                                        className="px-4 py-2.5 bg-white border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                    >
                                        ENABLE
                                    </button>
                                ) : (
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Wishes for the Couple (Optional)</label>
                            <textarea name="wish" value={formData.wish} onChange={handleChange} rows={3}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm resize-none" 
                                placeholder="Write your heartfelt message here..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 pb-4">
                        <button 
                            disabled={submitting}
                            type="submit" 
                            className="w-full bg-slate-900 text-white font-black py-4.5 px-4 rounded-[1.25rem] transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] uppercase tracking-[0.25em] text-xs disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {submitting ? 'Registering...' : 'Submit Securely'}
                        </button>
                        <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-6 opacity-60">
                            End-to-End Secure Transaction
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
