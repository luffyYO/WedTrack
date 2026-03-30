-- =====================================================================
-- WedTrack DEV: Reset Database (wipes ALL data, keeps schema)
-- Safe to run on DEV only — DO NOT run on production!
-- https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- =====================================================================
TRUNCATE public.guests  RESTART IDENTITY CASCADE;
TRUNCATE public.weddings RESTART IDENTITY CASCADE;

SELECT 'DEV database reset complete — all data wiped, schema intact.' AS status;
