-- Update username from @airdropio2024 to @officialsupport
-- User ID: 12d5b64f-a122-4e6b-bc63-21b50265095f

-- Update username in profiles table
UPDATE public.profiles
SET username = 'officialsupport'
WHERE id = '12d5b64f-a122-4e6b-bc63-21b50265095f';

-- Verify the update
SELECT 
  id,
  username,
  business_name,
  email,
  created_at
FROM public.profiles
WHERE id = '12d5b64f-a122-4e6b-bc63-21b50265095f';

-- Success message
SELECT 'Username updated to @officialsupport ✅' as status;
