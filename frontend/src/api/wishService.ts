import client from './client';

export interface Wish {
    id: string;           // UUID from guests.id
    fullname: string;
    wishes: string;
    created_at: string;
}

export interface WishPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

export interface WishesResponse {
    wishes: Wish[];
    pagination: WishPagination;
}

export const wishService = {
    /**
     * Fetch paginated wishes from the Edge Function.
     * @param weddingNanoId - The wedding's nanoid
     * @param page          - Page number (1-indexed)
     * @param limit         - Items per page (max 100)
     */
    getWishes: (weddingNanoId: string, page = 1, limit = 50) => {
        return client.get<{ data: WishesResponse }>(
            `fetch-wishes?wedding_nanoid=${encodeURIComponent(weddingNanoId)}&page=${page}&limit=${limit}`
        );
    },
};
