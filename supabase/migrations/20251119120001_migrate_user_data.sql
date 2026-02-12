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
    exists BOOLEAN,
    row_count BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Check all required tables
    RETURN QUERY
    WITH table_checks AS (
        SELECT 
            t.table_name::TEXT,
            true as exists,
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