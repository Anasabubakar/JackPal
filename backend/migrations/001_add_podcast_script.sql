-- Migration to add podcast_script column to documents table
-- Run this in Supabase SQL Editor

ALTER TABLE documents ADD COLUMN IF NOT EXISTS podcast_script jsonb;