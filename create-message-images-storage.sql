-- Create message-images storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects should be configured in Supabase Dashboard
-- Follow these steps in your Supabase Dashboard:
-- 
-- 1. Go to Storage > message-images bucket
-- 2. Click "Policies" tab
-- 3. Add these policies:
--
-- Policy 1: Allow authenticated users to upload
--   - Authenticated users can upload to public/* paths
--
-- Policy 2: Allow public read access
--   - Anyone can read files in this bucket
--
-- Policy 3: Allow users to delete their own files (optional)
--   - Authenticated users can delete files from their own folders

-- For now, the bucket is created with public=true
-- This allows file access once uploaded
