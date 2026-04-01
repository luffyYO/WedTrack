import { useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { FilterType } from '@/components/SearchFilters';

interface FilterOptions {
    guests: any[];
    searchQuery: string;
    activeFilter: FilterType;
    selectedAmountRange: number | null;
    selectedPaymentMethod: string | null;
}

/**
 * Encapsulates all client-side guest filtering logic.
 * Returns `filteredGuests`, `filteredVerifiedAmount`, and `filteredVerifiedGiftsCount`.
 */
export function useGuestFilters({
    guests,
    searchQuery,
    activeFilter,
    selectedAmountRange,
    selectedPaymentMethod,
}: FilterOptions) {
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredGuests = useMemo(() => {
        let result = [...guests];

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            if (activeFilter === 'Name') {
                result = result.filter(g => (g.fullname || '').toLowerCase().includes(query));
            } else if (activeFilter === 'Location') {
                result = result.filter(g => (g.village || '').toLowerCase().includes(query));
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
                result = result.filter(g => (g.payment_type || '').toLowerCase().includes(query));
            }
        }

        if (activeFilter === 'Side' && selectedPaymentMethod) {
            result = result.filter(g =>
                (g.gift_side || '').toLowerCase() === selectedPaymentMethod.toLowerCase()
            );
        }

        return result;
    }, [guests, debouncedSearchQuery, activeFilter, selectedAmountRange, selectedPaymentMethod]);

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

    return { filteredGuests, filteredVerifiedGiftsCount, filteredVerifiedAmount };
}
