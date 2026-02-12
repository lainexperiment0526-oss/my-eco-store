-- Add background music support for public bio pages
-- Supports direct audio URLs (MP3, OGG, WAV), YouTube links, Spotify links, and other streaming services

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS background_music_url TEXT DEFAULT '';

-- Add comment to explain the field with supported formats
COMMENT ON COLUMN public.profiles.background_music_url IS 'URL to background music - supports direct audio files (MP3, OGG, WAV), YouTube links (youtube.com/watch?v=...), Spotify links (open.spotify.com/track/...), and other streaming service URLs';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_background_music_url ON public.profiles(background_music_url);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
