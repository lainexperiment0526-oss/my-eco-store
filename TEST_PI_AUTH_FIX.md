# 🔐 Pi Authentication Duplicate Key Fix - Testing Guide

## Issue Fixed
**Error:** `duplicate key value violates unique constraint "profiles_pi_username_key"`

**Root Cause:** Code was checking for existing profiles by `username` field instead of `pi_username` field. When a user tried to sign in again, the code didn't find the existing profile and tried to INSERT a new one, violating the UNIQUE constraint on `pi_username`.

## Fix Applied
**File:** `src/services/piMainnetAuthService.ts`  
**Line:** 88  
**Change:** `.eq('username', piData.username)` → `.eq('pi_username', piData.username)`

This ensures we check for existing profiles using the Pi username, which matches the database's UNIQUE constraint.

---

## ✅ Verification Checklist

### 1. Database Schema Verified
- ✅ `pi_username` column has UNIQUE constraint
- ✅ `pi_user_id` column has UNIQUE constraint
- ✅ `pi_wallet_address` column exists (no constraint)
- ✅ Indexes created: `idx_profiles_pi_username`, `idx_profiles_pi_user_id`

### 2. Code Flow Verified
```
User clicks "Sign in with Pi Network"
    ↓
PiContext.signIn() called
    ↓
Pi SDK returns accessToken
    ↓
authenticatePiUser(accessToken) [from piMainnetAuthService]
    ↓
getPiUserProfile(accessToken) → validates token → returns piData
    ↓
linkPiUserToSupabase(piData) → checks by pi_username ✅ FIXED
    ↓
If found: UPDATE profile
If not found: INSERT new profile
    ↓
Return profile to PiContext
    ↓
User signed in successfully
```

### 3. No Other Insert Points
- ✅ Only ONE place inserts profiles: `piMainnetAuthService.ts` line 123
- ✅ All other profile operations use UPDATE or SELECT
- ✅ No duplicate INSERT logic found

---

## 🧪 Testing Instructions

### Test 1: First Time Sign In (New User)
**Expected:** Profile created successfully

1. Open Pi Browser
2. Navigate to `https://droplink.space/auth`
3. Click "Sign in with Pi Network"
4. Approve scopes: username, payments, wallet_address
5. **Expected Result:**
   - ✅ New profile created in database
   - ✅ User redirected to Dashboard
   - ✅ No errors in console

### Test 2: Second Sign In (Existing User) - CRITICAL TEST
**Expected:** Profile updated, no duplicate error

1. Sign out from DropLink
2. Clear browser cache (optional, but recommended)
3. Navigate to `https://droplink.space/auth`
4. Click "Sign in with Pi Network"
5. Approve scopes
6. **Expected Result:**
   - ✅ Existing profile found and updated
   - ✅ User redirected to Dashboard
   - ✅ NO "duplicate key value violates unique constraint" error
   - ✅ Console shows: "✅ Found existing Supabase profile"

### Test 3: Multiple Sign Ins (Stress Test)
**Expected:** Always updates, never tries to insert duplicate

1. Sign in with Pi Network
2. Sign out
3. Repeat 5 times
4. **Expected Result:**
   - ✅ All sign-ins successful
   - ✅ No duplicate key errors
   - ✅ Profile data updated each time

---

## 🔍 How to Verify Fix in Database

### Check Database Constraints
```sql
-- Run in Supabase SQL Editor
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND conname LIKE '%pi_username%';
```

**Expected Output:**
```
constraint_name          | constraint_type | constraint_definition
------------------------|-----------------|----------------------
profiles_pi_username_key | u              | UNIQUE (pi_username)
```

### Check Existing Profiles
```sql
-- Run in Supabase SQL Editor
SELECT 
    id,
    username,
    pi_username,
    pi_user_id,
    created_at,
    updated_at
FROM profiles
WHERE pi_username IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**What to Look For:**
- ✅ Each `pi_username` appears only once (no duplicates)
- ✅ `updated_at` changes when user signs in again
- ✅ No multiple rows with same `pi_username`

---

## 🐛 Console Logs to Watch

### Successful First Sign In (New User)
```
[Pi Auth Service] 🔐 Validating Pi access token with Mainnet API...
[Pi Auth Service] ✅ Token validated. Pi user: your_username
[Pi Auth Service] 🔗 Linking Pi user to Supabase profile...
[Pi Auth Service] Pi username: your_username
[Pi Auth Service] 📝 Creating new Supabase profile for Pi user...
[Pi Auth Service] ✅ New profile created for Pi user
[Pi Auth Service] ✅ Pi Mainnet authentication complete!
```

### Successful Repeat Sign In (Existing User) - FIXED
```
[Pi Auth Service] 🔐 Validating Pi access token with Mainnet API...
[Pi Auth Service] ✅ Token validated. Pi user: your_username
[Pi Auth Service] 🔗 Linking Pi user to Supabase profile...
[Pi Auth Service] Pi username: your_username
[Pi Auth Service] ✅ Found existing Supabase profile    ← THIS SHOULD SHOW
[Pi Auth Service] ✅ Profile updated with Pi data        ← THIS SHOULD SHOW
[Pi Auth Service] ✅ Pi Mainnet authentication complete!
```

### Error Pattern (Should NOT happen anymore)
```
❌ [Pi Auth Service] ❌ Error creating profile: {
  "code": "23505",
  "message": "duplicate key value violates unique constraint \"profiles_pi_username_key\""
}
```

---

## 📊 Success Criteria

✅ **Fix is working if:**
1. New users can sign in and profile is created
2. Existing users can sign in multiple times without errors
3. Console shows "✅ Found existing Supabase profile" for repeat sign-ins
4. Database has only ONE row per pi_username
5. No "duplicate key" errors in console or Supabase logs

❌ **Fix failed if:**
1. "duplicate key value violates unique constraint" still appears
2. Multiple profiles created for same Pi username
3. Sign in fails for existing users

---

## 🔧 Rollback Plan (If Needed)

If the fix causes issues, revert with:

```typescript
// In src/services/piMainnetAuthService.ts line 88
// Change back to:
.eq('username', piData.username)

// But this will bring back the duplicate key error!
```

**Note:** This is NOT recommended. The proper fix is to check by `pi_username`.

---

## 📝 Additional Notes

### Why This Fix Works
1. Database has UNIQUE constraint on `pi_username`
2. Code now checks by `pi_username` before attempting INSERT
3. If profile exists, it UPDATES instead of INSERT
4. No duplicate key violation possible

### Related Files
- ✅ `src/services/piMainnetAuthService.ts` (FIXED)
- ✅ `src/contexts/PiContext.tsx` (calls the fixed service)
- ✅ `verify-pi-auth-schema.sql` (defines UNIQUE constraint)
- ✅ Database table: `public.profiles`

### Database Function Alternative
The database also has a function `authenticate_pi_user_safe()` that checks both `pi_user_id` and `pi_username`:

```sql
WHERE (pi_user_id = p_pi_user_id OR pi_username = p_pi_username)
```

This provides additional safety at the database level.

---

## 🚀 Ready for Testing

**Status:** ✅ Fix applied and ready for testing  
**Priority:** HIGH - Critical authentication issue  
**Testing Required:** Sign in twice with same Pi account  

**Next Steps:**
1. Test in Pi Browser
2. Verify no duplicate key errors
3. Check database has only one profile per pi_username
4. Deploy to production if all tests pass

---

**Created:** December 8, 2025  
**Issue:** Duplicate key violation on pi_username  
**Fix:** Check existing profiles by pi_username instead of username  
**Status:** ✅ FIXED - Ready for Testing
