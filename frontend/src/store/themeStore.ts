import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Contrast = 'normal' | 'high';

interface ThemeState {
    theme: Theme;
    contrast: Contrast;
    // Derived convenience
    isDarkMode: boolean;
    isHighContrast: boolean;
    // Actions
    setTheme: (theme: Theme) => void;
    setContrast: (contrast: Contrast) => void;
    toggleDarkMode: () => void;
    toggleHighContrast: () => void;
    /** Call once on app boot to sync persisted values → DOM */
    applyToDOM: () => void;
}

function applyClasses(theme: Theme, contrast: Contrast) {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('high-contrast', contrast === 'high');
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            contrast: 'normal',
            isDarkMode: false,
            isHighContrast: false,

            setTheme: (theme) => {
                applyClasses(theme, get().contrast);
                set({ theme, isDarkMode: theme === 'dark' });
            },

            setContrast: (contrast) => {
                applyClasses(get().theme, contrast);
                set({ contrast, isHighContrast: contrast === 'high' });
            },

            toggleDarkMode: () => {
                const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
                applyClasses(next, get().contrast);
                set({ theme: next, isDarkMode: next === 'dark' });
            },

            toggleHighContrast: () => {
                const next: Contrast = get().contrast === 'high' ? 'normal' : 'high';
                applyClasses(get().theme, next);
                set({ contrast: next, isHighContrast: next === 'high' });
            },

            applyToDOM: () => {
                const { theme, contrast } = get();
                applyClasses(theme, contrast);
            },
        }),
        {
            name: 'theme-storage',
            // Re-derive isDarkMode / isHighContrast from persisted theme/contrast on rehydration
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isDarkMode = state.theme === 'dark';
                    state.isHighContrast = state.contrast === 'high';
                    applyClasses(state.theme, state.contrast);
                }
            },
        }
    )
);
