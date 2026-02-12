-- Fix messaging + group chat RLS and allow public media uploads (Pi auth uses anon Supabase)

-- Messages: allow public read/write for direct + group messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow group messages to omit receiver_profile_id
ALTER TABLE public.messages
  ALTER COLUMN receiver_profile_id DROP NOT NULL;

-- Ensure messages are either direct (receiver set) or group (group_id set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_direct_or_group_check'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_direct_or_group_check
      CHECK (
        (group_id IS NULL AND receiver_profile_id IS NOT NULL)
        OR
        (group_id IS NOT NULL AND receiver_profile_id IS NULL)
      );
  END IF;
END $$;

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
DROP POLICY IF EXISTS "Group members can view group messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send group messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone_can_send_messages_v2" ON public.messages;
DROP POLICY IF EXISTS "Public_can_view_messages_v2" ON public.messages;
DROP POLICY IF EXISTS "Anyone_can_update_messages_v2" ON public.messages;
DROP POLICY IF EXISTS "Anyone_can_delete_messages_v2" ON public.messages;

DROP POLICY IF EXISTS "public_messages_select" ON public.messages;
CREATE POLICY "public_messages_select"
ON public.messages
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "public_messages_insert" ON public.messages;
CREATE POLICY "public_messages_insert"
ON public.messages
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "public_messages_update" ON public.messages;
CREATE POLICY "public_messages_update"
ON public.messages
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "public_messages_delete" ON public.messages;
CREATE POLICY "public_messages_delete"
ON public.messages
FOR DELETE
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon;
GRANT ALL ON public.messages TO authenticated;

-- Groups: allow public create + read (Pi auth runs as anon)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;

DROP POLICY IF EXISTS "public_groups_select" ON public.groups;
CREATE POLICY "public_groups_select"
ON public.groups
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "public_groups_insert" ON public.groups;
CREATE POLICY "public_groups_insert"
ON public.groups
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "public_groups_update" ON public.groups;
CREATE POLICY "public_groups_update"
ON public.groups
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "public_groups_delete" ON public.groups;
CREATE POLICY "public_groups_delete"
ON public.groups
FOR DELETE
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon;
GRANT ALL ON public.groups TO authenticated;

-- Group members: allow public manage so group chat works without Supabase auth
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

DROP POLICY IF EXISTS "public_group_members_select" ON public.group_members;
CREATE POLICY "public_group_members_select"
ON public.group_members
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "public_group_members_insert" ON public.group_members;
CREATE POLICY "public_group_members_insert"
ON public.group_members
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "public_group_members_update" ON public.group_members;
CREATE POLICY "public_group_members_update"
ON public.group_members
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "public_group_members_delete" ON public.group_members;
CREATE POLICY "public_group_members_delete"
ON public.group_members
FOR DELETE
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO anon;
GRANT ALL ON public.group_members TO authenticated;

-- Storage: allow public uploads to media bucket (background videos)
DROP POLICY IF EXISTS "authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "public upload media" ON storage.objects;
DROP POLICY IF EXISTS "public view media" ON storage.objects;
CREATE POLICY "public upload media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'media');
CREATE POLICY "public view media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

GRANT SELECT, INSERT ON storage.objects TO anon, authenticated;

-- Ensure media bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage: allow public uploads to message images bucket
DROP POLICY IF EXISTS "Anyone can view message images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view message images" ON storage.objects;
CREATE POLICY "Public can view message images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-images');

DROP POLICY IF EXISTS "Authenticated users can upload message images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload message images" ON storage.objects;
CREATE POLICY "Public can upload message images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'message-images');
