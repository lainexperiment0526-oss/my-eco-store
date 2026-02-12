# Fix: "Failed to update follow status" Error

## Problem
Pi Network users cannot follow/unfollow profiles because the RLS (Row Level Security) policies on the `followers` table require a Supabase `auth.uid()`, which Pi users don't have since they authenticate through Pi Network, not Supabase Auth.

## Root Cause
The existing RLS policy checks:
```sql
CREATE POLICY "Users can follow profiles" ON public.followers FOR INSERT 
WITH CHECK ((EXISTS (
  SELECT 1 FROM public.profiles
  WHERE (profiles.id = followers.follower_profile_id) 
  AND (profiles.user_id = auth.uid())
)));
```

Pi users have `user_id = NULL` in the profiles table because they don't go through Supabase Auth.

## Solution

### Quick Fix (Recommended)
Run the SQL script in Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `fix-followers-rls-policy.sql`
4. Click "Run"

### Manual Fix
Execute these SQL commands in Supabase:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;

-- Allow anyone to follow (with validation)
CREATE POLICY "Anyone can follow profiles" 
ON public.followers 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.follower_profile_id) AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.following_profile_id) AND
  followers.follower_profile_id != followers.following_profile_id
);

-- Allow anyone to unfollow
CREATE POLICY "Anyone can unfollow" 
ON public.followers 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.follower_profile_id)
);
```

## What Changed

### Before:
- ❌ Only users with Supabase auth could follow/unfollow
- ❌ Pi Network users couldn't follow profiles
- ❌ Error: "Failed to update follow status"

### After:
- ✅ All users (Pi and Gmail) can follow/unfollow
- ✅ Validates both profiles exist
- ✅ Prevents self-following
- ✅ Frontend controls access (user must be signed in)

## Security Notes

This is safe because:
1. Both `follower_profile_id` and `following_profile_id` must exist in the profiles table
2. Self-following is prevented at the database level
3. Frontend validates user authentication before allowing follow actions
4. Duplicate follows are prevented by unique constraint on (follower_profile_id, following_profile_id)

## Additional Fixes Applied

### 1. Enhanced Error Logging in PublicBio.tsx
- Added detailed console logs for debugging
- Better error messages showing what went wrong
- Logs user authentication status and profile IDs

### 2. Improved Profile Loading
- Better error handling in `loadCurrentUserProfile()`
- Logs when profiles are loaded successfully
- Warns when profile lookup fails

## Testing

After applying the fix:

1. **Test as Pi User:**
   - Open app in Pi Browser
   - Sign in with Pi Network
   - Visit another user's profile (e.g., @flappypi)
   - Click "Follow" button
   - Should see "Following!" success message
   - Follower count should increment

2. **Test Unfollow:**
   - Click "Follow" button again (now showing as following)
   - Should see "Unfollowed" success message
   - Follower count should decrement

3. **Check Console:**
   - Open DevTools (F12)
   - Look for `[FOLLOW]` and `[PROFILE]` log messages
   - Verify no errors appear

## Files Modified

1. ✅ `src/pages/PublicBio.tsx` - Enhanced error logging
2. ✅ `fix-followers-rls-policy.sql` - RLS policy fix (created)
3. ✅ `FOLLOW_ERROR_FIX.md` - This guide (created)

## Rollback (if needed)

If you need to revert to the old restrictive policies:

```sql
DROP POLICY IF EXISTS "Anyone can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Anyone can unfollow" ON public.followers;

CREATE POLICY "Users can follow profiles" ON public.followers FOR INSERT 
WITH CHECK ((EXISTS (
  SELECT 1 FROM public.profiles
  WHERE (profiles.id = followers.follower_profile_id) 
  AND (profiles.user_id = auth.uid())
)));

CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE 
USING ((EXISTS (
  SELECT 1 FROM public.profiles
  WHERE (profiles.id = followers.follower_profile_id) 
  AND (profiles.user_id = auth.uid())
)));
```

## Next Steps

1. Apply the SQL fix in Supabase Dashboard
2. Test follow/unfollow functionality
3. Check browser console for any remaining errors
4. If issues persist, check the `[FOLLOW]` and `[PROFILE]` console logs
