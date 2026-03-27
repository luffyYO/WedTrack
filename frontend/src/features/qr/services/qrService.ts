import client from '@/api/client';
import type { QRData } from '../types/qr.types';

export const qrService = {
    /**
     * Fetch the QR code and wedding details for a given track ID.
     * GET /api/wedding/:trackId/qr
     */
    getByTrackId: async (trackId: string): Promise<{ data: QRData }> => {
        const { data } = await client.get<any>(`/get-wedding-details?wedding_nanoid=${trackId}`);
        // Map backend snake_case to frontend camelCase
        const wedding = data.data || data;
        return {
            data: {
                weddingId: wedding.nanoid || wedding.id,
                brideName: wedding.bride_name,
                groomName: wedding.groom_name,
                venue: wedding.location,
                village: wedding.village,
                date: wedding.wedding_date,
                qrImageUrl: wedding.qr_link,
                shareLink: wedding.qr_link,
                qrExpiresAt: wedding.qr_expires_at,
                qrActivationTime: wedding.qr_activation_time,
                qrStatus: wedding.qr_status,
            }
        };
    },
    /**
     * Extend the QR expiration by 24 hours.
     * POST /api/weddings/:trackId/extend
     */
    extend: (trackId: string) =>
        client.post<{ message: string; qrExpiresAt: string }>(`/weddings/${trackId}/extend`),
};
