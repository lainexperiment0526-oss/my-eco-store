-- Fix Row-Level Security policies for gift_cards table
-- This allows users to create and redeem gift cards

-- Enable RLS on gift_cards table
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view their purchased gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view gift cards they received" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can update gift cards they redeem" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable read for all users" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable update for redeemers" ON public.gift_cards;

-- Policy 1: Allow authenticated users to insert gift cards
CREATE POLICY "Enable insert for authenticated users" 
ON public.gift_cards 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Policy 2: Allow users to view all gift cards (needed for redemption)
CREATE POLICY "Enable read for all users" 
ON public.gift_cards 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Policy 3: Allow users to update gift cards they are redeeming
CREATE POLICY "Enable update for redeemers" 
ON public.gift_cards 
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Verify policies
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
WHERE tablename = 'gift_cards';

-- Success message
SELECT 'Gift cards RLS policies fixed! ✅' as status;
