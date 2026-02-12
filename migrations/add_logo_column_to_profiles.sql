-- Add a 'logo' column to the 'profiles' table if it does not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo text;