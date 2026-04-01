import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/SearchBar';
import SearchFilters, { FilterType } from '@/components/SearchFilters';
import SearchResults from '@/components/SearchResults';

import { useAuthStore, useAppStore } from '@/store';
import { fetchUserWeddings, fetchGuests } from '@/lib/queries';

// Feature: Dashboard
import DashboardStats from '@/features/dashboard/components/DashboardStats';
import GuestLinkBanner from '@/features/dashboard/components/GuestLinkBanner';
import WeddingSelector from '@/features/dashboard/components/WeddingSelector';
import GuestSummaryBar from '@/features/dashboard/components/GuestSummaryBar';
import { useRealtimeGuests } from '@/features/dashboard/hooks/useRealtimeGuests';
import { useGuestFilters } from '@/features/dashboard/hooks/useGuestFilters';
import { useGuestMutations } from '@/features/dashboard/hooks/useGuestMutations';

// ─── Dashboard Page ───────────────────────────────────────────────────────────
// This page is intentionally lean — it only composes feature components and hooks.
// All business logic lives in src/features/dashboard/.

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { activeWedding, setActiveWedding } = useAppStore();

    const isUUID = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
    const selectedWeddingId = activeWedding?.id && isUUID(activeWedding.id) ? activeWedding.id : '';

    // ── Search & Filter State ────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Name');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAmountRange, setSelectedAmountRange] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

    // ── TanStack Query: Weddings ─────────────────────────────────────────────
    const { data: weddings = [], isLoading: loading } = useQuery({
        queryKey: ['weddings', user?.id],
        queryFn: () => fetchUserWeddings(user!.id),
        enabled: !!user?.id,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
    });

    // ── Sync active wedding on first load ────────────────────────────────────
    const hasSyncedWedding = useRef(false);
    useEffect(() => {
        if (weddings.length === 0 || hasSyncedWedding.current) return;
        hasSyncedWedding.current = true;
        if (!activeWedding) {
            setActiveWedding(weddings[0]);
        } else {
            const updated = weddings.find((w: any) => w.id === activeWedding.id);
            if (updated) setActiveWedding(updated);
        }
    }, [weddings, activeWedding, setActiveWedding]);

    useEffect(() => { hasSyncedWedding.current = false; }, [user?.id]);

    // ── TanStack Query: Guests ───────────────────────────────────────────────
    const { data: guests = [], isLoading: guestsLoading } = useQuery({
        queryKey: ['guests', selectedWeddingId],
        queryFn: () => fetchGuests(selectedWeddingId),
        enabled: !!selectedWeddingId && !!user?.id,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });

    // ── Feature Hooks ────────────────────────────────────────────────────────
    useRealtimeGuests(selectedWeddingId);

    const { filteredGuests, filteredVerifiedGiftsCount, filteredVerifiedAmount } = useGuestFilters({
        guests,
        searchQuery,
        activeFilter,
        selectedAmountRange,
        selectedPaymentMethod,
    });

    const { confirmGuest, deleteGuest, handleDownloadPDF, pdfLoading } = useGuestMutations(
        selectedWeddingId,
        guests,
        filteredGuests,
        weddings
    );

    // ── Aggregated stats (global, not filtered) ──────────────────────────────
    const { totalCollected, totalVerifiedGifts, pendingGifts } = useMemo(() => {
        return guests.reduce(
            (acc, g) => {
                if (g.is_paid) {
                    acc.totalCollected += Number(g.amount);
                    acc.totalVerifiedGifts += 1;
                } else {
                    acc.pendingGifts += 1;
                }
                return acc;
            },
            { totalCollected: 0, totalVerifiedGifts: 0, pendingGifts: 0 }
        );
    }, [guests]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full pb-10">
            <div className="px-4 sm:px-6">
                <PageHeader
                    title="Management Dashboard"
                    description={
                        <>
                            Welcome back,{' '}
                            <span className="font-bold text-slate-900 capitalize">
                                {user?.user_metadata?.first_name ||
                                    user?.user_metadata?.full_name ||
                                    user?.email?.split('@')[0] ||
                                    'User'}
                            </span>
                            ! View your recent wedding gift tracks here.
                        </>
                    }
                    action={
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                            <Button
                                size="md"
                                fullWidth
                                variant="primary"
                                icon={<Plus size={16} />}
                                onClick={() => navigate('/wedding-track/new')}
                            >
                                Create Track
                            </Button>
                        </div>
                    }
                />
            </div>

            <GuestLinkBanner activeWedding={activeWedding} />

            {weddings.length === 0 && !loading ? (
                <div className="mt-8 mx-4 sm:mx-6 flex flex-col items-center justify-center min-h-[300px] gap-4 text-center glass-panel rounded-[2.5rem] border border-dashed border-slate-300 p-10">
                    <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-400">
                        <Users size={28} />
                    </div>
                    <p className="text-slate-800 font-bold text-xl tracking-tight">No events tracked yet.</p>
                    <p className="text-slate-500 max-w-sm mb-4">
                        Start organizing your guest list and contributions by creating a new wedding record.
                    </p>
                    <Button onClick={() => navigate('/wedding-track/new')} className="shadow-sm">
                        Create New Wedding Track
                    </Button>
                </div>
            ) : (
                <div className="mt-8 space-y-8">
                    <WeddingSelector
                        weddings={weddings}
                        selectedWeddingId={selectedWeddingId}
                        loading={loading}
                        onSelect={setActiveWedding}
                    />

                    <DashboardStats
                        totalCollected={totalCollected}
                        totalVerifiedGifts={totalVerifiedGifts}
                        totalGuests={guests.length}
                        pendingGifts={pendingGifts}
                        guestsLoading={guestsLoading}
                    />

                    {/* ── Search & Filter ── */}
                    <div className="space-y-4 max-w-[850px] mx-auto px-4 sm:px-6">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSearch={(q) => setSearchQuery(q)}
                            onSearchClick={() => {}}
                            onFilterToggle={() => setShowFilters(!showFilters)}
                            isFilterOpen={showFilters}
                            placeholder={
                                activeFilter === 'Name' ? 'Search guest name (e.g. Ravi)...' :
                                activeFilter === 'Location' ? 'Search village or district...' :
                                activeFilter === 'Payment Method' ? 'Search payment method (e.g. PhonePe)...' :
                                'Filtering entries by amount...'
                            }
                        />
                        <div
                            className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                            style={{ maxHeight: showFilters ? '400px' : '0px', opacity: showFilters ? 1 : 0 }}
                        >
                            <div className="glass-panel p-2 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80">
                                <SearchFilters
                                    activeFilter={activeFilter}
                                    onFilterChange={(f) => {
                                        setActiveFilter(f);
                                        if (f !== 'Amount') setSelectedAmountRange(null);
                                        if (f !== 'Payment Method') setSelectedPaymentMethod(null);
                                    }}
                                    onAmountRangeChange={setSelectedAmountRange}
                                    selectedAmountRange={selectedAmountRange}
                                    onPaymentMethodChange={setSelectedPaymentMethod}
                                    selectedPaymentMethod={selectedPaymentMethod}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Guest Table ── */}
                    <div className="space-y-4 w-full">
                        <GuestSummaryBar
                            filteredGuests={filteredGuests}
                            filteredVerifiedAmount={filteredVerifiedAmount}
                            filteredVerifiedGiftsCount={filteredVerifiedGiftsCount}
                            searchQuery={searchQuery}
                            activeFilter={activeFilter}
                            selectedAmountRange={selectedAmountRange}
                            selectedPaymentMethod={selectedPaymentMethod}
                            pdfLoading={pdfLoading}
                            onDownloadPDF={handleDownloadPDF}
                        />

                        {guestsLoading ? (
                            <div className="glass-panel overflow-hidden rounded-2xl border border-white/60 p-6 space-y-6 mx-4 sm:mx-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <div className="animate-pulse bg-slate-200/60 h-10 w-10 rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-3">
                                            <div className="animate-pulse bg-slate-200/60 h-3 w-1/3 rounded" />
                                            <div className="animate-pulse bg-slate-200/60 h-2 w-1/4 rounded" />
                                        </div>
                                        <div className="animate-pulse bg-slate-200/60 h-8 w-20 rounded-[1rem]" />
                                    </div>
                                ))}
                            </div>
                        ) : guests.length === 0 ? (
                            <div className="p-16 text-center glass-panel rounded-[2rem] text-slate-400 font-medium mx-4 sm:mx-6">
                                No guests have registered for this event yet.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)] mx-2 sm:mx-4">
                                <SearchResults
                                    results={filteredGuests}
                                    onConfirm={confirmGuest}
                                    onDelete={deleteGuest}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
