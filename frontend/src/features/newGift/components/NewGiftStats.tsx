import { IndianRupee } from 'lucide-react';

interface NewGiftStatsProps {
    totalAmount: number;
    totalEntries: number;
    recentAmount: number;
    pendingCount: number;
    loading: boolean;
}

export default function NewGiftStats({
    totalAmount,
    loading,
}: NewGiftStatsProps) {
    return (
        <div className="max-w-sm mx-auto z-10 relative px-4 sm:px-6">
            {/* Total Amount */}
            <div className="glass-panel p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -left-6 -bottom-6 text-slate-400 dark:text-slate-500 opacity-[0.05] group-hover:opacity-[0.08] group-hover:rotate-12 transition-all duration-500">
                    <IndianRupee size={120} />
                </div>
                <span className="text-slate-400 dark:text-[#6a7585] text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 leading-tight">Total Amount</span>
                <h3 className="text-xl sm:text-4xl lg:text-5xl font-black text-slate-700 dark:text-[#e6edf3] flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 relative z-10">
                    <IndianRupee size={14} className="text-slate-500 dark:text-[#8b97a8] sm:w-8 sm:h-8" />
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalAmount.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[10px] text-pink-400/80 dark:text-pink-400 font-bold mt-0.5 sm:mt-1 relative z-10 hidden xs:block">GIVEN TO OTHERS</span>
            </div>
        </div>
    );
}
