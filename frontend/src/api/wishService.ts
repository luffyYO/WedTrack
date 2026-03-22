import client from './client';

export interface Wish {
    id: string;
    wedding_id: string;
    first_name: string;
    last_name: string | null;
    wishes: string;
    is_read: boolean;
    created_at: string;
}

export const wishService = {
    /**
     * Fetch wishes. Pass a weddingId to scope results to a single wedding,
     * or omit it to get all wishes across all user weddings.
     */
    getWishes: (weddingId?: string) => {
        const url = weddingId
            ? `/guests/wishes?weddingId=${encodeURIComponent(weddingId)}`
            : '/guests/wishes';
        return client.get<{ data: Wish[] }>(url);
    },

    /**
     * Mark all unread wishes as read for the authenticated user.
     */
    markWishesRead: () => client.put('/guests/wishes/mark-read'),
};
