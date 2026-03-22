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
        <div className="max-w-4xl mx-auto pb-10">
            <PageHeader
                title="Guest Wishes"
                description="All the wishes and messages left by your guests."
            />

            {/* Wedding Selector (mirrors DashboardPage style) */}
            {weddings.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-black p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative z-30 mt-6">
                    <span className="text-sm font-semibold text-black dark:text-white whitespace-nowrap">Filter by wedding:</span>
                    <div className="relative w-full sm:min-w-[320px]">
                        <div
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">All weddings</span>
                                )}
                            </div>
                            <svg className="w-4 h-4 text-neutral-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        {/* Dropdown Options */}
                        <div className="hidden absolute top-full left-0 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 py-1">
                            <div
                                className={`p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800 ${selectedWeddingId === '' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                                onClick={(e) => {
                                    handleWeddingSelect('');
                                    e.currentTarget.parentElement?.classList.add('hidden');
                                }}
                            >
                                <span className="text-sm text-black dark:text-white font-medium">All weddings</span>
                            </div>
                            {weddings.map(w => (
                                <div
                                    key={w.id}
                                    className={`p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${selectedWeddingId === w.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                                    onClick={(e) => {
                                        handleWeddingSelect(w.id);
                                        e.currentTarget.parentElement?.classList.add('hidden');
                                    }}
                                >
                                    <WeddingNameDisplay brideName={w.bride_name} groomName={w.groom_name} size="sm" />
                                    <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{w.location}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
                </div>
            ) : displayedWishes.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 text-center mt-8 rounded-[2rem] bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                        <Sparkles size={28} className="text-black dark:text-white" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-black dark:text-white mb-1">No wishes yet</p>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            {selectedWeddingId
                                ? 'No wishes for this wedding yet.'
                                : 'When guests send you wishes, they will appear here.'}
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Wishes Grid/List ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {displayedWishes.map((wish) => (
                        <div
                            key={wish.id}
                            className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-800 to-black dark:from-neutral-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-black dark:text-white">
                                        {[wish.first_name, wish.last_name].filter(Boolean).join(' ')}
                                    </h3>
                                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 uppercase tracking-wider">
                                        {timeAgo(wish.created_at)}
                                    </p>
                                </div>
                                {!wish.is_read && (
                                    <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase bg-black dark:bg-white text-white dark:text-black shadow-sm px-2.5 py-1 rounded-full">
                                        New
                                    </span>
                                )}
                            </div>

                            <div
                                className="relative rounded-2xl px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 mt-2"
                            >
                                <span
                                    className="absolute -top-3 -left-2 text-4xl leading-none text-neutral-200 dark:text-neutral-800 select-none pointer-events-none font-serif opacity-50"
                                    aria-hidden="true"
                                >
                                    "
                                </span>
                                <p className="text-sm sm:text-base text-black dark:text-white leading-relaxed italic z-10 relative">
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
