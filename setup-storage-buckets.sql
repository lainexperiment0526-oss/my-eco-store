-- Setup Supabase Storage Buckets for Droplink
-- Run this in Supabase SQL Editor

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]),
  ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]),
  ('documents', 'documents', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]),
  ('thumbnails', 'thumbnails', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]),
  ('backgrounds', 'backgrounds', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile-images bucket
DROP POLICY IF EXISTS "Public Access to profile-images" ON storage.objects;
CREATE POLICY "Public Access to profile-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Authenticated users can upload to profile-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload to profile-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own files in profile-images" ON storage.objects;
CREATE POLICY "Users can update their own files in profile-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files in profile-images" ON storage.objects;
CREATE POLICY "Users can delete their own files in profile-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for logos bucket
DROP POLICY IF EXISTS "Public Access to logos" ON storage.objects;
CREATE POLICY "Public Access to logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can upload to logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload to logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own files in logos" ON storage.objects;
CREATE POLICY "Users can update their own files in logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files in logos" ON storage.objects;
CREATE POLICY "Users can delete their own files in logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for avatars bucket
DROP POLICY IF EXISTS "Public Access to avatars" ON storage.objects;
CREATE POLICY "Public Access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload to avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own files in avatars" ON storage.objects;
CREATE POLICY "Users can update their own files in avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files in avatars" ON storage.objects;
CREATE POLICY "Users can delete their own files in avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for backgrounds bucket
DROP POLICY IF EXISTS "Public Access to backgrounds" ON storage.objects;
CREATE POLICY "Public Access to backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Authenticated users can upload to backgrounds" ON storage.objects;
CREATE POLICY "Authenticated users can upload to backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'backgrounds' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own files in backgrounds" ON storage.objects;
CREATE POLICY "Users can update their own files in backgrounds"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own files in backgrounds" ON storage.objects;
CREATE POLICY "Users can delete their own files in backgrounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for product-images bucket
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload to product-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can manage product-images" ON storage.objects;
CREATE POLICY "Users can manage product-images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Create storage policies for documents bucket
DROP POLICY IF EXISTS "Public Access to documents" ON storage.objects;
CREATE POLICY "Public Access to documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can upload to documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload to documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can manage documents" ON storage.objects;
CREATE POLICY "Users can manage documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Create storage policies for thumbnails bucket
DROP POLICY IF EXISTS "Public Access to thumbnails" ON storage.objects;
CREATE POLICY "Public Access to thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated users can upload to thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload to thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can manage thumbnails" ON storage.objects;
CREATE POLICY "Users can manage thumbnails"
ON storage.objects FOR ALL
USING (
  bucket_id = 'thumbnails'
  AND auth.role() = 'authenticated'
);

-- Success message
SELECT 'Supabase Storage buckets and policies created successfully! ✅' as status;
