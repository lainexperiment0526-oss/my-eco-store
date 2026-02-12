-- Step 1: Create message-images storage bucket
-- Run this in Supabase Dashboard -> Storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up storage policies for message-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-images');

-- Allow public read access to message images
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-images');

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-images' AND auth.uid() IS NOT NULL);
