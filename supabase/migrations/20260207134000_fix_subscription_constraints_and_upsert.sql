-- Fix subscription constraints and allow upsert by profile_id

-- 1) Normalize legacy plan/status values
UPDATE public.subscriptions
SET plan_type = 'pro'
WHERE LOWER(plan_type) IN ('unlimited', 'unli', 'lifetime');

UPDATE public.subscriptions
SET status = 'active'
WHERE LOWER(status) IN ('paid', 'completed');

-- 2) Remove duplicate subscriptions (keep latest per profile)
WITH ranked AS (
  SELECT
    id,
    profile_id,
    ROW_NUMBER() OVER (
      PARTITION BY profile_id
      ORDER BY created_at DESC NULLS LAST, end_date DESC NULLS LAST
    ) AS rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- 3) Drop existing plan/status check constraints (regardless of name)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'subscriptions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%plan_type%'
  )
  LOOP
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  FOR r IN (
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'subscriptions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  )
  LOOP
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 4) Re-add constraints with correct values
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('free', 'basic', 'premium', 'pro'));

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'inactive', 'cancelled', 'expired'));

-- 5) Add unique index on profile_id for upsert logic
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_profile_id_unique
  ON public.subscriptions (profile_id);
