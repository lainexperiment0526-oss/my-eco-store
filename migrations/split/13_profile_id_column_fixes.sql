-- 13_profile_id_column_fixes.sql
-- Ensure all tables that rely on profiles have a profile_id column (safe to re-run)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'links',
    'products',
    'payments',
    'subscriptions',
    'analytics',
    'leads',
    'user_preferences',
    'badges',
    'notifications',
    'social_verifications'
  ])
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;',
      tbl
    );
  END LOOP;
END $$;

-- Backfill user_preferences.profile_id where missing
UPDATE public.user_preferences up
SET profile_id = p.id
FROM public.profiles p
WHERE up.profile_id IS NULL
  AND up.user_id = p.user_id;

-- Optional indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_links_profile_id ON public.links(profile_id);
CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_profile_id ON public.payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON public.leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON public.user_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_badges_profile_id ON public.badges(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_social_verifications_profile_id ON public.social_verifications(profile_id);
