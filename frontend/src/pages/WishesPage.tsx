import { useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useWishStore } from '@/store';
import PageHeader from '@/components/layout/PageHeader';
import apiClient from '@/api/client';
import { WeddingNameDisplay } from '@/components/ui';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function WishesPage() {
    const { wishes, isLoading } = useWishStore();
    const [weddings, setWeddings] = useState<any[]>([]);
    const [selectedWeddingId, setSelectedWeddingId] = useState<string>('');
    const [filteredWishes, setFilteredWishes] = useState<any[]>([]);
    const [wishesLoading, setWishesLoading] = useState(false);

    // Load wedding list once for the selector
    useEffect(() => {
        const fetchWeddings = async () => {
            try {
                const { data } = await apiClient.get('/weddings');
                if (data?.data) setWeddings(data.data);
            } catch (err) {
                console.error('Failed to load weddings for selector:', err);
            }
        };
        fetchWeddings();
    }, []);

    // Re-fetch wishes whenever selectedWeddingId changes
    const fetchWishes = useCallback(async (weddingId: string) => {
        setWishesLoading(true);
        try {
            const url = weddingId
                ? `/guests/wishes?weddingId=${encodeURIComponent(weddingId)}`
                : '/guests/wishes';
            const { data } = await apiClient.get(url);
            setFilteredWishes(data?.data ?? []);
        } catch (err) {
            console.error('Failed to load wishes:', err);
            setFilteredWishes([]);
        } finally {
            setWishesLoading(false);
        }
    }, []);

    // Initial load: fetch all wishes
    useEffect(() => {
        fetchWishes('');
    }, [fetchWishes]);

    const handleWeddingSelect = (weddingId: string) => {
        setSelectedWeddingId(weddingId);
        fetchWishes(weddingId);
    };

    const displayedWishes = filteredWishes;
    const showLoading = wishesLoading || (isLoading && wishes.length === 0);
    const selectedW = weddings.find(w => w.id === selectedWeddingId);

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-up">
            <PageHeader
                title="Guest Wishes"
                description="All the beautiful wishes and messages left by your guests."
            />

            {/* Wedding Selector (Premium Glass Style) */}
            {weddings.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center glass-panel p-5 rounded-[1.5rem] relative z-30 mt-8 group">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Filter by Event:</span>
                    <div className="relative w-full sm:min-w-[340px]">
                        <div
                            className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white hover:border-pink-300 transition-all shadow-sm"
                            onClick={(e) => {
                                const dropdown = e.currentTarget.nextElementSibling;
                                if (dropdown) dropdown.classList.toggle('hidden');
                            }}
                        >
                            <div className="overflow-hidden">
                                {selectedW ? (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <WeddingNameDisplay
                                            brideName={selectedW.bride_name}
                                            groomName={selectedW.groom_name}
                                            size="sm"
                                            className="text-slate-800"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400">All registered events</span>
                                )}
                            </div>
                            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        {/* Dropdown Options */}
                        <div className="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[60] py-2 animate-fade-up duration-200">
                            <div
                                className={`px-4 py-3 cursor-pointer hover:bg-pink-50/50 transition-colors border-b border-slate-100 ${selectedWeddingId === '' ? 'bg-pink-50/80' : ''}`}
                                onClick={(e) => {
                                    handleWeddingSelect('');
                                    e.currentTarget.parentElement?.classList.add('hidden');
                                }}
                            >
                                <span className="text-sm text-slate-800 font-semibold tracking-tight">Show All Events</span>
                            </div>
                            {weddings.map(w => (
                                <div
                                    key={w.id}
                                    className={`px-4 py-3 cursor-pointer hover:bg-pink-50/50 transition-colors border-b border-slate-100 last:border-0 ${selectedWeddingId === w.id ? 'bg-pink-50/80' : ''}`}
                                    onClick={(e) => {
                                        handleWeddingSelect(w.id);
                                        e.currentTarget.parentElement?.classList.add('hidden');
                                    }}
                                >
                                    <WeddingNameDisplay brideName={w.bride_name} groomName={w.groom_name} size="sm" className="text-slate-800" />
                                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">{w.location}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin shadow-sm" />
                </div>
            ) : displayedWishes.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center mt-8 glass-panel rounded-[2.5rem] border border-dashed border-slate-300">
                    <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <Sparkles size={32} className="text-pink-400 animate-pulse-glow bg-pink-50 rounded-full p-1" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">No wishes yet</p>
                        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                            {selectedWeddingId
                                ? 'No wishes have been submitted for this specific wedding.'
                                : 'When guests send their warm wishes and blessings, they will beautifully appear here.'}
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Wishes Grid ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {displayedWishes.map((wish, index) => (
                        <div
                            key={wish.id}
                            className="glass-panel border border-white/80 rounded-[2.5rem] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(244,114,182,0.1)] hover:-translate-y-1.5 transition-all duration-400 group relative overflow-hidden"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Decorative gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            
                            <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        {[wish.first_name, wish.last_name].filter(Boolean).join(' ')}
                                        {wish.amount && Number(wish.amount) > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]" aria-label="Gifted"></span>
                                        )}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-pink-300" />
                                        {timeAgo(wish.created_at)}
                                    </p>
                                </div>
                                {!wish.is_read && (
                                    <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md px-3 py-1.5 rounded-full">
                                        New
                                    </span>
                                )}
                            </div>

                            <div
                                className="relative rounded-2xl px-6 py-5 bg-white/70 border border-slate-100 shadow-inner mt-2 z-10"
                            >
                                <span
                                    className="absolute -top-4 -left-2 text-5xl leading-none text-pink-200 select-none pointer-events-none font-serif opacity-60"
                                    aria-hidden="true"
                                >
                                    "
                                </span>
                                <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed italic z-10 relative">
                                    {wish.wishes}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
