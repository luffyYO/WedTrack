import { supabase } from '@/config/supabaseClient';

export interface NewGiftEntry {
  id: string;
  user_id: string;
  person_name: string;
  father_name?: string;
  amount: number;
  amount_type: string;
  village?: string;
  gift_date: string;
  created_at: string;
}

/**
 * Fetch all manual gift entries for the logged-in user.
 */
export async function fetchGiftEntries(userId: string): Promise<NewGiftEntry[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('new_gift_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Create a new manual gift entry.
 */
export async function createGiftEntry(entry: Partial<NewGiftEntry>): Promise<NewGiftEntry> {
  const { data, error } = await supabase
    .from('new_gift_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update an existing manual gift entry.
 */
export async function updateGiftEntry(id: string, updates: Partial<NewGiftEntry>): Promise<NewGiftEntry> {
  const { data, error } = await supabase
    .from('new_gift_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a manual gift entry.
 */
export async function deleteGiftEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('new_gift_entries')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
