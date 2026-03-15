import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, IndianRupee, Download } from 'lucide-react';
import { generateGuestListPDF } from '@/utils/pdfGenerator';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store';
import SearchBar from '@/components/SearchBar';
import SearchFilters, { FilterType } from '@/components/SearchFilters';
import SearchResults from '@/components/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [weddings, setWeddings] = useState<any[]>([]);
    const [selectedWedding, setSelectedWedding] = useState<string>('');
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Name');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAmountRange, setSelectedAmountRange] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [filteredGuests, setFilteredGuests] = useState<any[]>([]);

    // Fetch Admin's Weddings
    useEffect(() => {
        const fetchWeddings = async () => {
            try {
                const { data } = await apiClient.get('/weddings');
                if (data.data) {
                    setWeddings(data.data);
                    if (data.data.length > 0) {
                        setSelectedWedding(data.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load weddings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeddings();
    }, []);

    // Fetch Guests when a Wedding is selected or Side filter changes
    useEffect(() => {
        const fetchGuests = async () => {
            if (!selectedWedding) return;
            try {
                let url = `/guests/wedding/${selectedWedding}`;
                if (activeFilter === 'Side' && selectedPaymentMethod) {
                    url += `?side=${selectedPaymentMethod.toLowerCase()}`;
                }
                
                const { data } = await apiClient.get(url);
                if (data.data) {
                    setGuests(data.data);
                    setFilteredGuests(data.data);
                }
            } catch (err) {
                console.error("Failed to load guests:", err);
            }
        };
        fetchGuests();
    }, [selectedWedding, activeFilter, selectedPaymentMethod]);

    // Debounce search query to prevent excessive filtering
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Filtering Logic
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
                    (g.village || '').toLowerCase().includes(query) || 
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

        // Local side filtering removed as it's now handled by the API

        setFilteredGuests(result);
    }, [debouncedSearchQuery, activeFilter, selectedAmountRange, selectedPaymentMethod, guests]);

    const confirmGuest = async (guestId: string) => {
        try {
            await apiClient.put(`/guests/${guestId}/confirm`);
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, is_paid: true } : g));
        } catch (err) {
            console.error("Failed to confirm payment:", err);
            alert("Failed to confirm payment.");
        }
    };

    const deleteGuest = async (guestId: string) => {
        if (!window.confirm("Are you sure you want to cancel and remove this guest entry? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/guests/${guestId}`);
            setGuests(prev => prev.filter(g => g.id !== guestId));
        } catch (err) {
            console.error("Failed to delete guest:", err);
            alert("Failed to remove guest entry.");
        }
    };

    const handleDownloadPDF = () => {
        const wedding = weddings.find(w => w.id === selectedWedding);
        if (!wedding) return;

        const summary = {
            weddingName: `${wedding.bride_name} & ${wedding.groom_name}`,
            totalGifts: totalVerifiedGifts,
            totalAmount: totalCollected
        };

        generateGuestListPDF(filteredGuests, summary);
    };

    // Calculate reliable totals by only summing VERIFIED paid amounts
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

    // Filtered Summary Logic
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
        <div className="w-full pb-10">
            <PageHeader
                title="Dashboard"
                description={`Welcome back, ${user?.user_metadata?.first_name || 'Admin'}! View your recent wedding gift tracks here.`}
                action={
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <Button
                            size="sm"
                            fullWidth
                            icon={<Plus size={15} />}
                            onClick={() => navigate('/wedding-track/new')}
                        >
                            Create Wedding Track
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <div className="w-full flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : weddings.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center min-h-[300px] gap-4 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6">
                    <Users size={28} className="text-neutral-300" />
                    <p className="text-body-sm text-[var(--color-text-muted)]">
                        No weddings tracked yet. Start tracking gifts by creating a new wedding.
                    </p>
                    <Button onClick={() => navigate('/wedding-track/new')}>Create New Wedding Track</Button>
                </div>
            ) : (
                <div className="mt-6 space-y-8 max-w-[900px] mx-auto">
                    {/* Wedding Selector */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">Displaying data for:</span>
                        <select 
                            value={selectedWedding} 
                            onChange={(e) => setSelectedWedding(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 outline-none"
                        >
                            {weddings.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.bride_name} & {w.groom_name} ({w.location})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stats Overview - Balanced 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-4 max-w-[700px] mx-auto">
                        {/* Total Collected */}
                        <div className="bg-white p-4 sm:p-4.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-1 h-[105px] sm:h-[140px]">
                            <span className="text-gray-400 text-sm sm:text-base font-bold uppercase tracking-wide">Total Collected</span>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 flex items-center gap-0.5 sm:gap-1">
                                <IndianRupee size={16} className="text-primary-500 sm:w-6 sm:h-6"/>
                                {totalCollected.toLocaleString('en-IN')}
                            </h3>
                            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Verified Payments</span>
                        </div>

                        {/* Total Gifts */}
                        <div className="bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] p-4 sm:p-4.5 rounded-2xl shadow-md border-none flex flex-col items-center justify-center text-center gap-1 h-[105px] sm:h-[140px] text-white">
                            <span className="text-white/80 text-sm sm:text-base font-bold uppercase tracking-wide">Verified Gifts</span>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black flex items-center gap-1.5 sm:gap-2">
                                <Users size={16} className="text-white/80 sm:w-6 sm:h-6"/>
                                {totalVerifiedGifts}
                            </h3>
                            <span className="text-[10px] sm:text-xs text-white/60 font-medium">Verified Guests</span>
                        </div>

                        {/* Total Registered (New 4th Card for Balance) */}
                        <div className="bg-white p-4 sm:p-4.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-1 h-[105px] sm:h-[140px]">
                            <span className="text-gray-400 text-sm sm:text-base font-bold uppercase tracking-wide">Total Registered</span>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                                {guests.length}
                            </h3>
                            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">All Submissions</span>
                        </div>

                        {/* Pending Verifications */}
                        <div className="bg-white p-4 sm:p-4.5 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center gap-1 h-[105px] sm:h-[140px]">
                            <span className="text-orange-500 text-sm sm:text-base font-bold uppercase tracking-wide">Pending</span>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-orange-600">
                                {pendingGifts}
                            </h3>
                            <span className="text-[10px] sm:text-xs text-orange-400 font-medium">Awaiting Confirmation</span>
                        </div>
                    </div>

                    {/* Search & Filtering System */}
                    <div className="space-y-4">
                        <SearchBar 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSearch={(q) => setSearchQuery(q)}
                            onSearchClick={() => {
                                // Search button now only performs search/closes filters if open (optional)
                                // or just does nothing as searchQuery is already bound to input
                                // Keeping it explicit for potential future API triggers
                                console.log("Searching for:", searchQuery);
                            }}
                            onFilterToggle={() => setShowFilters(!showFilters)}
                            isFilterOpen={showFilters}
                            placeholder={
                                activeFilter === 'Name' ? "Search guest name (e.g. Ravi)..." :
                                activeFilter === 'Location' ? "Search village or district..." :
                                activeFilter === 'Payment Method' ? "Search payment method (e.g. PhonePe)..." :
                                "Filtering entries by amount..."
                            }
                        />
                        
                        {showFilters && (
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
                        )}
                    </div>

                    {/* Search Results / Full Table */}
                    <div className="space-y-6">
                        {isFilterActive && (
                            <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl flex flex-wrap gap-6 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <span className="text-primary-700 text-xs font-bold uppercase tracking-wider">Verified Gifts</span>
                                    <div className="text-2xl font-black text-primary-900 leading-tight">
                                        {filteredVerifiedGiftsCount}
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-primary-200"></div>
                                <div>
                                    <span className="text-primary-700 text-xs font-bold uppercase tracking-wider">Total Verified Amount</span>
                                    <div className="text-2xl font-black text-primary-900 leading-tight flex items-center gap-1">
                                        <IndianRupee size={20} className="text-primary-600" />
                                        {filteredVerifiedAmount.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                                {searchQuery || (activeFilter === 'Amount' && selectedAmountRange) ? 'Search Results' : 'Recent Guest Entries'}
                                <span className="ml-2 text-sm font-normal text-gray-400">({filteredGuests.length})</span>
                            </h3>

                            <button
                                onClick={handleDownloadPDF}
                                disabled={filteredGuests.length === 0}
                                title="Download Guest List"
                                className="p-2 rounded-lg border border-gray-100 bg-white text-gray-600 hover:text-primary-600 hover:border-primary-100 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                            >
                                <Download size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {guests.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                                No guests have registered yet.
                            </div>
                        ) : (
                            <SearchResults 
                                results={filteredGuests}
                                onConfirm={confirmGuest}
                                onDelete={deleteGuest}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
