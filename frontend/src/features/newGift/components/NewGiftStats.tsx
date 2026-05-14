import { IndianRupee, Gift, Clock, AlertCircle } from 'lucide-react';

interface NewGiftStatsProps {
    totalAmount: number;
    totalEntries: number;
    recentAmount: number;
    pendingCount: number;
    loading: boolean;
}

export default function NewGiftStats({
    totalAmount,
    totalEntries,
    recentAmount,
    pendingCount,
    loading,
}: NewGiftStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[850px] mx-auto z-10 relative px-4 sm:px-6">
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

            {/* Total Entries */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_30px_rgba(236,72,153,0.3)] border border-pink-400 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:-rotate-12 transition-all duration-500">
                    <Gift size={140} />
                </div>
                <span className="text-white/80 text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 leading-tight">Total Entries</span>
                <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black flex items-center justify-center gap-1.5 sm:gap-2 relative z-10 drop-shadow-md mt-0.5 sm:mt-1 tracking-tighter">
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalEntries}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[10px] text-white/70 font-bold relative z-10 mt-0.5 sm:mt-1 uppercase hidden xs:block">RECORDED GIFTS</span>
            </div>

            {/* Recent Entry */}
            <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-slate-400 dark:text-[#6a7585] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Recent Entry</span>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-[#e6edf3] mt-0.5 sm:mt-1 tracking-tight flex items-center">
                    <IndianRupee size={16} className="text-slate-400" />
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {recentAmount.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-[#6a7585] font-bold mt-0.5 uppercase flex items-center justify-center gap-1"><Clock size={8} /> LAST RECORDED</span>
            </div>

            {/* Pending Placeholder */}
            <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] transition-all group relative opacity-70">
                <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Pending Returns</span>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1">
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {pendingCount}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-slate-400/80 font-bold mt-0.5 uppercase flex items-center justify-center gap-1"><AlertCircle size={8} /> NO ACTION NEEDED</span>
            </div>
        </div>
    );
}
