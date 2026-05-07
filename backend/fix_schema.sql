-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Add missing columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS podcast_script jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS podcast_status text DEFAULT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS podcast_ready int DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS podcast_total int DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;