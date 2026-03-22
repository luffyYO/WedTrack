import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import apiClient from '@/api/client';
import { WeddingNameDisplay } from '@/components/ui';
import FloatingHearts from '@/components/ui/FloatingHearts';
import AutoScrollGallery from '../components/AutoScrollGallery';

export default function GuestFormPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const [wedding, setWedding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isInactive, setIsInactive] = useState(false);

    const [heartsActive, setHeartsActive] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fatherFirstName: '',
        fatherLastName: '',
        district: '',
        village: '',
        amount: '',
        paymentType: 'Cash',
        wishes: '',
        giftSide: ''
    });

    useEffect(() => {
        const fetchWedding = async () => {
            if (!weddingId) return;
            try {
                const response = await apiClient.get(`/weddings/${weddingId}/qr`);
                const data = response.data.data;
                setWedding(data);
                
                const now = new Date();
                if (data.qrStatus === 'inactive') {
                    setIsInactive(true);
                } else if (data.qrStatus === 'expired') {
                    setIsExpired(true);
                } else {
                    if (data.qrActivationTime && now < new Date(data.qrActivationTime)) {
                        setIsInactive(true);
                    } else if (data.qrExpiresAt && now >= new Date(data.qrExpiresAt)) {
                        setIsExpired(true);
                    }
                }
            } catch (err: any) {
                console.error('Fetch wedding failed:', err);
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
    }, [weddingId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'lastName' && (prev.fatherLastName === '' || prev.fatherLastName === prev.lastName)) {
                updated.fatherLastName = value;
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        const payload = {
            weddingId,
            ...formData
        };
        
        try {
            await apiClient.post('/guests/submit', payload);
            setSuccess(true);
            setHeartsActive(true); // Trigger celebratory hearts on success
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
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] flex py-12 px-4 items-start justify-center overflow-y-auto">
            <div className="max-w-[460px] w-full glass-panel rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden animate-fade-up">
                
                <AutoScrollGallery images={wedding.galleryImages} />

                {/* ── Soft Premium Header ── */}
                <div className="h-44 bg-gradient-to-br from-pink-100 to-rose-50 flex flex-col items-center justify-center text-slate-800 p-8 text-center relative overflow-hidden border-b border-white">
                    <div className="absolute -right-8 -bottom-8 opacity-[0.05] pointer-events-none">
                        <Heart size={140} className="fill-pink-500" />
                    </div>
                    <WeddingNameDisplay 
                        brideName={wedding.brideName} 
                        groomName={wedding.groomName} 
                        size="lg" 
                        className="mb-1 relative z-10 font-bold tracking-tight drop-shadow-sm" 
                    />
                    <p className="opacity-50 text-[10px] font-black tracking-[0.25em] uppercase mt-3 relative z-10 text-slate-600">
                        Secure Guest Registry
                    </p>
                </div>

                {/* ── Extracted CSS Input Class ── */}
                {/* Because native inputs break with complex utility strings, we extract it. */}
                {/* It uses focus rings, soft backgrounds, and minimal borders */}

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-white/40">
                    
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-rose-100 font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">First Name <span className="text-rose-400">*</span></label>
                            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Father's Name</label>
                            <input type="text" name="fatherFirstName" value={formData.fatherFirstName} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Father's Last Name</label>
                            <input type="text" name="fatherLastName" value={formData.fatherLastName} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">District</label>
                            <input type="text" name="district" value={formData.district} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Location / Village</label>
                            <input type="text" name="village" value={formData.village} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Gift Amount (₹) <span className="text-rose-400">*</span></label>
                            <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleChange} 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-lg font-bold text-slate-800 shadow-sm" 
                                placeholder="0" 
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                            <div className="relative">
                                <select name="paymentType" value={formData.paymentType} onChange={handleChange} 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-sm font-semibold text-slate-700 shadow-sm appearance-none"
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
                    </div>

                    <div className="pt-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Select Guest Alignment <span className="text-rose-400">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer font-bold text-xs sm:text-sm tracking-wide ${formData.giftSide === 'bride' ? 'border-pink-400 bg-pink-50 text-pink-600 shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-400 hover:border-pink-200 hover:bg-white'}`}>
                                <input required type="radio" name="giftSide" value="bride" checked={formData.giftSide === 'bride'} onChange={handleChange} className="opacity-0 absolute" />
                                <span>BRIDE'S SIDE</span>
                            </label>
                            <label className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer font-bold text-xs sm:text-sm tracking-wide ${formData.giftSide === 'groom' ? 'border-pink-400 bg-pink-50 text-pink-600 shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-400 hover:border-pink-200 hover:bg-white'}`}>
                                <input required type="radio" name="giftSide" value="groom" checked={formData.giftSide === 'groom'} onChange={handleChange} className="opacity-0 absolute" />
                                <span>GROOM'S SIDE</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Wishes & Blessings</label>
                        <textarea rows={3} name="wishes" value={formData.wishes} onChange={handleChange} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all resize-none text-sm font-medium text-slate-700 shadow-sm" 
                            placeholder="Write your heartfelt message here..." 
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            disabled={submitting}
                            type="submit" 
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] uppercase tracking-[0.2em] text-sm disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {submitting ? 'Registering...' : 'Submit Securely'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
