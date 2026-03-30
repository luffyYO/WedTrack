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
        finalPrice: 1,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={!isSubmitting ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-10 text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-3">
                            Choose Your Track Plan
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
                            Select a premium plan to generate your secure wedding QR and start tracking tracks.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {PLANS.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`relative group p-6 sm:p-8 rounded-[2rem] transition-all duration-500 flex flex-col ${
                                    plan.isPopular 
                                    ? 'bg-gradient-to-b from-white to-pink-50/30 border-2 border-pink-200 shadow-xl shadow-pink-500/10 scale-100 hover:scale-[1.02]' 
                                    : 'bg-white/50 border border-slate-200 hover:border-pink-200 hover:shadow-lg hover:shadow-slate-200/50 hover:scale-[1.01]'
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
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-800 tracking-tighter">₹{plan.finalPrice}</span>
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">/ one-time</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.isPopular ? 'bg-pink-100 text-pink-500' : 'bg-slate-100 text-slate-400'}`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    fullWidth
                                    size="lg"
                                    onClick={() => onSelectPlan(plan.id, plan.finalPrice)}
                                    isLoading={isSubmitting}
                                    className={`h-14 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg ${
                                        plan.isPopular 
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 shadow-pink-500/25 active:scale-95' 
                                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 active:scale-95'
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
