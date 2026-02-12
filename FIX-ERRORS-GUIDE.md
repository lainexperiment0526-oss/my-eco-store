# Fix Pi Auth & Database Setup Issues

## Errors Fixed

### ❌ Error 1: "Failed to create Pi profile. Please try again."
**Cause**: Profile creation function not working or missing profile table setup
**Fix**: FIX-PI-AUTH-PROFILE.sql creates proper triggers and functions

### ❌ Error 2: "Database setup required. Check console for setup instructions."
**Cause**: Missing tables or columns in Supabase database
**Fix**: FIX-ALL-FEATURES.sql ensures all tables exist with proper schema

### ❌ Error 3: "Failed to save profile to database"
**Cause**: RLS policies blocking inserts or table constraints failing
**Fix**: Proper RLS policies created that allow authenticated users to create profiles

---

## Solution: 3-Step Fix Process

### Step 1: Run FIX-ALL-FEATURES.sql (Database Structure)

This creates/fixes:
- ✅ `profiles` table with all columns
- ✅ `followers` table with correct schema
- ✅ `analytics` table for tracking
- ✅ `user_wallets` table for balances
- ✅ Performance indexes
- ✅ Helper SQL functions

**Execute in Supabase:**
1. Go to **SQL Editor** → **New Query**
2. Copy entire [FIX-ALL-FEATURES.sql](FIX-ALL-FEATURES.sql)
3. Click **Run**

### Step 2: Run FIX-PI-AUTH-PROFILE.sql (Auth & Triggers)

This creates/fixes:
- ✅ Automatic profile creation trigger on signup
- ✅ Pi user registration function (`register_pi_user`)
- ✅ Safe profile upsert function (`upsert_pi_profile`)
- ✅ Database setup status check function
- ✅ Proper RLS policies for profile access
- ✅ Wallet auto-creation

**Execute in Supabase:**
1. Go to **SQL Editor** → **New Query**
2. Copy entire [FIX-PI-AUTH-PROFILE.sql](FIX-PI-AUTH-PROFILE.sql)
3. Click **Run**

### Step 3: Update Frontend Pi Auth Code

Add error handling and use the new functions in [src/contexts/PiContext.tsx](src/contexts/PiContext.tsx):

```typescript
// After successful Pi auth, create/update profile
const { data, error } = await supabase.rpc('upsert_pi_profile', {
  p_username: piUser.username,
  p_email: piUser.email,
  p_display_name: piUser.displayName,
  p_pi_wallet: piUser.walletAddress
});

if (error) {
  console.error('Failed to create profile:', error);
  throw error;
}

console.log('Profile created/updated:', data);
```

---

## What Each SQL File Does

### FIX-ALL-FEATURES.sql
**Main purpose**: Ensure database schema is complete

```
Profiles Table
├── Basic fields: id, username, email, created_at
├── Display fields: bio, category, business_name, logo
├── Card fields: card_front_color, card_back_color, etc.
├── Stats: follower_count, view_count, following_count
├── Auth: user_id, subscription_status, is_verified
└── Indexes: username, category, follower_count (for search)

Followers Table
├── follower_profile_id → who is following
├── following_profile_id → who they follow
├── Unique constraint (no duplicate follows)
└── Check constraint (can't follow yourself)

Analytics Table → Track views, clicks
Profile_Views Table → Track unique visitors
User_Wallets Table → Store balances
```

### FIX-PI-AUTH-PROFILE.sql
**Main purpose**: Enable automatic Pi profile creation

```
Triggers:
├── on_auth_user_created 
│   └── Automatically create profile when user signs up
│
Functions:
├── register_pi_user(pi_uid, username, email)
│   └── Register Pi user manually
│
├── upsert_pi_profile(username, email, display_name, wallet)
│   └── Create or update profile (idempotent)
│
├── check_database_setup()
│   └── Verify all tables and columns exist
│
└── handle_new_user()
    └── Trigger function for profile creation

RLS Policies:
├── Profiles: Public read, authenticated insert
├── Followers: Public read, authenticated follow/unfollow
└── Analytics: Public insert (for tracking)
```

---

## Testing the Fix

### 1. Check Database Setup
In Supabase SQL Editor:
```sql
SELECT * FROM public.check_database_setup();
```
Should return: `is_ready = true`

### 2. Test Profile Creation
```sql
SELECT * FROM public.upsert_pi_profile(
  'testuser123',
  'test@example.com',
  'Test User',
  'GWALLET123'
);
```
Should create/return a profile

### 3. Check Profile Stats
```sql
SELECT username, actual_followers, actual_views 
FROM public.profile_stats 
WHERE username = 'testuser123';
```

### 4. Verify Wallet Created
```sql
SELECT * FROM public.user_wallets 
WHERE profile_id = (
  SELECT id FROM public.profiles 
  WHERE username = 'testuser123'
);
```

---

## Error Messages Explained

### "Database setup required"
**Cause**: `check_database_setup()` returned false
**Solution**: 
1. Run FIX-ALL-FEATURES.sql
2. Check for errors in Supabase console
3. Verify all tables exist in Database → Tables

### "Failed to create Pi profile"
**Cause**: Profile creation function failed or RLS blocked it
**Solution**:
1. Check RLS policies on `profiles` table
2. Verify `upsert_pi_profile` function exists
3. Check Supabase logs for detailed error

### "Failed to save profile to database"
**Cause**: Profile update failed due to constraints
**Solution**:
1. Check username is unique
2. Verify email field is nullable if empty
3. Ensure `user_id` matches auth user

---

## Frontend Integration

The frontend already has proper Pi auth flow, but ensure it calls the profile functions:

### In PiContext.tsx (signIn function):
```typescript
// After successful Pi authentication
const profileData = await supabase.rpc('upsert_pi_profile', {
  p_username: piUser.username,
  p_email: piUser.email,
  p_display_name: piUser.displayName,
  p_pi_wallet: piUser.walletAddress
});

if (!profileData[0]) {
  throw new Error('Failed to create profile');
}

// Store profile in localStorage
localStorage.setItem('profile', JSON.stringify(profileData[0]));
```

### In Dashboard.tsx:
```typescript
// Profile is automatically loaded from localStorage
const profile = localStorage.getItem('profile');
```

### In CardGenerator.tsx:
```typescript
// Already implemented - fetches full profile data
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('username', username)
  .maybeSingle();
```

---

## Troubleshooting Checklist

- [ ] Run FIX-ALL-FEATURES.sql first
- [ ] Run FIX-PI-AUTH-PROFILE.sql second
- [ ] Check database setup: `SELECT * FROM public.check_database_setup();`
- [ ] Verify tables in Supabase Dashboard → Database → Tables
- [ ] Check RLS is enabled on profiles table
- [ ] Verify `username` column is UNIQUE
- [ ] Test profile creation manually with `upsert_pi_profile`
- [ ] Clear browser cache and localStorage
- [ ] Check Supabase console for detailed errors
- [ ] Ensure .env has correct VITE_SUPABASE_* variables

---

## Performance Notes

- Indexes created on: `username`, `category`, `follower_count`, `created_at`
- Views count cached in `profiles.view_count` (updated via analytics)
- Follower count cached in `profiles.follower_count` (updated via followers table)
- All functions use `SECURITY DEFINER` for safe RLS execution

---

## Security Notes

- RLS policies ensure users can only edit their own profiles
- Followers table is public (read) but insert/delete requires auth
- Analytics can be public (for tracking) but user data is not exposed
- All sensitive operations use service role key

---

## Files to Use

1. **FIX-ALL-FEATURES.sql** - Run first (creates tables/indexes)
2. **FIX-PI-AUTH-PROFILE.sql** - Run second (creates triggers/functions)
3. Both files have verification queries at the end

---

## Next Steps

1. ✅ Apply both SQL files to your Supabase database
2. ✅ Test in Supabase SQL Editor
3. ✅ Clear browser storage and reload app
4. ✅ Sign in with Pi Browser
5. ✅ Profile should be created automatically
6. ✅ Check Dashboard - profile data should load
7. ✅ Go to Public Bio - follower count should show
8. ✅ Use Card Generator - should fetch full profile

---

**Status**: 🟢 Ready to Deploy
**Date**: December 27, 2025
