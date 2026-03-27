import { create } from 'zustand';
import { wishService, type Wish } from '@/api/wishService';
import { supabase } from '@/config/supabaseClient';

interface WishState {
    wishes: Wish[];
    /** Count of wishes not yet seen in the current session (client-side only) */
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    error: string | null;
}

interface WishActions {
    fetchWishes: (nanoid: string, page?: number) => Promise<void>;
    /** Resets unread count client-side — no server call needed */
    markAllRead: () => void;
    addWish: (wish: Wish) => void;
    subscribeToWishes: (weddingId: string) => () => void;
    reset: () => void;
}

export const useWishStore = create<WishState & WishActions>((set, get) => ({
    // ─── State ────────────────────────────────────────────────────────────────
    wishes: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: false,
    error: null,

    // ─── Actions ──────────────────────────────────────────────────────────────

    fetchWishes: async (nanoid: string, page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const res = await wishService.getWishes(nanoid, page);
            const { wishes, pagination } = res.data.data;

            set((state) => ({
                // On page 1 replace; subsequent pages append
                wishes: page === 1 ? wishes : [...state.wishes, ...wishes],
                // New wishes fetched on page 1 may be unseen
                unreadCount: page === 1 ? wishes.length : state.unreadCount + wishes.length,
                isLoading: false,
                hasMore: pagination.hasMore ?? (pagination.page < pagination.totalPages),
            }));
        } catch (err: any) {
            set({ isLoading: false, error: err?.message ?? 'Failed to load wishes' });
        }
    },

    /**
     * Mark all wishes as read in the current session.
     * This is purely client-side — the server tracks presence via is_read
     * on individual guest records when queried by the admin dashboard.
     */
    markAllRead: () => {
        set({ unreadCount: 0 });
    },

    addWish: (wish: Wish) => {
        const existing = get().wishes;
        // Deduplicate by id
        if (existing.some((w) => w.id === wish.id)) return;
        set((state) => ({
            wishes: [wish, ...state.wishes],
            unreadCount: state.unreadCount + 1,
        }));
    },

    /**
     * Supabase Realtime subscription for new guest submissions.
     * Listens on the `guests` table filtered by wedding_id.
     * Returns an unsubscribe callback for cleanup.
     */
    subscribeToWishes: (weddingId: string) => {
        const channel = supabase
            .channel(`guests:${weddingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'guests',
                    filter: `wedding_id=eq.${weddingId}`,
                },
                (payload: any) => {
                    const newGuest = payload.new;
                    // Only show in wishes feed if they left a message
                    if (newGuest.wishes && newGuest.wishes.trim()) {
                        const wish: Wish = {
                            id: newGuest.id,
                            first_name: newGuest.first_name,
                            last_name: newGuest.last_name ?? null,
                            wishes: newGuest.wishes,
                            created_at: newGuest.created_at,
                        };
                        get().addWish(wish);
                    }
                }
            )
            .subscribe((status) => {
                if (import.meta.env.DEV) {
                    console.log(`[wishStore] Realtime subscription status: ${status}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    reset: () => set({ wishes: [], unreadCount: 0, isLoading: false, hasMore: false, error: null }),
}));
