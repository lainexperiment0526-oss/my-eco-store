-- ========================================
-- DISABLE FOLLOW NOTIFICATIONS TRIGGER (MINIMAL)
-- ========================================
-- This removes the trigger that causes "payload column does not exist" error
-- Run this in your Supabase SQL Editor

-- Drop ALL notification-related triggers
DROP TRIGGER IF EXISTS trg_followers_insert_notification ON public.followers CASCADE;
DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages CASCADE;
DROP TRIGGER IF EXISTS trg_follow_notification ON public.followers CASCADE;
DROP TRIGGER IF EXISTS trg_message_notification ON public.messages CASCADE;

-- Drop ALL notification-related functions
DROP FUNCTION IF EXISTS public.fn_notify_followers() CASCADE;
DROP FUNCTION IF EXISTS public.fn_notify_messages() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_message() CASCADE;
DROP FUNCTION IF EXISTS public.create_follow_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_message_notification() CASCADE;

-- You may add more DROP TRIGGER or DROP FUNCTION statements here if you find more with a different name.

-- After running this, try following again. If you still get the error, run the trigger/function listing queries I provided earlier and share the results for a precise fix.
