import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { generateGuestListPDF } from '@/utils/pdfGenerator';

export type GuestActionError = {
    type: 'verify' | 'delete' | 'pdf';
    message: string;
};

/** ID of the guest entry currently being deleted, or null if none in flight. */
export type DeletingId = string | null;

/**
 * Encapsulates all guest mutation logic:
 *  - confirmGuest  (verify payment + optimistic update)
 *  - deleteGuest   (remove PENDING entry — waits for API success before removing from UI)
 *  - handleDownloadPDF (filtered PDF export)
 *
 * All user-facing errors are surfaced via the returned state,
 * NOT via window.confirm / alert.
 */
export function useGuestMutations(
    selectedWeddingId: string,
    guests: any[],
    filteredGuests: any[],
    weddings: any[]
) {
    const queryClient = useQueryClient();
    const [pdfLoading, setPdfLoading] = useState(false);

    // ── In-flight delete tracking (shows spinner on the correct row) ───────────
    const [deletingId, setDeletingId] = useState<DeletingId>(null);

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
    /**
     * Called when user clicks "Cancel" on a PENDING row.
     * Shows a loading state on that row while the API request is in flight.
     * Only removes the entry from the UI AFTER the API confirms success.
     * On failure, leaves the entry in place and shows an error toast.
     */
    const deleteGuest = async (guestId: string) => {
        if (deletingId) return; // prevent double-click while another is in flight

        setDeletingId(guestId);
        try {
            await apiClient.post('delete-guest', { guest_id: guestId });
            // Remove from cache only after confirmed server-side deletion
            queryClient.setQueryData(
                ['guests', selectedWeddingId],
                (old: any[] = []) => old.filter(g => g.id !== guestId)
            );
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to delete guest:', err);
            setActionError({ type: 'delete', message: 'Failed to remove guest entry. Please try again.' });
        } finally {
            setDeletingId(null);
        }
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
        deleteGuest,
        handleDownloadPDF,
        // State
        pdfLoading,
        deletingId,
        actionError,
        clearError,
    };
}
