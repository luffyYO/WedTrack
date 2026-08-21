import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabaseClient';

/**
 * Subscribes ONCE to all guest changes and patches the TanStack Query cache
 * in real-time. Uses a ref to track the currently-selected wedding ID so we
 * avoid tearing down/rebuilding the channel when the user switches weddings.
 *
 * Includes a failure guard: if the channel errors or times out more than
 * MAX_FAILURES times in a row (indicating a persistent auth/key issue),
 * we stop retrying and allow the dashboard to fall back to polling.
 */

const MAX_FAILURES = 3;

export function useRealtimeGuests(selectedWeddingId: string) {
    const queryClient = useQueryClient();
    const selectedWeddingIdRef = useRef(selectedWeddingId);
    const failureCountRef = useRef(0);

    // Keep the ref in sync without re-running the subscription effect
    useEffect(() => {
        selectedWeddingIdRef.current = selectedWeddingId;
    }, [selectedWeddingId]);

    useEffect(() => {
        if (!selectedWeddingId) return;

        let isUnmounted = false;

        // Channel is scoped to the active wedding ID with a server-side filter.
        // REPLICA IDENTITY FULL is enabled on the guests table so Supabase can filter
        // UPDATE and DELETE events accurately.
        const channel = supabase
            .channel(`dashboard-guests-${selectedWeddingId}`)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'guests',
                    filter: `wedding_id=eq.${selectedWeddingId}`
                },
                (payload) => {
                    const newRow = payload.new as any;
                    const oldRow = payload.old as any;

                    if (payload.eventType === 'INSERT') {
                        queryClient.setQueryData(
                            ['guests', selectedWeddingId],
                            (old: any[] = []) => [newRow, ...old]
                        );
                    } else if (payload.eventType === 'UPDATE') {
                        queryClient.setQueryData(
                            ['guests', selectedWeddingId],
                            (old: any[] = []) =>
                                old.map((g) => (g.id === newRow.id ? { ...g, ...newRow } : g))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        queryClient.setQueryData(
                            ['guests', selectedWeddingId],
                            (old: any[] = []) => old.filter((g) => g.id !== oldRow.id)
                        );
                    }
                }
            )
            .subscribe((status, err) => {
                if (isUnmounted) return;

                if (status === 'SUBSCRIBED') {
                    failureCountRef.current = 0;
                    console.log('[Realtime] ✅ Connected to dashboard-guests-stable');
                } else if (status === 'CHANNEL_ERROR') {
                    failureCountRef.current += 1;
                    if (failureCountRef.current <= MAX_FAILURES) {
                        console.warn(`[Realtime] ❌ Channel error (attempt ${failureCountRef.current}/${MAX_FAILURES})`, err ?? '');
                    } else if (failureCountRef.current === MAX_FAILURES + 1) {
                        // Only log once after the cap to avoid log spam
                        console.error(
                            '[Realtime] Persistent connection failure — Realtime disabled for this session. ' +
                            'Dashboard data will still sync on each manual refresh. ' +
                            'Likely cause: malformed VITE_SUPABASE_ANON_KEY in hosting env vars (check for trailing newline).'
                        );
                        // Remove channel to stop the reconnect loop from Supabase internals
                        supabase.removeChannel(channel);
                    }
                } else if (status === 'TIMED_OUT') {
                    failureCountRef.current += 1;
                    console.warn('[Realtime] ⏱ Timed out — data will still sync on next query refetch');
                } else if (status === 'CLOSED') {
                    if (!isUnmounted) {
                        console.info('[Realtime] Channel closed');
                    }
                }
            });

        return () => {
            isUnmounted = true;
            supabase.removeChannel(channel);
        };
    }, [selectedWeddingId, queryClient]);
}
