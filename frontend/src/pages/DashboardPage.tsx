import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, IndianRupee, Download, LayoutDashboard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateGuestListPDF } from '@/utils/pdfGenerator';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import apiClient from '@/api/client';
import { supabase } from '@/config/supabaseClient';
import { useAuthStore, useAppStore } from '@/store';
import SearchBar from '@/components/SearchBar';
import SearchFilters, { FilterType } from '@/components/SearchFilters';
import SearchResults from '@/components/SearchResults';
import { WeddingNameDisplay } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchUserWeddings, fetchGuests } from '@/lib/queries';

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { activeWedding, setActiveWedding } = useAppStore();
    const queryClient = useQueryClient();

    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
    const selectedWeddingId = activeWedding?.id && isUUID(activeWedding.id) ? activeWedding.id : '';

    const [pdfLoading, setPdfLoading] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Name');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAmountRange, setSelectedAmountRange] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

    // ── TanStack Query: Weddings ─────────────────────────────────────────────
    const {
        data: weddings = [],
        isLoading: loading,
    } = useQuery({
        queryKey: ['weddings', user?.id],
        queryFn: () => fetchUserWeddings(user!.id),
        enabled: !!user?.id,
        staleTime: 60_000,          // serve from cache for 60s on revisit
        gcTime: 5 * 60_000,         // keep in memory 5min after unmount
    });

    // ── Sync active wedding when weddings load ───────────────────────────────
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

    // Reset sync flag when user re-navigates (weddings list could change)
    useEffect(() => {
        hasSyncedWedding.current = false;
    }, [user?.id]);

    // ── TanStack Query: Guests ───────────────────────────────────────────────
    const {
        data: guests = [],
        isLoading: guestsLoading,
    } = useQuery({
        queryKey: ['guests', selectedWeddingId],
        queryFn: () => fetchGuests(selectedWeddingId),
        enabled: !!selectedWeddingId && !!user?.id,  // wait for auth so RLS works
        staleTime: 30_000,          // serve from cache for 30s on revisit
        gcTime: 5 * 60_000,         // keep in memory 5min after unmount
    });

    // ── Realtime Subscription ────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedWeddingId) return;

        if (!isUUID(selectedWeddingId)) {
            console.warn(`[Realtime Config] CRITICAL: Attempted to subscribe with an invalid UUID (${selectedWeddingId}). Aborting connection to prevent payload errors.`);
            return;
        }

        const channel = supabase
            .channel(`dashboard-guests:${selectedWeddingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'guests',
                    filter: `wedding_id=eq.${selectedWeddingId}`,
                },
                (payload) => {
                    // Instantly prepend new guest — no refetch required
                    queryClient.setQueryData(
                        ['guests', selectedWeddingId],
                        (old: any[] = []) => [payload.new, ...old]
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'guests',
                    filter: `wedding_id=eq.${selectedWeddingId}`,
                },
                (payload) => {
                    // Update changed guest in-place — no refetch
                    queryClient.setQueryData(
                        ['guests', selectedWeddingId],
                        (old: any[] = []) =>
                            old.map((g) => (g.id === payload.new.id ? payload.new : g))
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'guests',
                    filter: `wedding_id=eq.${selectedWeddingId}`,
                },
                (payload) => {
                    queryClient.setQueryData(
                        ['guests', selectedWeddingId],
                        (old: any[] = []) => old.filter((g) => g.id !== payload.old.id)
                    );
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime Config] Successfully subscribed to dashboard-guests:${selectedWeddingId}`);
                } else {
                    console.warn(`[Realtime Config] Subscription error/failure: ${status}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedWeddingId, queryClient]);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // ── Client-side filtering (no re-fetch on filter change) ────────────────
    const filteredGuests = useMemo(() => {
        let result = [...guests];

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            if (activeFilter === 'Name') {
                result = result.filter(g =>
                    (g.fullname || '').toLowerCase().includes(query)
                );
            } else if (activeFilter === 'Location') {
                result = result.filter(g =>
                    (g.village || '').toLowerCase().includes(query)
                );
            }
        }

        if (activeFilter === 'Amount' && selectedAmountRange !== null) {
            result = result.filter(g => Number(g.amount) < selectedAmountRange);
        }

        if (activeFilter === 'Payment Method') {
            if (selectedPaymentMethod) {
                result = result.filter(g =>
                    (g.payment_type || '').toLowerCase() === selectedPaymentMethod.toLowerCase()
                );
            } else if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                result = result.filter(g =>
                    (g.payment_type || '').toLowerCase().includes(query)
                );
            }
        }

        return result;
    }, [guests, debouncedSearchQuery, activeFilter, selectedAmountRange, selectedPaymentMethod]);

    // ── Mutations (keep using Edge Functions for write operations) ───────────
    const confirmGuest = async (guestId: string) => {
        try {
            await apiClient.post('update-guest', { 
                guest_id: guestId, 
                is_paid: true,
                payment_status: 'paid' 
            });
            
            // Optimistically update cache
            queryClient.setQueryData(
                ['guests', selectedWeddingId],
                (old: any[] = []) =>
                    old.map(g => g.id === guestId ? { ...g, is_paid: true, payment_status: 'paid' } : g)
            );

            // Trigger WhatsApp notification asynchronously so it doesn't block the UI
            apiClient.post('send-whatsapp', { guest_id: guestId })
                .catch(err => console.error('WhatsApp trigger failed:', err));

        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to confirm payment:', err);
            alert('Failed to confirm payment.');
        }
    };

    const deleteGuest = async (guestId: string) => {
        if (!window.confirm('Are you sure you want to cancel and remove this guest entry? This cannot be undone.')) return;
        try {
            await apiClient.post('delete-guest', { guest_id: guestId });
            // Remove from cache immediately
            queryClient.setQueryData(
                ['guests', selectedWeddingId],
                (old: any[] = []) => old.filter(g => g.id !== guestId)
            );
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to delete guest:', err);
            alert('Failed to remove guest entry.');
        }
    };

    const handleDownloadPDF = useCallback(async () => {
        const wedding = weddings.find((w: any) => w.id === selectedWeddingId);
        if (!wedding) return;

        setPdfLoading(true);
        try {
            const summary = {
                weddingName: `${wedding.bride_name} & ${wedding.groom_name}`,
                totalGifts: totalVerifiedGifts,
                totalAmount: totalCollected,
            };
            await generateGuestListPDF(filteredGuests, summary);
        } catch (err) {
            if (import.meta.env.DEV) console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setPdfLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weddings, selectedWeddingId, filteredGuests]);

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

    const isFilterActive = debouncedSearchQuery.trim().length > 0 || selectedAmountRange !== null || selectedPaymentMethod !== null;

    const { filteredVerifiedGiftsCount, filteredVerifiedAmount } = useMemo(() => {
        if (!isFilterActive) return { filteredVerifiedGiftsCount: 0, filteredVerifiedAmount: 0 };
        return filteredGuests.reduce(
            (acc, g) => {
                if (g.is_paid) {
                    acc.filteredVerifiedAmount += Number(g.amount);
                    acc.filteredVerifiedGiftsCount += 1;
                }
                return acc;
            },
            { filteredVerifiedGiftsCount: 0, filteredVerifiedAmount: 0 }
        );
    }, [filteredGuests, isFilterActive]);

    return (
        <div className="w-full pb-10 px-4 sm:px-6 animate-fade-up">
            <PageHeader
                title="Management Dashboard"
                description={
                    <>
                        Welcome back, <span className="font-bold text-slate-900 capitalize">{user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>! View your recent wedding gift tracks here.
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

        {weddings.length === 0 && !loading ? (
            <div className="mt-8 flex flex-col items-center justify-center min-h-[300px] gap-4 text-center glass-panel rounded-[2.5rem] border border-dashed border-slate-300 p-10">
                <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-400">
                    <Users size={28} />
                </div>
                <p className="text-slate-800 font-bold text-xl tracking-tight">
                    No events tracked yet.
                </p>
                <p className="text-slate-500 max-w-sm mb-4">Start organizing your guest list and contributions by creating a new wedding record.</p>
                <Button onClick={() => navigate('/wedding-track/new')} className="shadow-sm">Create New Wedding Track</Button>
            </div>
        ) : (
                <div className="mt-8 space-y-8 max-w-[950px] mx-auto">
                    {/* ── Wedding Selector ── */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center glass-panel p-5 rounded-[1.5rem] relative z-30 group">
                        <div className="flex items-center gap-2 text-slate-400">
                            <LayoutDashboard size={18} className="group-hover:text-pink-400 transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Active Channel:</span>
                        </div>

                        <div className="relative w-full sm:min-w-[340px] z-[60]">
                            {(() => {
                                const selectedW = weddings.find((w: any) => w.id === selectedWeddingId);
                                return (
                                    <div
                                        className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white hover:border-pink-300 transition-all shadow-sm"
                                        onClick={(e) => {
                                            const dropdown = e.currentTarget.nextElementSibling;
                                            if (dropdown) dropdown.classList.toggle('hidden');
                                        }}
                                    >
                                        <div className="overflow-hidden">
                                            {loading ? (
                                                <div className="animate-pulse bg-slate-200/60 h-5 w-40 rounded-md" />
                                            ) : selectedW ? (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <WeddingNameDisplay
                                                        brideName={selectedW.bride_name}
                                                        groomName={selectedW.groom_name}
                                                        size="sm"
                                                        className="text-slate-800"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">Select an event record...</span>
                                            )}
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                );
                            })()}

                            {/* Dropdown Options */}
                            <div className="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[60] py-2 animate-fade-up duration-200">
                                {weddings.map((w: any) => (
                                    <div
                                        key={w.id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-pink-50/50 transition-colors border-b border-slate-100 last:border-0 ${selectedWeddingId === w.id ? 'bg-pink-50/80' : ''}`}
                                        onClick={(e) => {
                                            setActiveWedding(w);
                                            e.currentTarget.parentElement?.classList.add('hidden');
                                        }}
                                    >
                                        <WeddingNameDisplay
                                            brideName={w.bride_name}
                                            groomName={w.groom_name}
                                            size="sm"
                                            className="text-slate-800"
                                        />
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Location: {[w.village, w.location].filter(Boolean).join(', ')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Stats Overview ── */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[850px] mx-auto z-10 relative">
                        {/* Total Collected */}
                        <div className="glass-panel p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute -left-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500">
                                <IndianRupee size={120} />
                            </div>
                            <span className="text-slate-400 text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 leading-tight">Validated Revenue</span>
                            <h3 className="text-xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 relative z-10">
                                <IndianRupee size={14} className="text-slate-600 sm:w-8 sm:h-8"/>
                                <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                                    {totalCollected.toLocaleString('en-IN')}
                                </span>
                            </h3>
                            <span className="text-[7px] sm:text-[10px] text-pink-400/80 font-bold mt-0.5 sm:mt-1 relative z-10 hidden xs:block">SECURE TRANSACTION LEDGER</span>
                        </div>

                        {/* Total Gifts */}
                        <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_30px_rgba(236,72,153,0.3)] border border-pink-400 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 h-[120px] sm:h-[160px] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:-rotate-12 transition-all duration-500">
                                <Users size={140} />
                            </div>
                            <span className="text-white/80 text-[8px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 text-shadow-sm leading-tight">Verified Contributions</span>
                            <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black flex items-center justify-center gap-1.5 sm:gap-2 relative z-10 drop-shadow-md mt-0.5 sm:mt-1 tracking-tighter">
                                <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                                    {totalVerifiedGifts}
                                </span>
                            </h3>
                            <span className="text-[7px] sm:text-[10px] text-white/70 font-bold relative z-10 mt-0.5 sm:mt-1 uppercase text-shadow-sm hidden xs:block">Confirmed Guest Entries</span>
                        </div>

                        {/* Total Registered */}
                        <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all group relative">
                            <span className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Total Inventory</span>
                            <h3 className="text-2xl sm:text-4xl font-black text-slate-700 mt-0.5 sm:mt-1 tracking-tight">
                                <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                                    {guests.length}
                                </span>
                            </h3>
                            <span className="text-[7px] sm:text-[9px] text-slate-400 font-bold mt-0.5">ALL SUBMISSIONS</span>
                        </div>

                        {/* Pending Verifications */}
                        <div className="glass-panel p-3 sm:p-6 rounded-[1.5rem] border border-red-200 flex flex-col items-center justify-center text-center gap-1 h-[110px] sm:h-[140px] hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] hover:border-red-300 transition-all group relative bg-gradient-to-br from-white/60 to-red-50/30">
                            {pendingGifts > 0 && (
                                <span className="absolute top-2.5 right-2.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500"></span>
                                </span>
                            )}
                            <span className="text-red-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">Awaiting Action</span>
                            <h3 className="text-2xl sm:text-4xl font-black text-red-500 mt-0.5 sm:mt-1 drop-shadow-sm">
                                <span className={`transition-opacity duration-300 ${guestsLoading ? 'opacity-30' : 'opacity-100'}`}>
                                    {pendingGifts}
                                </span>
                            </h3>
                            <span className="text-[7px] sm:text-[9px] text-red-400/80 font-bold mt-0.5 uppercase">Verification Required</span>
                        </div>
                    </div>

                    {/* ── Search & Filtering ── */}
                    <div className="space-y-4">
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

                        {/* CLS fix: use overflow+max-height transition instead of mount/unmount */}
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

                    {/* ── Search Results / Table ── */}
                    <div className="space-y-6">
                        {/* CLS fix: always render, collapse with max-height instead of mount/unmount */}
                        <div
                            className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                            style={{ maxHeight: isFilterActive ? '120px' : '0px', opacity: isFilterActive ? 1 : 0 }}
                        >
                            <div className="glass-panel p-6 rounded-[2rem] flex flex-wrap gap-8 items-center">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Verified Target Gifts</span>
                                    <div className="text-4xl font-black text-slate-800 mt-1 tracking-tighter">
                                        {filteredVerifiedGiftsCount}
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-14 bg-slate-200/60" />
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Target Verified Amount</span>
                                    <div className="text-4xl font-black text-slate-800 flex items-center gap-1 mt-1 tracking-tighter">
                                        <IndianRupee size={28} className="text-slate-600" />
                                        {filteredVerifiedAmount.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                {searchQuery || (activeFilter === 'Amount' && selectedAmountRange) ? 'Active Results' : 'Recent Submissions'}
                                <span className="bg-white/60 text-slate-500 text-xs px-2.5 py-1 rounded-full shadow-sm border border-slate-200/50">
                                    {filteredGuests.length}
                                </span>
                            </h3>

                            <button
                                onClick={handleDownloadPDF}
                                disabled={filteredGuests.length === 0 || pdfLoading}
                                title={pdfLoading ? 'Generating PDF…' : 'Download Guest List PDF'}
                                className="px-4 py-2 rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm text-slate-600 hover:text-pink-500 hover:border-pink-200 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex items-center gap-2"
                            >
                                {pdfLoading ? (
                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                        <span className="text-sm font-semibold hidden sm:inline">Export PDF</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {guestsLoading ? (
                            <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 p-6 space-y-6">
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
                            <div className="p-16 text-center glass-panel rounded-[2rem] text-slate-400 font-medium">
                                No guests have registered for this event yet.
                            </div>
                        ) : (
                            <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/60">
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
