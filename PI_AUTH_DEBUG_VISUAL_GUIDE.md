# 🎨 Pi Auth Debug - Visual Guide

## 🖥️ What You'll See on the Login Page

```
┌─────────────────────────────────────────────────┐
│          DROPLINK LOGIN PAGE                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  🔍 Pi Auth Debug Info                   │  │
│  ├──────────────────────────────────────────┤  │
│  │ Pi Browser Detected:  ✅ Yes              │  │
│  │ Pi SDK Loaded:        ✅ Yes              │  │
│  │ isPiBrowserEnv():     ✅ True             │  │
│  │ window.Pi:            ✅ Exists           │  │
│  │                                          │  │
│  │ User Agent: Mozilla/5.0 (Windows NT      │  │
│  │ 10.0; Win64; x64) AppleWebKit/537.36...  │  │
│  │                                          │  │
│  │ ✅ Pi SDK is loaded!                      │  │
│  │ Check browser console for detailed logs. │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Sign in with Pi Network                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Color Legend:
- 🟦 **Blue Box** = Debug info (always visible)
- ✅ **Green Check** = Everything working
- ❌ **Red X** = Something wrong
- ⚠️ **Yellow Warning** = Warning message

---

## 📱 If Pi SDK NOT Loaded

```
┌─────────────────────────────────────────────────┐
│          DROPLINK LOGIN PAGE                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  🔍 Pi Auth Debug Info                   │  │
│  ├──────────────────────────────────────────┤  │
│  │ Pi Browser Detected:  ✅ Yes              │  │
│  │ Pi SDK Loaded:        ❌ No               │  │
│  │ isPiBrowserEnv():     ❌ False            │  │
│  │ window.Pi:            ❌ Undefined        │  │
│  │                                          │  │
│  │ ┌──────────────────────────────────────┐ │  │
│  │ │⚠️ Warning: Pi SDK is not loaded.     │ │  │
│  │ │                                      │ │  │
│  │ │Checklist:                            │ │  │
│  │ │• Use Pi Browser                      │ │  │
│  │ │• Check manifest.json                 │ │  │
│  │ │• Verify validation-key.txt           │ │  │
│  │ │• Confirm Pi SDK in index.html        │ │  │
│  │ │• Reload page                         │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Pi Browser Required (disabled)         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🖥️ Browser Console - Success Sequence

When you click "Sign in with Pi Network", you should see this in the console:

```
[PI AUTH DEBUG] 🟢 START: handlePiSignIn() called
[PI AUTH DEBUG] 📋 User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...
[PI AUTH DEBUG] 🔍 isPiBrowserEnv(): true
[PI AUTH DEBUG] 🔍 userAgent.includes(PiBrowser): true
[PI AUTH DEBUG] 🔍 Combined isPi result: true
[PI AUTH DEBUG] ✅ Pi Browser confirmed - proceeding with signIn()
[PI AUTH DEBUG] 📞 Calling signIn() from PiContext...

[PI SDK] ✅ Pi SDK initialized successfully (Mainnet)
[PI SDK] ✅ Pi.authenticate() returned successfully

[PI AUTH DEBUG] ✅ signIn() completed successfully
[PI AUTH DEBUG] 🔍 piUser after signIn: {
  uid: "abc123def456",
  username: "your_pi_username",
  wallet_address: "..."
}
[PI AUTH DEBUG] 📍 Checking Supabase session...
[PI AUTH DEBUG] 🔍 Supabase session: EXISTS
[PI AUTH DEBUG] 🔍 Access token present: true
[PI AUTH DEBUG] 🔍 piUser present: true
[PI AUTH DEBUG] 📤 Sending user data to /api/save-pi-user...
[PI AUTH DEBUG] 📥 Response status: 200
[PI AUTH DEBUG] 📥 Response data: {
  success: true,
  profile: { username: "your_pi_username", ... }
}
[PI AUTH DEBUG] 🔄 Redirecting to /dashboard
[PI AUTH DEBUG] 🟢 END: handlePiSignIn() completed successfully
```

**Result:** ✅ Redirected to dashboard with Pi user logged in

---

## 🖥️ Console - Error: Not in Pi Browser

```
[PI AUTH DEBUG] 🟢 START: handlePiSignIn() called
[PI AUTH DEBUG] 📋 User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
[PI AUTH DEBUG] 🔍 isPiBrowserEnv(): false
[PI AUTH DEBUG] 🔍 userAgent.includes(PiBrowser): false
[PI AUTH DEBUG] 🔍 Combined isPi result: false
[PI AUTH DEBUG] ❌ NOT in Pi Browser - aborting
```

**Toast Message:** ❌ "Please use Pi Browser to sign in with Pi Network."

**Solution:** Download and open in official Pi Browser from minepi.com

---

## 🖥️ Console - Error: signIn() Failed

```
[PI AUTH DEBUG] 🟢 START: handlePiSignIn() called
[PI AUTH DEBUG] 📋 User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) PiBrowser...
[PI AUTH DEBUG] 🔍 isPiBrowserEnv(): true
[PI AUTH DEBUG] ✅ Pi Browser confirmed - proceeding with signIn()
[PI AUTH DEBUG] 📞 Calling signIn() from PiContext...

[PI SDK] ⚠️ Pi.authenticate() failed with error: User cancelled authentication

[PI AUTH DEBUG] ❌ ERROR in handlePiSignIn: User cancelled authentication
[PI AUTH DEBUG] ❌ Error message: User cancelled authentication
[PI AUTH DEBUG] ❌ Error stack: Error: User cancelled authentication
    at PiContext.tsx:425
    ...
```

**Toast Message:** ❌ "User cancelled authentication"

**Solution:** Try signing in again, or check your internet connection

---

## 🖥️ Console - Error: Backend Verification Failed

```
[PI AUTH DEBUG] 🟢 START: handlePiSignIn() called
[PI AUTH DEBUG] ✅ Pi Browser confirmed
[PI AUTH DEBUG] 📞 Calling signIn()...
[PI AUTH DEBUG] ✅ signIn() completed successfully
[PI AUTH DEBUG] 📍 Checking Supabase session...
[PI AUTH DEBUG] 🔍 Supabase session: EXISTS
[PI AUTH DEBUG] 🔍 Access token present: true
[PI AUTH DEBUG] 📤 Sending user data to /api/save-pi-user...
[PI AUTH DEBUG] 📥 Response status: 400
[PI AUTH DEBUG] 📥 Response data: {
  success: false,
  error: "Invalid Pi access token: 401",
  errorDetails: "Pi API verification failed: 401 Unauthorized"
}

[PI AUTH DEBUG] ❌ ERROR in handlePiSignIn: Invalid Pi access token: 401
[PI AUTH DEBUG] ❌ Error message: Invalid Pi access token: 401
```

**Toast Message:** ❌ "Invalid Pi access token: 401"

**Solution:** 
- Token expired → Clear cache and try again
- Network issue → Check internet connection
- Backend issue → Check Supabase logs

---

## 🔍 Console Search Tips

### Find All Debug Logs
```javascript
// In browser console, copy all logs:
// Ctrl+A in console, then copy and paste to text editor
```

### Count Log Messages
```javascript
// Type in console:
document.querySelectorAll('*').filter(el => el.textContent.includes('[PI AUTH DEBUG]')).length
```

### Filter by Emoji
```javascript
// ✅ Success steps
// ❌ Failure points
// 📞 Function calls
// 📤 Sending data
// 📥 Receiving data
// 🔄 Redirects
```

---

## 📊 Decision Tree

```
START: Click Sign In Button
│
├─ Is console showing [PI AUTH DEBUG] logs?
│  ├─ NO → Check if console is open (F12)
│  └─ YES → Continue
│
├─ First log shows "START"?
│  ├─ NO → JavaScript error, reload page
│  └─ YES → Continue
│
├─ Do you see "Pi Browser confirmed"?
│  ├─ NO → You're not in Pi Browser
│  │        → Download from minepi.com
│  └─ YES → Continue
│
├─ Do you see "signIn() completed"?
│  ├─ NO → Sign in failed
│  │        → Check error message
│  │        → Try again or check network
│  └─ YES → Continue
│
├─ Do you see "Response status: 200"?
│  ├─ NO → Backend error
│  │        → Check errorDetails field
│  │        → Check Supabase logs
│  └─ YES → Continue
│
└─ Do you see "END: ... completed successfully"?
   ├─ NO → Something stuck, reload
   └─ YES → ✅ SUCCESS! Redirecting...
```

---

## 🎯 Quick Fixes

| Problem | Fix |
|---------|-----|
| Console logs not showing | Open console with F12 |
| Logs show Pi Browser: ❌ No | Download official Pi Browser |
| Logs show SDK Loaded: ❌ No | Reload page with Ctrl+F5 |
| Error: "User cancelled" | Click sign in again |
| Error: "Authentication failed" | Check network, try again |
| Error: "Invalid token" | Clear cache, reload, try again |
| Stuck on "Connecting..." | Check console for errors |

---

## 🚀 Success Confirmation

You'll know it's working when:

1. ✅ Debug box shows all green checkmarks
2. ✅ Console shows all [PI AUTH DEBUG] logs
3. ✅ No red error messages in console
4. ✅ Toast says "Signing in..." then redirects
5. ✅ URL changes to `/dashboard`
6. ✅ Your Pi username appears in the app

---

**Start Here:** Open login page in Pi Browser → Look at debug box → Open console → Click sign in → Watch logs
