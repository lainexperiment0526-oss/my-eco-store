-- DropLink: Followers table schema + RLS quick fix
-- Use in Supabase SQL editor or psql.

-- Ensure correct columns (rename old columns if they exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='followers' AND column_name='follower_id'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='followers' AND column_name='follower_profile_id'
    ) THEN
        ALTER TABLE public.followers RENAME COLUMN follower_id TO follower_profile_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='followers' AND column_name='following_id'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='followers' AND column_name='following_profile_id'
    ) THEN
        ALTER TABLE public.followers RENAME COLUMN following_id TO following_profile_id;
    END IF;
END $$;

-- Ensure required columns exist
ALTER TABLE public.followers
    ADD COLUMN IF NOT EXISTS follower_profile_id uuid NOT NULL;
ALTER TABLE public.followers
    ADD COLUMN IF NOT EXISTS following_profile_id uuid NOT NULL;
ALTER TABLE public.followers
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'followers_follower_unique'
    ) THEN
        ALTER TABLE public.followers
        ADD CONSTRAINT followers_follower_unique UNIQUE (follower_profile_id, following_profile_id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_profile ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_profile ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='followers') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.followers', r.policyname);
  END LOOP;
END $$;

-- Allow anyone (including anon/Pi users) to insert/delete/select/update, while preventing self-follow and ensuring profiles exist
CREATE POLICY "followers_insert_anyone" ON public.followers
FOR INSERT
WITH CHECK (
  follower_profile_id IS NOT NULL AND following_profile_id IS NOT NULL AND
  follower_profile_id <> following_profile_id AND
  EXISTS (SELECT 1 FROM public.profiles p1 WHERE p1.id = follower_profile_id) AND
  EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = following_profile_id)
);

CREATE POLICY "followers_delete_anyone" ON public.followers
FOR DELETE USING (true);

CREATE POLICY "followers_select_anyone" ON public.followers
FOR SELECT USING (true);

CREATE POLICY "followers_update_anyone" ON public.followers
FOR UPDATE USING (true) WITH CHECK (true);

GRANT ALL ON public.followers TO anon;
GRANT ALL ON public.followers TO authenticated;

-- ========================================
-- HEALTH CHECK (run after applying fixes)
-- ========================================
-- Run the SELECTs below to verify schema, RLS, policies, and grants.

-- Column existence and nullability
SELECT
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='followers' AND column_name='follower_profile_id' AND is_nullable='NO') AS has_follower_profile_id_not_null,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='followers' AND column_name='following_profile_id' AND is_nullable='NO') AS has_following_profile_id_not_null,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='followers' AND column_name='created_at') AS has_created_at;

-- Unique constraint present
SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'followers_follower_unique'
) AS has_unique_constraint;

-- RLS enabled
SELECT c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'followers';

-- Policies summary
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='followers'
ORDER BY policyname;

-- Grants check (anon/authenticated)
SELECT
    has_table_privilege('anon', 'public.followers', 'INSERT') AS anon_insert,
    has_table_privilege('anon', 'public.followers', 'SELECT') AS anon_select,
    has_table_privilege('anon', 'public.followers', 'DELETE') AS anon_delete,
    has_table_privilege('authenticated', 'public.followers', 'INSERT') AS auth_insert,
    has_table_privilege('authenticated', 'public.followers', 'SELECT') AS auth_select,
    has_table_privilege('authenticated', 'public.followers', 'DELETE') AS auth_delete;

-- Indexes present
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='followers'
ORDER BY indexname;

