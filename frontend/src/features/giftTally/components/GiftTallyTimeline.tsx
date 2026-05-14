import { MatchedFamily } from '../utils/matchingLogic';
import { IndianRupee, Heart, Gift, ArrowRightLeft } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface GiftTallyTimelineProps {
    family: MatchedFamily;
}

export default function GiftTallyTimeline({ family }: GiftTallyTimelineProps) {
    const givenYear = new Date(family.givenDate).getFullYear();
    const returnedYear = family.returnedDate ? new Date(family.returnedDate).getFullYear() : null;

    return (
        <div className="bg-slate-50/50 dark:bg-[#0f1219]/50 border-t border-slate-100 dark:border-neutral-800/60 p-6 px-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Heart size={150} />
            </div>

            <div className="max-w-2xl mx-auto">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                    Relationship Timeline
                </h4>

                <div className="relative border-l-2 border-pink-200 dark:border-pink-900/30 ml-3 pl-6 space-y-8">
                    
                    {/* Given Event */}
                    <div className="relative">
                        <div className="absolute -left-[31px] bg-pink-100 dark:bg-pink-900/40 border-2 border-white dark:border-[#0f1219] p-1.5 rounded-full text-pink-500 dark:text-pink-400">
                            <Gift size={12} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-pink-400/80 uppercase tracking-wider">{givenYear || 'Past'}</span>
                            <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                                You gifted <strong className="text-slate-800 dark:text-white flex items-center inline-flex gap-0.5"><IndianRupee size={12}/>{family.givenAmount.toLocaleString('en-IN')}</strong> to {family.personName}'s family
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                                {formatDate(family.givenDate)}
                            </span>
                        </div>
                    </div>

                    {/* Returned Event (If matched) */}
                    {family.guestEntry ? (
                        <div className="relative">
                            <div className="absolute -left-[31px] bg-emerald-100 dark:bg-emerald-900/40 border-2 border-white dark:border-[#0f1219] p-1.5 rounded-full text-emerald-500 dark:text-emerald-400">
                                <ArrowRightLeft size={12} />
                            </div>
                            <div>
                                <span className="text-xs font-black text-emerald-400/80 uppercase tracking-wider">{returnedYear || 'Recent'}</span>
                                <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                                    They returned <strong className="text-slate-800 dark:text-white flex items-center inline-flex gap-0.5"><IndianRupee size={12}/>{family.returnedAmount.toLocaleString('en-IN')}</strong> to you
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                                    {formatDate(family.returnedDate)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute -left-[29px] bg-slate-100 dark:bg-neutral-800 border-2 border-white dark:border-[#0f1219] p-1 rounded-full text-slate-300 dark:text-slate-600">
                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 font-medium italic text-sm mt-1">
                                    Awaiting their return contribution...
                                </p>
                            </div>
                        </div>
                    )}
                    
                </div>

                {/* Summary Box */}
                {family.guestEntry && (
                    <div className="mt-8 ml-3 bg-white dark:bg-neutral-900/50 rounded-xl p-4 border border-slate-100 dark:border-neutral-800 flex items-center justify-between shadow-sm max-w-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Return Difference</span>
                            <span className={`text-lg font-black mt-0.5 flex items-center ${
                                family.difference > 0 ? 'text-emerald-500' : 
                                family.difference < 0 ? 'text-pink-500' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                                {family.difference > 0 ? '+' : ''}
                                <IndianRupee size={16} className="ml-0.5 mr-0.5" />
                                {family.difference === 0 ? '0' : Math.abs(family.difference).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Time Gap</span>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">
                                {family.timeGapStr || 'Unknown'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
