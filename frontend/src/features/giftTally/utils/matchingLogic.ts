export interface NewGiftEntry {
    id: string;
    person_name: string;
    father_name: string | null;
    amount: number;
    amount_type: string;
    village: string | null;
    gift_date: string | null;
    created_at: string;
}

export interface Guest {
    id: string;
    fullname: string;
    father_fullname?: string;
    village?: string;
    amount: number;
    created_at: string;
}

export type TallyStatus = 'Returned More' | 'Balanced' | 'Returned Less' | 'No Return Yet';

export interface MatchedFamily {
    id: string; // usually based on NewGiftEntry id
    personName: string;
    fatherName: string;
    village: string;
    givenAmount: number;
    givenDate: string;
    returnedAmount: number;
    returnedDate: string | null;
    difference: number;
    status: TallyStatus;
    timeGapStr: string | null;
    newGiftEntry: NewGiftEntry;
    guestEntry: Guest | null;
}

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
}

function normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Returns true if a and b are "close enough"
function isFuzzyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
    const normA = normalizeString(a);
    const normB = normalizeString(b);
    
    if (normA === normB) return true;
    if (normA.length === 0 || normB.length === 0) return false;
    
    // If one is a substring of another and reasonably long
    if (normA.length > 3 && normB.length > 3) {
        if (normA.includes(normB) || normB.includes(normA)) return true;
    }
    
    const distance = levenshteinDistance(normA, normB);
    const maxLength = Math.max(normA.length, normB.length);
    
    // Allow roughly 1 typo per 4 characters
    return distance <= Math.floor(maxLength / 4);
}

function calculateTimeGap(date1Str: string, date2Str: string): string {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 'Unknown';

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    }
    
    const diffYears = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    
    if (remainingMonths === 0) {
        return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
    }
    
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

export function generateTally(givenGifts: NewGiftEntry[], receivedContributions: Guest[]): MatchedFamily[] {
    const matches: MatchedFamily[] = [];
    const usedGuests = new Set<string>();

    for (const given of givenGifts) {
        let bestMatch: Guest | null = null;
        
        for (const guest of receivedContributions) {
            if (usedGuests.has(guest.id)) continue;

            const nameMatches = isFuzzyMatch(given.person_name, guest.fullname);
            const fatherMatches = isFuzzyMatch(given.father_name, guest.father_fullname);
            const villageMatches = isFuzzyMatch(given.village, guest.village);

            // Strong match: Name matches AND (Father matches OR Village matches)
            // Or exact match on Name if Father and Village are both empty
            if (nameMatches && (fatherMatches || villageMatches)) {
                bestMatch = guest;
                break;
            }
        }

        const givenAmount = given.amount || 0;
        let returnedAmount = 0;
        let returnedDate: string | null = null;
        let timeGapStr: string | null = null;
        let status: TallyStatus = 'No Return Yet';
        let difference = -givenAmount; // Initial difference

        if (bestMatch) {
            usedGuests.add(bestMatch.id);
            returnedAmount = bestMatch.amount || 0;
            difference = returnedAmount - givenAmount;
            
            // Prefer created_at for guest as wedding date might not be strictly available, created_at is a good proxy for reception
            returnedDate = bestMatch.created_at;
            
            const givenDateStr = given.gift_date || given.created_at;
            timeGapStr = calculateTimeGap(givenDateStr, returnedDate);

            if (difference > 0) status = 'Returned More';
            else if (difference === 0) status = 'Balanced';
            else status = 'Returned Less';
        }

        matches.push({
            id: given.id,
            personName: given.person_name,
            fatherName: given.father_name || '',
            village: given.village || '',
            givenAmount,
            givenDate: given.gift_date || given.created_at,
            returnedAmount,
            returnedDate,
            difference,
            status,
            timeGapStr,
            newGiftEntry: given,
            guestEntry: bestMatch
        });
    }

    return matches;
}
