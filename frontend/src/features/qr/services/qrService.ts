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
     * Fast path: direct Supabase client (select * avoids 400 from missing column enums).
     * Fallback: Edge Function get-wedding-details (always works).
     */
    getByTrackId: async (trackId: string): Promise<{ data: QRData }> => {
        // Fast path — direct Supabase query (select * is safe with RLS)
        const { data: wedding, error } = await supabase
            .from('weddings')
            .select('*')
            .or(`nanoid.eq.${trackId},id.eq.${trackId}`)
            .maybeSingle();

        if (!error && wedding) {
            return { data: mapToQRData(wedding) };
        }

        // Fallback — Edge Function (handles auth, complex queries)
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
