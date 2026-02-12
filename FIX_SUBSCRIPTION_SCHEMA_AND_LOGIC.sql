-- ============================================
-- FIX SUBSCRIPTION SCHEMA AND LOGIC
-- ============================================

-- 1. Fix subscriptions table schema to match code (useActiveSubscription.ts & PaymentPage.tsx)
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        -- Rename 'plan' to 'plan_type' if it exists and 'plan_type' does not
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan') 
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type') THEN
            ALTER TABLE public.subscriptions RENAME COLUMN plan TO plan_type;
        END IF;

        -- Rename 'ends_at' to 'end_date' if it exists and 'end_date' does not
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'ends_at') 
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'end_date') THEN
            ALTER TABLE public.subscriptions RENAME COLUMN ends_at TO end_date;
        END IF;
        
        -- Rename 'started_at' to 'start_date' if it exists and 'start_date' does not
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'started_at') 
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'start_date') THEN
            ALTER TABLE public.subscriptions RENAME COLUMN started_at TO start_date;
        END IF;

        -- Add 'billing_period' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_period') THEN
            ALTER TABLE public.subscriptions ADD COLUMN billing_period TEXT DEFAULT 'monthly';
        END IF;

        -- Add 'pi_amount' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'pi_amount') THEN
            ALTER TABLE public.subscriptions ADD COLUMN pi_amount DECIMAL(10, 2) DEFAULT 0;
        END IF;

        -- Add 'pi_transaction_id' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'pi_transaction_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN pi_transaction_id TEXT;
        END IF;
        
        -- Add 'auto_renew' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'auto_renew') THEN
            ALTER TABLE public.subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT FALSE;
        END IF;

        -- Add 'status' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
            ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
        END IF;

        -- Add 'profile_id' if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'profile_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        
        -- Make sure plan_type is not null (set default if needed)
        ALTER TABLE public.subscriptions ALTER COLUMN plan_type SET DEFAULT 'free';
        
    ELSE
        -- Create table if it doesn't exist (using the correct schema)
        CREATE TABLE public.subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            plan_type TEXT NOT NULL DEFAULT 'free',
            billing_period TEXT DEFAULT 'monthly',
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_date TIMESTAMP WITH TIME ZONE,
            status TEXT DEFAULT 'active',
            pi_amount DECIMAL(10, 2) DEFAULT 0,
            pi_transaction_id TEXT,
            auto_renew BOOLEAN DEFAULT FALSE,
            payment_id UUID, -- Optional reference to payments table
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 1.5. Fix legacy plan names (e.g. "unlimited" -> "premium")
UPDATE public.subscriptions
SET plan_type = 'premium'
WHERE LOWER(plan_type) = 'unlimited' OR LOWER(plan_type) = 'unli';

-- 2. Update profiles table to include has_premium
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'has_premium') THEN
        ALTER TABLE public.profiles ADD COLUMN has_premium BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create helper function to check subscription status (for backend logic/RLS)
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_status TEXT;
BEGIN
    SELECT end_date, status INTO v_end_date, v_status
    FROM public.subscriptions
    WHERE profile_id = p_profile_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_status = 'active' AND v_end_date > NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 4. Create trigger to update profiles.has_premium when subscription changes
CREATE OR REPLACE FUNCTION public.update_profile_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If subscription is active and not expired, set has_premium = true
    -- Otherwise false
    -- We need to check the LATEST subscription for this profile
    
    UPDATE public.profiles
    SET has_premium = public.is_subscription_active(NEW.profile_id)
    WHERE id = NEW.profile_id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_premium_status();

-- 5. Backfill has_premium for existing profiles
UPDATE public.profiles
SET has_premium = public.is_subscription_active(id);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_subscription_active TO authenticated;
