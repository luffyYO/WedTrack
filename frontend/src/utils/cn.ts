import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names safely, resolving conflicts.
 * Use this for all conditional/dynamic className composition.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
