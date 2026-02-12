-- Disable notification triggers to prevent payload column errors
-- Run this in your Supabase SQL Editor

-- Drop the notification trigger functions and triggers
DROP TRIGGER IF EXISTS trg_followers_insert_notification ON public.followers;
DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;

DROP FUNCTION IF EXISTS public.fn_notify_followers();
DROP FUNCTION IF EXISTS public.fn_notify_messages();

-- Verify triggers are removed
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%';
