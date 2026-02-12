# 🔧 Fix Follow Functionality - Quick Guide

## Problem
"new row violates row-level security policy for table 'followers'" error when trying to follow users.

## Root Cause
The followers table has RLS (Row-Level Security) policies that require `auth.uid()`, but Pi Network users authenticate via Pi Network (not Supabase Auth), so `auth.uid()` is always NULL.

## Solution

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\deploy-follow-fix.ps1
```
Choose option 1 for quick follow fix, or option 2 for complete fix.

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project
   - Go to SQL Editor (left sidebar)

2. **Run the Fix**
   - Click "New Query"
   - Copy the contents of `fix-follow-now.sql`
   - Paste into the editor
   - Click "Run"

3. **Verify**
   - You should see "Success. No rows returned"
   - No errors should appear

## What Gets Fixed

✅ **Followers Table Schema**
- Ensures column names are correct (`follower_profile_id`, `following_profile_id`)
- Fixes any mismatched column names

✅ **RLS Policies**
- Removes old restrictive policies
- Adds new permissive policies that work with Pi Network auth
- Allows anonymous users to follow (validated in frontend)

✅ **Permissions**
- Grants proper permissions to anonymous users
- Ensures public profiles are readable

## Testing

After applying the fix:

1. **Open your app**: https://droplink.space/search-users
2. **Try to follow a user**
3. **Should work without errors** ✅

## Troubleshooting

### Still getting errors?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Supabase logs: Dashboard → Logs

### Need complete fix?
Run `fix-all-issues.sql` instead - this fixes:
- ✅ Follow functionality
- ✅ Search users
- ✅ Public bio loading
- ✅ Message sending
- ✅ Inbox messages

### Manual verification
```sql
-- Check if policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'followers';

-- Check if column names are correct
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'followers';
```

## Files Created
- `fix-follow-now.sql` - Quick follow fix
- `deploy-follow-fix.ps1` - Deployment script
- This guide

## Need Help?
The fix-all-issues.sql file already exists and contains a comprehensive solution.
