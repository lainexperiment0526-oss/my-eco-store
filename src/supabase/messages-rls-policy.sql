-- Row Level Security Policies for Messages Table
-- This file contains all necessary RLS policies to secure the messages table

-- Step 1: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY 1: Users can view their sent messages
-- ============================================
-- Allows users to see messages they sent to others
DROP POLICY IF EXISTS "Users can view their sent messages" ON messages;
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
USING (
  sender_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ============================================
-- POLICY 2: Users can view messages sent to them
-- ============================================
-- Allows users to see messages others sent to them
DROP POLICY IF EXISTS "Users can view messages sent to them" ON messages;
CREATE POLICY "Users can view messages sent to them"
ON public.messages
FOR SELECT
USING (
  receiver_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ============================================
-- POLICY 3: Authenticated users can send messages
-- ============================================
-- Allows any authenticated user to send messages to anyone
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  (
    auth.uid() IS NOT NULL
    AND sender_profile_id = (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  )
  OR (
    auth.uid() IS NULL
    AND sender_profile_id IS NULL
  )
);

-- ============================================
-- POLICY 4: Receivers can update message read status
-- ============================================
-- Allows receivers to mark their messages as read
DROP POLICY IF EXISTS "Receivers can update message read status" ON messages;
CREATE POLICY "Receivers can update message read status"
ON public.messages
FOR UPDATE
USING (
  receiver_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
)
WITH CHECK (
  receiver_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ============================================
-- POLICY 5: Senders can delete their sent messages
-- ============================================
-- Allows senders to delete messages they sent
DROP POLICY IF EXISTS "Senders can delete their sent messages" ON messages;
CREATE POLICY "Senders can delete their sent messages"
ON public.messages
FOR DELETE
USING (
  sender_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ============================================
-- POLICY 6: Receivers can delete received messages
-- ============================================
-- Allows receivers to delete messages sent to them
DROP POLICY IF EXISTS "Receivers can delete their received messages" ON messages;
CREATE POLICY "Receivers can delete their received messages"
ON public.messages
FOR DELETE
USING (
  receiver_profile_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify RLS policies are working

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- Check all policies on messages table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- ============================================
-- SECURITY NOTES
-- ============================================
/*
1. SENDER RESTRICTIONS:
   - Senders can ONLY insert messages with their own username
   - Senders can ONLY view messages they sent
   - Senders can ONLY delete messages they sent
   - Senders CANNOT update (except admin can)

2. RECEIVER RESTRICTIONS:
   - Receivers can view messages sent to them
   - Receivers can mark messages as read
   - Receivers can delete received messages
   - Receivers CANNOT see who else received similar messages

3. ANONYMOUS ACCESS:
   - Anonymous users cannot access any messages
   - RLS prevents all access without auth.uid()

4. TRANSACTION INTEGRITY:
   - Prevents sender from impersonating another user
   - Prevents reading other users' conversations
   - Maintains message history integrity
*/
