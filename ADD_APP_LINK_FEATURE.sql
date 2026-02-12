-- Add app_link, app_title, app_logo, and app_description columns to profiles table

DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'app_link'
        ) THEN 
            ALTER TABLE public.profiles ADD COLUMN app_link TEXT; 
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'app_title'
        ) THEN 
            ALTER TABLE public.profiles ADD COLUMN app_title TEXT; 
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'app_logo'
        ) THEN 
            ALTER TABLE public.profiles ADD COLUMN app_logo TEXT; 
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'app_description'
        ) THEN 
            ALTER TABLE public.profiles ADD COLUMN app_description TEXT; 
        END IF;
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping app link columns';
    END IF;
END $$;
