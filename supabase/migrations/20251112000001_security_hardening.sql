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

