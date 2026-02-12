-- Add theme color to groups and create community applications table

ALTER TABLE IF EXISTS public.groups
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#3b82f6';

CREATE TABLE IF NOT EXISTS public.community_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL CHECK (role IN ('ambassador', 'moderator')),
  status text NOT NULL DEFAULT 'pending',
  profile_id uuid NULL,
  username text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  portfolio_url text NULL,
  experience text NULL,
  availability text NULL,
  motivation text NOT NULL
);

CREATE INDEX IF NOT EXISTS community_applications_role_idx ON public.community_applications (role);
CREATE INDEX IF NOT EXISTS community_applications_status_idx ON public.community_applications (status);
