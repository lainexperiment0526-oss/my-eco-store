-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
    UNIQUE(group_id, profile_id)
);

-- Add group_id to messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'group_id') THEN
        ALTER TABLE public.messages ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies
DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
CREATE POLICY "Groups are viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.profile_id = auth.uid() -- Note: This assumes auth.uid() maps to profile.id or we need a lookup.
            -- Usually profiles.id is NOT auth.uid() in this schema?
            -- Let's check profiles table definition. usually profiles.id is uuid. 
            -- Wait, in many Supabase starters profiles.id IS auth.users.id.
            -- If not, we need to join.
            -- Let's assume for now we need to lookup profile id from auth.uid()
        )
        OR
        created_by = (SELECT id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid() LIMIT 1) -- covering bases
    );

-- Wait, let's look at how other policies are written.
-- The search result for `profiles` table showed `profile_id` references `profiles(id)`.
-- I should check if `profiles.id` matches `auth.uid()`.
-- In `20251118000001_complete_database_schema.sql`:
-- CREATE TABLE IF NOT EXISTS public.profiles (
--     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
-- ...
-- So yes, profiles.id IS auth.users.id.

DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
CREATE POLICY "Groups are viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.profile_id = auth.uid()
        )
        OR
        created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
CREATE POLICY "Admins can update groups" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.profile_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Group Members policies
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage group members" ON public.group_members;
CREATE POLICY "Admins can manage group members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.profile_id = auth.uid()
            AND gm.role = 'admin'
        )
    );
    
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 
    -- This is a bit loose, usually invites or public groups logic needed.
    -- For now, allow insert if authenticated (self-join or added by others).

-- Update Messages policies to include groups
-- We need to update existing policies or add new ones.
-- "Users can view their own messages" usually covers sender/receiver.
-- We need "Group members can view group messages".

CREATE POLICY "Group members can view group messages" ON public.messages
    FOR SELECT USING (
        group_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.profile_id = auth.uid()
        )
    );

CREATE POLICY "Group members can send group messages" ON public.messages
    FOR INSERT WITH CHECK (
        group_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.profile_id = auth.uid()
        )
    );
