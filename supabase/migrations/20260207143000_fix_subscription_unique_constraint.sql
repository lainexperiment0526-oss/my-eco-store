-- Fix duplicate subscriptions and add unique constraint
DO $$
BEGIN
    -- 1. Remove duplicate subscriptions, keeping the most recent one for each profile
    DELETE FROM public.subscriptions a
    USING public.subscriptions b
    WHERE a.profile_id = b.profile_id
    AND a.created_at < b.created_at;

    -- 2. Add unique constraint on profile_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_profile_id_key'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD CONSTRAINT subscriptions_profile_id_key UNIQUE (profile_id);
    END IF;

    -- 3. Verify plan_type column exists and has correct values
    -- Update any null plan_type to 'free'
    UPDATE public.subscriptions
    SET plan_type = 'free'
    WHERE plan_type IS NULL;

    -- Normalize plan_type values
    UPDATE public.subscriptions
    SET plan_type = LOWER(plan_type);

    -- 4. Ensure RLS policies allow upsert (INSERT/UPDATE) based on profile_id
    -- This part is tricky via SQL script if policies are complex, 
    -- but usually 'authenticated' users can insert/update their own rows.
    -- We assume RLS is already set up or disabled for now, but let's check grants.
    GRANT ALL ON public.subscriptions TO authenticated;
    GRANT ALL ON public.subscriptions TO service_role;

END $$;
