import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, IndianRupee, Download, LayoutDashboard, Link2, Copy, Check } from 'lucide-react';
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
    const [linkCopied, setLinkCopied] = useState(false);

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

        // Side filter — Bride Side / Groom Side
        if (activeFilter === 'Side' && selectedPaymentMethod) {
            result = result.filter(g =>
                (g.gift_side || '').toLowerCase() === selectedPaymentMethod.toLowerCase()
            );
        }

        return result;
    }, [guests, debouncedSearchQuery, activeFilter, selectedAmountRange, selectedPaymentMethod]);

    // ── Mutations ──────────────────────────────────────────────
    const confirmGuest = async (guestId: string) => {
        // Optimistically update cache INSTANTLY
        queryClient.setQueryData(
            ['guests', selectedWeddingId],
            (old: any[] = []) =>
                old.map(g => g.id === guestId ? { ...g, is_paid: true, payment_status: 'paid' } : g)
        );

        try {
            await apiClient.post('update-guest', { 
                guest_id: guestId, 
                is_paid: true,
                payment_status: 'paid' 
            });

            // Trigger WhatsApp notification asynchronously
            apiClient.post('send-whatsapp', { guest_id: guestId })
                .catch(err => console.error('WhatsApp trigger failed:', err));

        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to confirm payment:', err);
            queryClient.invalidateQueries({ queryKey: ['guests', selectedWeddingId] }); // Revert on fail
            alert('Failed to confirm payment.');
        }
    };

    const deleteGuest = async (guestId: string) => {
        if (!window.confirm('Are you sure you want to cancel and remove this guest entry? This cannot be undone.')) return;
        
        // Optimistically remove from cache INSTANTLY
        queryClient.setQueryData(
            ['guests', selectedWeddingId],
            (old: any[] = []) => old.filter(g => g.id !== guestId)
        );

        try {
            await apiClient.post('delete-guest', { guest_id: guestId });
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to delete guest:', err);
            queryClient.invalidateQueries({ queryKey: ['guests', selectedWeddingId] }); // Revert on fail
            alert('Failed to remove guest entry.');
        }
    };

    const handleDownloadPDF = useCallback(async () => {
        const wedding = weddings.find((w: any) => w.id === selectedWeddingId);
        if (!wedding) return;

        const verifiedGuests = filteredGuests.filter((g: any) => g.is_paid);

        setPdfLoading(true);
        try {
            const summary = {
                weddingName: `${wedding.bride_name} & ${wedding.groom_name}`,
                totalGifts: verifiedGuests.length,
                totalAmount: verifiedGuests.reduce((sum, g) => sum + Number(g.amount || 0), 0),
            };
            await generateGuestListPDF(verifiedGuests, summary);
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




    // Always compute from filteredGuests — no isFilterActive guard so mobile always sees the correct values
    const { filteredVerifiedGiftsCount, filteredVerifiedAmount } = useMemo(() => {
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
    }, [filteredGuests]);

    return (
        <div className="w-full pb-10">
            <div className="px-4 sm:px-6">
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
            </div>

            {/* ── Invite Link Banner ── */}
            {activeWedding?.nanoid && (() => {
                const inviteUrl = `${window.location.origin}/guest-form/${activeWedding.nanoid}`;
                const handleCopy = () => {
                    navigator.clipboard.writeText(inviteUrl).then(() => {
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                    });
                };
                const handleWhatsApp = () => {
                    const weddingName = activeWedding?.bride_name && activeWedding?.groom_name
                        ? `${activeWedding.bride_name} & ${activeWedding.groom_name}'s`
                        : 'Our';
                    const msg = `💍 ${weddingName} Wedding

You're invited! Please register your gift/contribution using this link:
${inviteUrl}

Powered by WedTrack 🌸`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                };
                return (
                    <div
                        style={{
                            margin: '12px 0 0',
                            background: '#ffffff',
                            borderRadius: '1.1rem',
                            boxShadow: '0 2px 16px -4px rgba(25,28,30,0.07)',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Icon + Label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <div style={{
                                background: '#fce7f3',
                                borderRadius: '8px',
                                padding: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Link2 size={13} style={{ color: '#be185d' }} />
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#87717a',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                            }}>Guest Link</span>
                        </div>

                        {/* URL pill */}
                        <div style={{
                            flex: 1,
                            minWidth: 0,
                            background: '#f7f9fb',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#544249',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: 'monospace',
                            letterSpacing: '0.01em',
                        }}>
                            {inviteUrl}
                        </div>

                        {/* Copy button */}
                        <button
                            onClick={handleCopy}
                            title="Copy invite link"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(218,192,201,0.4)',
                                background: linkCopied ? '#f0fdf4' : '#ffffff',
                                color: linkCopied ? '#15803d' : '#544249',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                            }}
                        >
                            {linkCopied
                                ? <><Check size={12} /><span>Copied!</span></>
                                : <><Copy size={12} /><span className="hidden sm:inline">Copy</span></>}
                        </button>

                        {/* WhatsApp share */}
                        <button
                            onClick={handleWhatsApp}
                            title="Share on WhatsApp"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#25D366',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                );
            })()}

        {weddings.length === 0 && !loading ? (
            <div className="mt-8 mx-4 sm:mx-6 flex flex-col items-center justify-center min-h-[300px] gap-4 text-center glass-panel rounded-[2.5rem] border border-dashed border-slate-300 p-10">
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
                <div className="mt-8 space-y-8">
                    {/* ── Wedding Selector ── */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center glass-panel p-5 rounded-[1.5rem] relative z-30 group mx-4 sm:mx-6">
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
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[850px] mx-auto z-10 relative px-4 sm:px-6">
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

                    {/* ── Search Results / Table — Full Width ── */}
                    <div className="space-y-4 w-full">
                        {/* ── Summary Bar (Ethereal Union design) ── */}
                        <div className="px-4 sm:px-6">
                            {/* Outer card: white surface lifted from page bg */}
                            <div
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '1.25rem',
                                    boxShadow: '0 4px 24px -4px rgba(25,28,30,0.06)',
                                    padding: '14px 16px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                }}
                            >
                                {/* Row 1: Section heading + count badge + download */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <span style={{
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            color: '#191c1e',
                                            letterSpacing: '-0.01em',
                                            lineHeight: 1.3,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {searchQuery || (activeFilter === 'Amount' && selectedAmountRange) ? 'Active Results'
                                                : activeFilter === 'Side' && selectedPaymentMethod ? `${selectedPaymentMethod === 'bride' ? 'Bride' : 'Groom'} Side`
                                                : 'Recent Submissions'}
                                        </span>
                                        {/* Count pill */}
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            background: '#f2f4f6',
                                            color: '#544249',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '9999px',
                                            letterSpacing: '0.02em',
                                            flexShrink: 0,
                                        }}>
                                            {filteredGuests.length}
                                        </span>
                                    </div>

                                    {/* Download button */}
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={filteredGuests.length === 0 || pdfLoading}
                                        title={pdfLoading ? 'Generating PDF…' : 'Export verified guest PDF'}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '6px 10px',
                                            borderRadius: '0.75rem',
                                            border: '1px solid rgba(218,192,201,0.35)',
                                            background: '#ffffff',
                                            color: '#544249',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            opacity: (filteredGuests.length === 0 || pdfLoading) ? 0.4 : 1,
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {pdfLoading
                                            ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
                                            : <Download size={13} />}
                                        <span className="hidden sm:inline">Export PDF</span>
                                    </button>
                                </div>

                                {/* Tonal separator — background shift instead of border line */}
                                <div style={{ height: '1px', background: '#f2f4f6', margin: '0 -2px' }} />

                                {/* Row 2: Verified amount — always visible */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        color: '#87717a',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        flexShrink: 0,
                                    }}>Verified</span>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1px',
                                        fontWeight: 800,
                                        color: '#191c1e',
                                        fontSize: '15px',
                                        letterSpacing: '-0.02em',
                                        flex: 1,
                                    }}>
                                        <IndianRupee size={13} style={{ color: '#544249', flexShrink: 0 }} />
                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {filteredVerifiedAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {/* Emerald verified count pill */}
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        background: '#6ffbbe',
                                        color: '#002113',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: '9999px',
                                        flexShrink: 0,
                                        letterSpacing: '0.02em',
                                    }}>
                                        {filteredVerifiedGiftsCount}
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5l2 2 4-4" stroke="#002113" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>

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
