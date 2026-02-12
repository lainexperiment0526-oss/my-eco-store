-- Combined Migration Script for DropLink
-- Generated on: 2025-11-19T09:32:27.654Z
-- Files included: 20251111083853_remix_migration_from_pg_dump.sql, 20251112000000_add_email_to_profiles.sql, 20251112000001_security_hardening.sql, 20251112000002_add_custom_domain.sql, 20251116121505_01d03779-7eca-4c27-8e68-e39e6d570a54.sql, 20251116123200_de993d44-272e-4312-ae0f-f7b6a0e16a7e.sql, 20251118000000_complete_database_remove_restrictions.sql, 20251118000001_complete_database_schema.sql, 20251118000002_pi_network_enhancements.sql, 20251118000003_user_preferences_and_persistence.sql, 20251119000000_voting_system.sql, 20251119120000_payment_links_and_features.sql, 20251119120001_migrate_user_data.sql


-- ============================================================================
-- Migration 1: 20251111083853_remix_migration_from_pg_dump.sql
-- ============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: get_active_subscription(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_active_subscription(p_profile_id uuid) RETURNS TABLE(plan_type text, billing_period text, end_date timestamp with time zone, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.billing_period,
    s.end_date,
    CASE 
      WHEN s.end_date < now() THEN 'expired'::text
      ELSE s.status
    END as status
  FROM public.subscriptions s
  WHERE s.profile_id = p_profile_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;


--
-- Name: handle_new_profile_wallet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_wallets (profile_id, drop_tokens)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    session_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: ai_support_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ai_support_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    enabled boolean DEFAULT false,
    business_info text,
    faqs text,
    custom_instructions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    visitor_ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    location_country text,
    location_city text,
    CONSTRAINT analytics_event_type_check CHECK ((event_type = ANY (ARRAY['view'::text, 'social_click'::text, 'product_click'::text])))
);


--
-- Name: followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.followers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_profile_id uuid NOT NULL,
    following_profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gift_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.gift_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_profile_id uuid NOT NULL,
    receiver_profile_id uuid NOT NULL,
    gift_id uuid NOT NULL,
    drop_tokens_spent integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gift_transactions_check CHECK ((sender_profile_id <> receiver_profile_id)),
    CONSTRAINT gift_transactions_drop_tokens_spent_check CHECK ((drop_tokens_spent > 0))
);


--
-- Name: gifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.gifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    drop_token_cost integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gifts_drop_token_cost_check CHECK ((drop_token_cost > 0))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text NOT NULL,
    price text NOT NULL,
    description text,
    image text,
    file_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    username text NOT NULL,
    business_name text NOT NULL,
    description text,
    logo text,
    social_links jsonb DEFAULT '[]'::jsonb,
    theme_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    has_premium boolean DEFAULT false,
    youtube_video_url text,
    crypto_wallets jsonb DEFAULT '{}'::jsonb,
    bank_details jsonb DEFAULT '{}'::jsonb,
    show_share_button boolean DEFAULT true,
    pi_wallet_address text,
    pi_donation_message text DEFAULT 'Send me a coffee ☕'::text
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    plan_type text NOT NULL,
    billing_period text NOT NULL,
    pi_amount integer DEFAULT 0 NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    auto_renew boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscriptions_billing_period_check CHECK ((billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT subscriptions_plan_type_check CHECK ((plan_type = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    drop_tokens bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_wallets_drop_tokens_check CHECK ((drop_tokens >= 0))
);


--
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_messages_pkey'
    ) THEN
        ALTER TABLE ONLY public.ai_chat_messages
            ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: ai_support_config ai_support_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_support_config_pkey'
    ) THEN
        ALTER TABLE ONLY public.ai_support_config
            ADD CONSTRAINT ai_support_config_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: ai_support_config ai_support_config_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_support_config_profile_id_key'
    ) THEN
        ALTER TABLE ONLY public.ai_support_config
            ADD CONSTRAINT ai_support_config_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_pkey'
    ) THEN
        ALTER TABLE ONLY public.analytics
            ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: followers followers_follower_profile_id_following_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'followers_follower_profile_id_following_profile_id_key'
    ) THEN
        ALTER TABLE ONLY public.followers
            ADD CONSTRAINT followers_follower_profile_id_following_profile_id_key UNIQUE (follower_profile_id, following_profile_id);
    END IF;
END $$;


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'followers_pkey'
    ) THEN
        ALTER TABLE ONLY public.followers
            ADD CONSTRAINT followers_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: gift_transactions gift_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'gift_transactions_pkey'
    ) THEN
        ALTER TABLE ONLY public.gift_transactions
            ADD CONSTRAINT gift_transactions_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: gifts gifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'gifts_pkey'
    ) THEN
        ALTER TABLE ONLY public.gifts
            ADD CONSTRAINT gifts_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_pkey'
    ) THEN
        ALTER TABLE ONLY public.products
            ADD CONSTRAINT products_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey'
    ) THEN
        ALTER TABLE ONLY public.profiles
            ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
    ) THEN
        ALTER TABLE ONLY public.profiles
            ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_pkey'
    ) THEN
        ALTER TABLE ONLY public.subscriptions
            ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_wallets_pkey'
    ) THEN
        ALTER TABLE ONLY public.user_wallets
            ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (id);
    END IF;
END $$;


--
-- Name: user_wallets user_wallets_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_wallets_profile_id_key'
    ) THEN
        ALTER TABLE ONLY public.user_wallets
            ADD CONSTRAINT user_wallets_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;


--
-- Name: idx_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics USING btree (created_at DESC);


--
-- Name: idx_analytics_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics USING btree (event_type);


--
-- Name: idx_analytics_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics USING btree (profile_id);


--
-- Name: idx_followers_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers USING btree (follower_profile_id);


--
-- Name: idx_followers_following; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers USING btree (following_profile_id);


--
-- Name: idx_products_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products USING btree (profile_id);


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles USING btree (username);


--
-- Name: profiles create_wallet_for_new_profile; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS create_wallet_for_new_profile ON public.profiles;
CREATE TRIGGER create_wallet_for_new_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();


--
-- Name: profiles on_profile_created_wallet; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();


--
-- Name: products set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: ai_support_config update_ai_support_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_ai_support_config_updated_at ON public.ai_support_config;
CREATE TRIGGER update_ai_support_config_updated_at BEFORE UPDATE ON public.ai_support_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_wallets update_user_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_chat_messages ai_chat_messages_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_messages_profile_id_fkey'
    ) THEN
        ALTER TABLE ONLY public.ai_chat_messages
            ADD CONSTRAINT ai_chat_messages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;


--
-- Name: ai_support_config ai_support_config_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_support_config
    ADD CONSTRAINT ai_support_config_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: analytics analytics_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: followers followers_follower_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_profile_id_fkey FOREIGN KEY (follower_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: followers followers_following_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_following_profile_id_fkey FOREIGN KEY (following_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: gift_transactions gift_transactions_gift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_transactions
    ADD CONSTRAINT gift_transactions_gift_id_fkey FOREIGN KEY (gift_id) REFERENCES public.gifts(id) ON DELETE CASCADE;


--
-- Name: gift_transactions gift_transactions_receiver_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_transactions
    ADD CONSTRAINT gift_transactions_receiver_profile_id_fkey FOREIGN KEY (receiver_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: gift_transactions gift_transactions_sender_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_transactions
    ADD CONSTRAINT gift_transactions_sender_profile_id_fkey FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: products products_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_wallets user_wallets_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: analytics Anyone can insert analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);


--
-- Name: ai_chat_messages Anyone can insert chat messages; Type: POLICY; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert chat messages' AND tablename = 'ai_chat_messages'
    ) THEN
        CREATE POLICY "Anyone can insert chat messages" ON public.ai_chat_messages FOR INSERT WITH CHECK (true);
    END IF;
END $$;


--
-- Name: ai_chat_messages Anyone can view AI chat messages; Type: POLICY; Schema: public; Owner: -
--

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view AI chat messages' AND tablename = 'ai_chat_messages'
    ) THEN
        CREATE POLICY "Anyone can view AI chat messages" ON public.ai_chat_messages FOR SELECT USING (true);
    END IF;
END $$;


--
-- Name: followers Anyone can view followers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);


--
-- Name: gifts Gifts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gifts are viewable by everyone" ON public.gifts FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


--
-- Name: analytics Profile owners can view their analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profile owners can view their analytics" ON public.analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = analytics.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: products Users can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: followers Users can follow profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can follow profiles" ON public.followers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = followers.follower_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: products Users can insert products for their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert products for their profile" ON public.products FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: ai_support_config Users can insert their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own AI config" ON public.ai_support_config FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can insert their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can insert their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own wallet" ON public.user_wallets FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_wallets.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: gift_transactions Users can send gifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send gifts" ON public.gift_transactions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.sender_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: followers Users can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = followers.follower_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: ai_support_config Users can update their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own AI config" ON public.ai_support_config FOR UPDATE USING ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: products Users can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can update their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can update their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own wallet" ON public.user_wallets FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_wallets.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: gift_transactions Users can view their gift transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their gift transactions" ON public.gift_transactions FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.sender_profile_id) AND (profiles.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.receiver_profile_id) AND (profiles.user_id = auth.uid()))))));


--
-- Name: ai_support_config Users can view their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own AI config" ON public.ai_support_config FOR SELECT USING ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can view their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own wallet" ON public.user_wallets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_wallets.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: ai_chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_support_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_support_config ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: followers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

--
-- Name: gift_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: gifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




-- End of 20251111083853_remix_migration_from_pg_dump.sql
-- ============================================================================


-- ============================================================================
-- Migration 2: 20251112000000_add_email_to_profiles.sql
-- ============================================================================

-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email address for notifications and preferences';



-- End of 20251112000000_add_email_to_profiles.sql
-- ============================================================================


-- ============================================================================
-- Migration 3: 20251112000001_security_hardening.sql
-- ============================================================================

-- Security Hardening Migration
-- 1. Create private financial data table
-- 2. Create user_roles table
-- 3. Update RLS policies
-- 4. Prevent wallet self-minting

-- ============================================
-- 1. Create private financial data table
-- ============================================
CREATE TABLE IF NOT EXISTS public.profile_financial_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pi_wallet_address text,
    pi_donation_message text DEFAULT 'Send me a coffee ☕',
    crypto_wallets jsonb DEFAULT '{}'::jsonb,
    bank_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profile_financial_data_profile_id_key UNIQUE (profile_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_financial_data_profile_id ON public.profile_financial_data(profile_id);

-- Migrate existing financial data from profiles table
INSERT INTO public.profile_financial_data (profile_id, pi_wallet_address, pi_donation_message, crypto_wallets, bank_details)
SELECT 
    id as profile_id,
    pi_wallet_address,
    pi_donation_message,
    crypto_wallets,
    bank_details
FROM public.profiles
WHERE pi_wallet_address IS NOT NULL 
   OR pi_donation_message IS NOT NULL 
   OR crypto_wallets IS NOT NULL 
   OR bank_details IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

-- ============================================
-- 2. Create user_roles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================
-- 3. Create payment idempotency table
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_idempotency (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id text NOT NULL UNIQUE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    txid text,
    amount numeric NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT payment_idempotency_payment_id_key UNIQUE (payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_idempotency_payment_id ON public.payment_idempotency(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_profile_id ON public.payment_idempotency(profile_id);

-- ============================================
-- 4. RLS Policies for profile_financial_data
-- ============================================
ALTER TABLE public.profile_financial_data ENABLE ROW LEVEL SECURITY;

-- Public can view financial data (for donation wallets on public profiles)
CREATE POLICY "Public can view financial data" ON public.profile_financial_data
    FOR SELECT
    USING (true);

-- Users can only view their own financial data (more restrictive, but public is already covered above)
-- This is redundant but kept for clarity

-- Users can only insert their own financial data
CREATE POLICY "Users can insert own financial data" ON public.profile_financial_data
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = profile_financial_data.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can only update their own financial data
CREATE POLICY "Users can update own financial data" ON public.profile_financial_data
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = profile_financial_data.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- ============================================
-- 5. RLS Policies for user_roles
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Only admins can insert/update roles (enforced in functions)
CREATE POLICY "No direct role inserts" ON public.user_roles
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "No direct role updates" ON public.user_roles
    FOR UPDATE
    USING (false);

-- ============================================
-- 6. RLS Policies for payment_idempotency
-- ============================================
ALTER TABLE public.payment_idempotency ENABLE ROW LEVEL SECURITY;

-- Users can only view their own payment records
CREATE POLICY "Users can view own payments" ON public.payment_idempotency
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = payment_idempotency.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- No direct inserts/updates (only via functions)
CREATE POLICY "No direct payment inserts" ON public.payment_idempotency
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "No direct payment updates" ON public.payment_idempotency
    FOR UPDATE
    USING (false);

-- ============================================
-- 7. Lock down AI chat tables
-- ============================================
-- Update AI support config RLS to owner-only
DROP POLICY IF EXISTS "Users can insert their own AI config" ON public.ai_support_config;
DROP POLICY IF EXISTS "Users can update their own AI config" ON public.ai_support_config;
DROP POLICY IF EXISTS "Users can view their own AI config" ON public.ai_support_config;

CREATE POLICY "Users can view own AI config" ON public.ai_support_config
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = ai_support_config.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own AI config" ON public.ai_support_config
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = ai_support_config.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own AI config" ON public.ai_support_config
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = ai_support_config.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Lock down AI chat messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.ai_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.ai_chat_messages;

CREATE POLICY "Users can view own AI messages" ON public.ai_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = ai_chat_messages.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own AI messages" ON public.ai_chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = ai_chat_messages.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- ============================================
-- 8. Prevent wallet self-minting
-- ============================================
-- Disable direct updates to user_wallets
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;

-- Users can only view their own wallet
-- Updates must go through server function
CREATE POLICY "Users can view own wallet" ON public.user_wallets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = user_wallets.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- ============================================
-- 9. Helper function to check user role
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = required_role
    );
END;
$$;

-- ============================================
-- 10. Function to increment wallet balance (server-side only)
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
    p_profile_id uuid,
    p_amount numeric,
    p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow increments, not decrements
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    UPDATE public.user_wallets
    SET 
        drop_tokens = drop_tokens + p_amount,
        updated_at = now()
    WHERE profile_id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for profile';
    END IF;
END;
$$;



-- End of 20251112000001_security_hardening.sql
-- ============================================================================


-- ============================================================================
-- Migration 4: 20251112000002_add_custom_domain.sql
-- ============================================================================

-- Add custom_domain column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_domain text;

-- Add index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain 
ON public.profiles(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.custom_domain IS 'Custom domain connected to this profile (e.g., example.com)';



-- End of 20251112000002_add_custom_domain.sql
-- ============================================================================


-- ============================================================================
-- Migration 5: 20251116121505_01d03779-7eca-4c27-8e68-e39e6d570a54.sql
-- ============================================================================

-- Create payment_idempotency table for preventing duplicate payment processing
CREATE TABLE IF NOT EXISTS public.payment_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  txid TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_idempotency ENABLE ROW LEVEL SECURITY;

-- Only service role can access (payments are processed server-side only)
CREATE POLICY "Service role can manage payment idempotency"
ON public.payment_idempotency
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index for fast payment_id lookups
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_payment_id 
ON public.payment_idempotency(payment_id);

-- Add index for profile lookups
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_profile_id 
ON public.payment_idempotency(profile_id);

-- Trigger to update updated_at
CREATE TRIGGER update_payment_idempotency_updated_at
BEFORE UPDATE ON public.payment_idempotency
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- End of 20251116121505_01d03779-7eca-4c27-8e68-e39e6d570a54.sql
-- ============================================================================


-- ============================================================================
-- Migration 6: 20251116123200_de993d44-272e-4312-ae0f-f7b6a0e16a7e.sql
-- ============================================================================

-- Fix wallet creation trigger to be idempotent and remove duplicate trigger

-- Update the wallet creation function to handle existing wallets
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to avoid duplicate key errors
  INSERT INTO public.user_wallets (profile_id, drop_tokens)
  VALUES (NEW.id, 0)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Remove the duplicate trigger (keep only one)
DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;

-- End of 20251116123200_de993d44-272e-4312-ae0f-f7b6a0e16a7e.sql
-- ============================================================================


-- ============================================================================
-- Migration 7: 20251118000000_complete_database_remove_restrictions.sql
-- ============================================================================

-- Remove all access restrictions and complete database schema
-- This migration opens all features for all users regardless of subscription

-- First, let's add missing columns and update existing tables

-- Add Pi Network integration columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_user_id TEXT,
ADD COLUMN IF NOT EXISTS pi_username TEXT,
ADD COLUMN IF NOT EXISTS pi_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_verification JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"all": true}';

-- Create link_icons table for custom icons
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default link icons
INSERT INTO public.link_icons (name, icon_url, category, is_default) VALUES
('Twitter', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg', 'social', true),
('Instagram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg', 'social', true),
('Facebook', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg', 'social', true),
('LinkedIn', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg', 'social', true),
('YouTube', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg', 'social', true),
('TikTok', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg', 'social', true),
('Twitch', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg', 'social', true),
('Discord', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg', 'social', true),
('GitHub', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg', 'tech', true),
('Website', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlechrome.svg', 'general', true),
('Email', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg', 'contact', true),
('Phone', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/phone.svg', 'contact', true),
('WhatsApp', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg', 'contact', true),
('Telegram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg', 'contact', true),
('Spotify', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg', 'music', true),
('Apple Music', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/applemusic.svg', 'music', true),
('SoundCloud', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/soundcloud.svg', 'music', true),
('Patreon', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/patreon.svg', 'monetization', true),
('PayPal', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paypal.svg', 'monetization', true),
('Venmo', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/venmo.svg', 'monetization', true),
('CashApp', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/cashapp.svg', 'monetization', true),
('OnlyFans', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/onlyfans.svg', 'monetization', true),
('Medium', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/medium.svg', 'content', true),
('Substack', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/substack.svg', 'content', true),
('Pinterest', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg', 'social', true),
('Snapchat', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg', 'social', true),
('Reddit', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg', 'social', true),
('Clubhouse', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/clubhouse.svg', 'social', true),
('Calendly', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/calendly.svg', 'productivity', true),
('Zoom', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zoom.svg', 'productivity', true)
ON CONFLICT (name) DO NOTHING;

-- Update custom_links to include icon selection
ALTER TABLE public.profiles 
ALTER COLUMN custom_links TYPE JSONB USING custom_links::jsonb;

-- Create analytics_events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'click', 'view', 'share', etc.
    event_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT false,
    verification_code TEXT,
    ssl_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- Create backup_exports table
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL, -- 'full', 'analytics', 'content'
    file_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    reward_amount INTEGER DEFAULT 10, -- in tokens or credits
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_store_url ON public.profiles(store_url);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_created ON public.analytics_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read ON public.notifications(profile_id, read);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);

-- Update RLS policies to be more permissive (remove restrictions)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for profile owner" ON public.profiles;

-- Create permissive policies
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for profile owner or authenticated" ON public.profiles FOR UPDATE USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = pi_user_id OR
    auth.role() = 'authenticated'
);
CREATE POLICY "Enable delete for profile owner" ON public.profiles FOR DELETE USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = pi_user_id
);

-- Remove subscription restrictions from subscriptions table
DROP POLICY IF EXISTS "Enable read for subscription owner" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable update for subscription owner" ON public.subscriptions;

-- Create open subscription policies
CREATE POLICY "Enable full access to subscriptions" ON public.subscriptions FOR ALL USING (true);

-- Remove restrictions from analytics
DROP POLICY IF EXISTS "Enable read for analytics owner" ON public.analytics;
DROP POLICY IF EXISTS "Enable insert for all" ON public.analytics;

CREATE POLICY "Enable full access to analytics" ON public.analytics FOR ALL USING (true);

-- Remove restrictions from user_wallets
DROP POLICY IF EXISTS "Enable read for wallet owner" ON public.user_wallets;
DROP POLICY IF EXISTS "Enable update for wallet owner" ON public.user_wallets;

CREATE POLICY "Enable full access to user_wallets" ON public.user_wallets FOR ALL USING (true);

-- Add policies for new tables
ALTER TABLE public.link_icons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for link_icons" ON public.link_icons FOR SELECT USING (true);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to analytics_events" ON public.analytics_events FOR ALL USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for notification owner" ON public.notifications FOR SELECT USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);
CREATE POLICY "Enable insert for authenticated users" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for notification owner" ON public.notifications FOR UPDATE USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to custom_domains" ON public.custom_domains FOR ALL USING (true);

ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for export owner" ON public.backup_exports FOR ALL USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all referral_codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Enable manage for referral owner" ON public.referral_codes FOR ALL USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

-- Update the get_active_subscription function to always return premium access
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_profile_id uuid) 
RETURNS TABLE(plan_type text, billing_period text, end_date timestamp with time zone, status text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always return premium access for now
  RETURN QUERY
  SELECT 
    'premium'::text as plan_type,
    'lifetime'::text as billing_period,
    (now() + interval '100 years')::timestamptz as end_date,
    'active'::text as status;
END;
$$;

-- Create function to handle Pi user authentication
CREATE OR REPLACE FUNCTION public.handle_pi_auth(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_wallet_address TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Check if profile already exists
    SELECT id INTO profile_id
    FROM public.profiles
    WHERE pi_user_id = p_pi_user_id;
    
    IF profile_id IS NULL THEN
        -- Create new profile
        INSERT INTO public.profiles (
            pi_user_id,
            pi_username,
            pi_wallet_address,
            username,
            business_name,
            auth_provider,
            features_enabled
        ) VALUES (
            p_pi_user_id,
            p_pi_username,
            p_wallet_address,
            p_pi_username,
            p_pi_username || '''s Page',
            'pi_network',
            '{"all": true}'::jsonb
        ) RETURNING id INTO profile_id;
        
        -- Create default subscription (premium)
        INSERT INTO public.subscriptions (
            profile_id,
            plan_type,
            status,
            billing_period,
            amount,
            end_date
        ) VALUES (
            profile_id,
            'premium',
            'active',
            'lifetime',
            0,
            now() + interval '100 years'
        );
        
    ELSE
        -- Update existing profile
        UPDATE public.profiles
        SET 
            pi_username = p_pi_username,
            pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
            updated_at = now()
        WHERE id = profile_id;
    END IF;
    
    RETURN profile_id;
END;
$$;

-- Create function for email users to link Pi account
CREATE OR REPLACE FUNCTION public.link_pi_account(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_wallet_address TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        pi_user_id = p_pi_user_id,
        pi_username = p_pi_username,
        pi_wallet_address = p_wallet_address,
        updated_at = now()
    WHERE id = p_profile_id;
    
    -- Upgrade to premium if not already
    INSERT INTO public.subscriptions (
        profile_id,
        plan_type,
        status,
        billing_period,
        amount,
        end_date
    ) VALUES (
        p_profile_id,
        'premium',
        'active',
        'lifetime',
        0,
        now() + interval '100 years'
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        plan_type = 'premium',
        status = 'active',
        end_date = now() + interval '100 years';
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- End of 20251118000000_complete_database_remove_restrictions.sql
-- ============================================================================


-- ============================================================================
-- Migration 8: 20251118000001_complete_database_schema.sql
-- ============================================================================

-- Complete Droplink Database Schema
-- This creates all required tables for the Droplink application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (main user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User identification
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For email/Gmail users
    username TEXT UNIQUE NOT NULL,
    pi_user_id TEXT, -- For Pi Network users
    
    -- Profile information
    business_name TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    
    -- Social links (stored as JSONB)
    social_links JSONB DEFAULT '{}',
    
    -- Theme settings (stored as JSONB)
    theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "backgroundColor": "#000000", "iconStyle": "rounded", "buttonStyle": "filled", "customLinks": []}',
    
    -- Premium features
    has_premium BOOLEAN DEFAULT false,
    show_share_button BOOLEAN DEFAULT true,
    
    -- Pi Network integration
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    
    -- Financial data (encrypted)
    crypto_wallets JSONB DEFAULT '{"wallets": []}',
    bank_details JSONB DEFAULT '{"accounts": []}',
    
    -- YouTube video
    youtube_video_url TEXT DEFAULT ''
);

-- Create products table (digital products for sale)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT NOT NULL DEFAULT '0',
    file_url TEXT DEFAULT '',
    
    -- Product settings
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0
);

-- Create followers table (user follow relationships)
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    follower_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Prevent duplicate follows
    UNIQUE(follower_profile_id, following_profile_id),
    -- Prevent self-follows
    CHECK (follower_profile_id != following_profile_id)
);

-- Create analytics table (page views and interactions)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'view', 'click', 'social_click', 'product_click', 'ai_chat'
    event_data JSONB DEFAULT '{}',
    
    -- Browser/session info
    user_agent TEXT DEFAULT '',
    ip_address INET,
    session_id TEXT DEFAULT ''
);

-- Create subscriptions table (premium plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    
    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Payment info
    payment_method TEXT DEFAULT 'pi_network',
    amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD'
);

-- Create gifts table (Pi Network gifts between users)
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    gift_type TEXT NOT NULL DEFAULT 'pi_coins',
    amount DECIMAL(10,8) NOT NULL DEFAULT 0.00000001,
    message TEXT DEFAULT '',
    
    -- Pi Network transaction info
    pi_payment_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Create link_icons table (custom icons for links)
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    name TEXT UNIQUE NOT NULL,
    icon_data TEXT NOT NULL, -- SVG or icon identifier
    category TEXT DEFAULT 'custom'
);

-- Create notifications table (user notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    is_read BOOLEAN DEFAULT false,
    action_url TEXT DEFAULT ''
);

-- Create custom_domains table (user custom domains)
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT DEFAULT '',
    
    -- DNS settings
    dns_records JSONB DEFAULT '{}',
    ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed'))
);

-- Create backup_exports table (user data exports)
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL DEFAULT 'full' CHECK (export_type IN ('full', 'analytics', 'content')),
    file_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Export metadata
    file_size BIGINT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days')
);

-- Create referral_codes table (referral system)
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    
    -- Rewards
    reward_type TEXT DEFAULT 'premium_days',
    reward_value INTEGER DEFAULT 30, -- days, pi_coins, etc.
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 year')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products(profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON public.gifts(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_gifts_receiver_id ON public.gifts(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_profile_id ON public.custom_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_subscriptions ON public.subscriptions;
CREATE TRIGGER set_timestamp_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_custom_domains ON public.custom_domains;
CREATE TRIGGER set_timestamp_custom_domains
    BEFORE UPDATE ON public.custom_domains
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Insert default link icons
INSERT INTO public.link_icons (name, icon_data, category) VALUES
('shop', 'shopping-bag', 'ecommerce'),
('mail', 'mail', 'contact'),
('phone', 'phone', 'contact'),
('calendar', 'calendar', 'booking'),
('download', 'download', 'files'),
('external', 'external-link', 'general'),
('heart', 'heart', 'social'),
('star', 'star', 'featured'),
('zap', 'zap', 'energy'),
('link', 'link', 'general'),
('wallet', 'wallet', 'payment'),
('gift', 'gift', 'special')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies (for development - can be tightened later)

-- Profiles: Public read, authenticated users can manage their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (true);

-- Products: Public read, profile owners can manage
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profile owners can manage their products" ON public.products;
CREATE POLICY "Profile owners can manage their products" ON public.products
    FOR ALL USING (true);

-- Followers: Public read, authenticated users can manage their relationships
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON public.followers;
CREATE POLICY "Followers are viewable by everyone" ON public.followers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their follow relationships" ON public.followers;
CREATE POLICY "Users can manage their follow relationships" ON public.followers
    FOR ALL USING (true);

-- Analytics: Profile owners can view their analytics
DROP POLICY IF EXISTS "Analytics are viewable by profile owners" ON public.analytics;
CREATE POLICY "Analytics are viewable by profile owners" ON public.analytics
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Analytics can be inserted by anyone" ON public.analytics;
CREATE POLICY "Analytics can be inserted by anyone" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- Other tables: Permissive policies for development
DROP POLICY IF EXISTS "Subscriptions are manageable" ON public.subscriptions;
CREATE POLICY "Subscriptions are manageable" ON public.subscriptions
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Gifts are manageable" ON public.gifts;
CREATE POLICY "Gifts are manageable" ON public.gifts
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Notifications are manageable" ON public.notifications;
CREATE POLICY "Notifications are manageable" ON public.notifications
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Custom domains are manageable" ON public.custom_domains;
CREATE POLICY "Custom domains are manageable" ON public.custom_domains
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Backup exports are manageable" ON public.backup_exports;
CREATE POLICY "Backup exports are manageable" ON public.backup_exports
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Referral codes are manageable" ON public.referral_codes;
CREATE POLICY "Referral codes are manageable" ON public.referral_codes
    FOR ALL USING (true);

-- Link icons: Public read access
DROP POLICY IF EXISTS "Link icons are viewable by everyone" ON public.link_icons;
CREATE POLICY "Link icons are viewable by everyone" ON public.link_icons
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;

GRANT SELECT ON public.followers TO anon;
GRANT ALL ON public.followers TO authenticated;

GRANT SELECT, INSERT ON public.analytics TO anon;
GRANT ALL ON public.analytics TO authenticated;

GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.gifts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.custom_domains TO authenticated;
GRANT ALL ON public.backup_exports TO authenticated;
GRANT ALL ON public.referral_codes TO authenticated;

GRANT SELECT ON public.link_icons TO anon;
GRANT SELECT ON public.link_icons TO authenticated;

-- Create sample data for testing (optional)
-- Uncomment if you want some sample data

/*
INSERT INTO public.profiles (username, business_name, description, pi_user_id) VALUES
('testuser', 'Test Business', 'A sample business profile for testing Droplink features.', 'pi_test_123')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.products (profile_id, title, description, price) 
SELECT id, 'Sample Digital Product', 'This is a sample product for testing.', '$9.99'
FROM public.profiles WHERE username = 'testuser'
ON CONFLICT DO NOTHING;
*/

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- End of 20251118000001_complete_database_schema.sql
-- ============================================================================


-- ============================================================================
-- Migration 9: 20251118000002_pi_network_enhancements.sql
-- ============================================================================

-- Enhanced Pi Network Integration and Public Sharing
-- This supplements the existing migration with Pi-specific features

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to profiles table for Pi Network integration
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS pi_user_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for Pi user ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error', 'gift', 'follow', 'payment'))
);

-- Create custom_domains table for public sharing
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create link_icons table for custom link styling
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    link_url TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    icon_color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral_codes table for growth features
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create backup_exports table for data portability
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL DEFAULT 'full',
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT backup_exports_type_check CHECK (export_type IN ('full', 'profile', 'analytics')),
    CONSTRAINT backup_exports_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_domains_profile_id ON public.custom_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_is_verified ON public.custom_domains(is_verified);

CREATE INDEX IF NOT EXISTS idx_link_icons_profile_id ON public.link_icons(profile_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON public.referral_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON public.referral_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_backup_exports_profile_id ON public.backup_exports(profile_id);
CREATE INDEX IF NOT EXISTS idx_backup_exports_status ON public.backup_exports(status);

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON public.custom_domains;
CREATE TRIGGER update_custom_domains_updated_at 
  BEFORE UPDATE ON public.custom_domains 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_link_icons_updated_at ON public.link_icons;
CREATE TRIGGER update_link_icons_updated_at 
  BEFORE UPDATE ON public.link_icons 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER update_referral_codes_updated_at 
  BEFORE UPDATE ON public.referral_codes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for custom_domains (public read for verification)
CREATE POLICY "Anyone can view custom domains" ON public.custom_domains
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own domains" ON public.custom_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = custom_domains.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for link_icons
CREATE POLICY "Anyone can view link icons" ON public.link_icons
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own link icons" ON public.link_icons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = link_icons.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for referral_codes
CREATE POLICY "Anyone can view active referral codes" ON public.referral_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own referral codes" ON public.referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = referral_codes.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for backup_exports
CREATE POLICY "Users can view their own backup exports" ON public.backup_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = backup_exports.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own backup exports" ON public.backup_exports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = backup_exports.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT ALL ON public.custom_domains TO anon, authenticated;
GRANT ALL ON public.link_icons TO anon, authenticated;
GRANT ALL ON public.referral_codes TO anon, authenticated;
GRANT ALL ON public.backup_exports TO anon, authenticated;

-- Insert some default gift options if gifts table is empty
INSERT INTO public.gifts (name, icon, drop_token_cost)
VALUES 
  ('Coffee', '☕', 10),
  ('Heart', '❤️', 15),
  ('Star', '⭐', 20),
  ('Trophy', '🏆', 50),
  ('Diamond', '💎', 100)
ON CONFLICT DO NOTHING;

-- Create public share link function
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_username text)
RETURNS TABLE(
  id UUID,
  username TEXT,
  business_name TEXT,
  description TEXT,
  logo TEXT,
  social_links JSONB,
  theme_settings JSONB,
  youtube_video_url TEXT,
  show_share_button BOOLEAN,
  pi_donation_message TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.business_name,
    p.description,
    p.logo,
    p.social_links,
    p.theme_settings,
    p.youtube_video_url,
    p.show_share_button,
    p.pi_donation_message,
    p.created_at
  FROM public.profiles p
  WHERE p.username = profile_username 
    AND p.is_active = true;
END;
$$;

-- Create analytics tracking function for public views
CREATE OR REPLACE FUNCTION public.track_profile_view(
  profile_username text,
  visitor_ip text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  location_country text DEFAULT NULL,
  location_city text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_profile_id UUID;
BEGIN
  -- Get the profile ID
  SELECT id INTO target_profile_id
  FROM public.profiles
  WHERE username = profile_username
    AND is_active = true;
    
  -- Insert analytics record if profile exists
  IF target_profile_id IS NOT NULL THEN
    INSERT INTO public.analytics (
      profile_id,
      event_type,
      event_data,
      visitor_ip,
      user_agent,
      location_country,
      location_city
    )
    VALUES (
      target_profile_id,
      'view',
      '{"source": "public_share"}',
      visitor_ip,
      user_agent,
      location_country,
      location_city
    );
  END IF;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_profile_view(text, text, text, text, text) TO anon, authenticated;

-- Update existing RLS policies to be more permissive for public sharing
-- Allow anyone to view profiles (for public sharing)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (is_active = true);

-- Allow anyone to insert analytics (for public tracking)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics" ON public.analytics
  FOR INSERT WITH CHECK (true);

-- Create a policy for users to manage their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- End of 20251118000002_pi_network_enhancements.sql
-- ============================================================================


-- ============================================================================
-- Migration 10: 20251118000003_user_preferences_and_persistence.sql
-- ============================================================================

-- Enhanced Database Schema for User Preferences and Data Persistence
-- This migration adds comprehensive user preference storage that survives app updates

-- Create user_preferences table for persistent settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- App preferences
    theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
    primary_color TEXT DEFAULT '#3b82f6',
    background_color TEXT DEFAULT '#000000',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    
    -- Dashboard layout preferences
    dashboard_layout JSONB DEFAULT '{"sidebarCollapsed": false, "previewMode": "phone", "activeTab": "profile"}',
    
    -- Store preferences
    store_settings JSONB DEFAULT '{"showFollowerCount": true, "showVisitCount": true, "enableComments": true}',
    
    -- Social preferences  
    social_settings JSONB DEFAULT '{"allowFollows": true, "showOnline": true, "enableNotifications": true}',
    
    -- Content preferences
    content_settings JSONB DEFAULT '{"autoSave": true, "draftsEnabled": true, "backupEnabled": true}',
    
    -- Privacy settings
    privacy_settings JSONB DEFAULT '{"profileVisible": true, "analyticsEnabled": true, "dataCollection": true}',
    
    -- Notification preferences
    notification_settings JSONB DEFAULT '{"email": true, "browser": true, "marketing": false}',
    
    -- Feature flags and experiment participation
    feature_flags JSONB DEFAULT '{}',
    experiments JSONB DEFAULT '{}',
    
    -- App usage data (non-PII)
    usage_data JSONB DEFAULT '{"lastActive": null, "totalSessions": 0, "favoriteFeatures": []}',
    
    -- Custom user data
    custom_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON public.user_preferences(profile_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Enhanced profiles table with additional persistence fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_app_version TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_install_date TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feature_tour_completed JSONB DEFAULT '{}';

-- App version tracking table
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_number TEXT NOT NULL UNIQUE,
    release_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    features JSONB DEFAULT '[]',
    breaking_changes JSONB DEFAULT '[]',
    migration_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert current version
INSERT INTO public.app_versions (version_number, features, is_active) VALUES 
('1.0.0', '["Pi Network Integration", "Supabase Database", "User Profiles", "Analytics", "Social Features"]', true)
ON CONFLICT (version_number) DO NOTHING;

-- User sessions table for better session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_end TIMESTAMP WITH TIME ZONE,
    auth_method TEXT CHECK (auth_method IN ('pi_network', 'email', 'google')),
    device_info JSONB DEFAULT '{}',
    app_version TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_id ON public.user_sessions(profile_id);

-- Enhanced analytics with user journey tracking
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}';
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.user_sessions(id);

-- User feedback and feature requests table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature_request', 'improvement', 'compliment')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'completed', 'rejected')),
    votes INTEGER DEFAULT 0,
    admin_response TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature roadmap table (public visible)
CREATE TABLE IF NOT EXISTS public.feature_roadmap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'planned' CHECK (status IN ('idea', 'planned', 'in_development', 'testing', 'released')),
    target_quarter TEXT, -- e.g., 'Q1 2025'
    estimated_completion DATE,
    pi_earnings_potential TEXT, -- How this feature helps users earn Pi
    user_votes INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some example roadmap features
INSERT INTO public.feature_roadmap (title, description, category, status, pi_earnings_potential, is_public, tags) VALUES 
('Pi Network Marketplace Integration', 'Direct integration with Pi Network marketplace for selling products', 'commerce', 'planned', 'Earn Pi by selling products directly through your Droplink store', true, '{"pi-network", "commerce", "earnings"}'),
('Advanced Analytics Dashboard', 'Detailed analytics with revenue tracking and customer insights', 'analytics', 'in_development', 'Optimize your store performance to increase Pi earnings', true, '{"analytics", "insights", "optimization"}'),
('Social Commerce Features', 'Group buying, affiliate marketing, and social selling tools', 'social', 'planned', 'Earn commissions and bonuses through social selling', true, '{"social", "affiliate", "earning"}'),
('Pi Wallet Integration', 'Direct Pi wallet connection for seamless transactions', 'payments', 'planned', 'Accept Pi payments directly in your store', true, '{"pi-network", "payments", "wallet"}'),
('Creator Monetization Tools', 'Tools for content creators to monetize their audience', 'monetization', 'idea', 'New revenue streams for content creators using Pi Network', true, '{"creators", "monetization", "content"}')
ON CONFLICT DO NOTHING;

-- User achievements and gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    category TEXT DEFAULT 'general',
    points INTEGER DEFAULT 0,
    pi_bonus DECIMAL(10,8) DEFAULT 0, -- Potential Pi rewards
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_feedback
CREATE POLICY "Users can view own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for roadmap and app versions
CREATE POLICY "Everyone can view roadmap" ON public.feature_roadmap
    FOR SELECT USING (is_public = true);

CREATE POLICY "Everyone can view app versions" ON public.app_versions
    FOR SELECT USING (true);

-- RLS Policies for user_achievements  
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default preferences when a new profile is created
    INSERT INTO public.user_preferences (
        user_id, 
        profile_id,
        dashboard_layout,
        store_settings,
        social_settings,
        content_settings,
        privacy_settings,
        notification_settings
    ) VALUES (
        NEW.user_id,
        NEW.id,
        '{"sidebarCollapsed": false, "previewMode": "phone", "activeTab": "profile"}',
        '{"showFollowerCount": true, "showVisitCount": true, "enableComments": true}',
        '{"allowFollows": true, "showOnline": true, "enableNotifications": true}',
        '{"autoSave": true, "draftsEnabled": true, "backupEnabled": true}',
        '{"profileVisible": true, "analyticsEnabled": true, "dataCollection": true}',
        '{"email": true, "browser": true, "marketing": false}'
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preferences for new profiles
CREATE TRIGGER trigger_create_default_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_preferences();

-- Function to track user login
CREATE OR REPLACE FUNCTION track_user_login(user_uuid UUID, auth_method_param TEXT DEFAULT 'unknown')
RETURNS UUID AS $$
DECLARE
    session_uuid UUID;
    profile_record RECORD;
BEGIN
    -- Get user's profile
    SELECT * INTO profile_record FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
    
    IF profile_record.id IS NOT NULL THEN
        -- Update profile login stats
        UPDATE public.profiles 
        SET total_logins = COALESCE(total_logins, 0) + 1,
            last_login = now(),
            last_app_version = '1.0.0'
        WHERE user_id = user_uuid;
        
        -- Create session record
        INSERT INTO public.user_sessions (
            user_id, 
            profile_id, 
            auth_method, 
            app_version
        ) VALUES (
            user_uuid,
            profile_record.id,
            auth_method_param,
            '1.0.0'
        ) RETURNING id INTO session_uuid;
    END IF;
    
    RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.user_preferences IS 'Stores all user preferences and settings that persist across app updates and sign-outs';
COMMENT ON TABLE public.user_sessions IS 'Tracks user login sessions for analytics and security';
COMMENT ON TABLE public.feature_roadmap IS 'Public roadmap of planned features and Pi earning opportunities';
COMMENT ON TABLE public.user_feedback IS 'User feedback, feature requests, and bug reports';
COMMENT ON TABLE public.user_achievements IS 'User achievements and gamification elements';

-- Create view for user dashboard data
CREATE OR REPLACE VIEW public.user_dashboard_data AS
SELECT 
    p.id as profile_id,
    p.username,
    p.business_name,
    p.total_logins,
    p.last_login,
    p.onboarding_completed,
    up.theme_mode,
    up.dashboard_layout,
    up.store_settings,
    up.usage_data,
    COUNT(DISTINCT f.id) as followers_count,
    COUNT(DISTINCT a.id) as analytics_count,
    COUNT(DISTINCT ua.id) as achievements_count
FROM public.profiles p
LEFT JOIN public.user_preferences up ON up.profile_id = p.id
LEFT JOIN public.followers f ON f.following_profile_id = p.id
LEFT JOIN public.analytics a ON a.profile_id = p.id
LEFT JOIN public.user_achievements ua ON ua.profile_id = p.id
GROUP BY p.id, p.username, p.business_name, p.total_logins, p.last_login, p.onboarding_completed,
         up.theme_mode, up.dashboard_layout, up.store_settings, up.usage_data;

-- End of 20251118000003_user_preferences_and_persistence.sql
-- ============================================================================


-- ============================================================================
-- Migration 11: 20251119000000_voting_system.sql
-- ============================================================================

-- Create feature_requests table
CREATE TABLE IF NOT EXISTS feature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'feature',
    status VARCHAR(20) NOT NULL DEFAULT 'proposed',
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_votes table
CREATE TABLE IF NOT EXISTS feature_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_by ON feature_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes(user_id);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_requests
CREATE POLICY "Anyone can read feature requests" ON feature_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create feature requests" ON feature_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own feature requests" ON feature_requests FOR UPDATE USING (created_by = (SELECT id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for feature_votes
CREATE POLICY "Anyone can read votes" ON feature_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON feature_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own votes" ON feature_votes FOR UPDATE USING (user_id = (SELECT id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete their own votes" ON feature_votes FOR DELETE USING (user_id = (SELECT id FROM profiles WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feature_requests_updated_at 
    BEFORE UPDATE ON feature_requests 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- End of 20251119000000_voting_system.sql
-- ============================================================================


-- ============================================================================
-- Migration 12: 20251119120000_payment_links_and_features.sql
-- ============================================================================

-- Payment Links and Enhanced Features Migration
-- This adds payment links table and ensures all user features are saved to database

-- Create payment_links table for Pi Network payment checkout links
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Associated profile
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL, -- Pi Network user ID for quick lookups
    
    -- Payment link details
    link_id TEXT UNIQUE NOT NULL, -- Custom link ID (e.g., pl_123456789)
    amount DECIMAL(10,8) NOT NULL, -- Pi amount (supports up to 8 decimal places)
    description TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('product', 'donation', 'tip', 'subscription', 'group')),
    
    -- Link settings
    is_active BOOLEAN DEFAULT true,
    payment_url TEXT NOT NULL, -- Full checkout URL
    
    -- Analytics
    total_received DECIMAL(10,8) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_payment_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}' -- Additional data like custom fields, expiration, etc.
);

-- Create payment_transactions table for tracking Pi Network payments
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Payment link reference
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction details
    transaction_id TEXT UNIQUE NOT NULL, -- Pi Network transaction ID
    payment_id TEXT, -- Pi payment ID from SDK
    amount DECIMAL(10,8) NOT NULL,
    fee DECIMAL(10,8) DEFAULT 0,
    
    -- Addresses
    sender_address TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    
    -- Status and metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    memo TEXT DEFAULT '',
    pi_metadata JSONB DEFAULT '{}',
    
    -- Blockchain info
    block_height BIGINT,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Add custom_links column to profiles if not exists (for better database storage)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'custom_links') THEN
        ALTER TABLE public.profiles ADD COLUMN custom_links JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add store_url column to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'store_url') THEN
        ALTER TABLE public.profiles ADD COLUMN store_url TEXT DEFAULT '';
    END IF;
END $$;

-- Add youtube_video_url column to profiles if not exists (ensure it exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'youtube_video_url') THEN
        ALTER TABLE public.profiles ADD COLUMN youtube_video_url TEXT DEFAULT '';
    END IF;
END $$;

-- Create profile_financial_data table for financial information
CREATE TABLE IF NOT EXISTS public.profile_financial_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Pi Network financial data
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    
    -- Crypto wallets (stored as JSONB)
    crypto_wallets JSONB DEFAULT '{}',
    
    -- Bank details (encrypted, stored as JSONB)
    bank_details JSONB DEFAULT '{}'
);

-- Update theme_settings to include all theme options
ALTER TABLE public.profiles ALTER COLUMN theme_settings SET DEFAULT '{
    "primaryColor": "#3b82f6",
    "backgroundColor": "#000000",
    "backgroundType": "color",
    "backgroundGif": "",
    "iconStyle": "rounded",
    "buttonStyle": "filled"
}';

-- Create user_sessions table for better session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    
    -- Session data
    user_agent TEXT DEFAULT '',
    ip_address INET,
    device_info JSONB DEFAULT '{}',
    
    -- Pi Network authentication
    pi_access_token TEXT DEFAULT '',
    pi_user_data JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '30 days')
);

-- Enhanced analytics with user journey tracking (fix session_id reference)
DO $$
BEGIN
    -- Add session_id column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'session_id') THEN
        ALTER TABLE public.analytics ADD COLUMN session_id TEXT DEFAULT '';
    END IF;
    
    -- Add user_preferences column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'user_preferences') THEN
        ALTER TABLE public.analytics ADD COLUMN user_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create feature_usage table for tracking feature usage analytics
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feature_name TEXT NOT NULL, -- 'payment_links', 'custom_links', 'ai_chat', 'analytics', etc.
    usage_type TEXT NOT NULL, -- 'created', 'used', 'clicked', 'viewed', etc.
    
    -- Usage data
    usage_data JSONB DEFAULT '{}',
    session_id TEXT DEFAULT '',
    
    -- Analytics metadata
    user_agent TEXT DEFAULT '',
    ip_address INET
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_links_profile_id ON public.payment_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_pi_user_id ON public.payment_links(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_link_id ON public.payment_links(link_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON public.payment_links(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_link_id ON public.payment_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_profile_id ON public.payment_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_id ON public.user_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_feature_usage_profile_id ON public.feature_usage(profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON public.feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_created_at ON public.feature_usage(created_at);

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS set_timestamp_payment_links ON public.payment_links;
CREATE TRIGGER set_timestamp_payment_links
    BEFORE UPDATE ON public.payment_links
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_payment_transactions ON public.payment_transactions;
CREATE TRIGGER set_timestamp_payment_transactions
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_sessions ON public.user_sessions;
CREATE TRIGGER set_timestamp_user_sessions
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security for new tables
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_financial_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_links
DROP POLICY IF EXISTS "Payment links are viewable by everyone" ON public.payment_links;
CREATE POLICY "Payment links are viewable by everyone" ON public.payment_links
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage their payment links" ON public.payment_links;
CREATE POLICY "Users can manage their payment links" ON public.payment_links
    FOR ALL USING (true);

-- Create RLS policies for payment_transactions
DROP POLICY IF EXISTS "Payment transactions are viewable by profile owners" ON public.payment_transactions;
CREATE POLICY "Payment transactions are viewable by profile owners" ON public.payment_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Payment transactions can be inserted" ON public.payment_transactions;
CREATE POLICY "Payment transactions can be inserted" ON public.payment_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Payment transactions can be updated" ON public.payment_transactions;
CREATE POLICY "Payment transactions can be updated" ON public.payment_transactions
    FOR UPDATE USING (true);

-- Create RLS policies for user_sessions
DROP POLICY IF EXISTS "User sessions are manageable by profile owners" ON public.user_sessions;
CREATE POLICY "User sessions are manageable by profile owners" ON public.user_sessions
    FOR ALL USING (true);

-- Create RLS policies for feature_usage
DROP POLICY IF EXISTS "Feature usage is viewable by profile owners" ON public.feature_usage;
CREATE POLICY "Feature usage is viewable by profile owners" ON public.feature_usage
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Feature usage can be tracked" ON public.feature_usage;
CREATE POLICY "Feature usage can be tracked" ON public.feature_usage
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for profile_financial_data
DROP POLICY IF EXISTS "Financial data is viewable by profile owners" ON public.profile_financial_data;
CREATE POLICY "Financial data is viewable by profile owners" ON public.profile_financial_data
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Financial data can be managed by profile owners" ON public.profile_financial_data;
CREATE POLICY "Financial data can be managed by profile owners" ON public.profile_financial_data
    FOR ALL USING (true);

-- Grant permissions for new tables
GRANT ALL ON public.payment_links TO authenticated;
GRANT SELECT ON public.payment_links TO anon;

GRANT ALL ON public.payment_transactions TO authenticated;
GRANT SELECT ON public.payment_transactions TO anon;

GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.feature_usage TO authenticated;
GRANT ALL ON public.profile_financial_data TO authenticated;

-- Create function to automatically update payment link analytics
CREATE OR REPLACE FUNCTION update_payment_link_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update payment link stats when a transaction is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.payment_links 
        SET 
            total_received = total_received + NEW.amount,
            transaction_count = transaction_count + 1,
            last_payment_at = NEW.updated_at
        WHERE id = NEW.payment_link_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment analytics
DROP TRIGGER IF EXISTS trigger_update_payment_analytics ON public.payment_transactions;
CREATE TRIGGER trigger_update_payment_analytics
    AFTER INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_link_analytics();

-- Create function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_profile_id UUID,
    p_feature_name TEXT,
    p_usage_type TEXT,
    p_usage_data JSONB DEFAULT '{}',
    p_session_id TEXT DEFAULT '',
    p_user_agent TEXT DEFAULT '',
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO public.feature_usage (
        profile_id,
        feature_name,
        usage_type,
        usage_data,
        session_id,
        user_agent,
        ip_address
    ) VALUES (
        p_profile_id,
        p_feature_name,
        p_usage_type,
        p_usage_data,
        p_session_id,
        p_user_agent,
        p_ip_address
    ) RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user payment links
CREATE OR REPLACE FUNCTION get_user_payment_links(p_pi_user_id TEXT)
RETURNS TABLE (
    id UUID,
    link_id TEXT,
    amount DECIMAL,
    description TEXT,
    payment_type TEXT,
    is_active BOOLEAN,
    payment_url TEXT,
    total_received DECIMAL,
    transaction_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.link_id,
        pl.amount,
        pl.description,
        pl.payment_type,
        pl.is_active,
        pl.payment_url,
        pl.total_received,
        pl.transaction_count,
        pl.created_at,
        pl.updated_at
    FROM public.payment_links pl
    WHERE pl.pi_user_id = p_pi_user_id
    ORDER BY pl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync payment links from localStorage to database
CREATE OR REPLACE FUNCTION sync_payment_links_to_db(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_payment_links JSONB
)
RETURNS INTEGER AS $$
DECLARE
    payment_link JSONB;
    links_synced INTEGER := 0;
BEGIN
    -- Clear existing payment links for this user
    DELETE FROM public.payment_links WHERE pi_user_id = p_pi_user_id;
    
    -- Insert payment links from JSONB array
    FOR payment_link IN SELECT * FROM jsonb_array_elements(p_payment_links)
    LOOP
        INSERT INTO public.payment_links (
            profile_id,
            pi_user_id,
            link_id,
            amount,
            description,
            payment_type,
            is_active,
            payment_url,
            total_received,
            transaction_count,
            created_at
        ) VALUES (
            p_profile_id,
            p_pi_user_id,
            payment_link->>'id',
            (payment_link->>'amount')::DECIMAL,
            payment_link->>'description',
            payment_link->>'type',
            (payment_link->>'active')::BOOLEAN,
            payment_link->>'url',
            (payment_link->>'totalReceived')::DECIMAL,
            (payment_link->>'transactionCount')::INTEGER,
            (payment_link->>'created')::TIMESTAMP WITH TIME ZONE
        );
        
        links_synced := links_synced + 1;
    END LOOP;
    
    RETURN links_synced;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION track_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_links TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_links TO anon;
GRANT EXECUTE ON FUNCTION sync_payment_links_to_db TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Add sample data for testing (optional)
-- This creates a sample payment link for testing
/*
INSERT INTO public.payment_links (
    profile_id, 
    pi_user_id, 
    link_id, 
    amount, 
    description, 
    payment_type, 
    payment_url
) 
SELECT 
    p.id,
    p.pi_user_id,
    'pl_sample_123',
    1.00,
    'Sample Payment Link',
    'tip',
    'https://droplink.vercel.app/pay/pl_sample_123'
FROM public.profiles p 
WHERE p.pi_user_id IS NOT NULL 
LIMIT 1
ON CONFLICT (link_id) DO NOTHING;
*/

-- End of 20251119120000_payment_links_and_features.sql
-- ============================================================================


-- ============================================================================
-- Migration 13: 20251119120001_migrate_user_data.sql
-- ============================================================================

-- Data Migration and Utilities for Payment Links
-- Execute this AFTER running 20251119120000_payment_links_and_features.sql

-- First, ensure the main migration has been run
-- You must run 20251119120000_payment_links_and_features.sql before this file

-- Ensure analytics table has session_id column (fix for existing installations)
DO $$
BEGIN
    -- Add session_id column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'session_id') THEN
        ALTER TABLE public.analytics ADD COLUMN session_id TEXT DEFAULT '';
    END IF;
    
    -- Add user_preferences column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'user_preferences') THEN
        ALTER TABLE public.analytics ADD COLUMN user_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create a function to migrate existing user data
CREATE OR REPLACE FUNCTION migrate_existing_user_data()
RETURNS INTEGER AS $$
DECLARE
    profile_record RECORD;
    migrated_count INTEGER := 0;
    payment_links_data JSONB;
    custom_links_data JSONB;
BEGIN
    -- Loop through all profiles with theme_settings containing payment links
    FOR profile_record IN 
        SELECT id, pi_user_id, theme_settings, username
        FROM public.profiles 
        WHERE theme_settings ? 'paymentLinks'
        AND pi_user_id IS NOT NULL
    LOOP
        -- Extract payment links from theme_settings
        payment_links_data := profile_record.theme_settings->'paymentLinks';
        
        -- Migrate payment links to dedicated table
        IF payment_links_data IS NOT NULL AND jsonb_array_length(payment_links_data) > 0 THEN
            INSERT INTO public.payment_links (
                profile_id,
                pi_user_id,
                link_id,
                amount,
                description,
                payment_type,
                is_active,
                payment_url,
                total_received,
                transaction_count,
                created_at
            )
            SELECT 
                profile_record.id,
                profile_record.pi_user_id,
                link->>'id',
                (link->>'amount')::DECIMAL,
                link->>'description',
                link->>'type',
                (link->>'active')::BOOLEAN,
                link->>'url',
                COALESCE((link->>'totalReceived')::DECIMAL, 0),
                COALESCE((link->>'transactionCount')::INTEGER, 0),
                (link->>'created')::TIMESTAMP WITH TIME ZONE
            FROM jsonb_array_elements(payment_links_data) AS link
            ON CONFLICT (link_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                description = EXCLUDED.description,
                payment_type = EXCLUDED.payment_type,
                is_active = EXCLUDED.is_active,
                payment_url = EXCLUDED.payment_url,
                total_received = EXCLUDED.total_received,
                transaction_count = EXCLUDED.transaction_count;
        END IF;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration (uncomment to run)
-- SELECT migrate_existing_user_data();

-- Create a function to sync payment links from the app
CREATE OR REPLACE FUNCTION sync_user_payment_links(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_payment_links JSONB
)
RETURNS TABLE (
    synced_links INTEGER,
    total_links INTEGER
) AS $$
DECLARE
    links_synced INTEGER := 0;
    total_links INTEGER := 0;
    link_record JSONB;
BEGIN
    -- Delete existing payment links for this user
    DELETE FROM public.payment_links WHERE pi_user_id = p_pi_user_id;
    
    -- Count total links
    total_links := jsonb_array_length(p_payment_links);
    
    -- Insert new payment links
    FOR link_record IN SELECT * FROM jsonb_array_elements(p_payment_links)
    LOOP
        INSERT INTO public.payment_links (
            profile_id,
            pi_user_id,
            link_id,
            amount,
            description,
            payment_type,
            is_active,
            payment_url,
            total_received,
            transaction_count,
            created_at,
            metadata
        ) VALUES (
            p_profile_id,
            p_pi_user_id,
            link_record->>'id',
            (link_record->>'amount')::DECIMAL,
            link_record->>'description',
            link_record->>'type',
            (link_record->>'active')::BOOLEAN,
            link_record->>'url',
            COALESCE((link_record->>'totalReceived')::DECIMAL, 0),
            COALESCE((link_record->>'transactionCount')::INTEGER, 0),
            COALESCE((link_record->>'created')::TIMESTAMP WITH TIME ZONE, NOW()),
            COALESCE(link_record->'metadata', '{}'::jsonb)
        );
        
        links_synced := links_synced + 1;
    END LOOP;
    
    RETURN QUERY SELECT links_synced, total_links;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION migrate_existing_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_payment_links TO authenticated;

-- Create a function to verify the complete setup
CREATE OR REPLACE FUNCTION verify_droplink_setup()
RETURNS TABLE (
    table_name TEXT,
    table_exists BOOLEAN,
    row_count BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Check all required tables
    RETURN QUERY
    WITH table_checks AS (
        SELECT 
            t.table_name::TEXT,
            true as table_exists,
            COALESCE(
                (SELECT count(*) FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = t.table_name), 
                0
            )::BIGINT as row_count,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE table_schema = 'public' AND table_name = t.table_name)
                THEN 'OK'
                ELSE 'MISSING'
            END as status
        FROM (VALUES 
            ('profiles'),
            ('payment_links'),
            ('payment_transactions'),
            ('user_sessions'),
            ('feature_usage'),
            ('profile_financial_data'),
            ('analytics'),
            ('products'),
            ('subscriptions'),
            ('followers')
        ) AS t(table_name)
    )
    SELECT * FROM table_checks;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get setup summary
CREATE OR REPLACE FUNCTION get_setup_summary()
RETURNS TABLE (
    total_profiles BIGINT,
    total_payment_links BIGINT,
    total_transactions BIGINT,
    active_sessions BIGINT,
    setup_complete BOOLEAN
) AS $$
DECLARE
    setup_complete_flag BOOLEAN := true;
    required_tables TEXT[] := ARRAY['profiles', 'payment_links', 'payment_transactions', 'user_sessions', 'feature_usage'];
    table_name TEXT;
BEGIN
    -- Check if all required tables exist
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            setup_complete_flag := false;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN QUERY
    SELECT 
        (SELECT count(*) FROM public.profiles)::BIGINT,
        (SELECT count(*) FROM public.payment_links)::BIGINT,
        (SELECT count(*) FROM public.payment_transactions)::BIGINT,
        (SELECT count(*) FROM public.user_sessions WHERE is_active = true)::BIGINT,
        setup_complete_flag;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for verification functions
GRANT EXECUTE ON FUNCTION verify_droplink_setup TO authenticated;
GRANT EXECUTE ON FUNCTION verify_droplink_setup TO anon;
GRANT EXECUTE ON FUNCTION get_setup_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_setup_summary TO anon;

-- Add helpful comments
COMMENT ON FUNCTION migrate_existing_user_data() IS 'Migrates payment links from theme_settings to dedicated payment_links table';
COMMENT ON FUNCTION sync_user_payment_links(UUID, TEXT, JSONB) IS 'Syncs payment links from the app to the database';
COMMENT ON FUNCTION verify_droplink_setup() IS 'Verifies that all required tables exist for DropLink functionality';
COMMENT ON FUNCTION get_setup_summary() IS 'Returns a summary of the current DropLink database setup';

-- Create an index for better performance on payment link lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_lookup 
ON public.payment_links(link_id, is_active) 
WHERE is_active = true;

-- End of 20251119120001_migrate_user_data.sql
-- ============================================================================


-- ============================================================================
-- FINAL VERIFICATION AND SETUP SUMMARY
-- ============================================================================

-- Create verification function if it doesn't exist
CREATE OR REPLACE FUNCTION verify_droplink_setup()
RETURNS TABLE(
    table_name text,
    exists_status text,
    row_count bigint,
    has_rls boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        CASE 
            WHEN t.table_name IS NOT NULL THEN 'OK'
            ELSE 'MISSING'
        END::text as exists_status,
        CASE 
            WHEN t.table_name IS NOT NULL THEN (
                SELECT count(*) FROM information_schema.tables 
                WHERE table_name = t.table_name AND table_schema = 'public'
            )
            ELSE 0
        END as row_count,
        CASE 
            WHEN t.table_name IS NOT NULL THEN (
                SELECT count(*) > 0 FROM pg_policies p 
                JOIN information_schema.tables t2 ON p.tablename = t2.table_name
                WHERE p.tablename = t.table_name AND t2.table_schema = 'public'
            )
            ELSE false
        END as has_rls
    FROM (VALUES 
        ('profiles'::text),
        ('payment_links'::text),
        ('payment_transactions'::text),
        ('analytics'::text),
        ('custom_links'::text),
        ('feature_usage'::text),
        ('profile_financial_data'::text),
        ('user_sessions'::text),
        ('user_preferences'::text)
    ) AS t(table_name);
END;
$$;

-- Create setup summary function
CREATE OR REPLACE FUNCTION get_setup_summary()
RETURNS TABLE(
    component text,
    status text,
    details text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Database Tables'::text as component,
        CASE 
            WHEN (SELECT count(*) FROM verify_droplink_setup() WHERE exists_status = 'OK') >= 8 
            THEN 'Ready ✅'
            ELSE 'Issues Found ⚠️'
        END::text as status,
        (SELECT count(*)::text || ' tables verified' FROM verify_droplink_setup() WHERE exists_status = 'OK')::text as details
    
    UNION ALL
    
    SELECT 
        'RLS Policies'::text as component,
        CASE 
            WHEN (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') > 0 
            THEN 'Configured ✅'
            ELSE 'Not Found ⚠️'
        END::text as status,
        (SELECT count(*)::text || ' policies active' FROM pg_policies WHERE schemaname = 'public')::text as details
    
    UNION ALL
    
    SELECT 
        'Payment System'::text as component,
        CASE 
            WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_links' AND table_schema = 'public')
            THEN 'Ready ✅'
            ELSE 'Not Ready ❌'
        END::text as status,
        'Payment links and transactions'::text as details
    
    UNION ALL
    
    SELECT 
        'Analytics'::text as component,
        CASE 
            WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics' AND table_schema = 'public')
            THEN 'Ready ✅'
            ELSE 'Not Ready ❌'
        END::text as status,
        'User analytics tracking'::text as details;
END;
$$;

-- Show final setup status
SELECT '🎉 MIGRATION COMPLETE! 🎉' as message;
SELECT * FROM get_setup_summary();

-- Show table verification
SELECT '📋 TABLE VERIFICATION:' as section;
SELECT * FROM verify_droplink_setup() ORDER BY table_name;
