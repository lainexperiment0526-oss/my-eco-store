-- Audit and Fix Subscription Schema
-- Ensure 'profiles' table has redundancy columns for subscription data as requested

DO $$
BEGIN
    -- Add 'subscription_plan' if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;

    -- Add 'subscription_status' if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT NULL;
    END IF;

    -- Add 'expires_at' if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'expires_at') THEN
        ALTER TABLE public.profiles ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;

    -- Add 'has_premium' if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'has_premium') THEN
        ALTER TABLE public.profiles ADD COLUMN has_premium BOOLEAN DEFAULT FALSE;
    END IF;

END $$;

-- Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON public.profiles(subscription_plan);
