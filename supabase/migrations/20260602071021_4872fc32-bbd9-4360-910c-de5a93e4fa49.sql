ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;

ALTER TABLE public.app_drafts
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;