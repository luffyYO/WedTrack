import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/api/client';
import { WeddingNameDisplay } from '@/components/ui';

export default function GuestFormPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const [wedding, setWedding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);

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
                
                if (data.qrExpiresAt) {
                    const now = new Date().getTime();
                    const expiry = new Date(data.qrExpiresAt).getTime();
                    if (now >= expiry) {
                        setIsExpired(true);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load wedding details.');
            } finally {
                setLoading(false);
            }
        };

        fetchWedding();
    }, [weddingId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        try {
            await apiClient.post('/guests/submit', {
                weddingId,
                ...formData
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit details. Please try again.');
            // If backend says expired, update local state
            if (err.response?.status === 403 && err.response?.data?.error?.includes('Expired')) {
                setIsExpired(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">QR Code Expired</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        This guest submission link is no longer active. 
                        Please contact the host if you need to submit your gift details.
                    </p>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-widest pt-6 border-t border-gray-100">
                        WedTrack Security
                    </div>
                </div>
            </div>
        );
    }

    if (error && !wedding) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-500">{error || 'Wedding not found.'}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center transform transition-all scale-100">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-500 mb-6">Your details and blessings have been securely recorded.</p>
                    <button onClick={() => window.location.reload()} className="text-primary-600 font-medium hover:text-primary-700">
                        Submit another entry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex py-8 px-4 items-start justify-center overflow-y-auto">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header Banner */}
                <div className="h-40 bg-gradient-to-r from-primary-600 to-purple-600 flex flex-col items-center justify-center text-white p-6 text-center">
                    <WeddingNameDisplay 
                        brideName={wedding.brideName} 
                        groomName={wedding.groomName} 
                        size="lg" 
                        className="mb-1 text-white [&>span]:text-white [&>.text-primary-600]:text-white"
                    />
                    <p className="opacity-90 text-sm font-medium tracking-wide uppercase">
                        Wedding Celebration
                    </p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} /> <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">First Name <span className="text-red-500">*</span></label>
                            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Father's First Name</label>
                            <input type="text" name="fatherFirstName" value={formData.fatherFirstName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Father's Last Name</label>
                            <input type="text" name="fatherLastName" value={formData.fatherLastName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">District</label>
                            <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Village/City</label>
                            <input type="text" name="village" value={formData.village} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Gift Amount (₹)</label>
                            <input type="number" min="0" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Payment Method</label>
                            <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white">
                                <option value="Cash">Cash</option>
                                <option value="GPay">GPay</option>
                                <option value="PhonePe">PhonePe</option>
                                <option value="PayTM">PayTM</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Gift For / Side <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.giftSide === 'bride' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                <input 
                                    required 
                                    type="radio" 
                                    name="giftSide" 
                                    value="bride" 
                                    checked={formData.giftSide === 'bride'} 
                                    onChange={handleChange} 
                                    className="opacity-0 absolute"
                                />
                                <span className="font-bold">Bride Side</span>
                            </label>
                            <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.giftSide === 'groom' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                <input 
                                    required 
                                    type="radio" 
                                    name="giftSide" 
                                    value="groom" 
                                    checked={formData.giftSide === 'groom'} 
                                    onChange={handleChange} 
                                    className="opacity-0 absolute"
                                />
                                <span className="font-bold">Groom Side</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Wishes for the Couple</label>
                        <textarea rows={3} name="wishes" value={formData.wishes} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none" placeholder="Write your blessings here..." />
                    </div>

                    <button 
                        disabled={submitting}
                        type="submit" 
                        className="w-full mt-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98]"
                    >
                        {submitting ? 'Submitting...' : 'Submit Details'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 px-4">
                        All data is securely sent to <span className="font-semibold text-gray-500">{wedding.brideName} & {wedding.groomName}</span>
                    </p>
                </form>
            </div>
        </div>
    );
}
