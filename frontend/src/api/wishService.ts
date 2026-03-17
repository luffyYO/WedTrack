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
     * Fetch all wishes for the authenticated user's weddings, newest first.
     */
    getWishes: () => client.get<{ data: Wish[] }>('/guests/wishes'),

    /**
     * Mark all unread wishes as read for the authenticated user.
     */
    markWishesRead: () => client.put('/guests/wishes/mark-read'),
};
