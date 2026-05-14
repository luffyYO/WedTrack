import { IndianRupee, Users, CheckCircle, Gift } from 'lucide-react';
import { MatchedFamily } from '../utils/matchingLogic';

interface GiftTallyStatsProps {
    tally: MatchedFamily[];
    loading: boolean;
}

export default function GiftTallyStats({ tally, loading }: GiftTallyStatsProps) {
    const totalGiven = tally.reduce((sum, fam) => sum + fam.givenAmount, 0);
    const totalReturned = tally.reduce((sum, fam) => sum + fam.returnedAmount, 0);
    const positiveBalance = tally.reduce((sum, fam) => sum + (fam.difference > 0 ? fam.difference : 0), 0);
    const matchedFamiliesCount = tally.filter(fam => fam.guestEntry !== null).length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full mx-auto z-10 relative px-4 sm:px-6">
            {/* Total Given */}
            <div className="glass-panel p-3 sm:p-5 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-slate-400 dark:text-[#6a7585] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Total Given</span>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-[#e6edf3] mt-0.5 sm:mt-1 tracking-tight flex items-center">
                    <IndianRupee size={16} className="text-slate-400" />
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalGiven.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-pink-400 font-bold mt-0.5 uppercase flex items-center justify-center gap-1"><Gift size={8} /> OUTFLOW</span>
            </div>

            {/* Total Returned */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-3 sm:p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgba(236,72,153,0.3)] border border-pink-400 flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-white/80 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Total Returned</span>
                <h3 className="text-2xl sm:text-4xl font-black text-white mt-0.5 sm:mt-1 tracking-tight flex items-center">
                    <IndianRupee size={16} className="text-white/70" />
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {totalReturned.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-white/90 font-bold mt-0.5 uppercase flex items-center justify-center gap-1"><CheckCircle size={8} /> RECOVERED</span>
            </div>

            {/* Positive Balance */}
            <div className="glass-panel p-3 sm:p-5 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-slate-400 dark:text-[#6a7585] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Positive Return</span>
                <h3 className="text-2xl sm:text-4xl font-black text-emerald-500 dark:text-emerald-400 mt-0.5 sm:mt-1 tracking-tight flex items-center">
                    +<IndianRupee size={16} className="text-emerald-500/70 dark:text-emerald-400/70" />
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {positiveBalance.toLocaleString('en-IN')}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-emerald-500/80 font-bold mt-0.5 uppercase flex items-center justify-center gap-1">SURPLUS AMOUNT</span>
            </div>

            {/* Matched Families */}
            <div className="glass-panel p-3 sm:p-5 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:-translate-y-0.5 transition-all group relative">
                <span className="text-slate-400 dark:text-[#6a7585] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Matched Families</span>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-[#e6edf3] mt-0.5 sm:mt-1 tracking-tight">
                    <span className={`transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                        {matchedFamiliesCount} / {tally.length}
                    </span>
                </h3>
                <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-[#6a7585] font-bold mt-0.5 uppercase flex items-center justify-center gap-1"><Users size={8} /> FAMILIES FOUND</span>
            </div>
        </div>
    );
}
