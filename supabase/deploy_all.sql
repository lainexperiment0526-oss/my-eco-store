-- Executable, idempotent all-in-one schema deploy for Droplink
-- Safe to re-run: uses IF NOT EXISTS and conditional DO blocks

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- TABLES (create if missing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_chat_messages_profile_id_fkey'
      AND conrelid = 'public.ai_chat_messages'::regclass
  ) THEN
    ALTER TABLE public.ai_chat_messages
      ADD CONSTRAINT ai_chat_messages_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_support_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  enabled boolean DEFAULT false,
  business_info text,
  faqs text,
  custom_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_support_config_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_support_config_profile_id_fkey'
      AND conrelid = 'public.ai_support_config'::regclass
  ) THEN
    ALTER TABLE public.ai_support_config
      ADD CONSTRAINT ai_support_config_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_support_config_profile_id_key'
      AND conrelid = 'public.ai_support_config'::regclass
  ) THEN
    ALTER TABLE public.ai_support_config
      ADD CONSTRAINT ai_support_config_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['view'::text, 'social_click'::text, 'product_click'::text])),
  event_data jsonb DEFAULT '{}'::jsonb,
  visitor_ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  location_country text,
  location_city text,
  CONSTRAINT analytics_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'analytics_profile_id_fkey'
      AND conrelid = 'public.analytics'::regclass
  ) THEN
    ALTER TABLE public.analytics
      ADD CONSTRAINT analytics_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.followers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_profile_id uuid NOT NULL,
  following_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT followers_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'followers_follower_profile_id_following_profile_id_key'
      AND conrelid = 'public.followers'::regclass
  ) THEN
    ALTER TABLE public.followers
      ADD CONSTRAINT followers_follower_profile_id_following_profile_id_key UNIQUE (follower_profile_id, following_profile_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'followers_follower_profile_id_fkey'
      AND conrelid = 'public.followers'::regclass
  ) THEN
    ALTER TABLE public.followers
      ADD CONSTRAINT followers_follower_profile_id_fkey FOREIGN KEY (follower_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'followers_following_profile_id_fkey'
      AND conrelid = 'public.followers'::regclass
  ) THEN
    ALTER TABLE public.followers
      ADD CONSTRAINT followers_following_profile_id_fkey FOREIGN KEY (following_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  drop_token_cost integer NOT NULL CHECK (drop_token_cost > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gifts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_profile_id uuid NOT NULL,
  receiver_profile_id uuid NOT NULL,
  gift_id uuid NOT NULL,
  drop_tokens_spent integer NOT NULL CHECK (drop_tokens_spent > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gift_transactions_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gift_transactions_check'
      AND conrelid = 'public.gift_transactions'::regclass
  ) THEN
    ALTER TABLE public.gift_transactions
      ADD CONSTRAINT gift_transactions_check CHECK (sender_profile_id <> receiver_profile_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gift_transactions_gift_id_fkey'
      AND conrelid = 'public.gift_transactions'::regclass
  ) THEN
    ALTER TABLE public.gift_transactions
      ADD CONSTRAINT gift_transactions_gift_id_fkey FOREIGN KEY (gift_id) REFERENCES public.gifts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gift_transactions_receiver_profile_id_fkey'
      AND conrelid = 'public.gift_transactions'::regclass
  ) THEN
    ALTER TABLE public.gift_transactions
      ADD CONSTRAINT gift_transactions_receiver_profile_id_fkey FOREIGN KEY (receiver_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gift_transactions_sender_profile_id_fkey'
      AND conrelid = 'public.gift_transactions'::regclass
  ) THEN
    ALTER TABLE public.gift_transactions
      ADD CONSTRAINT gift_transactions_sender_profile_id_fkey FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'follow'::text, 'message'::text, 'gift'::text, 'payment'::text])),
  is_read boolean DEFAULT false,
  action_url text DEFAULT ''::text,
  payload jsonb DEFAULT '{}'::jsonb,
  delivered boolean DEFAULT false,
  delivery_channel text CHECK (delivery_channel = ANY (ARRAY['email'::text, 'webhook'::text, 'in-app'::text])),
  webhook_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_profile_id_fkey'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  title text NOT NULL,
  price text NOT NULL,
  description text,
  image text,
  file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_profile_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  username text NOT NULL,
  business_name text NOT NULL,
  description text,
  logo text,
  social_links jsonb DEFAULT '[]'::jsonb,
  theme_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  has_premium boolean DEFAULT false,
  youtube_video_url text,
  crypto_wallets jsonb DEFAULT '{}'::jsonb,
  bank_details jsonb DEFAULT '{}'::jsonb,
  show_share_button boolean DEFAULT true,
  pi_wallet_address text,
  pi_donation_message text DEFAULT 'Send me a coffee ☕'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='profiles' AND indexname='idx_profiles_username'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_username ON public.profiles (username);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text])),
  billing_period text NOT NULL CHECK (billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  pi_amount integer NOT NULL DEFAULT 0,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])),
  auto_renew boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_profile_id_fkey'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  drop_tokens bigint NOT NULL DEFAULT 0 CHECK (drop_tokens >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_wallets_pkey PRIMARY KEY (id)
);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_wallets_profile_id_fkey'
      AND conrelid = 'public.user_wallets'::regclass
  ) THEN
    ALTER TABLE public.user_wallets
      ADD CONSTRAINT user_wallets_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_wallets_profile_id_key'
      AND conrelid = 'public.user_wallets'::regclass
  ) THEN
    ALTER TABLE public.user_wallets
      ADD CONSTRAINT user_wallets_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- ============================================
-- FUNCTIONS (create or replace)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_profile_id uuid)
RETURNS TABLE(plan_type text, billing_period text, end_date timestamp with time zone, status text)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.billing_period,
    s.end_date,
    CASE WHEN s.end_date < now() THEN 'expired'::text ELSE s.status END
  FROM public.subscriptions s
  WHERE s.profile_id = p_profile_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_wallets (profile_id, drop_tokens)
  VALUES (NEW.id, 0)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS (idempotent via DO blocks)
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='create_wallet_for_new_profile') THEN
    CREATE TRIGGER create_wallet_for_new_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_ai_support_config_updated_at') THEN
    CREATE TRIGGER update_ai_support_config_updated_at
    BEFORE UPDATE ON public.ai_support_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_user_wallets_updated_at') THEN
    CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_notifications_updated_at') THEN
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY + POLICIES
-- ============================================
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_support_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper to create policy if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics' AND policyname='Anyone can insert analytics') THEN
    EXECUTE 'CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics' AND policyname='Profile owners can view their analytics') THEN
    EXECUTE 'CREATE POLICY "Profile owners can view their analytics" ON public.analytics FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = analytics.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_chat_messages' AND policyname='Anyone can insert chat messages') THEN
    EXECUTE 'CREATE POLICY "Anyone can insert chat messages" ON public.ai_chat_messages FOR INSERT WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_chat_messages' AND policyname='Anyone can view AI chat messages') THEN
    EXECUTE 'CREATE POLICY "Anyone can view AI chat messages" ON public.ai_chat_messages FOR SELECT USING (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='followers' AND policyname='Anyone can view followers') THEN
    EXECUTE 'CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='followers' AND policyname='Users can follow profiles') THEN
    EXECUTE 'CREATE POLICY "Users can follow profiles" ON public.followers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = followers.follower_profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='followers' AND policyname='Users can unfollow') THEN
    EXECUTE 'CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = followers.follower_profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gifts' AND policyname='Gifts are viewable by everyone') THEN
    EXECUTE 'CREATE POLICY "Gifts are viewable by everyone" ON public.gifts FOR SELECT USING (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Products are viewable by everyone') THEN
    EXECUTE 'CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Users can insert products for their profile') THEN
    EXECUTE 'CREATE POLICY "Users can insert products for their profile" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = products.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Users can update their own products') THEN
    EXECUTE 'CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = products.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Users can delete their own products') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = products.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profiles are viewable by everyone') THEN
    EXECUTE 'CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can delete their own profile') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can insert their own subscriptions') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can update their own subscriptions') THEN
    EXECUTE 'CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can view their own subscriptions') THEN
    EXECUTE 'CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_wallets' AND policyname='Users can insert their own wallet') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own wallet" ON public.user_wallets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = user_wallets.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_wallets' AND policyname='Users can update their own wallet') THEN
    EXECUTE 'CREATE POLICY "Users can update their own wallet" ON public.user_wallets FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = user_wallets.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_wallets' AND policyname='Users can view their own wallet') THEN
    EXECUTE 'CREATE POLICY "Users can view their own wallet" ON public.user_wallets FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = user_wallets.profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gift_transactions' AND policyname='Users can send gifts') THEN
    EXECUTE 'CREATE POLICY "Users can send gifts" ON public.gift_transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = gift_transactions.sender_profile_id AND profiles.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gift_transactions' AND policyname='Users can view their gift transactions') THEN
    EXECUTE 'CREATE POLICY "Users can view their gift transactions" ON public.gift_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = gift_transactions.sender_profile_id AND profiles.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = gift_transactions.receiver_profile_id AND profiles.user_id = auth.uid()))';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_support_config' AND policyname='Users can insert their own AI config') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own AI config" ON public.ai_support_config FOR INSERT WITH CHECK (auth.uid() IN (SELECT profiles.user_id FROM public.profiles WHERE profiles.id = ai_support_config.profile_id))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_support_config' AND policyname='Users can update their own AI config') THEN
    EXECUTE 'CREATE POLICY "Users can update their own AI config" ON public.ai_support_config FOR UPDATE USING (auth.uid() IN (SELECT profiles.user_id FROM public.profiles WHERE profiles.id = ai_support_config.profile_id))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_support_config' AND policyname='Users can view their own AI config') THEN
    EXECUTE 'CREATE POLICY "Users can view their own AI config" ON public.ai_support_config FOR SELECT USING (auth.uid() IN (SELECT profiles.user_id FROM public.profiles WHERE profiles.id = ai_support_config.profile_id))';
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers USING btree (follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers USING btree (following_profile_id);
CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles USING btree (username);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);

-- Done.