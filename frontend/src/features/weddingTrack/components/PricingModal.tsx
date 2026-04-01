import { Check, ShieldCheck, Zap, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PricingPlan {
    id: 'basic' | 'pro';
    title: string;
    originalPrice: number;
    discountBadge: string;
    finalPrice: number;
    features: string[];
    isPopular?: boolean;
    tag?: string;
}

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (plan: 'basic' | 'pro', amount: number) => void;
    isSubmitting?: boolean;
}

const PLANS: PricingPlan[] = [
    {
        id: 'basic',
        title: 'Basic',
        originalPrice: 499,
        discountBadge: '80% OFF',
        finalPrice: 99,
        features: [
            'Unlimited guest list',
            '1 QR code',
            'Valid for 1 day'
        ]
    },
    {
        id: 'pro',
        title: 'Pro',
        tag: 'Most Popular',
        isPopular: true,
        originalPrice: 699,
        discountBadge: '50% OFF',
        finalPrice: 349,
        features: [
            'Unlimited guest list',
            '1 QR code',
            'Extended validity',
            'AI-based handling'
        ]
    }
];

export default function PricingModal({ isOpen, onClose, onSelectPlan, isSubmitting }: PricingModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start md:items-center overflow-y-auto p-4 sm:p-6 scrollbar-hide animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={!isSubmitting ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white/98 backdrop-blur-3xl md:rounded-[2.5rem] rounded-[2rem] shadow-2xl overflow-hidden animate-in md:zoom-in-95 slide-in-from-bottom duration-500 flex flex-col md:max-h-[90vh] min-h-max md:h-auto my-auto md:my-0">
                
                {/* Close Button - Moved for better mobile reach */}
                <button 
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute right-4 top-4 p-2 rounded-full bg-slate-100/50 hover:bg-slate-100 transition-colors z-20 text-slate-400 hover:text-slate-600 md:right-8 md:top-8"
                >
                    <X size={20} />
                </button>

                <div className="p-4 sm:p-10 overflow-y-visible">
                    <div className="text-center mb-8 sm:mb-12 pt-4 md:pt-0">
                        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4">
                            Premium Access
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
                            Select a premium plan to generate your secure wedding QR and start tracking tracks.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        {PLANS.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`relative group p-6 sm:p-10 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-700 flex flex-col border-0 ${
                                    plan.isPopular 
                                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' 
                                    : 'bg-slate-50 text-slate-900'
                                }`}
                            >
                                {plan.tag && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-pink-500/30">
                                        {plan.tag}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className={`text-xl font-bold mb-2 ${plan.isPopular ? 'text-pink-600' : 'text-slate-700'}`}>
                                        {plan.title}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-slate-400 text-sm line-through font-medium">₹{plan.originalPrice}</span>
                                        <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            {plan.discountBadge}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline gap-1.5">
                                        <span className={`text-5xl font-black tracking-tighter ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                                            ₹{plan.finalPrice}
                                        </span>
                                        <span className={`${plan.isPopular ? 'text-slate-400' : 'text-slate-400'} text-[10px] font-black uppercase tracking-[0.2em]`}>
                                            / one-time
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${plan.isPopular ? 'bg-white/10 text-pink-400' : 'bg-slate-200 text-slate-400'}`}>
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                            <span className={`text-sm font-semibold leading-tight ${plan.isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    fullWidth
                                    size="lg"
                                    onClick={() => onSelectPlan(plan.id, plan.finalPrice)}
                                    isLoading={isSubmitting}
                                    className={`h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-500 shadow-lg active:scale-[0.98] ${
                                        plan.isPopular 
                                        ? 'bg-white text-slate-900 hover:bg-slate-100' 
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                                >
                                    Pay ₹{plan.finalPrice}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <Zap size={14} className="text-amber-400" />
                                Instant Setup
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-400" />
                                Secure Payment
                            </div>
                        </div>
                        <p className="text-[12px] text-slate-400 font-medium italic">
                            One-time payment • No hidden charges • Securely powered by Cashfree
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
