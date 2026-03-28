import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    activeWedding: any | null;
    setActiveWedding: (wedding: any | null) => void;
    clearActiveWedding: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            activeWedding: null,
            setActiveWedding: (wedding) => set({ activeWedding: wedding }),
            clearActiveWedding: () => set({ activeWedding: null }),
        }),
        {
            name: 'app-storage',
        }
    )
);
