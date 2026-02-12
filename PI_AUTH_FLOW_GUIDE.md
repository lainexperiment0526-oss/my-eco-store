# 🔐 Pi Authentication Flow Guide

**Last Updated:** December 11, 2025

## Overview

This document explains how Pi authentication works in both the Dashboard and PublicBio pages, specifically for users accessing via Pi Browser (no Gmail required).

---

## 🎯 How It Works

### 1️⃣ **Dashboard Page** (`/`)

**Authentication Flow:**

```typescript
// Step 1: Check Pi authentication status
const { piUser, isAuthenticated } = usePi();

// Step 2: Load user profile by Pi username
if (isAuthenticated && piUser) {
  // Load profile using Pi username
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", piUser.username)
    .maybeSingle();
  
  // If no profile exists, auto-create one
  if (!profileData) {
    await supabase.from("profiles").upsert({
      username: piUser.username,
      business_name: piUser.username,
      pi_user_id: piUser.uid,
      description: "",
      email: "", // Pi users don't need email
    }, { onConflict: 'username' });
  }
}
```

**Key Points:**
- ✅ No Gmail required - uses Pi username
- ✅ Auto-creates profile on first login
- ✅ Uses `pi_user_id` and `pi_username` for identification
- ✅ Tracks authentication with `last_pi_auth` timestamp

---

### 2️⃣ **PublicBio Page** (`/@username`)

**Dual Authentication Support:**

```typescript
const loadCurrentUserProfile = async () => {
  // Check for Gmail users (Supabase session)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profile) {
      setCurrentUserProfileId(profile.id);
      return;
    }
  }

  // Check for Pi-authenticated users (no Supabase session)
  if (isPiAuthenticated && piUser?.username) {
    const { data: piProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", piUser.username)
      .maybeSingle();
    
    if (piProfile) {
      setCurrentUserProfileId(piProfile.id);
    }
  }
};
```

**Key Points:**
- ✅ Supports **both** Gmail and Pi authentication
- ✅ Gmail users: matched by `user_id`
- ✅ Pi users: matched by `username` or `pi_username`
- ✅ No authentication required to **view** profiles (public access)
- ✅ Authentication required to **follow** or **interact** with profiles

---

## 📊 Database Schema

### Profiles Table Structure

```sql
CREATE TABLE public.profiles (
    -- Standard fields
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    business_name TEXT,
    description TEXT,
    avatar_url TEXT,
    
    -- Gmail user authentication
    user_id UUID REFERENCES auth.users(id), -- NULL for Pi users
    email TEXT,
    
    -- Pi Network authentication
    pi_user_id TEXT UNIQUE,              -- Pi uid (e.g., "ABCD1234")
    pi_username TEXT UNIQUE,             -- Pi username (e.g., "johndoe")
    pi_access_token TEXT,                -- Encrypted access token
    pi_access_token_expiry TIMESTAMPTZ,  -- Token expiration
    last_pi_auth TIMESTAMPTZ,            -- Last auth timestamp
    
    -- Display options
    display_name TEXT,                   -- User-friendly name
    environment TEXT DEFAULT 'mainnet',  -- 'mainnet' or 'testnet'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔍 User Identification Logic

### Dashboard (Owner Access)

```typescript
// Pi User
if (isPiAuthenticated && piUser) {
  userIdentifier = piUser.username;  // Use Pi username
  isPiUser = true;
}

// Gmail User
else if (supabaseUser) {
  userIdentifier = supabaseUser.email; // Use email
  isPiUser = false;
}

// No authentication → Redirect to /auth
else {
  navigate("/auth");
}
```

### PublicBio (Visitor Access)

```typescript
// Profile Owner (from URL)
const profileData = await supabase
  .from("profiles")
  .select("*")
  .eq("username", username) // From URL: /@username
  .maybeSingle();

// Current Visitor (if logged in)
if (supabaseUser) {
  // Gmail user viewing profile
  currentUserProfileId = profile.id; // matched by user_id
}
else if (isPiAuthenticated && piUser) {
  // Pi user viewing profile
  currentUserProfileId = piProfile.id; // matched by username
}
else {
  // Anonymous visitor (can view, can't interact)
  currentUserProfileId = null;
}
```

---

## 🚀 Follow Feature in Pi Browser

### Flow for Pi Users

```typescript
const handleFollow = async () => {
  // Step 1: Check if user is authenticated
  if (!isPiAuthenticated || !piUser) {
    // Redirect to dashboard for Pi auth
    sessionStorage.setItem('authAction', 'follow');
    sessionStorage.setItem('profileToFollow', username);
    navigate('/');
    return;
  }
  
  // Step 2: Get current user's profile ID
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", piUser.username)
    .single();
  
  // Step 3: Create follow relationship
  await supabase.from("followers").insert({
    follower_profile_id: currentProfile.id,
    following_profile_id: profileId, // Profile being viewed
  });
  
  setIsFollowing(true);
  toast.success("Following!");
};
```

**Key Points:**
- ✅ Pi users are redirected to dashboard for authentication
- ✅ After auth, they return to complete the follow action
- ✅ Session storage preserves the intended action
- ✅ No Gmail required for any interaction

---

## 🛠️ SQL Migration Applied

**File:** `supabase/migrations/20251211000000_pi_auth_profile_update.sql`

**What It Does:**

1. ✅ Adds/verifies Pi authentication columns:
   - `pi_user_id` (unique Pi Network user ID)
   - `pi_username` (Pi Network username)
   - `pi_access_token` (encrypted token storage)
   - `pi_access_token_expiry` (token expiration)
   - `last_pi_auth` (authentication tracking)
   - `display_name` (user-friendly name)
   - `environment` (mainnet/testnet)

2. ✅ Creates optimized indexes:
   - Fast Pi user lookups by `pi_user_id`
   - Fast username lookups by `pi_username`
   - Case-insensitive username search

3. ✅ Updates RLS policies:
   - Public read access (for PublicBio page)
   - Authenticated insert/update/delete
   - Works for both Gmail and Pi users

4. ✅ Helper functions:
   - `get_profile_by_pi_username()` - Fast Pi user lookup
   - `upsert_pi_user_profile()` - Create/update Pi profiles

---

## 📱 Testing in Pi Browser

### Dashboard Test

1. Open Pi Browser
2. Navigate to your app URL
3. App automatically requests Pi authentication
4. Pi user is authenticated via Pi Network
5. Profile is loaded/created using Pi username
6. **No Gmail required!**

### PublicBio Test

1. Open Pi Browser
2. Navigate to `/@username` (any profile)
3. Profile loads without authentication (public view)
4. To follow:
   - Click "Follow" button
   - Redirects to dashboard for Pi auth
   - Returns to complete follow action
5. **No Gmail required!**

---

## 🎯 Key Differences

| Feature | Gmail Users | Pi Users |
|---------|-------------|----------|
| **Authentication** | Supabase Auth | Pi Network Auth |
| **Identifier** | `user_id` (UUID) | `pi_username` (string) |
| **Email Required** | ✅ Yes | ❌ No |
| **Profile Lookup** | By `user_id` | By `username` or `pi_username` |
| **Auto-Create Profile** | ✅ Yes | ✅ Yes |
| **Can View Public Bio** | ✅ Yes | ✅ Yes |
| **Can Follow** | ✅ Yes | ✅ Yes |
| **Stored in DB** | `user_id` set | `user_id` is NULL, `pi_user_id` set |

---

## ✅ Verification Checklist

- [x] Pi authentication columns exist in profiles table
- [x] Indexes created for fast Pi user lookups
- [x] RLS policies allow Pi users to create/update profiles
- [x] Dashboard loads profiles for Pi users (no Gmail)
- [x] PublicBio supports both Gmail and Pi users
- [x] Follow feature works for Pi users
- [x] Profile auto-creation works for Pi users
- [x] No email required for Pi users

---

## 🎉 Summary

**The system now fully supports Pi authentication!**

- ✅ **Dashboard:** Works with Pi Browser (no Gmail)
- ✅ **PublicBio:** Supports both Gmail and Pi users
- ✅ **Database:** Properly handles Pi user identification
- ✅ **Follow Feature:** Works for Pi authenticated users
- ✅ **Profile Creation:** Automatic for new Pi users

**Pi users can now:**
1. Sign in via Pi Network (no Gmail)
2. Auto-create their profile
3. View any public profile
4. Follow other users
5. Manage their dashboard
6. Interact with all features

**No Gmail required anywhere in the flow!** 🎊
