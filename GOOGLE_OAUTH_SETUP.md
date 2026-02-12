# How to Enable Google OAuth for Admin Panel

## Quick Setup Guide

### Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `droplink-testnet-35167-4`
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list of providers
5. Toggle it to **Enabled**

### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **Droplink Admin**
   - User support email: Your email
   - Developer contact: Your email
   - Save and Continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Droplink Admin Panel**
   - Authorized JavaScript origins:
     - `http://localhost:8080`
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - Get this from Supabase (step 3)

### Step 3: Get Supabase Redirect URL

In Supabase **Authentication** → **Providers** → **Google**:
- Copy the **Callback URL (for OAuth)** 
- Example: `https://idkjfuctyukspexmijvb.supabase.co/auth/v1/callback`

### Step 4: Add Redirect URI to Google

1. Go back to Google Cloud Console
2. Edit your OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   ```
   https://idkjfuctyukspexmijvb.supabase.co/auth/v1/callback
   ```
4. Save

### Step 5: Configure Supabase with Google Credentials

In Supabase **Authentication** → **Providers** → **Google**:

1. Paste your **Client ID** from Google
2. Paste your **Client Secret** from Google
3. Click **Save**

### Step 6: Test the Integration

1. Navigate to `/admin-mrwain`
2. Click "Sign in with Google"
3. Choose your Google account
4. Grant permissions
5. You should be redirected back and logged in!

## Troubleshooting

### Error: redirect_uri_mismatch

**Solution**: Make sure the redirect URI in Google Console exactly matches the one from Supabase.

### Google sign-in button doesn't work

**Solution**: 
- Check browser console for errors
- Verify Google provider is enabled in Supabase
- Ensure Client ID and Secret are correct

### Not redirected after sign-in

**Solution**:
- Check that redirect URL includes `/admin-mrwain`
- Clear browser cache
- Try in incognito mode

## Without Google OAuth

If you don't want to set up Google OAuth, you can still use:
- Email/Password sign-in (already working)
- Just ignore the Google button

## Security Notes

- Never share your Client Secret
- Use HTTPS in production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Console

---

**Status**: Optional Feature
**Time to Setup**: 5-10 minutes
**Required**: No (Email auth works without this)
