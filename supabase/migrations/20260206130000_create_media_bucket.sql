-- Create media bucket for background videos and other uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for media assets
DROP POLICY IF EXISTS "public read media" ON storage.objects;
CREATE POLICY "public read media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

-- Authenticated uploads to media bucket
DROP POLICY IF EXISTS "authenticated upload media" ON storage.objects;
CREATE POLICY "authenticated upload media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Authenticated owners can update their own media objects
DROP POLICY IF EXISTS "authenticated update own media" ON storage.objects;
CREATE POLICY "authenticated update own media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'media' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

-- Authenticated owners can delete their own media objects
DROP POLICY IF EXISTS "authenticated delete own media" ON storage.objects;
CREATE POLICY "authenticated delete own media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'media' AND auth.uid() = owner);
