import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { generateGuestListPDF } from '@/utils/pdfGenerator';

/**
 * Encapsulates all guest mutation logic:
 *  - confirmGuest (verify payment + optimistic update)
 *  - deleteGuest  (remove entry + optimistic update)
 *  - handleDownloadPDF (filtered PDF export)
 */
export function useGuestMutations(
    selectedWeddingId: string,
    guests: any[],
    filteredGuests: any[],
    weddings: any[]
) {
    const queryClient = useQueryClient();
    const [pdfLoading, setPdfLoading] = useState(false);

    const confirmGuest = async (guestId: string) => {
        const originalGuest = guests.find(g => g.id === guestId);

        // Optimistically update immediately for instant UI feedback
        queryClient.setQueryData(
            ['guests', selectedWeddingId],
            (old: any[] = []) =>
                old.map(g => g.id === guestId ? { ...g, is_paid: true, payment_status: 'paid' } : g)
        );

        try {
            await apiClient.post('verify-guest', { guest_id: guestId });
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to verify guest:', err);
            // Revert on failure
            queryClient.setQueryData(
                ['guests', selectedWeddingId],
                (old: any[] = []) =>
                    old.map(g => g.id === guestId ? { ...g, ...originalGuest } : g)
            );
            alert('Failed to verify payment. Please try again.');
        }
    };

    const deleteGuest = async (guestId: string) => {
        if (!window.confirm('Are you sure you want to cancel and remove this guest entry? This cannot be undone.')) return;

        // Optimistically remove immediately
        queryClient.setQueryData(
            ['guests', selectedWeddingId],
            (old: any[] = []) => old.filter(g => g.id !== guestId)
        );

        try {
            await apiClient.post('delete-guest', { guest_id: guestId });
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to delete guest:', err);
            queryClient.invalidateQueries({ queryKey: ['guests', selectedWeddingId] });
            alert('Failed to remove guest entry.');
        }
    };

    const handleDownloadPDF = useCallback(async () => {
        const wedding = weddings.find((w: any) => w.id === selectedWeddingId);
        if (!wedding) return;

        const verifiedGuests = filteredGuests.filter((g: any) => g.is_paid);
        setPdfLoading(true);
        try {
            await generateGuestListPDF(verifiedGuests, {
                weddingName: `${wedding.bride_name} & ${wedding.groom_name}`,
                totalGifts: verifiedGuests.length,
                totalAmount: verifiedGuests.reduce((sum: number, g: any) => sum + Number(g.amount || 0), 0),
            });
        } catch (err) {
            if (import.meta.env.DEV) console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setPdfLoading(false);
        }
    }, [weddings, selectedWeddingId, filteredGuests]);

    return { confirmGuest, deleteGuest, handleDownloadPDF, pdfLoading };
}
