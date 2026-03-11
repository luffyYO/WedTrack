import client from '@/api/client';
import type { CreateWeddingTrackPayload, CreateWeddingTrackResponse, WeddingTrack } from '../types/weddingTrack.types';

/**
 * Service layer for Wedding Track API calls.
 * All endpoints map to REST /api/weddings on the backend.
 */
export const weddingTrackService = {
    /**
     * Create a new wedding track and receive a QR code.
     * POST /api/weddings
     */
    create: (data: CreateWeddingTrackPayload) =>
        client.post<CreateWeddingTrackResponse>('/weddings', data),

    /**
     * Fetch a single wedding track by its ID.
     * GET /api/weddings/:id
     */
    getById: (id: string) =>
        client.get<WeddingTrack>(`/weddings/${id}`),

    /**
     * Fetch all wedding tracks for the authenticated user.
     * GET /api/weddings
     */
    getAll: () =>
        client.get<WeddingTrack[]>('/weddings'),

    /**
     * Delete a wedding track.
     * DELETE /api/weddings/:id
     */
    delete: (id: string) =>
        client.delete(`/weddings/${id}`),
};
