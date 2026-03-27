import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, IndianRupee, Download, LayoutDashboard } from 'lucide-react';
import { generateGuestListPDF } from '@/utils/pdfGenerator';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import apiClient from '@/api/client';
import { useAuthStore, useAppStore } from '@/store';
import SearchBar from '@/components/SearchBar';
import SearchFilters, { FilterType } from '@/components/SearchFilters';
import SearchResults from '@/components/SearchResults';
import { WeddingNameDisplay } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SkeletonBox({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-slate-200/60 rounded-xl ${className}`}
            aria-hidden="true"
        />
    );
}

function DashboardSkeleton() {
    return (
        <div className="mt-6 space-y-8 max-w-[900px] mx-auto" aria-label="Loading dashboard…">
            <div className="glass-panel p-5 rounded-[1.5rem] flex items-center gap-4">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-10 flex-1 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 max-w-[750px] mx-auto">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="glass-panel p-4 sm:p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 h-[105px] sm:h-[150px]"
                    >
                        <SkeletonBox className="h-3 w-24" />
                        <SkeletonBox className="h-8 w-20" />
                        <SkeletonBox className="h-2 w-16" />
                    </div>
                ))}
            </div>

            <SkeletonBox className="h-12 w-full rounded-[1.5rem]" />

            <div className="space-y-4">
                <SkeletonBox className="h-4 w-40" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="glass-panel rounded-[1.5rem] p-5 flex gap-4 items-center">
                        <SkeletonBox className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2.5">
                            <SkeletonBox className="h-3 w-1/3" />
                            <SkeletonBox className="h-2 w-1/4" />
                        </div>
                        <SkeletonBox className="h-8 w-20 rounded-[1rem]" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { activeWedding, setActiveWedding } = useAppStore();
    const [weddings, setWeddings] = useState<any[]>([]);
    const selectedWeddingId = activeWedding?.id || '';
    const selectedWeddingNanoId = activeWedding?.nanoid || '';
    
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Name');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAmountRange, setSelectedAmountRange] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [filteredGuests, setFilteredGuests] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            if (weddings.length > 0) return;
            
            setLoading(true);
            try {
                // Use list-weddings Edge Function
                const response = await apiClient.get('list-weddings');
                const fetchedWeddings: any[] = response.data.data ?? [];
                setWeddings(fetchedWeddings);

                if (fetchedWeddings.length > 0 && !activeWedding) {
                    setActiveWedding(fetchedWeddings[0]);
                } else if (fetchedWeddings.length > 0 && activeWedding) {
                    const updated = fetchedWeddings.find(w => w.id === activeWedding.id);
                    if (updated) setActiveWedding(updated);
                }
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            loadDashboard();
        }
    }, [loading, weddings.length, activeWedding, setActiveWedding]);

    useEffect(() => {
        if (!selectedWeddingNanoId) return;

        const fetchGuests = async () => {
            setGuestsLoading(true);
            try {
                // Use get-guests Edge Function
                let url = `get-guests?wedding_id=${selectedWeddingId}`;
                const response = await apiClient.get(url);
                if (response.data.data) {
                    setGuests(response.data.data);
                    setFilteredGuests(response.data.data);
                }
            } catch (err) {
                console.error('Failed to load guests:', err);
            } finally {
                setGuestsLoading(false);
            }
        };

        fetchGuests();
    }, [selectedWeddingNanoId]);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        let result = [...guests];

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            if (activeFilter === 'Name') {
                result = result.filter(g =>
                    `${g.first_name} ${g.last_name || ''}`.toLowerCase().includes(query)
                );
            } else if (activeFilter === 'Location') {
                result = result.filter(g =>
                    (g.location || '').toLowerCase().includes(query) ||
                    (g.district || '').toLowerCase().includes(query)
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

        setFilteredGuests(result);
    }, [debouncedSearchQuery, activeFilter, selectedAmountRange, selectedPaymentMethod, guests]);

    const confirmGuest = async (guestId: string) => {
        try {
            // Use update-guest Edge Function
            await apiClient.post('update-guest', { guest_id: guestId, is_paid: true });
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, is_paid: true } : g));
        } catch (err) {
            console.error('Failed to confirm payment:', err);
            alert('Failed to confirm payment.');
        }
    };

    const deleteGuest = async (guestId: string) => {
        if (!window.confirm('Are you sure you want to cancel and remove this guest entry? This cannot be undone.')) return;
        try {
            // Use delete-guest Edge Function
            await apiClient.post('delete-guest', { guest_id: guestId });
            setGuests(prev => prev.filter(g => g.id !== guestId));
        } catch (err) {
            console.error('Failed to delete guest:', err);
            alert('Failed to remove guest entry.');
        }
    };

    const handleDownloadPDF = useCallback(async () => {
        const wedding = weddings.find(w => w.id === selectedWeddingId);
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
            console.error('PDF generation failed:', err);
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
                description={`Welcome back, ${user?.user_metadata?.first_name || 'Admin'}! View your recent wedding gift tracks here.`}
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

            {loading ? (
                <DashboardSkeleton />
            ) : weddings.length === 0 ? (
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
                                const selectedW = weddings.find(w => w.id === selectedWeddingId);
                                return (
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
                                                <span className="text-sm text-slate-400">Select an event record...</span>
                                            )}
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                );
                            })()}

                            {/* Dropdown Options */}
                            <div className="hidden absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[60] py-2 animate-fade-up duration-200">
                                {weddings.map(w => (
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
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 sm:gap-6 max-w-[850px] mx-auto z-10 relative">
                        {/* Total Collected */}
                        <div className="glass-panel p-5 sm:p-7 rounded-[2rem] flex flex-col items-center justify-center text-center gap-1.5 sm:h-[160px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute -left-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:rotate-12 transition-all duration-500">
                                <IndianRupee size={120} />
                            </div>
                            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] relative z-10">Validated Revenue</span>
                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent flex items-center justify-center gap-0.5 sm:gap-1 mt-1 relative z-10">
                                <IndianRupee size={24} className="text-slate-600 sm:w-8 sm:h-8"/>
                                {totalCollected.toLocaleString('en-IN')}
                            </h3>
                            <span className="text-[9px] sm:text-[10px] text-pink-400/80 font-bold mt-1 relative z-10">SECURE TRANSACTION LEDGER</span>
                        </div>

                        {/* Total Gifts */}
                        <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-5 sm:p-7 rounded-[2rem] shadow-[0_8px_30px_rgba(236,72,153,0.3)] border border-pink-400 flex flex-col items-center justify-center text-center gap-1.5 sm:h-[160px] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:-rotate-12 transition-all duration-500">
                                <Users size={140} />
                            </div>
                            <span className="text-white/80 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] relative z-10 text-shadow-sm">Verified Contributions</span>
                            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black flex items-center justify-center gap-1.5 sm:gap-2 relative z-10 drop-shadow-md mt-1 tracking-tighter">
                                {totalVerifiedGifts}
                            </h3>
                            <span className="text-[9px] sm:text-[10px] text-white/70 font-bold relative z-10 mt-1 uppercase text-shadow-sm">Confirmed Guest Entries</span>
                        </div>

                        {/* Total Registered */}
                        <div className="glass-panel p-5 sm:p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center gap-1 sm:h-[140px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all group relative">
                            <span className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Total Inventory</span>
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-700 mt-1 tracking-tight">
                                {guests.length}
                            </h3>
                            <span className="text-[9px] text-slate-400 font-bold mt-1">ALL PROTOCOL SUBMISSIONS</span>
                        </div>

                        {/* Pending Verifications */}
                        <div className="glass-panel p-5 sm:p-6 rounded-[1.5rem] border border-red-200 flex flex-col items-center justify-center text-center gap-1 sm:h-[140px] hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] hover:border-red-300 transition-all group relative bg-gradient-to-br from-white/60 to-red-50/30">
                            {pendingGifts > 0 && (
                                <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                            <span className="text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Action</span>
                            <h3 className="text-3xl sm:text-4xl font-black text-red-500 mt-1 drop-shadow-sm">
                                {pendingGifts}
                            </h3>
                            <span className="text-[9px] text-red-400/80 font-bold mt-1 uppercase">Verification Required</span>
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

                        {showFilters && (
                            <div className="glass-panel p-2 rounded-[1.5rem] animate-fade-up shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80">
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
                        )}
                    </div>

                    {/* ── Search Results / Table ── */}
                    <div className="space-y-6">
                        {isFilterActive && (
                            <div className="glass-panel p-6 rounded-[2rem] flex flex-wrap gap-8 items-center animate-fade-up">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Verified Target Gifts</span>
                                    <div className="text-4xl font-black text-slate-800 mt-1 tracking-tighter">
                                        {filteredVerifiedGiftsCount}
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-14 bg-slate-200/60"></div>
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Target Verified Amount</span>
                                    <div className="text-4xl font-black text-slate-800 flex items-center gap-1 mt-1 tracking-tighter">
                                        <IndianRupee size={28} className="text-slate-600" />
                                        {filteredVerifiedAmount.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        )}

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
