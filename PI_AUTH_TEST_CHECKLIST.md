# Pi Auth Testing Checklist

## ✅ Pre-Test Setup

- [ ] Pi Browser app downloaded and installed on phone
- [ ] Logged into Pi Network (in the Pi app)
- [ ] Internet connection stable
- [ ] Latest version of Pi Browser installed
- [ ] App URL is HTTPS (not HTTP)

---

## 🧪 Test 1: Pi Browser Detection

### In Pi Browser Console:
```javascript
// Run these commands in developer console
console.log("Window Pi available:", typeof window.Pi !== 'undefined');
console.log("UserAgent:", navigator.userAgent);
console.log("Contains PiBrowser:", /PiBrowser|Pi/i.test(navigator.userAgent));
```

**Expected Results:**
- [ ] `Window Pi available: true`
- [ ] UserAgent contains "PiBrowser" or "Pi"
- [ ] Contains PiBrowser: true

---

## 🧪 Test 2: SDK Initialization

### In console, after page load:
```javascript
console.log("Pi SDK Methods:", {
  init: typeof window.Pi?.init,
  authenticate: typeof window.Pi?.authenticate,
  nativeFeaturesList: typeof window.Pi?.nativeFeaturesList
});
```

**Expected Results:**
- [ ] All methods should be "function"
- [ ] No errors in console about loading SDK

**Check the page logs:**
- [ ] `[INIT] Pi SDK script tag loaded` appears
- [ ] `[INIT] ✅ Pi SDK available on window.Pi after page load` appears

---

## 🧪 Test 3: Pi Authentication Flow

### Steps:
1. [ ] Open the app in Pi Browser
2. [ ] Navigate to login/auth page
3. [ ] Check console for these logs (in order):

```
[PI DEBUG] 🥧 Starting Pi Network initialization...
[PI DEBUG] ✅ Mainnet configuration validated
[PI DEBUG] 📍 Network: mainnet
[PI DEBUG] 🔗 API Endpoint: https://api.minepi.com
[PI DEBUG] 🔍 isPiBrowserEnv result: true
[PI DEBUG] ✅ We are in Pi Browser environment
[PI DEBUG] ✅ window.Pi is available, initializing SDK...
[PI DEBUG] ✅ Pi SDK initialized successfully (Mainnet)
```

- [ ] All initialization logs appear in order
- [ ] No error logs in initialization
- [ ] See "✅ We are in Pi Browser environment"

---

## 🧪 Test 4: Sign In Button Click

### Steps:
1. [ ] Click "Sign in with Pi Network" button
2. [ ] Watch console for authentication logs
3. [ ] Verify this sequence:

```
[PI DEBUG] 🔐 signIn() called with scopes: username
[PI DEBUG] ✅ Confirmed we are in Pi Browser
[PI DEBUG] ⏳ Calling Pi.authenticate()...
```

**Expected behavior:**
- [ ] Pi Network authentication popup appears
- [ ] User sees permission request
- [ ] No error logs appear

---

## 🧪 Test 5: User Authorization

### In Pi Network popup:
- [ ] User clicks "Authorize" button
- [ ] Popup closes
- [ ] Check console continues with:

```
[PI DEBUG] ✅ Pi.authenticate() returned successfully
[PI DEBUG] ✅ authResult received: { hasAccessToken: true, hasUser: true, userId: ... }
[PI DEBUG] ✅ Access token received: ...
```

- [ ] Access token is shown (truncated)
- [ ] No authentication failure messages

---

## 🧪 Test 6: Token Verification

### Verify these logs appear:

```
[PI DEBUG] 🔍 Verifying with Pi API endpoint: https://api.minepi.com/v2/me
[PI DEBUG] ✅ Pi user verified: [uid] [username]
```

**Expected:**
- [ ] User UID and username appear in log
- [ ] No "verification failed" errors
- [ ] Response status should be 200

---

## 🧪 Test 7: Profile Saving

### Check for these logs:

```
[PI DEBUG] 💾 Saving profile to Supabase with RPC call...
[PI DEBUG] ✅ Profile saved successfully
```

**Expected:**
- [ ] Profile saving completes
- [ ] No RPC errors
- [ ] No database connection errors

---

## 🧪 Test 8: Successful Login

### Verify completion:

```
[PI DEBUG] ✅ Authentication complete! User: [username]
```

**Expected behavior:**
- [ ] User is redirected to dashboard
- [ ] Username appears in the interface
- [ ] localStorage contains:
  - `pi_access_token` 
  - `pi_user`

**Check localStorage:**
```javascript
localStorage.getItem('pi_access_token'); // Should be non-empty
localStorage.getItem('pi_user');        // Should be JSON object
```

- [ ] `pi_access_token` is not empty
- [ ] `pi_user` contains valid JSON with username

---

## 🧪 Test 9: Session Persistence

### Test reload:
1. [ ] User is logged in (dashboard visible)
2. [ ] Refresh the page
3. [ ] Check console for auto-login log:

```
[PI DEBUG] 🔍 Found stored Pi authentication, verifying...
[PI DEBUG] ✅ Auto-authenticated with stored credentials (Mainnet)
```

**Expected:**
- [ ] Page reloads without requiring re-authentication
- [ ] User stays logged in
- [ ] Auto-login logs appear in console

---

## 🧪 Test 10: Sign Out

### Steps:
1. [ ] Click sign out button
2. [ ] Verify localStorage is cleared:

```javascript
localStorage.getItem('pi_access_token'); // Should be null
localStorage.getItem('pi_user');        // Should be null
```

- [ ] Both localStorage items are removed
- [ ] User is redirected to login
- [ ] Toast message appears

---

## ❌ Error Scenarios to Test

### Scenario 1: Not in Pi Browser
- [ ] Open app in regular browser
- [ ] Should see error: "Pi Network features are only available in the official Pi Browser"
- [ ] Console shows: `[PI DEBUG] ❌ Pi Browser NOT detected`

### Scenario 2: User Cancels Auth
- [ ] Open in Pi Browser
- [ ] Click Sign In
- [ ] Click "Decline" on Pi auth popup
- [ ] Should see error in console about cancellation

### Scenario 3: Network Error
- [ ] Turn off internet
- [ ] Try to sign in
- [ ] Should see network error in logs
- [ ] Error message: "Failed to initialize Pi SDK" or network error

### Scenario 4: No Internet When Verifying
- [ ] Authenticate successfully
- [ ] Turn off internet before verification completes
- [ ] Should see API verification error

---

## 📊 Test Results Summary

| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Pi Browser Detection | window.Pi defined | | ☐ |
| SDK Initialization | All methods available | | ☐ |
| Initial Logs | All logs appear | | ☐ |
| Sign In Click | Auth popup appears | | ☐ |
| User Authorizes | Logs continue | | ☐ |
| Token Received | Access token shown | | ☐ |
| API Verification | User verified | | ☐ |
| Profile Saved | Saved successfully | | ☐ |
| Login Complete | Redirected to dashboard | | ☐ |
| Session Persistence | Auto-login on reload | | ☐ |
| Sign Out | localStorage cleared | | ☐ |

---

## 🐛 Bugs Found

If you find bugs during testing, note:

```
Bug #1: [Description]
- Reproducible in: [Pi Browser version, device]
- Expected: [What should happen]
- Actual: [What actually happened]
- Console logs: [Paste relevant logs]
- Suggested fix: [If known]
```

---

## ✅ Sign-Off

- [ ] All tests passed
- [ ] No errors in console
- [ ] Authentication flow complete
- [ ] Session persists across reload
- [ ] Sign out works
- [ ] Error scenarios handled properly

**Tested by:** _____________

**Date:** _____________

**Overall Status:** 🟢 Ready for Production / 🟡 Needs Fix / 🔴 Critical Issues
