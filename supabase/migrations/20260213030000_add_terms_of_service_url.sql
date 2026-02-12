-- Optional Terms of Service URL for apps and drafts.
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS terms_of_service_url text;

ALTER TABLE public.app_drafts
ADD COLUMN IF NOT EXISTS terms_of_service_url text;

