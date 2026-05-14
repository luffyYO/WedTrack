import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabaseClient';
import { Guest, NewGiftEntry, MatchedFamily, generateTally } from '../features/giftTally/utils/matchingLogic';

// Fetch all guests across all weddings owned by the user
async function fetchAllUserGuests(userId: string): Promise<Guest[]> {
    if (!userId) return [];
    
    // First find all weddings for this user
    const { data: weddings, error: weddingsError } = await supabase
        .from('weddings')
        .select('id')
        .eq('user_id', userId);
        
    if (weddingsError) throw new Error(weddingsError.message);
    
    const weddingIds = weddings?.map(w => w.id) || [];
    if (weddingIds.length === 0) return [];
    
    // Then fetch all guests for those weddings
    const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .in('wedding_id', weddingIds);
        
    if (guestsError) throw new Error(guestsError.message);
    return guests as Guest[] || [];
}

async function fetchUserGivenGifts(userId: string): Promise<NewGiftEntry[]> {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('new_gift_entries')
        .select('*')
        .eq('user_id', userId);
        
    if (error) throw new Error(error.message);
    return data as NewGiftEntry[] || [];
}

export function useGiftTally() {
    return useQuery<MatchedFamily[]>({
        queryKey: ['giftTally'],
        queryFn: async () => {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError) throw new Error(authError.message);
            const userId = authData.user?.id;
            
            if (!userId) return [];
            
            // Fetch both datasets concurrently
            const [givenGifts, receivedGuests] = await Promise.all([
                fetchUserGivenGifts(userId),
                fetchAllUserGuests(userId)
            ]);
            
            return generateTally(givenGifts, receivedGuests);
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });
}
