import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabaseClient';

/**
 * Subscribes ONCE to all guest changes and patches the TanStack Query cache
 * in real-time. Uses a ref to track the currently-selected wedding ID so we
 * avoid tearing down/rebuilding the channel when the user switches weddings.
 */
export function useRealtimeGuests(selectedWeddingId: string) {
    const queryClient = useQueryClient();
    const selectedWeddingIdRef = useRef(selectedWeddingId);

    // Keep the ref in sync without re-running the subscription effect
    useEffect(() => {
        selectedWeddingIdRef.current = selectedWeddingId;
    }, [selectedWeddingId]);

    useEffect(() => {
        // WHY unfiltered: server-side filter requires REPLICA IDENTITY FULL on the
        // guests table. Without it Supabase closes the channel → infinite loop.
        // Client-side filtering is equally fast and avoids the DB requirement.
        const channel = supabase
            .channel('dashboard-guests-stable')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'guests' },
                (payload) => {
                    const activeId = selectedWeddingIdRef.current;
                    if (!activeId) return;

                    const newRow = payload.new as any;
                    const oldRow = payload.old as any;

                    const rowWeddingId = newRow?.wedding_id ?? oldRow?.wedding_id;
                    if (rowWeddingId !== activeId) return;

                    if (payload.eventType === 'INSERT') {
                        queryClient.setQueryData(
                            ['guests', activeId],
                            (old: any[] = []) => [newRow, ...old]
                        );
                    } else if (payload.eventType === 'UPDATE') {
                        queryClient.setQueryData(
                            ['guests', activeId],
                            (old: any[] = []) =>
                                old.map((g) => (g.id === newRow.id ? { ...g, ...newRow } : g))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        queryClient.setQueryData(
                            ['guests', activeId],
                            (old: any[] = []) => old.filter((g) => g.id !== oldRow.id)
                        );
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] ✅ Connected to dashboard-guests-stable');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] ❌ Channel error:', err);
                } else if (status === 'TIMED_OUT') {
                    console.warn('[Realtime] ⏱ Timed out — data will still sync on next query refetch');
                } else if (status === 'CLOSED') {
                    console.warn('[Realtime] ⚠ Channel closed — check Supabase Realtime is enabled for the guests table');
                }
            });

        return () => { supabase.removeChannel(channel); };
        // queryClient is stable — this runs exactly ONCE on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient]);
}
