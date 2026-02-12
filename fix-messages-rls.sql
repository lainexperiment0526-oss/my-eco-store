-- Fix Messages RLS Policies for Pi Browser Compatibility
-- This allows messages to work without Supabase auth (using Pi auth instead)

-- 1. Drop all existing policies on messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their received messages" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_all" ON public.messages;
DROP POLICY IF EXISTS "messages_select_all" ON public.messages;
DROP POLICY IF EXISTS "messages_update_all" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_all" ON public.messages;

-- 2. Create simplified policies for Pi Browser compatibility
-- SELECT: Allow anyone to read messages (they'll filter by profile_id in the app)
CREATE POLICY "messages_select_all"
    ON public.messages
    FOR SELECT
    USING (true);

-- INSERT: Allow anyone to send messages
CREATE POLICY "messages_insert_all"
    ON public.messages
    FOR INSERT
    WITH CHECK (true);

-- UPDATE: Allow anyone to update messages (for marking as read)
CREATE POLICY "messages_update_all"
    ON public.messages
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- DELETE: Allow anyone to delete messages
CREATE POLICY "messages_delete_all"
    ON public.messages
    FOR DELETE
    USING (true);

-- 3. Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Grant all permissions to anon and authenticated
GRANT ALL ON public.messages TO anon, authenticated;

-- 5. Verify the table exists and has proper structure
DO $$ 
BEGIN
    -- Check if image_url column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN image_url TEXT;
    END IF;
    
    -- Check if is_read column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 6. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 7. Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;
