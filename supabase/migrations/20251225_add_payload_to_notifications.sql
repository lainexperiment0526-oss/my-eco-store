-- Add missing payload column to notifications table
-- This fixes the "column payload of relation notifications does not exist" error

-- Add payload column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

-- Update the fn_notify_followers function to use correct column names
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the fn_notify_messages function to use correct column names
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
