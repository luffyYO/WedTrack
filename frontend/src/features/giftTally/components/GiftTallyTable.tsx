import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, IndianRupee, MapPin, User } from 'lucide-react';
import type { MatchedFamily, TallyStatus } from '../utils/matchingLogic';
import GiftTallyTimeline from './GiftTallyTimeline';


interface GiftTallyTableProps {
    tally: MatchedFamily[];
    loading: boolean;
}

export default function GiftTallyTable({ tally, loading }: GiftTallyTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TallyStatus | 'All'>('All');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const filteredTally = useMemo(() => {
        return tally.filter(fam => {
            const matchesSearch = 
                fam.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fam.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fam.village.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = statusFilter === 'All' || fam.status === statusFilter;
            
            return matchesSearch && matchesFilter;
        }).sort((a, b) => new Date(b.givenDate).getTime() - new Date(a.givenDate).getTime());
    }, [tally, searchQuery, statusFilter]);

    const getStatusBadge = (status: TallyStatus) => {
        switch (status) {
            case 'Returned More':
                return <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-500/20">Returned More</span>;
            case 'Balanced':
                return <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-200/50 dark:border-blue-500/20">Balanced</span>;
            case 'Returned Less':
                return <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-200/50 dark:border-amber-500/20">Returned Less</span>;
            case 'No Return Yet':
                return <span className="px-3 py-1 bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200/50 dark:border-slate-500/20">No Return Yet</span>;
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by family name or village..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/60 dark:bg-[#0f1219]/60 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                    />
                </div>
                
                <div className="relative w-full sm:w-48 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">
                        <Filter size={18} />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TallyStatus | 'All')}
                        className="w-full pl-11 pr-10 py-3 bg-white/60 dark:bg-[#0f1219]/60 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Returned More">Returned More</option>
                        <option value="Balanced">Balanced</option>
                        <option value="Returned Less">Returned Less</option>
                        <option value="No Return Yet">No Return Yet</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>

            {/* Table / Cards */}
            <div className="bg-white/60 dark:bg-[#0f1219]/60 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-neutral-800/60 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-neutral-900/80 border-b border-slate-200/80 dark:border-neutral-800/80 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                                <th className="px-6 py-4">Family Details</th>
                                <th className="px-6 py-4">Village</th>
                                <th className="px-6 py-4 text-right">You Gave</th>
                                <th className="px-6 py-4 text-right">They Returned</th>
                                <th className="px-6 py-4 text-right">Difference</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        Loading tally records...
                                    </td>
                                </tr>
                            ) : filteredTally.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No matched families found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTally.map((family) => {
                                    const isExpanded = expandedRow === family.id;
                                    return (
                                        <React.Fragment key={family.id}>
                                            <tr 
                                                onClick={() => toggleRow(family.id)}
                                                className={`group cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-neutral-900/50' : ''}`}
                                            >
                                                {/* Details */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 flex items-center justify-center text-pink-500 dark:text-pink-400 flex-shrink-0 mt-0.5">
                                                            <User size={14} className="opacity-70" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-white text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                                {family.personName}
                                                            </p>
                                                            {family.fatherName && (
                                                                <p className="text-[11px] font-medium text-slate-400 dark:text-neutral-400 mt-0.5">
                                                                    S/O {family.fatherName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Village */}
                                                <td className="px-6 py-4">
                                                    {family.village ? (
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                            <MapPin size={12} className="text-slate-400 opacity-70" />
                                                            {family.village}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-xs italic">-</span>
                                                    )}
                                                </td>

                                                {/* You Gave */}
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-end">
                                                        <IndianRupee size={12} className="mr-0.5 text-slate-400" />
                                                        {family.givenAmount.toLocaleString('en-IN')}
                                                    </span>
                                                </td>

                                                {/* They Returned */}
                                                <td className="px-6 py-4 text-right">
                                                    {family.returnedAmount > 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-end">
                                                            <IndianRupee size={12} className="mr-0.5 opacity-70" />
                                                            {family.returnedAmount.toLocaleString('en-IN')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-xs italic">-</span>
                                                    )}
                                                </td>

                                                {/* Difference */}
                                                <td className="px-6 py-4 text-right">
                                                    {family.guestEntry ? (
                                                        <span className={`font-bold text-sm flex items-center justify-end ${
                                                            family.difference > 0 ? 'text-emerald-500' : 
                                                            family.difference < 0 ? 'text-pink-500' : 'text-slate-400'
                                                        }`}>
                                                            {family.difference > 0 ? '+' : ''}
                                                            <IndianRupee size={12} className="mx-0.5 opacity-70" />
                                                            {family.difference === 0 ? '0' : Math.abs(family.difference).toLocaleString('en-IN')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-xs italic">-</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(family.status)}
                                                </td>

                                                {/* Caret */}
                                                <td className="px-6 py-4 text-right text-slate-400">
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </td>
                                            </tr>

                                            {/* Expanded Timeline */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="p-0 border-b border-slate-100 dark:border-neutral-800/60">
                                                        <GiftTallyTimeline family={family} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
