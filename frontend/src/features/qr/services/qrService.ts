import { supabase } from '@/config/supabaseClient';
import client from '@/api/client';
import type { QRData } from '../types/qr.types';

/**
 * Map a raw wedding DB row (or edge function response) to QRData.
 */
function mapToQRData(wedding: any): QRData {
    return {
        weddingId: wedding.nanoid || wedding.id,
        brideName: wedding.bride_name,
        groomName: wedding.groom_name,
        venue: wedding.location,
        village: wedding.village,
        date: wedding.wedding_date,
        qrImageUrl: wedding.qr_link,
        shareLink: wedding.qr_link,
        qrExpiresAt: wedding.qr_expires_at,
        qrActivationTime: wedding.qr_activation_time ?? wedding.wedding_date ?? null,
        qrStatus: wedding.qr_status,
    };
}

export const qrService = {
    /**
     * Fetch QR and wedding details for the authenticated QR page.
     * Fast path: direct Supabase query using nanoid column (authenticated user only).
     * Fallback: Edge Function get-wedding-details (handles all edge cases).
     */
    getByTrackId: async (trackId: string): Promise<{ data: QRData }> => {
        // Fast path — direct Supabase query using authenticated session
        // Filter by nanoid only (RLS will restrict to owner via user_id)
        const { data: wedding, error } = await supabase
            .from('weddings')
            .select('*')
            .eq('nanoid', trackId)
            .maybeSingle();

        if (!error && wedding) {
            return { data: mapToQRData(wedding) };
        }

        // Fallback — Edge Function (handles unauthed state, complex queries)
        const response = await client.get(`get-wedding-details?wedding_nanoid=${trackId}`);
        const raw = response.data?.data ?? response.data;
        return { data: mapToQRData(raw) };
    },

    /**
     * Extend the QR expiration by 24 hours.
     * Kept as Edge Function — has business logic for time calculation.
     */
    extend: (trackId: string) =>
        client.post<{ message: string; qr_expires_at: string }>('extend-wedding', {
            wedding_nanoid: trackId
        }),
};
