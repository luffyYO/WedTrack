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
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-gray-50 p-6 rounded-full text-gray-300 mb-4 ring-8 ring-gray-50/50">
                    <SearchX size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No matching entries found</h3>
                <p className="text-gray-500 max-w-xs">
                    Try adjusting your search query or switching filters to find what you're looking for.
                </p>
            </div>
        );
    }

    // Table rendering directly without slicing

    return (
        <div className="bg-white dark:bg-black rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                    <thead className="text-[11px] text-black dark:text-white uppercase bg-neutral-100 dark:bg-neutral-900 font-black border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                            <th className="px-4 py-3">Guest Name</th>
                            <th className="px-4 py-3">Father's Name</th>
                            <th className="px-4 py-3 text-right">Amount and Type</th>
                            <th className="px-4 py-3 text-center">Status / Action</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Date and Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {sortedResults.map((guest) => {
                            const entryDate = parseSafeDate(guest.created_at);
                            const timeStr = entryDate && !isNaN(entryDate.getTime()) 
                                ? entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : '';
                                
                            return (
                                <tr key={guest.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 p-1.5 rounded-lg group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                                                <User size={12} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black dark:text-white text-sm">{guest.fullname}</span>
                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                                    {guest.phone_number}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                        {guest.father_fullname || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-extrabold text-black dark:text-white text-sm">₹{Number(guest.amount).toLocaleString('en-IN')}</span>
                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight">{guest.payment_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center justify-center gap-1.5 min-w-[100px]">
                                            {guest.is_paid ? (
                                                <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-100 dark:border-green-800">
                                                    Verified
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {onConfirm && (
                                                        <button
                                                            onClick={() => onConfirm(guest.id)}
                                                            className="bg-black dark:bg-white text-white dark:text-black font-black px-2.5 py-1 rounded-lg text-[10px] hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-95"
                                                        >
                                                            Paid
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(guest.id)}
                                                            className="bg-white dark:bg-black border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all active:scale-95"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!guest.is_paid && (
                                                <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-orange-100 hidden sm:block sm:group-hover:hidden">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                            <MapPin size={12} className="text-black dark:text-white shrink-0" />
                                            <span className="font-medium text-xs truncate max-w-[120px]">{guest.village || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-black dark:text-white font-bold text-[11px]">{formatDate(guest.created_at)}</span>
                                            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">{timeStr}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SearchResults;
