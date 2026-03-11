import client from '@/api/client';
import type { QRData } from '../types/qr.types';

export const qrService = {
    /**
     * Fetch the QR code and wedding details for a given track ID.
     * GET /api/wedding/:trackId/qr
     */
    getByTrackId: (trackId: string) =>
        client.get<QRData>(`/weddings/${trackId}/qr`),
};
