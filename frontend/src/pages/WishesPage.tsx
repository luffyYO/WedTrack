import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useWishStore } from '@/store';
import PageHeader from '@/components/layout/PageHeader';

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
    const { wishes, fetchWishes, markAllRead, isLoading } = useWishStore();

    useEffect(() => {
        // Fetch wishes when entering page
        fetchWishes();
    }, [fetchWishes]);

    useEffect(() => {
        // Mark all as read since they are viewing the page
        if (wishes.some(w => !w.is_read)) {
            markAllRead();
        }
    }, [wishes, markAllRead]);

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <PageHeader
                title="Guest Wishes"
                description="All the wishes and messages left by your guests."
            />

            {isLoading && wishes.length === 0 ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                </div>
            ) : wishes.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 text-center mt-8 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                        <Sparkles size={28} className="text-primary-400" />
                    </div>
                    <div>
                        <p className="text-heading-md text-[var(--color-text-primary)] mb-1">No wishes yet</p>
                        <p className="text-body-md text-[var(--color-text-secondary)]">
                            When guests send you wishes, they will appear here.
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Wishes Grid/List ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {wishes.map((wish) => (
                        <div 
                            key={wish.id}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-body-lg font-semibold text-[var(--color-text-primary)]">
                                        {[wish.first_name, wish.last_name].filter(Boolean).join(' ')}
                                    </h3>
                                    <p className="text-caption text-[var(--color-text-muted)] mt-0.5">
                                        {timeAgo(wish.created_at)}
                                    </p>
                                </div>
                                {!wish.is_read && (
                                    <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                        New
                                    </span>
                                )}
                            </div>

                            <div 
                                className="relative rounded-[var(--radius-md)] px-4 py-3 bg-neutral-50/80"
                            >
                                <span 
                                    className="absolute -top-1 -left-1 text-3xl leading-none text-primary-200 select-none pointer-events-none font-serif" 
                                    aria-hidden="true"
                                >
                                    "
                                </span>
                                <p className="text-body-md text-[var(--color-text-secondary)] leading-relaxed italic z-10 relative">
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
