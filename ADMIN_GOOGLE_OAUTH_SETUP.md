# 🔐 Admin Google OAuth Setup Guide - /admin-mrwain

## Issue
Google Sign-In is not working on the admin login page `/admin-mrwain`

## Root Cause
Google OAuth provider is not configured in Supabase authentication settings

## ✅ Solution: Enable Google OAuth in Supabase

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to APIs & Services → Library
   - Search for "Google+ API"
   - Click Enable
4. Create OAuth 2.0 Credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://jzzbmoopwnvgxxirulga.supabase.co/auth/v1/callback
     https://droplink.space/admin-mrwain
     ```
   - Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **jzzbmoopwnvgxxirulga**
3. Go to **Authentication** → **Providers**
4. Find **Google** and click it
5. Enable the provider (toggle switch)
6. Paste your Google credentials:
   - **Client ID** (from Google Cloud)
   - **Client Secret** (from Google Cloud)
7. Save changes

### Step 3: Verify Setup

After configuring Google OAuth:

1. Go to `/admin-mrwain`
2. Click "Sign in with Google"
3. You should be redirected to Google login page
4. After authentication, you'll be redirected back to `/admin-mrwain`

## 🔧 Code Details

**File:** `src/pages/AdminMrwain.tsx`

The Google OAuth handler uses:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/admin-mrwain`,
    skipBrowserRedirect: false,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  }
});
```

**Redirect URI:** `https://jzzbmoopwnvgxxirulga.supabase.co/auth/v1/callback`

This URI must be registered in both:
- Google Cloud Console (OAuth consent screen)
- Supabase Google provider settings

## 🧪 Testing

### Email/Password Auth (Already Works)
- Username: Email address or @username format
- Password: 6+ characters
- Can sign up and sign in

### Google Auth (Needs Setup)
- Click "Sign in with Google"
- If not configured: Shows error message with guidance
- Once configured: Redirects to Google login

## ⚠️ Redirect URI Mismatch Issues

If you get "Invalid redirect URI" error:

1. **Check Supabase Settings:**
   - Go to Authentication → URL Configuration
   - Verify "Site URL" is set to `https://droplink.space`

2. **Check Google Cloud:**
   - All redirect URIs must be HTTPS
   - Exact URL must match (including scheme and path)
   - Both Google and Supabase settings must match

3. **Common Issues:**
   - ❌ `http://` vs `https://` mismatch
   - ❌ Missing `/auth/v1/callback` path
   - ❌ Wrong project ID in Supabase URL
   - ❌ Typos in domain name

## 📋 Current Configuration

- **Supabase Project:** jzzbmoopwnvgxxirulga
- **Admin Page:** `/admin-mrwain`
- **Authentication:** Supabase Auth
- **Methods:**
  - ✅ Email/Password (working)
  - ⏳ Google OAuth (needs setup)

## 🚀 Next Steps

1. **Immediate:** Get Google credentials from Google Cloud
2. **Then:** Add them to Supabase provider settings
3. **Finally:** Test Google login on `/admin-mrwain`

## 📞 Support

If Google OAuth still doesn't work after setup:

1. Check browser console (F12) for error messages
2. Verify all redirect URIs are HTTPS
3. Check that Google Cloud project is correct
4. Ensure Google+ API is enabled in Google Cloud
5. Wait 5-10 minutes for changes to propagate

---
**Status:** Code ready for OAuth ✅ | Configuration needed ⏳
