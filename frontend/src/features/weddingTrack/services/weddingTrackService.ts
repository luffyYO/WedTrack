import client from '@/api/client';
import type { CreateWeddingTrackPayload, CreateWeddingTrackResponse } from '../types/weddingTrack.types';

/**
 * Service layer for Wedding Track API calls.
 * All endpoints now map to Supabase Edge Functions.
 */
export const weddingTrackService = {
    /**
     * Create a new wedding track.
     * Edge Function: create-wedding
     */
    create: (data: CreateWeddingTrackPayload) => {
        console.log("SENDING WEDDING CREATION PAYLOAD:", data);
        return client.post<CreateWeddingTrackResponse>('create-wedding', data);
    },

    /**
     * Fetch all wedding tracks for the authenticated user.
     * Edge Function: list-weddings
     */
    getAll: () =>
        client.get('list-weddings'),

    /**
     * Fetch a single wedding track by its NanoID (for public/guest use).
     * Edge Function: get-wedding-details
     */
    getByNanoId: (nanoId: string) =>
        client.get(`get-wedding-details?wedding_nanoid=${nanoId}`),

    /**
     * Delete a wedding track.
     * Edge Function: delete-wedding
     */
    delete: (id: string) =>
        client.post('delete-wedding', { wedding_id: id }),
};
