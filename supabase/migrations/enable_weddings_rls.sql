-- ============================================================
-- WedTrack: Enable RLS on weddings table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Enable Row Level Security
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: users can only read their own weddings
CREATE POLICY "Users can view their weddings"
ON weddings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. INSERT: users can only create weddings with their own user_id
CREATE POLICY "Users can insert their weddings"
ON weddings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. UPDATE: users can only edit their own weddings
CREATE POLICY "Users can update their weddings"
ON weddings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. DELETE: users can only delete their own weddings
CREATE POLICY "Users can delete their weddings"
ON weddings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
