# 🔧 Pi Auth Authentication Failure - Debugging Guide

## ❌ Current Issue

The user is getting "Pi authentication failed: Authentication failed." error in Pi Browser.

This means the app IS detecting Pi Browser correctly (otherwise it would say "not in Pi Browser"), but the `Pi.authenticate()` call is failing.

---

## 🔍 Root Causes (In Order of Likelihood)

### **1. User Not Authorized in Pi App** ⭐ MOST LIKELY
**What's happening:**
- User hasn't approved the Droplink app in their Pi Network app
- App asks for permission, user hasn't accepted yet
- Or user rejected the permission request

**How to fix:**
1. Open Pi Network app (not browser)
2. Go to Settings → Apps
3. Look for "Droplink" or "b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz"
4. Check if it has permission for "username"
5. If not listed, accept the permission request next time
6. If rejected, tap to re-authorize

**What the console shows:**
```
[PI DEBUG] ⚠️ Pi.authenticate() failed with error: [specific error about authorization]
```

---

### **2. Pi Network App Not Updated**
**What's happening:**
- Pi Browser SDK version 2.0 might require updated Pi Network app
- Older Pi app doesn't support the newest SDK

**How to fix:**
1. Open app store (Google Play or Apple App Store)
2. Search for "Pi Network"
3. Click "Update" if available
4. Restart Pi Browser and try again

---

### **3. User Not Logged Into Pi Network**
**What's happening:**
- User opened Pi Browser but isn't logged into Pi Network
- SDK is available but no user context

**How to fix:**
1. Open the Pi Network app
2. Make sure you're logged in (you should see your Pi username)
3. Then open the app in Pi Browser
4. Try signing in again

---

### **4. Token Validation Issue with Pi API**
**What's happening:**
- `Pi.authenticate()` succeeds
- But verification with `/v2/me` API fails (401 Unauthorized)
- Token is invalid or expired

**Look for in console:**
```
[PI DEBUG] ❌ Pi API verification failed: 401
```

**How to fix:**
- Clear Pi Browser cache (Settings → Clear browsing data)
- Try signing in again

---

## 🧪 Debugging Steps

### Step 1: Check Console Logs
1. Open developer console in Pi Browser (F12 or device menu)
2. Look for `[PI DEBUG]` messages
3. Screenshot or copy the exact error message

### Step 2: Check Which Step Fails
Look for the LAST successful `[PI DEBUG]` message:

| Last Successful Log | Likely Problem |
|-------------------|-----------------|
| `✅ We are in Pi Browser environment` | SDK init failed |
| `✅ Pi SDK initialized successfully` | `Pi.authenticate()` failed |
| `✅ Pi.authenticate() returned successfully` | Token verification failed |
| `✅ Pi user verified` | Supabase save failed |

### Step 3: Manual Test
Run these commands in browser console:

```javascript
// Check 1: Is window.Pi available?
typeof window.Pi !== 'undefined' ? 'YES' : 'NO'

// Check 2: Can we initialize SDK?
if (window.Pi) {
  window.Pi.init({ version: "2.0" })
    .then(() => console.log('SDK init: OK'))
    .catch(err => console.log('SDK init ERROR:', err));
}

// Check 3: What's in localStorage?
{
  token: localStorage.getItem('pi_access_token'),
  user: localStorage.getItem('pi_user')
}

// Check 4: Try authenticate with just username
if (window.Pi) {
  window.Pi.authenticate(['username'], null)
    .then(result => console.log('Auth result:', result))
    .catch(err => console.log('Auth error:', err));
}
```

---

## 📱 Device-Specific Issues

### Android Pi Browser
- Make sure Pi Browser is updated to latest version
- Try clearing app data: Settings → Apps → Pi Browser → Clear Data
- Restart phone

### iOS Pi Browser
- Make sure iPhone has Pi app installed (not just Pi Browser)
- Pi Browser requires companion Pi app for authentication
- Update both apps to latest version

---

## 🛠️ Recent Code Improvements

We've made these improvements to help debugging:

1. **Better error messages** - Now shows exactly WHERE it fails
2. **Scope fallback** - Automatically tries with `['username']` if scopes fail
3. **SDK waiting loop** - Waits up to 2 seconds for SDK to load
4. **Detailed logging** - Every step is logged with [PI DEBUG] prefix
5. **Fixed scope config** - Now defaults to `['username']` only (not payments)

---

## 🚀 Next Steps to Try

### Option 1: Try with Email Auth (Temporary)
1. On login page, switch to "Email" tab
2. Create account with email/password
3. This confirms the backend is working

### Option 2: Full Debug Trace
1. Enable browser DevTools
2. Set breakpoint in signIn function
3. Step through to see exact error
4. Share screenshot of error

### Option 3: Check Pi Network Status
1. Visit https://status.minepi.com
2. Check if Pi API is operational
3. If red/yellow, wait for Pi Network to recover

---

## 📋 What to Report

If this persists, provide:

```
Device: [iPhone/Android]
Pi Browser Version: [Check Settings → About]
Pi Network App Updated: [Yes/No]
Last [PI DEBUG] log: [Copy from console]
Exact error message: [What does error dialog say?]
Steps to reproduce: [What did you do before error?]
```

---

## ✅ Expected Success Flow

When it works, console should show:

```
[PI DEBUG] 🥧 Starting Pi Network initialization...
[PI DEBUG] ✅ Mainnet configuration validated
[PI DEBUG] ✅ We are in Pi Browser environment
[PI DEBUG] ✅ Pi SDK initialized successfully (Mainnet)

[User clicks "Sign in with Pi Network"]

[PI DEBUG] 🔐 signIn() called with scopes: username
[PI DEBUG] ✅ Confirmed we are in Pi Browser
[PI DEBUG] ⏳ Calling Pi.authenticate()...
[PI DEBUG] ✅ Pi.authenticate() returned successfully
[PI DEBUG] ✅ Access token received: ...
[PI DEBUG] 🔍 Verifying with Pi API endpoint: https://api.minepi.com/v2/me
[PI DEBUG] ✅ Pi user verified: ...
[PI DEBUG] 💾 Saving profile to Supabase...
[PI DEBUG] ✅ Profile saved successfully
[PI DEBUG] ✅ Authentication complete! User: ...
```

If you see this sequence, authentication worked!

---

## 📞 When to Get Help

Get help if:
- You're stuck on same step for 10+ minutes
- Multiple devices all fail the same way
- Console shows API error (401, 403, 500)
- Pi Network status shows issues

Share:
1. Screenshot of error dialog
2. Console logs (all [PI DEBUG] messages)
3. Device type and Pi Browser version
4. Whether email auth works
