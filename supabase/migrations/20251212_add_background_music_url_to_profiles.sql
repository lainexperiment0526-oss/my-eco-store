-- Migration: Add background_music_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_music_url text;