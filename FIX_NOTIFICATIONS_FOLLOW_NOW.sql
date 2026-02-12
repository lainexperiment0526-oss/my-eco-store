-- =====================================================
-- FIX NOTIFICATIONS PAYLOAD COLUMN ERROR
-- This fixes: column "payload" of relation "notifications" does not exist
-- Deploy this NOW to fix follow functionality
-- =====================================================

-- Step 1: Add payload column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_payload ON public.notifications USING GIN (payload);

-- Step 3: Update fn_notify_followers function with correct columns
CREATE OR REPLACE FUNCTION public.fn_notify_followers() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, title, message, type, payload)
  VALUES (
    NEW.following_profile_id, 
    'New Follower',
    'Someone followed you',
    'follow', 
    jsonb_build_object('follower_profile_id', NEW.follower_profile_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in fn_notify_followers: %', SQLERRM;
  RETURN NEW; -- Continue even if notification fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update fn_notify_messages function with correct columns
CREATE OR REPLACE FUNCTION public.fn_notify_messages()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, title, message, type, payload)
  VALUES (
    NEW.to_profile_id,
    'New Message',
    COALESCE(NEW.content, 'You received a message'),
    'message',
    jsonb_build_object('from_profile_id', NEW.from_profile_id, 'content', NEW.content)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in fn_notify_messages: %', SQLERRM;
  RETURN NEW; -- Continue even if notification fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate triggers to ensure they're active
DROP TRIGGER IF EXISTS trg_followers_insert_notification ON public.followers;
CREATE TRIGGER trg_followers_insert_notification
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_followers();

DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;
CREATE TRIGGER trg_messages_insert_notification
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_messages();

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verification
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'payload'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ SUCCESS: payload column exists in notifications table';
        RAISE NOTICE '✅ Follow functionality should now work correctly';
    ELSE
        RAISE EXCEPTION '❌ FAILED: payload column was not added to notifications table';
    END IF;
END $$;
