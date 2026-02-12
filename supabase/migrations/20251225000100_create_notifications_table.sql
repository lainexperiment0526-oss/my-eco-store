-- Create notifications table with all required columns and proper setup
-- This migration ensures the notifications table exists with proper schema

-- Step 1: Create notifications table if it doesn't exist
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

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Step 3: Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read for notification owner" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for notification owner" ON public.notifications;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = notifications.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- Step 6: Create updated_at trigger
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

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon;

-- Step 8: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 9: Verify table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ notifications table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create notifications table';
    END IF;
END $$;
