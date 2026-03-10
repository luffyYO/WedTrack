import { useState, useEffect, useCallback } from 'react';

/**
 * A hook that syncs a state value with localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch {
                console.warn(`useLocalStorage: Failed to set key "${key}"`);
            }
        },
        [key, storedValue]
    );

    const removeValue = useCallback(() => {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue] as const;
}

/**
 * A hook that tracks window dimensions and returns a boolean for mobile.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [query]);

    return matches;
}
