-- COMPLETE NOTIFICATIONS TABLE SETUP
-- Run this FIRST to create the table and all related setup
-- This combines table creation + payload column + functions + RLS

-- ========================================
-- STEP 1: Create notifications table
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'follow', 'message', 'gift', 'payment')),
    
    is_read BOOLEAN DEFAULT false,
    action_url TEXT DEFAULT '',
    payload JSONB DEFAULT '{}',
    
    delivered BOOLEAN DEFAULT FALSE,
    delivery_channel TEXT CHECK (delivery_channel IN ('email', 'webhook', 'in-app')),
    webhook_url TEXT
);

-- ========================================
-- STEP 2: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- ========================================
-- STEP 3: Enable Row Level Security
-- ========================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read for notification owner" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for notification owner" ON public.notifications;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND (profiles.user_id = auth.uid()::text OR profiles.pi_user_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND (profiles.user_id = auth.uid()::text OR profiles.pi_user_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND (profiles.user_id = auth.uid()::text OR profiles.pi_user_id = auth.uid()::text)
        )
    );

-- ========================================
-- STEP 4: Create or replace update_at trigger
-- ========================================
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notifications_updated_at();

-- ========================================
-- STEP 5: Create notification trigger functions
-- ========================================

-- Function to insert notification on follow
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

-- Function to insert notification on message
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

-- Create triggers for notifications
DROP TRIGGER IF EXISTS trg_followers_insert_notification ON public.followers;
CREATE TRIGGER trg_followers_insert_notification
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_followers();

DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;
CREATE TRIGGER trg_messages_insert_notification
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_messages();

-- ========================================
-- STEP 6: Grant permissions
-- ========================================
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon;

-- ========================================
-- STEP 7: Refresh schema cache
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- STEP 8: Verify everything was created
-- ========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ notifications table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create notifications table';
    END IF;
END $$;
