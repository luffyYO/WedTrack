-- ──────────────────────────────────────────────────────────────────────────────
-- DROP ALL PAPER SCAN ARTIFACTS
-- Run this in the Supabase SQL Editor to fully remove paper_scan infrastructure.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Drop ocr_corrections table (feedback learning — built but no longer needed)
DROP TABLE IF EXISTS public.ocr_corrections CASCADE;

-- 2. Drop paper_scans table and all its foreign keys / indexes / policies
DROP TABLE IF EXISTS public.paper_scans CASCADE;

-- 3. Remove paper_scan_id column from guests if it exists
ALTER TABLE public.guests
    DROP COLUMN IF EXISTS paper_scan_id;

-- 4. Remove paper_scan_id from new_gift_entries if it exists
ALTER TABLE public.new_gift_entries
    DROP COLUMN IF EXISTS paper_scan_id;

-- 5. Drop all storage policies for paper-scans bucket
DROP POLICY IF EXISTS "Wedding owners can upload scans"          ON storage.objects;
DROP POLICY IF EXISTS "Wedding owners can read their scans"      ON storage.objects;
DROP POLICY IF EXISTS "Wedding owners can delete their scans"    ON storage.objects;
DROP POLICY IF EXISTS "owner_upload_paper_scans"                 ON storage.objects;
DROP POLICY IF EXISTS "owner_read_paper_scans"                   ON storage.objects;
DROP POLICY IF EXISTS "owner_delete_paper_scans"                 ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload scans"     ON storage.objects;
DROP POLICY IF EXISTS "Public read access for paper-scans"       ON storage.objects;
DROP POLICY IF EXISTS "Public Access to paper-scans"             ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload paper-scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own paper-scans"   ON storage.objects;

-- 6. Delete the paper-scans storage bucket
--    (objects inside must be empty first — delete via Storage UI if bucket is non-empty)
DELETE FROM storage.buckets WHERE id = 'paper-scans';

