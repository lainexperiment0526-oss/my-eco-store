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

DROP FUNCTION IF EXISTS public.get_active_subscription(uuid) CASCADE;

CREATE FUNCTION public.get_active_subscription(p_profile_id uuid) RETURNS TABLE(plan_type text, billing_period text, end_date timestamp with time zone, status text)
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

DROP FUNCTION IF EXISTS public.handle_new_profile_wallet() CASCADE;

CREATE FUNCTION public.handle_new_profile_wallet() RETURNS trigger
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

DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
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


-- Drop the function if it already exists to avoid duplicate error
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace
    ) THEN
        DROP FUNCTION public.update_updated_at_column() CASCADE;
    END IF;
END $$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
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
    pi_amount numeric(20, 6) DEFAULT 0 NOT NULL,
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
    pi_amount numeric(10, 2) DEFAULT 0 NOT NULL,
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



CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info',
    is_read boolean DEFAULT false,
    action_url text DEFAULT '',
    payload jsonb DEFAULT '{}'::jsonb,
    delivered boolean DEFAULT false,
    delivery_channel text,
    webhook_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'follow'::text, 'message'::text, 'gift'::text, 'payment'::text]))),
    CONSTRAINT notifications_delivery_channel_check CHECK ((delivery_channel = ANY (ARRAY['email'::text, 'webhook'::text, 'in-app'::text])))
);


--
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_support_config ai_support_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_support_config
    ADD CONSTRAINT ai_support_config_pkey PRIMARY KEY (id);


--
-- Name: ai_support_config ai_support_config_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_support_config
    ADD CONSTRAINT ai_support_config_profile_id_key UNIQUE (profile_id);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: followers followers_follower_profile_id_following_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_profile_id_following_profile_id_key UNIQUE (follower_profile_id, following_profile_id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (id);


--
-- Name: gift_transactions gift_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_transactions
    ADD CONSTRAINT gift_transactions_pkey PRIMARY KEY (id);


--
-- Name: gifts gifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT gifts_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (id);


--
-- Name: user_wallets user_wallets_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_profile_id_key UNIQUE (profile_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


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
-- Name: idx_notifications_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications USING btree (profile_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);


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
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_chat_messages ai_chat_messages_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


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
-- Name: notifications notifications_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: analytics Anyone can insert analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);


--
-- Name: ai_chat_messages Anyone can insert chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Anyone can insert chat messages" ON public.ai_chat_messages FOR INSERT WITH CHECK (true);


--
-- Name: ai_chat_messages Anyone can view AI chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Anyone can view AI chat messages" ON public.ai_chat_messages FOR SELECT USING (true);


--
-- Name: followers Anyone can view followers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Anyone can view followers" ON public.followers FOR SELECT USING (true);


--
-- Name: gifts Gifts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Gifts are viewable by everyone" ON public.gifts FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


--
-- Name: analytics Profile owners can view their analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Profile owners can view their analytics" ON public.analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = analytics.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: products Users can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete their own products" ON public.products FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: followers Users can follow profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can follow profiles" ON public.followers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = followers.follower_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: products Users can insert products for their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert products for their profile" ON public.products FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: ai_support_config Users can insert their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own AI config" ON public.ai_support_config FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can insert their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can insert their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own wallet" ON public.user_wallets FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_wallets.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: gift_transactions Users can send gifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can send gifts" ON public.gift_transactions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.sender_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: followers Users can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can unfollow" ON public.followers FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = followers.follower_profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: ai_support_config Users can update their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own AI config" ON public.ai_support_config FOR UPDATE USING ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: products Users can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own products" ON public.products FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = products.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can update their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can update their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own wallet" ON public.user_wallets FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_wallets.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own notifications" ON public.notifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = notifications.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: notifications Users can insert their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = notifications.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = notifications.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: gift_transactions Users can view their gift transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their gift transactions" ON public.gift_transactions FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.sender_profile_id) AND (profiles.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = gift_transactions.receiver_profile_id) AND (profiles.user_id = auth.uid()))))));


--
-- Name: ai_support_config Users can view their own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own AI config" ON public.ai_support_config FOR SELECT USING ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.id = ai_support_config.profile_id))));


--
-- Name: subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = subscriptions.profile_id) AND (profiles.user_id = auth.uid())))));


--
-- Name: user_wallets Users can view their own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own wallet" ON public.user_wallets FOR SELECT USING ((EXISTS ( SELECT 1
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
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


