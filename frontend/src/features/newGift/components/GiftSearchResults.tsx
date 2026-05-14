import React, { useMemo } from 'react';
import { SearchX, MapPin, User, Loader2, Edit2, Trash2 } from 'lucide-react';
import { formatDate, parseSafeDate } from '@/utils/formatters';
import { NewGiftEntry } from '@/lib/giftQueries';

interface GiftSearchResultsProps {
    results: NewGiftEntry[];
    onEdit?: (entry: NewGiftEntry) => void;
    onDelete?: (id: string) => void;
    deletingId?: string | null;
}

const GiftSearchResults: React.FC<GiftSearchResultsProps> = ({ results, onEdit, onDelete, deletingId }) => {
    // Single page rendering with dynamic sorting
    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            // Sort by time: newest first
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeB - timeA;
        });
    }, [results]);

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-slate-100 dark:bg-neutral-900 p-6 rounded-full text-slate-400 dark:text-neutral-600 mb-4 ring-8 ring-slate-100/80 dark:ring-neutral-800/30">
                    <SearchX size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No matching entries found</h3>
                <p className="text-slate-500 dark:text-neutral-400 max-w-xs">
                    Try adjusting your search query or switching filters to find what you're looking for.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0a0a0a] w-full overflow-hidden border-t border-pink-100/80 dark:border-transparent shadow-[0_-1px_0_0_rgba(236,72,153,0.06)] dark:shadow-none">
            {/* Sticky scrollable wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    {/* Sticky header */}
                    <thead className="sticky top-0 z-10 text-[10px] uppercase font-black border-b bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-slate-50 dark:from-transparent dark:via-transparent dark:bg-[#111111] text-slate-500 dark:text-white border-pink-100 dark:border-neutral-800 shadow-[0_1px_0_rgba(236,72,153,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                        <tr>
                            <th className="px-3 py-4 text-center tracking-widest text-slate-400 dark:text-neutral-500 w-10">#</th>
                            <th className="px-5 py-4 tracking-widest text-slate-500 dark:text-white">Person Name</th>
                            <th className="px-5 py-4 tracking-widest text-slate-500 dark:text-white">Father's Name</th>
                            <th className="px-5 py-4 text-right tracking-widest text-slate-500 dark:text-white">Amount &amp; Type</th>
                            <th className="px-5 py-4 text-center tracking-widest text-slate-500 dark:text-white">Status / Action</th>
                            <th className="px-5 py-4 tracking-widest text-slate-500 dark:text-white">Location</th>
                            <th className="px-5 py-4 tracking-widest text-slate-500 dark:text-white">Date &amp; Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                        {sortedResults.map((guest, idx) => {
                            const entryDate = parseSafeDate(guest.gift_date || guest.created_at);
                            const timeStr = entryDate && !isNaN(entryDate.getTime())
                                ? entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : '';

                            return (
                                <tr
                                    key={guest.id}
                                    className={`group transition-colors duration-150 ${
                                        idx % 2 === 0
                                            ? 'bg-white dark:bg-[#0a0a0a] hover:bg-pink-50/40 dark:hover:bg-neutral-800/40'
                                            : 'bg-rose-50/20 dark:bg-[#0d0d0d] hover:bg-pink-50/60 dark:hover:bg-neutral-800/40'
                                    }`}
                                >
                                    {/* Serial Number */}
                                    <td className="px-3 py-3.5 text-center">
                                        <span className="text-[11px] font-bold text-slate-300 dark:text-neutral-600 tabular-nums">
                                            {idx + 1}
                                        </span>
                                    </td>

                                    {/* Person Name */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 p-2 rounded-lg group-hover:bg-pink-500 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-200 shrink-0">
                                                <User size={12} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight truncate max-w-[140px]">
                                                    {guest.person_name}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Father's Name */}
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-400 text-[12px] font-medium">
                                        {guest.father_name || '—'}
                                    </td>

                                    {/* Amount & Type */}
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="font-extrabold text-slate-800 dark:text-white text-[14px] tracking-tight">
                                                ₹{Number(guest.amount).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                {guest.amount_type}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Status / Action */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-center gap-2 min-w-[150px]">
                                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                                                ✓ Verified
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(guest)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Edit entry"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(guest.id)}
                                                        disabled={!!deletingId}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete entry"
                                                    >
                                                        {deletingId === guest.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Location */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
                                            <MapPin size={11} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                                            <span className="font-medium text-[12px] truncate max-w-[130px]">
                                                {guest.village || '—'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Date & Time */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-slate-700 dark:text-white font-bold text-[11px]">
                                                {formatDate(guest.gift_date || guest.created_at)}
                                            </span>
                                            <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-medium">
                                                {timeStr}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer count bar */}
            <div className="border-t border-pink-100/70 dark:border-neutral-800 px-5 py-3 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-rose-50/20 dark:from-transparent dark:to-transparent dark:bg-transparent">
                <span className="text-[10px] text-slate-400 dark:text-neutral-600 font-bold uppercase tracking-widest">
                    {sortedResults.length} {sortedResults.length === 1 ? 'entry' : 'entries'}
                </span>
            </div>
        </div>
    );
};

export default GiftSearchResults;
