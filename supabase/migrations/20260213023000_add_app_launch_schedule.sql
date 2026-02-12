-- Optional launch schedule for apps and drafts.
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS launch_at timestamptz;

ALTER TABLE public.app_drafts
ADD COLUMN IF NOT EXISTS launch_at timestamptz;

