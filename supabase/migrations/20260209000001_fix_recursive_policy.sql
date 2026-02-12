-- Fix recursive policy on group_members
-- First, drop the existing problematic policies if they exist
DROP POLICY IF EXISTS "Group members can view group messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_id = check_group_id 
    AND profile_id = auth.uid()
  );
END;
$$;

-- Re-create the policies using the function
CREATE POLICY "Group members can view group messages"
ON public.messages
FOR SELECT
USING (
  public.is_group_member(group_id)
);

CREATE POLICY "Group members can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  public.is_group_member(group_id)
);
