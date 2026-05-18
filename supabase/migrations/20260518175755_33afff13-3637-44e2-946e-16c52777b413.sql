ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS app_file_url text,
  ADD COLUMN IF NOT EXISTS app_file_name text,
  ADD COLUMN IF NOT EXISTS app_file_size bigint,
  ADD COLUMN IF NOT EXISTS app_file_type text;

ALTER TABLE public.app_drafts
  ADD COLUMN IF NOT EXISTS app_file_url text,
  ADD COLUMN IF NOT EXISTS app_file_name text,
  ADD COLUMN IF NOT EXISTS app_file_size bigint,
  ADD COLUMN IF NOT EXISTS app_file_type text;