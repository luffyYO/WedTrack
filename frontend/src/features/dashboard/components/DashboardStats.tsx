import { IndianRupee, Users } from 'lucide-react';

interface DashboardStatsProps {
    totalCollected: number;
    totalVerifiedGifts: number;
    totalGuests: number;
    pendingGifts: number;
    guestsLoading: boolean;
}

export default function DashboardStats({
    totalCollected,
    totalVerifiedGifts,
    totalGuests,
    pendingGifts,
    guestsLoading,
}: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[850px] mx-auto z-10 relative px-4 sm:px-6">
            {/* Total Collected */}
            <div className="glass-panel p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -left-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500">
                    <IndianRupee size={120} />
                </div>
                <span className="text-slate-400 text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 leading-tight">Validated Revenue</span>
                <h3 className="text-xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 relative z-10">
                    <IndianRupee size={14} className="text-slate-600 sm:w-8 sm:h-8" />
                    <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalCollected.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[10px] text-pink-400/80 font-bold mt-0.5 sm:mt-1 relative z-10 hidden xs:block">SECURE TRANSACTION LEDGER</span>
            </div>

            {/* Total Gifts */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_30px_rgba(236,72,153,0.3)] border border-pink-400 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:-rotate-12 transition-all duration-500">
                    <Users size={140} />
                </div>
                <span className="text-white/80 text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 text-shadow-sm leading-tight">Verified Contributions</span>
                <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black flex items-center justify-center gap-1.5 sm:gap-2 relative z-10 drop-shadow-md mt-0.5 sm:mt-1 tracking-tighter">
                    <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalVerifiedGifts}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[10px] text-white/70 font-bold relative z-10 mt-0.5 sm:mt-1 uppercase text-shadow-sm hidden xs:block">Confirmed Guest Entries</span>
            </div>

            {/* Total Registered */}
            <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Total Inventory</span>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-700 mt-0.5 sm:mt-1 tracking-tight">
                    <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalGuests}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-slate-400 font-bold mt-0.5">ALL SUBMISSIONS</span>
            </div>

            {/* Pending Verifications */}
            <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] border border-red-200 flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] hover:border-red-300 transition-all group relative bg-gradient-to-br from-white/60 to-red-50/30">
                {pendingGifts > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500"></span>
                    </span>
                )}
                <span className="text-red-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Awaiting Action</span>
                <h3 className="text-2xl sm:text-4xl font-black text-red-500 mt-0.5 sm:mt-1 drop-shadow-sm">
                    <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                        {pendingGifts}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-red-400/80 font-bold mt-0.5 uppercase">Verification Required</span>
            </div>
        </div>
    );
}
