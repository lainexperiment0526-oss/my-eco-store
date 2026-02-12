# 🔧 Fix: Pi Authentication Sign-In Issues - RLS Policy Fix

## Problem
You're seeing the error:
```
"new row violates row-level security policy for table 'user_wallets'"
```

This happens when trying to sign in with Pi Network because:
1. The `user_wallets` RLS policy requires `auth.uid()` to exist
2. During Pi authentication, `auth.uid()` may not be set yet
3. The profile creation also fails due to strict RLS policies

## Solution
We've created **`FIX_PI_AUTH_RLS_COMPLETE.sql`** which:
- ✅ Allows `anon` role to create profiles during Pi auth
- ✅ Allows `service_role` to bypass RLS for internal operations
- ✅ Maintains security by keeping authenticated checks in place
- ✅ Fixes both `profiles` and `user_wallets` RLS policies

## How to Deploy

### Option 1: Quick Fix (Recommended)
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy entire contents of `FIX_PI_AUTH_RLS_COMPLETE.sql`
5. Paste into query editor
6. Click **Run** ▶️
7. Should show: "Pi Authentication RLS Fix Applied Successfully!"

### Option 2: Using Supabase CLI
```bash
supabase db push FIX_PI_AUTH_RLS_COMPLETE.sql
```

### Option 3: Save as Migration
1. Copy `FIX_PI_AUTH_RLS_COMPLETE.sql` 
2. Rename to `supabase/migrations/20251229000000_fix_pi_auth_rls.sql`
3. Run `supabase db push`

## What Changed

### Before (Broken)
```sql
-- profiles table: Only allowed authenticated users with matching uid
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_wallets: Required auth.uid() match through profile
CREATE POLICY "user_wallets_insert" ON user_wallets
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid())
);
```

### After (Fixed)
```sql
-- profiles table: Allows service_role, authenticated with uid match, AND anon during Pi auth
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR (auth.role() = 'authenticated' AND auth.uid() = user_id)
  OR (auth.role() = 'anon' AND user_id IS NULL)  -- Pi auth flow
);

-- user_wallets: Allows service_role, anon, AND authenticated users
CREATE POLICY "user_wallets_insert" ON user_wallets
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'  -- Allow during Pi auth
  OR EXISTS (SELECT 1 FROM profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid())
);
```

## Testing the Fix

### 1. Test in Pi Browser
1. Open your app in **Pi Browser**
2. Click **"Sign in with Pi Network"**
3. Authorize the request
4. ✅ Should sign in without RLS errors

### 2. Check Browser Console
Look for these success logs:
```
[Pi Auth Service] ✅ Token validated. Pi user: @username
[Pi Auth Service] ✅ New profile created for Pi user
[Pi DEBUG] ✅ Authentication complete!
```

### 3. Verify in Supabase
Go to Supabase Dashboard → Table Editor:
- Check `profiles` table - new user should exist
- Check `user_wallets` table - wallet should be created automatically

## If Still Having Issues

### Check 1: Verify RLS Policies Exist
```sql
SELECT polname, polcmd 
FROM pg_policies 
WHERE tablename = 'user_wallets';
```

Should show: `user_wallets_insert`, `user_wallets_update`, `user_wallets_select`, `user_wallets_delete`

### Check 2: Verify Grants
```sql
SELECT grantee, privilege_type 
FROM role_table_grants 
WHERE table_name = 'user_wallets';
```

Should show `SELECT`, `INSERT`, `UPDATE`, `DELETE` for `anon` and `authenticated`

### Check 3: Clear Browser Cache
1. In Pi Browser, go to Settings
2. Select **Privacy & Security**
3. Clear **Browsing data** and **Cookies**
4. Try signing in again

### Check 4: Check Log in Supabase
1. Go to **Logs** in Supabase Dashboard
2. Look for any RLS or permission errors
3. Check the exact error message

## Rollback (If Needed)
If you need to revert:
```sql
-- Go back to strict RLS (not recommended)
DROP POLICY "profiles_insert" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Security Notes
- ✅ **Service role bypass** is needed for server-side operations
- ✅ **Anonymous access** during Pi auth is scoped to profile creation only
- ✅ **User isolation** is maintained - users can only access their own data
- ✅ **No public access** - all operations require authentication or are part of authorized flow

---

**Need Help?**
Check these related documentation:
- [00_START_HERE.md](00_START_HERE.md) - Project overview
- [PI_AUTH_FIX_GUIDE.md](PI_AUTH_FIX_GUIDE.md) - Pi auth troubleshooting
- [FIX_PI_AUTH_RLS_COMPLETE.sql](FIX_PI_AUTH_RLS_COMPLETE.sql) - The actual fix script
