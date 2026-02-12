-- Add media metadata to messages for chat attachments

ALTER TABLE IF EXISTS public.messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS duration_ms integer;
