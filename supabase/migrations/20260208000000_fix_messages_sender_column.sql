-- Fix missing sender_profile_id column in messages and gifts tables

DO $$
BEGIN
    -- 1. Check and fix messages table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        
        -- Add sender_profile_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_profile_id') THEN
            ALTER TABLE public.messages ADD COLUMN sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added sender_profile_id to messages table';
        END IF;

        -- Add receiver_profile_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'receiver_profile_id') THEN
            ALTER TABLE public.messages ADD COLUMN receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added receiver_profile_id to messages table';
        END IF;
    END IF;

    -- 2. Check and fix gifts table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifts' AND table_schema = 'public') THEN
        
        -- Add sender_profile_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'sender_profile_id') THEN
            ALTER TABLE public.gifts ADD COLUMN sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added sender_profile_id to gifts table';
        END IF;

        -- Add receiver_profile_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'receiver_profile_id') THEN
            ALTER TABLE public.gifts ADD COLUMN receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added receiver_profile_id to gifts table';
        END IF;
    END IF;
END $$;
