import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/SearchBar';
import NewGiftStats from '../components/NewGiftStats';
import GiftSearchResults from '../components/GiftSearchResults';
import NewGiftModal from '../components/NewGiftModal';
import type {
    NewGiftEntry
} from '@/lib/giftQueries';
import {
    fetchGiftEntries,
    createGiftEntry,
    updateGiftEntry,
    deleteGiftEntry
} from '@/lib/giftQueries';

export default function NewGiftPage() {
    const { user } = useAuthStore();
    const [entries, setEntries] = useState<NewGiftEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<NewGiftEntry | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const data = await fetchGiftEntries(user.id);
                setEntries(data);
            } catch (err) {
                console.error('Failed to fetch gifts:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    // Computed Stats
    const { totalAmount, totalEntries, recentAmount } = useMemo(() => {
        let amt = 0;
        let latestAmt = 0;
        let latestDate = 0;

        entries.forEach(entry => {
            amt += Number(entry.amount);
            const t = new Date(entry.gift_date || entry.created_at).getTime();
            if (t > latestDate) {
                latestDate = t;
                latestAmt = Number(entry.amount);
            }
        });

        return {
            totalAmount: amt,
            totalEntries: entries.length,
            recentAmount: latestAmt
        };
    }, [entries]);

    // Filtering
    const filteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        const q = searchQuery.toLowerCase();
        return entries.filter(e => 
            e.person_name.toLowerCase().includes(q) ||
            e.amount_type.toLowerCase().includes(q) ||
            (e.village && e.village.toLowerCase().includes(q))
        );
    }, [entries, searchQuery]);

    // Handlers
    const handleOpenModal = (entry?: NewGiftEntry) => {
        if (entry) {
            setEditingEntry(entry);
        } else {
            setEditingEntry(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleSubmit = async (data: Partial<NewGiftEntry>) => {
        if (!user?.id) return;

        try {
            if (editingEntry) {
                const updated = await updateGiftEntry(editingEntry.id, data);
                setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
            } else {
                const newEntry = await createGiftEntry({ ...data, user_id: user.id });
                setEntries(prev => [newEntry, ...prev]);
            }
        } catch (err) {
            console.error('Error saving gift entry:', err);
            throw err;
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        
        try {
            setDeletingId(id);
            await deleteGiftEntry(id);
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting gift entry:', err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="w-full pb-10">
            <div className="px-4 sm:px-6">
                <PageHeader
                    title="New Gift Entries"
                    description={
                        <>
                            Manually record and manage gifts you have given to friends and family.
                        </>
                    }
                    action={
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                            <Button
                                size="md"
                                fullWidth
                                variant="primary"
                                icon={<Plus size={16} />}
                                onClick={() => handleOpenModal()}
                            >
                                Create New Gift Entry
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="mt-8 space-y-8">
                <NewGiftStats
                    totalAmount={totalAmount}
                    totalEntries={totalEntries}
                    recentAmount={recentAmount}
                    pendingCount={0}
                    loading={loading}
                />

                <div className="space-y-4 max-w-[850px] mx-auto px-4 sm:px-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={(q) => setSearchQuery(q)}
                        onSearchClick={() => {}}
                        onFilterToggle={() => {}}
                        isFilterOpen={false}
                        placeholder="Search by person name or amount type..."
                    />
                </div>

                <div className="space-y-4 w-full">
                    {loading ? (
                        <div className="glass-panel overflow-hidden rounded-2xl border border-white/60 p-6 space-y-6 mx-4 sm:mx-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="animate-pulse bg-slate-200/60 h-10 w-10 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="animate-pulse bg-slate-200/60 h-3 w-1/3 rounded" />
                                        <div className="animate-pulse bg-slate-200/60 h-2 w-1/4 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)] mx-2 sm:mx-4">
                            <GiftSearchResults
                                results={filteredEntries}
                                onEdit={handleOpenModal}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <NewGiftModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    initialData={editingEntry}
                />
            )}
        </div>
    );
}
