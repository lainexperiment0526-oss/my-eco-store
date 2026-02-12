-- 10_rls_policies.sql
-- Enable Row Level Security and define policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_authenticated_write" ON public.profiles;
CREATE POLICY "profiles_authenticated_write" ON public.profiles
  FOR UPDATE USING (auth.uid() = profiles.user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = profiles.user_id OR is_admin(auth.uid()));

-- Links
DROP POLICY IF EXISTS "links_public_read" ON public.links;
CREATE POLICY "links_public_read" ON public.links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "links_owner_write" ON public.links;
CREATE POLICY "links_owner_write" ON public.links
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = links.profile_id AND user_id = auth.uid())
  );

-- Products
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_owner_write" ON public.products;
CREATE POLICY "products_owner_write" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = products.profile_id AND user_id = auth.uid())
  );

-- Followers
DROP POLICY IF EXISTS "followers_public_read" ON public.followers;
CREATE POLICY "followers_public_read" ON public.followers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "followers_authenticated_write" ON public.followers;
CREATE POLICY "followers_authenticated_write" ON public.followers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Messages
DROP POLICY IF EXISTS "messages_read" ON public.messages;
CREATE POLICY "messages_read" ON public.messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles
      WHERE id = messages.receiver_profile_id OR id = messages.sender_profile_id
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Gift Cards
DROP POLICY IF EXISTS "gift_cards_read" ON public.gift_cards;
CREATE POLICY "gift_cards_read" ON public.gift_cards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "gift_cards_write" ON public.gift_cards;
CREATE POLICY "gift_cards_write" ON public.gift_cards
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Payments
DROP POLICY IF EXISTS "payments_read" ON public.payments;
CREATE POLICY "payments_read" ON public.payments
  FOR SELECT USING (
    auth.uid() = payments.user_id OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions_read" ON public.subscriptions;
CREATE POLICY "subscriptions_read" ON public.subscriptions
  FOR SELECT USING (auth.uid() = subscriptions.user_id);

DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = subscriptions.user_id);

-- Analytics
DROP POLICY IF EXISTS "analytics_insert" ON public.analytics;
CREATE POLICY "analytics_insert" ON public.analytics
  FOR INSERT WITH CHECK (true);

-- Leads
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Badges
DROP POLICY IF EXISTS "badges_read" ON public.badges;
CREATE POLICY "badges_read" ON public.badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "badges_grant" ON public.badges;
CREATE POLICY "badges_grant" ON public.badges
  FOR INSERT WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
CREATE POLICY "notifications_read" ON public.notifications
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = notifications.profile_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = notifications.profile_id AND user_id = auth.uid())
  );

-- Social Verifications
DROP POLICY IF EXISTS "social_verifications_read" ON public.social_verifications;
CREATE POLICY "social_verifications_read" ON public.social_verifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "social_verifications_write" ON public.social_verifications;
CREATE POLICY "social_verifications_write" ON public.social_verifications
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = social_verifications.profile_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "social_verifications_update" ON public.social_verifications;
CREATE POLICY "social_verifications_update" ON public.social_verifications
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = social_verifications.profile_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = social_verifications.profile_id AND user_id = auth.uid())
  );

-- User Preferences
DROP POLICY IF EXISTS "user_preferences_read" ON public.user_preferences;
CREATE POLICY "user_preferences_read" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_preferences.user_id);

DROP POLICY IF EXISTS "user_preferences_write" ON public.user_preferences;
CREATE POLICY "user_preferences_write" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_preferences.user_id);

DROP POLICY IF EXISTS "user_preferences_update" ON public.user_preferences;
CREATE POLICY "user_preferences_update" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_preferences.user_id)
  WITH CHECK (auth.uid() = user_preferences.user_id);
