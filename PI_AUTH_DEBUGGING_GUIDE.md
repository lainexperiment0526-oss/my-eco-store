# Pi Auth Debugging Guide - Pi Browser Sign In Issues

## 🔧 What We Fixed

We've enhanced the Pi Authentication system with better detection and comprehensive logging. Here's what was improved:

### 1. **Enhanced Pi Browser Detection** ✅
The `isPiBrowserEnv()` function now uses multiple detection methods in order of reliability:
1. Check for `window.Pi` object (most reliable)
2. Check userAgent for Pi Browser patterns
3. Check for Pi-specific browser properties
4. Detailed logging at each step

### 2. **Improved SDK Initialization** ✅
- Waits for `window.Pi` to be available (up to 2 seconds) before trying to use it
- Better error messages if SDK fails to load
- Comprehensive logging of initialization steps

### 3. **Enhanced Sign In Flow** ✅
- Detailed logging at EVERY step of authentication
- Better error handling with specific messages
- Fallback scope handling if payments permission not available
- Session persistence verification

---

## 🧪 Testing in Pi Browser

### Step 1: Open Developer Console
1. Open the app in **Pi Browser** on your phone
2. Enable developer mode and open console (this varies by device)
3. Alternatively, use a Pi Browser emulator or debugger

### Step 2: Look for These Console Logs

When you click "Sign in with Pi Network", you should see these logs in order:

```
[PI DEBUG] 🥧 Starting Pi Network initialization...
[PI DEBUG] ✅ Mainnet configuration validated
[PI DEBUG] 📍 Network: mainnet
[PI DEBUG] 🔗 API Endpoint: https://api.minepi.com
[PI DEBUG] 🔍 isPiBrowserEnv result: true
[PI DEBUG] ✅ We are in Pi Browser environment
```

Then when you click the sign-in button:

```
[PI DEBUG] 🔐 signIn() called with scopes: username
[PI DEBUG] ✅ Confirmed we are in Pi Browser
[PI DEBUG] ⏳ Calling Pi.authenticate()...
[PI DEBUG] ✅ Pi.authenticate() returned successfully
[PI DEBUG] ✅ authResult received: { hasAccessToken: true, hasUser: true, userId: ... }
[PI DEBUG] ✅ Access token received: ...
[PI DEBUG] 🔍 Verifying with Pi API endpoint: https://api.minepi.com/v2/me
[PI DEBUG] ✅ Pi user verified: uid, username
[PI DEBUG] 💾 Saving profile to Supabase with RPC call...
[PI DEBUG] ✅ Profile saved successfully
[PI DEBUG] ✅ Authentication complete! User: ...
```

---

## 🚨 Troubleshooting

### Issue: "Pi Browser NOT detected"

**Console shows:**
```
[PI DEBUG] ❌ Pi Browser NOT detected. UserAgent: ...
```

**Solutions:**
1. **Verify you're in Pi Browser**: Download from https://minepi.com/get
2. **Check if Pi SDK loaded**: Look for `<script src="https://sdk.minepi.com/pi-sdk.js"></script>` in HTML
3. **Clear Pi Browser cache**: Settings → Clear browsing data
4. **Update Pi Browser**: Check for app updates in app store
5. **Try in incognito mode**: Some Pi Browser versions have cache issues

---

### Issue: "window.Pi is undefined"

**Console shows:**
```
[PI DEBUG] ❌ window.Pi is still undefined after waiting!
```

**Solutions:**
1. **Check internet connection**: Pi SDK must download from https://sdk.minepi.com
2. **Check CSP headers**: Look for errors like "Refused to load the script..."
3. **Verify manifest.json**: Your app ID must be registered in Pi Network
4. **Try refreshing**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

### Issue: "Pi.authenticate() failed"

**Console shows:**
```
[PI DEBUG] ⚠️ Pi.authenticate() failed with error: ...
```

**Solutions depend on the error message:**

#### "User cancelled"
- User clicked cancel on the Pi authentication popup
- Just ask them to try again

#### "scope" or "permission" related
- System automatically retries with just 'username' scope
- This is normal - payments scope may not be approved yet

#### "Not authenticated with Pi Network"
- User is not logged into Pi Network app
- Ask them to open Pi Network app and log in first

#### "Network error"
- Connection issue between app and Pi Network
- Check internet connection
- Try again in a moment

---

### Issue: "Pi API verification failed"

**Console shows:**
```
[PI DEBUG] ❌ Pi API verification failed: 401/403/500
```

**Solutions:**

#### Status 401 (Unauthorized)
- Access token is invalid or expired
- Try signing out and signing in again

#### Status 403 (Forbidden)
- Token validation failed
- Check that your app ID matches the one in Pi Network

#### Status 500 (Server Error)
- Pi Network API is temporarily down
- Try again in a few minutes
- Check status at https://status.minepi.com

---

### Issue: "Failed to save Pi user profile to Supabase"

**Console shows:**
```
[PI DEBUG] ❌ RPC error: ...
```

**Solutions:**
1. **Check Supabase connection**: Is the database accessible?
2. **Verify RPC function**: Check that `authenticate_pi_user` RPC exists in Supabase
3. **Check permissions**: Does your service role have access to the RPC?
4. **Review error code**: Check the error code in logs for specific issue

---

## 📊 Debug Flags

### Enable All Logging

The code has detailed console logging enabled. Look for messages starting with `[PI DEBUG]`.

### Test with ?debug=1

Add `?debug=1` to the URL for additional test buttons in the Auth page:

```
https://droplink.space/auth?debug=1
```

This shows special test buttons like "Sign in with username only".

---

## 🔍 What to Check First

When Pi Auth isn't working, check in this order:

1. **Are you in Pi Browser?**
   ```javascript
   console.log(typeof window.Pi !== 'undefined' ? '✅ Yes' : '❌ No')
   ```

2. **Is the SDK loaded?**
   ```javascript
   console.log(window.Pi?.init ? '✅ SDK available' : '❌ SDK not loaded')
   ```

3. **What's the userAgent?**
   ```javascript
   console.log(navigator.userAgent)
   ```

4. **Check localStorage after auth**
   ```javascript
   console.log({
     token: !!localStorage.getItem('pi_access_token'),
     user: localStorage.getItem('pi_user')
   })
   ```

---

## 📝 Information to Include When Reporting Issues

If Pi Auth still doesn't work, provide:

1. **Console logs** from the complete login attempt (copy all `[PI DEBUG]` messages)
2. **Device info**: Which phone? iOS or Android?
3. **Pi Browser version**: Check Settings → About
4. **When it breaks**: At which step (detection, SDK init, authenticate, verify, save)?
5. **Network info**: Any proxy or VPN? What's your internet type?

---

## ✅ Verification Checklist

- [x] Pi Browser detection works in multiple ways
- [x] SDK initialization waits for window.Pi
- [x] Each authentication step logs progress
- [x] Error messages are specific and helpful
- [x] Fallback handling for scope issues
- [x] Token persistence works
- [x] Session auto-login on refresh

---

## 🚀 Next Steps

If the issue persists, check:

1. **Network tab**: Are the API calls reaching https://api.minepi.com?
2. **HTTPS requirement**: App must be on HTTPS (not HTTP)
3. **CORS headers**: Check if requests are blocked by CORS
4. **Pi Network status**: Check https://status.minepi.com

---

## 📞 Support Resources

- **Pi Network Docs**: https://developers.minepi.com
- **Pi Browser Download**: https://minepi.com/get
- **Pi API Docs**: https://developers.minepi.com/docs/rest-api
- **Pi Network Status**: https://status.minepi.com
