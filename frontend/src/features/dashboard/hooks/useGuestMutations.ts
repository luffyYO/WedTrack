import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { generateGuestListPDF } from '@/utils/pdfGenerator';

export type GuestActionError = {
    type: 'verify' | 'delete' | 'pdf';
    message: string;
};

/**
 * Encapsulates all guest mutation logic:
 *  - confirmGuest  (verify payment + optimistic update)
 *  - deleteGuest   (remove entry + optimistic update)
 *  - handleDownloadPDF (filtered PDF export)
 *
 * All user-facing confirmations and errors are surfaced via the
 * returned state, NOT via window.confirm / alert.
 */
export function useGuestMutations(
    selectedWeddingId: string,
    guests: any[],
    filteredGuests: any[],
    weddings: any[]
) {
    const queryClient = useQueryClient();
    const [pdfLoading, setPdfLoading] = useState(false);

    // ── Delete confirm dialog state ────────────────────────────────────────────
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        guestId: string | null;
    }>({ isOpen: false, guestId: null });

    // ── Error toast state ──────────────────────────────────────────────────────
    const [actionError, setActionError] = useState<GuestActionError | null>(null);

    const clearError = () => setActionError(null);

    // ── Confirm (Mark as Paid) ─────────────────────────────────────────────────
    const confirmGuest = async (guestId: string) => {
        const originalGuest = guests.find(g => g.id === guestId);

        // Optimistic update — instant UI feedback
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
            setActionError({ type: 'verify', message: 'Failed to verify payment. Please try again.' });
        }
    };

    // ── Delete (Cancel guest) ──────────────────────────────────────────────────
    /** Called when user clicks the "Cancel" button — opens the confirm dialog */
    const requestDeleteGuest = (guestId: string) => {
        setDeleteConfirm({ isOpen: true, guestId });
    };

    /** Called when user confirms deletion in the dialog */
    const executeDeleteGuest = async () => {
        const guestId = deleteConfirm.guestId;
        setDeleteConfirm({ isOpen: false, guestId: null });
        if (!guestId) return;

        // Optimistic remove — instant UI feedback
        queryClient.setQueryData(
            ['guests', selectedWeddingId],
            (old: any[] = []) => old.filter(g => g.id !== guestId)
        );

        try {
            await apiClient.post('delete-guest', { guest_id: guestId });
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to delete guest:', err);
            queryClient.invalidateQueries({ queryKey: ['guests', selectedWeddingId] });
            setActionError({ type: 'delete', message: 'Failed to remove guest entry. Please try again.' });
        }
    };

    /** Called when user cancels the delete dialog */
    const cancelDeleteGuest = () => {
        setDeleteConfirm({ isOpen: false, guestId: null });
    };

    // ── PDF Download ───────────────────────────────────────────────────────────
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
            setActionError({ type: 'pdf', message: 'Failed to generate PDF. Please try again.' });
        } finally {
            setPdfLoading(false);
        }
    }, [weddings, selectedWeddingId, filteredGuests]);

    return {
        // Mutation actions
        confirmGuest,
        requestDeleteGuest,
        executeDeleteGuest,
        cancelDeleteGuest,
        handleDownloadPDF,
        // State
        pdfLoading,
        deleteConfirm,
        actionError,
        clearError,
    };
}
