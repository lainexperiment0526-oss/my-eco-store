-- Fix Messages Table RLS Policies - Allow PUBLIC Users to Send Messages

-- Step 0: DROP ALL EXISTING POLICIES FIRST
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages sent to them" ON public.messages;
DROP POLICY IF EXISTS "Public can view messages" ON public.messages;
DROP POLICY IF EXISTS "Receivers can update message read status" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can delete their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Receivers can delete their received messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;

-- Step 1: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY 1: Anyone (public or authenticated) can INSERT messages
-- ============================================
-- This allows public visitors to send messages WITHOUT authentication
CREATE POLICY "Anyone_can_send_messages_v2"
ON public.messages
FOR INSERT
WITH CHECK (true);

-- ============================================
-- POLICY 2: Anyone can SELECT messages (public read access)
-- ============================================
CREATE POLICY "Public_can_view_messages_v2"
ON public.messages
FOR SELECT
USING (true);

-- ============================================
-- POLICY 3: Senders/Receivers can UPDATE messages
-- ============================================
CREATE POLICY "Anyone_can_update_messages_v2"
ON public.messages
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================
-- POLICY 4: Anyone can DELETE messages
-- ============================================
CREATE POLICY "Anyone_can_delete_messages_v2"
ON public.messages
FOR DELETE
USING (true);

-- Grant permissions to anonymous users
GRANT INSERT ON public.messages TO anon;
GRANT SELECT ON public.messages TO anon;
GRANT UPDATE ON public.messages TO anon;
GRANT DELETE ON public.messages TO anon;

-- Grant permissions to authenticated users
GRANT ALL ON public.messages TO authenticated;

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'messages';
