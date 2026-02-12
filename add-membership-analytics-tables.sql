-- Memberships, monetization, analytics primitives for Droplink
-- Safe to run multiple times: extensions guarded; tables use IF NOT EXISTS where supported

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Membership tiers (per profile)
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'pi',
  billing_period text NOT NULL DEFAULT 'monthly', -- e.g., monthly, yearly
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Membership access (who unlocked which tier)
CREATE TABLE IF NOT EXISTS public.membership_access (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.membership_tiers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- active, expired, canceled
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Products / tips / digital goods
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'pi',
  type text NOT NULL DEFAULT 'digital', -- digital, tip, one_time
  file_url text,
  status text NOT NULL DEFAULT 'active', -- active, hidden, archived
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders / payments (tips or product purchases)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_wallet text,
  buyer_email text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'pi',
  status text NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded, canceled
  source_link_id text, -- optional link identifier for attribution
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link-level analytics events
CREATE TABLE IF NOT EXISTS public.link_events (
  id bigserial PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  link_id text NOT NULL, -- flexible: can be slug or db id
  event_type text NOT NULL DEFAULT 'click', -- click, view
  referrer text,
  device text,
  country text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase events (aggregated from orders)
CREATE TABLE IF NOT EXISTS public.purchase_events (
  id bigserial PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  source_link_id text,
  amount numeric(12,2),
  currency text NOT NULL DEFAULT 'pi',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Email capture / newsletter leads
CREATE TABLE IF NOT EXISTS public.email_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  source_link_id text,
  source text, -- e.g., capture_block, popup, checkout
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_tiers_profile ON public.membership_tiers(profile_id);
CREATE INDEX IF NOT EXISTS idx_membership_access_profile ON public.membership_access(profile_id);
CREATE INDEX IF NOT EXISTS idx_membership_access_member ON public.membership_access(member_user_id);
CREATE INDEX IF NOT EXISTS idx_products_profile ON public.products(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_profile ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_link_events_profile ON public.link_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_link_events_link ON public.link_events(link_id);
CREATE INDEX IF NOT EXISTS idx_email_leads_profile ON public.email_leads(profile_id);

-- Updated timestamps trigger (if desired later)
-- You can add a generic trigger function to auto-update updated_at on products/orders/membership_tiers.
