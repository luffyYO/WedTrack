import React from 'react';
import { SearchX, MapPin, User } from 'lucide-react';
import { formatDate, parseSafeDate } from '@/utils/formatters';

interface Guest {
    id: string;
    first_name: string;
    last_name?: string;
    father_first_name: string;
    father_last_name?: string;
    village?: string;
    district?: string;
    amount: number;
    payment_type: string;
    is_paid: boolean;
    created_at: string;
}

interface SearchResultsProps {
    results: Guest[];
    onConfirm?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onConfirm, onDelete }) => {
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-5">Guest Name</th>
                            <th className="px-6 py-5">Father's Name</th>
                            <th className="px-6 py-5">Location</th>
                            <th className="px-6 py-5 text-right">Amount</th>
                            <th className="px-6 py-5">Date & Time</th>
                            <th className="px-6 py-5 text-center">Status / Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {results.map((guest) => {
                            const entryDate = parseSafeDate(guest.created_at);
                            const timeStr = entryDate && !isNaN(entryDate.getTime()) 
                                ? entryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : '';
                                
                            return (
                                <tr key={guest.id} className="hover:bg-primary-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary-100 text-primary-700 p-2 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-all">
                                                <User size={14} />
                                            </div>
                                            <span className="font-bold text-gray-900">{guest.first_name} {guest.last_name || ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {guest.father_first_name} {guest.father_last_name || ''}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin size={14} className="text-primary-400" />
                                            <span className="font-medium">{guest.village || guest.district || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-gray-900 text-base">₹{Number(guest.amount).toLocaleString('en-IN')}</span>
                                            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tight">{guest.payment_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-medium">{formatDate(guest.created_at)}</span>
                                            <span className="text-[11px] text-gray-400">{timeStr}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 min-w-[120px]">
                                            {guest.is_paid ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    Verified
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {onConfirm && (
                                                        <button
                                                            onClick={() => onConfirm(guest.id)}
                                                            className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all shadow-sm active:scale-95"
                                                        >
                                                            Paid
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(guest.id)}
                                                            className="bg-white border border-red-100 text-red-500 hover:bg-red-50 font-bold px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all active:scale-95"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!guest.is_paid && (
                                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:block sm:group-hover:hidden">
                                                    Pending
                                                </span>
                                            )}
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
