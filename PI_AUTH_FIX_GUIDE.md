# Pi Network Authentication - Troubleshooting Guide

## 🔴 Issues Fixed

### 1. **RPC Parameter Mismatch** ✅ FIXED
**Problem**: The `signIn()` function was passing an extra `validation_key` parameter to the `authenticate_pi_user` RPC function that doesn't exist.

**Error**: The RPC call was failing silently or with database errors.

**Fix Applied**: 
- Removed the invalid `validation_key` parameter from the RPC call
- The function now only passes the 4 required parameters:
  - `p_pi_user_id`
  - `p_pi_username`
  - `p_access_token`
  - `p_wallet_address`

### 2. **Improved Error Logging** ✅ FIXED
**Problem**: Generic error messages made it difficult to debug authentication failures.

**Fix Applied**:
- Added detailed console logging at each step of the authentication flow
- Error messages now include specific error codes and details
- Debug output shows:
  - Whether Pi Browser is detected
  - Scopes being requested
  - Token verification status
  - API response details
  - RPC error codes and messages

---

## 🔍 How to Debug Pi Auth Issues

### Step 1: Check Browser Console
Open the Pi Browser → F12 to open developer tools → Console tab

Look for these success indicators:
```
✅ Access token received: <token starts with>...
✅ Pi user verified: <uid> <username>
✅ Profile saved successfully
✅ Authentication complete! User: <username>
```

### Step 2: Common Error Messages & Solutions

#### Error: "Pi Network features are only available in the official Pi Browser"
- **Cause**: Not running in Pi Browser
- **Solution**: Download and open the app in official Pi Browser from https://minepi.com/download

#### Error: "No access token received from Pi Network"
- **Cause**: Pi.authenticate() didn't return a token
- **Possible causes**:
  - Pi SDK not loaded in Pi Browser
  - User cancelled authentication
  - Network connectivity issue
- **Solution**: 
  - Check internet connection
  - Try signing in again
  - Clear browser cache (Settings → Clear browsing data)

#### Error: "Failed to validate Pi user with mainnet API" + HTTP status code
- **Cause**: Pi API rejected the access token
- **Possible causes**:
  - Token is invalid or expired
  - Pi API endpoint is unreachable
  - CORS issue (shouldn't happen - Pi API should allow this)
- **Solution**:
  - Try signing out and signing in again
  - Check if you're logged into Pi Network in Pi Browser
  - Wait a few minutes and retry

#### Error: "Failed to save Pi user profile to Supabase" + RPC error
- **Cause**: Database function failed
- **Common error codes**:
  - `23505`: Username already exists
  - `22023`: Invalid parameter type
  - `42883`: Function doesn't exist
- **Solutions**:
  - If username exists: The app should handle this (choose different username)
  - If function doesn't exist: Run the migration in Supabase
  - Check Supabase connection and API keys

### Step 3: Enable Verbose Logging

Add this to your browser console to enable more detailed logging:
```javascript
// Enable all Pi SDK logging
window.PiDebugMode = true;
console.log("Pi Debug Mode enabled");

// Run comprehensive authentication test
(async () => {
  try {
    console.log("Testing Pi SDK availability...");
    if (typeof window.Pi === "undefined") {
      console.error("❌ Pi SDK not available!");
      return;
    }
    
    console.log("✅ Pi SDK available");
    console.log("Testing Pi.authenticate()...");
    
    const auth = await window.Pi.authenticate(
      ['username'],
      (payment) => console.log('Incomplete payment:', payment)
    );
    
    console.log("✅ Authentication result:", auth);
    console.log("Access Token:", auth.accessToken?.substring(0, 30) + "...");
    console.log("User:", auth.user);
  } catch (error) {
    console.error("❌ Authentication test failed:", error);
  }
})();
```

### Step 4: Check Network Requests

1. Open DevTools → Network tab
2. Try to sign in
3. Look for these requests:
   - `https://api.minepi.com/v2/me` - should return 200
   - Supabase RPC call - should return 200

If requests are failing:
- Check HTTP status code
- Click on request to see response body
- Share the error details for debugging

---

## 🛠️ Manual Testing Checklist

- [ ] Open app in Pi Browser
- [ ] Check console for "Pi SDK initialized successfully"
- [ ] Click "Sign in with Pi Network"
- [ ] Authorize the request in Pi Network popup
- [ ] Check console for success logs
- [ ] Should see green success message
- [ ] Should be redirected to dashboard
- [ ] Refresh page - should still be logged in
- [ ] Check localStorage: `localStorage.getItem('pi_access_token')` should show token
- [ ] Check localStorage: `localStorage.getItem('pi_user')` should show user data

---

## 📋 Required Supabase Setup

The following must exist in your Supabase database:

### 1. Function: `authenticate_pi_user`
```sql
CREATE OR REPLACE FUNCTION authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL
)
RETURNS JSON
```

### 2. Table: `profiles`
Required columns:
- `id` (UUID, primary key)
- `user_id` (UUID)
- `username` (text)
- `pi_user_id` (text)
- `pi_username` (text)
- `pi_access_token` (text)
- `pi_wallet_address` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. Table: `user_preferences`
Required columns:
- `user_id` (UUID)
- `theme` (text)
- `notifications_enabled` (boolean)

Run this migration if tables don't exist:
```bash
supabase migration up
```

---

## 🚀 Environment Variables

Ensure these are set in your `.env` file:
```
VITE_SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

And in Supabase (Settings → Database → Environment Variables):
```
SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## 🔐 Configuration Files to Check

1. **`src/config/pi-config.ts`**
   - `API_KEY`: Must match manifest.json
   - `ENDPOINTS.ME`: Must be `https://api.minepi.com/v2/me`
   - `NETWORK`: Must be `"mainnet"`
   - `SANDBOX_MODE`: Must be `false`

2. **`manifest.json`**
   - `api_key`: Must match pi-config.ts
   - `version`: Must match SDK version
   - `networks`: Must include mainnet

3. **`index.html`**
   - Pi SDK script: `https://sdk.minepi.com/pi-sdk.js`
   - CSP headers allow: `sdk.minepi.com`, `api.minepi.com`, `*.supabase.co`

---

## 📞 Still Having Issues?

1. **Collect Debug Info**:
   ```javascript
   console.log({
     piAvailable: typeof window.Pi !== 'undefined',
     piVersion: window.Pi?.version,
     isPiBrowser: navigator.userAgent.includes('PiBrowser'),
     supabaseUrl: 'check in Network tab',
     apiKey: 'check manifest.json'
   });
   ```

2. **Share**:
   - Browser console screenshot
   - Network requests screenshot
   - Error message text
   - Your Pi username

3. **Check Logs**:
   - Supabase dashboard → Logs
   - Pi Developer Console → API calls
   - Browser console → JavaScript errors

---

## ✅ Success Indicators

When authentication works correctly:
1. ✅ "Sign in with Pi Network" button is clickable
2. ✅ Pi auth popup appears and closes
3. ✅ Console shows "✅ Authentication complete!"
4. ✅ Redirected to dashboard (not auth page)
5. ✅ Profile photo appears in top right (if configured)
6. ✅ Can see username in app
7. ✅ localStorage has `pi_access_token` and `pi_user`
8. ✅ Refreshing page keeps you logged in
