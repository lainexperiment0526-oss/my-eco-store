-- Add verified badge subscription fields to apps.
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_until timestamptz;

