# Fix Follow & Public Bio Issues ✅

## Issues Fixed
1. **Follow not working** - Column name mismatch in followers table (`following_id` → `following_profile_id`)
2. **Public bio not loading** - RLS policies preventing public access to profiles
3. **Search users failing** - Missing columns and incorrect follow logic
4. **null value in "following_id"** - NOT NULL constraint violation

## Root Causes

### 1. Column Name Mismatch
The followers table had conflicting schemas:
- Old schema: `user_id`, `follower_id`, `following_id`
- New schema: `follower_profile_id`, `following_profile_id`

The code was trying to use new column names on an old schema → NULL values → NOT NULL constraint violation

### 2. RLS Policies Too Restrictive
The followers and profiles tables had RLS policies that blocked Pi Network users (who don't have `auth.uid()`)

### 3. Missing Profile Columns
The search feature requires: `category`, `follower_count`, `following_count`

## Solution: Run Migration

### Step 1: Copy the SQL from `fix-all-issues.sql`
The file already exists at the root: `fix-all-issues.sql`

### Step 2: Execute in Supabase SQL Editor
1. Go to: **Supabase Dashboard → SQL Editor**
2. Create a new query
3. Copy **entire contents** of `fix-all-issues.sql`
4. Click **Run**
5. Wait for completion (should show success messages)

### Step 3: Verify the Fix
Run this verification query:
```sql
-- Check followers table structure
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'followers' 
ORDER BY ordinal_position;

-- Should show:
-- id (NOT NULL)
-- follower_profile_id (NOT NULL) ✅
-- following_profile_id (NOT NULL) ✅
-- created_at (NOT NULL)
```

## What the Migration Fixes

### Followers Table
```sql
-- BEFORE (broken):
CREATE TABLE followers (
    id UUID PRIMARY KEY,
    follower_id UUID,           -- ❌ Wrong name
    following_id UUID,          -- ❌ Wrong name (also causing NOT NULL error)
    created_at TIMESTAMP
);

-- AFTER (fixed):
CREATE TABLE followers (
    id UUID PRIMARY KEY,
    follower_profile_id UUID NOT NULL,      -- ✅ Correct
    following_profile_id UUID NOT NULL,     -- ✅ Correct (will fix the NOT NULL error)
    created_at TIMESTAMP NOT NULL,
    UNIQUE(follower_profile_id, following_profile_id)
);
```

### RLS Policies - BEFORE
```sql
CREATE POLICY "Require auth"
ON followers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);  -- ❌ Blocks Pi Network users!
```

### RLS Policies - AFTER
```sql
CREATE POLICY "Anyone can follow profiles"
ON followers FOR INSERT
WITH CHECK (
    follower_profile_id != following_profile_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = follower_profile_id) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = following_profile_id)
);  -- ✅ Works for Pi Network users!
```

### Profiles Table Additions
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
-- Plus indexes for search optimization
```

## Code Changes Made

### UserSearchPage.tsx
✅ Added `showRewardedAd` to watch ads when clicking "View Full Profile"
✅ Follow functionality already uses correct column names (`follower_profile_id`, `following_profile_id`)

### FollowersSection.tsx
✅ Uses correct column names
✅ Fetches follower/following data properly

### PublicBio.tsx
✅ Already has logic to fetch and display profiles
✅ No code changes needed (RLS policies were the issue)

## Testing Checklist

After running the migration:

- [ ] Go to `/search-users`
- [ ] Search for a user
- [ ] Click "View Full Profile" button
- [ ] Watch the rewarded ad (if free user)
- [ ] Verify you're taken to the profile page
- [ ] Test "Follow" button
- [ ] Go to user's page, verify follower count increased
- [ ] Test "Unfollow" button
- [ ] Verify follower count decreased
- [ ] Go directly to public bio (/@username)
- [ ] Verify profile loads
- [ ] Verify follow button works on public bio

## Troubleshooting

### Issue: Still getting "null value in column 'following_id'"
**Solution:** The old column names still exist. Run the migration again and check that the columns were renamed.

```sql
-- Check current column names
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'followers';

-- Should show: follower_profile_id and following_profile_id
-- NOT: follower_id and following_id
```

### Issue: "Public bio not loading"
**Solution:** Check RLS policies allow public read access.

```sql
-- Should return true - policies allow public access
SELECT COUNT(*) FROM public.policies 
WHERE tablename = 'profiles' AND policyname LIKE 'Public%';
```

### Issue: Follow button still not working
**Solution:** Clear browser cache and local storage, then reload.

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Database Changes Summary

| Issue | Before | After |
|-------|--------|-------|
| Followers columns | `follower_id`, `following_id` | `follower_profile_id`, `following_profile_id` |
| NOT NULL constraint | ❌ following_id NULL | ✅ following_profile_id NOT NULL |
| RLS - Pi users | ❌ Blocked | ✅ Allowed |
| Public bio access | ❌ RLS denied | ✅ RLS allowed |
| Profile columns | ❌ Missing category, counts | ✅ All columns present |
| Indexes | ❌ None for search | ✅ Username, category, counts |

## Files Involved

1. **`fix-all-issues.sql`** - Main migration (RUN THIS)
2. **`src/pages/UserSearchPage.tsx`** - Already fixed
3. **`src/components/FollowersSection.tsx`** - Already correct
4. **`src/pages/PublicBio.tsx`** - Already correct
5. **`src/pages/Followers.tsx`** - Already correct

## Success Indicators

After the migration:
- ✅ No "null value in column" errors
- ✅ Follow button works in search
- ✅ Follow button works in public bio
- ✅ Follower counts update correctly
- ✅ Public bio pages load without auth errors
- ✅ Search results show follower counts

---

**Status:** Migration ready to run
**Time to fix:** < 2 minutes (just run the SQL)
**Impact:** Fixes 3 major features (follow, public bio, search)
