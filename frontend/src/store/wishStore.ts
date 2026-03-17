import { create } from 'zustand';
import { wishService, type Wish } from '@/api/wishService';

interface WishState {
    wishes: Wish[];
    unreadCount: number;
    isLoading: boolean;
}

interface WishActions {
    fetchWishes: () => Promise<void>;
    markAllRead: () => Promise<void>;
    addWish: (wish: Wish) => void;
    reset: () => void;
}

export const useWishStore = create<WishState & WishActions>((set, get) => ({
    // State
    wishes: [],
    unreadCount: 0,
    isLoading: false,

    // Actions
    fetchWishes: async () => {
        set({ isLoading: true });
        try {
            const res = await wishService.getWishes();
            const wishes = res.data.data ?? [];
            set({
                wishes,
                unreadCount: wishes.filter((w) => !w.is_read).length,
                isLoading: false,
            });
        } catch {
            set({ isLoading: false });
        }
    },

    markAllRead: async () => {
        // Optimistically update UI first
        set((state) => ({
            wishes: state.wishes.map((w) => ({ ...w, is_read: true })),
            unreadCount: 0,
        }));
        try {
            await wishService.markWishesRead();
        } catch {
            // Silently fail — next fetchWishes will restore correct state
        }
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

    reset: () => set({ wishes: [], unreadCount: 0, isLoading: false }),
}));
