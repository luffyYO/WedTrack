/**
 * Safely parse a date string in ISO, MM/DD/YYYY, or DD/MM/YYYY formats.
 */
export function parseSafeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try native parsing first (works for ISO and sometimes others depending on env)
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Manual parsing for MM/DD/YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[/\\-]/);
    if (parts.length === 3) {
        let day, month, year;

        // Case: YYYY-MM-DD
        if (parts[0].length === 4) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            day = parseInt(parts[2]);
        } 
        // Case: MM/DD/YYYY or DD/MM/YYYY
        else if (parts[2].length === 4) {
            year = parseInt(parts[2]);
            const p1 = parseInt(parts[0]);
            const p2 = parseInt(parts[1]);

            if (p1 > 12) {
                // Definitely DD/MM/YYYY
                day = p1;
                month = p2 - 1;
            } else if (p2 > 12) {
                // Definitely MM/DD/YYYY
                month = p1 - 1;
                day = p2;
            } else {
                // Ambiguous. Default to MM/DD/YYYY as it was the previous legacy standard.
                month = p1 - 1;
                day = p2;
            }
        }

        if (year && month !== undefined && day) {
            date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return null;
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
    const date = parseSafeDate(dateStr);
    
    if (!date) {
        return dateStr ? 'Invalid date' : '—';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    return new Intl.DateTimeFormat('en-IN', options || defaultOptions).format(date);
}

/**
 * Format an amount as Indian Rupees.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
}

/**
 * Returns initials from a full name (e.g., "John Doe" → "JD").
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Returns a relative time string (e.g., "2 hours ago").
 */
export function timeAgo(dateStr: string): string {
    const now = Date.now();
    const dateObj = parseSafeDate(dateStr);
    
    if (!dateObj) return formatDate(dateStr);
    
    const date = dateObj.getTime();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(dateStr);
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
