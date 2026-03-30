import React, { useMemo } from 'react';
import { SearchX, MapPin, User } from 'lucide-react';
import { formatDate, parseSafeDate } from '@/utils/formatters';

interface Guest {
    id: string;
    fullname: string;
    father_fullname?: string;
    phone_number: string;
    village?: string;
    amount: number;
    payment_type: string;
    is_paid: boolean;
    gift_side?: string;
    created_at: string;
}

interface SearchResultsProps {
    results: Guest[];
    onConfirm?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onConfirm, onDelete }) => {
    // Single page rendering with dynamic sorting
    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            // Pending entries (!is_paid) before verified entries (is_paid)
            if (a.is_paid !== b.is_paid) {
                return a.is_paid ? 1 : -1;
            }
            // Sort by time: newest first within each group
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeB - timeA;
        });
    }, [results]);

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-neutral-900 p-6 rounded-full text-neutral-600 mb-4 ring-8 ring-neutral-800/30">
                    <SearchX size={48} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No matching entries found</h3>
                <p className="text-neutral-400 max-w-xs">
                    Try adjusting your search query or switching filters to find what you're looking for.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] w-full overflow-hidden">
            {/* Sticky scrollable wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-neutral-400 whitespace-nowrap">
                    {/* Sticky header */}
                    <thead className="sticky top-0 z-10 text-[10px] text-white uppercase bg-[#111111] font-black border-b border-neutral-800 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                        <tr>
                            <th className="px-3 py-4 text-center tracking-widest text-neutral-500 w-10">#</th>
                            <th className="px-5 py-4 tracking-widest">Guest Name</th>
                            <th className="px-5 py-4 tracking-widest">Father's Name</th>
                            <th className="px-5 py-4 text-right tracking-widest">Amount &amp; Type</th>
                            <th className="px-5 py-4 text-center tracking-widest">Status / Action</th>
                            <th className="px-5 py-4 tracking-widest">Location</th>
                            <th className="px-5 py-4 tracking-widest">Date &amp; Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                        {sortedResults.map((guest, idx) => {
                            const entryDate = parseSafeDate(guest.created_at);
                            const timeStr = entryDate && !isNaN(entryDate.getTime())
                                ? entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : '';

                            return (
                                <tr
                                    key={guest.id}
                                    className={`group transition-colors duration-150 ${
                                        idx % 2 === 0
                                            ? 'bg-[#0a0a0a] hover:bg-neutral-800/40'
                                            : 'bg-[#0d0d0d] hover:bg-neutral-800/40'
                                    }`}
                                >
                                    {/* Serial Number */}
                                    <td className="px-3 py-3.5 text-center">
                                        <span className="text-[11px] font-bold text-neutral-600 tabular-nums">
                                            {idx + 1}
                                        </span>
                                    </td>

                                    {/* Guest Name */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-neutral-800 text-neutral-400 p-2 rounded-lg group-hover:bg-white group-hover:text-black transition-all duration-200 shrink-0">
                                                <User size={12} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-white text-[13px] leading-tight truncate max-w-[140px]">
                                                    {guest.fullname}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 font-medium mt-0.5">
                                                    {guest.phone_number}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Father's Name */}
                                    <td className="px-5 py-3.5 text-neutral-400 text-[12px] font-medium">
                                        {guest.father_fullname || '—'}
                                    </td>

                                    {/* Amount & Type */}
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="font-extrabold text-white text-[14px] tracking-tight">
                                                ₹{Number(guest.amount).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-800 px-1.5 py-0.5 rounded">
                                                {guest.payment_type}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Status / Action */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-center gap-1.5 min-w-[110px]">
                                            {guest.is_paid ? (
                                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                                    {onConfirm && (
                                                        <button
                                                            onClick={() => onConfirm(guest.id)}
                                                            className="bg-white text-black font-black px-3 py-1 rounded-lg text-[10px] hover:bg-emerald-400 hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            Paid
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(guest.id)}
                                                            className="border border-red-800/60 text-red-400 hover:bg-red-900/30 font-bold px-3 py-1 rounded-lg text-[10px] transition-all active:scale-95"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!guest.is_paid && (
                                                <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20 sm:block sm:group-hover:hidden">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Location */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5 text-neutral-400">
                                            <MapPin size={11} className="text-neutral-500 shrink-0" />
                                            <span className="font-medium text-[12px] truncate max-w-[130px]">
                                                {guest.village || '—'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Date & Time */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-white font-bold text-[11px]">
                                                {formatDate(guest.created_at)}
                                            </span>
                                            <span className="text-[9px] text-neutral-500 font-medium">
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
            <div className="border-t border-neutral-800 px-5 py-3 flex items-center justify-between">
                <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                    {sortedResults.length} {sortedResults.length === 1 ? 'entry' : 'entries'}
                </span>
                <span className="text-[10px] text-neutral-700 font-medium">
                    {sortedResults.filter(g => g.is_paid).length} verified · {sortedResults.filter(g => !g.is_paid).length} pending
                </span>
            </div>
        </div>
    );
};

export default SearchResults;
