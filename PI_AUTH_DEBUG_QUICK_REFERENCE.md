# 🚀 Pi Auth Debug - Quick Reference

## Console Logs to Watch For

When you click "Sign in with Pi Network" in Pi Browser, watch console for:

### ✅ SUCCESS Path
```
[PI AUTH DEBUG] 🟢 START: handlePiSignIn() called
[PI AUTH DEBUG] ✅ Pi Browser confirmed - proceeding with signIn()
[PI AUTH DEBUG] ✅ signIn() completed successfully
[PI AUTH DEBUG] 📤 Sending user data to /api/save-pi-user...
[PI AUTH DEBUG] 📥 Response status: 200
[PI AUTH DEBUG] 🟢 END: handlePiSignIn() completed successfully
```

### ❌ FAILURE Path

#### NOT in Pi Browser
```
[PI AUTH DEBUG] 🔍 Combined isPi result: false
[PI AUTH DEBUG] ❌ NOT in Pi Browser - aborting
```
→ **Solution:** Use official Pi Browser app

#### Pi SDK Not Loaded
```
[PI AUTH DEBUG] 🔍 window.Pi: ❌ Undefined
```
→ **Solution:** Check index.html has Pi SDK script tag

#### signIn() Failed
```
[PI AUTH DEBUG] ❌ ERROR in handlePiSignIn: Authentication failed
```
→ **Solution:** User cancelled or network issue

#### Backend Verification Failed
```
[PI AUTH DEBUG] 📥 Response status: 400
[PI AUTH DEBUG] ❌ ERROR: ...errorDetails...
```
→ **Solution:** Check Supabase logs or token validity

---

## Debug Info Box on Page

Look at the blue **"🔍 Pi Auth Debug Info"** box:

| Indicator | Meaning | What to Do |
|-----------|---------|-----------|
| `Pi Browser Detected: ✅ Yes` | Good | You're in Pi Browser |
| `Pi Browser Detected: ❌ No` | Problem | Download/open official Pi Browser |
| `Pi SDK Loaded: ✅ Yes` | Good | SDK is ready |
| `Pi SDK Loaded: ❌ No` | Problem | Reload in Pi Browser, check manifest.json |
| `isPiBrowserEnv(): ✅ True` | Good | Detection working |
| `window.Pi: ✅ Exists` | Good | SDK accessible |
| `window.Pi: ❌ Undefined` | Problem | SDK not loaded yet |

---

## 3-Step Debug Process

### 1️⃣ Check Page Status
- Open in Pi Browser
- Look at debug info box
- All checkmarks green? → Go to step 2
- Some red? → Fix the issue shown

### 2️⃣ Click Sign In Button
- Open console (F12 → Console)
- Click "Sign in with Pi Network"
- Look for `[PI AUTH DEBUG]` logs
- Did you approve in Pi Network popup?

### 3️⃣ Find the Failure Point
- ❌ NOT in Pi Browser → Use official app
- ❌ SDK Not Loaded → Reload page
- ❌ signIn() failed → Network issue or user cancelled
- ❌ Backend failed → Check error response

---

## Files with Debug Code

1. **Frontend (React):** `src/pages/PiAuth.tsx`
   - Debug info display box
   - Console logs in handlePiSignIn()

2. **Backend (Supabase):** `supabase/functions/pi-auth/index.ts`
   - Request body logging
   - Pi API response logging
   - Error details in response

---

## Common Error Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Pi Browser Required" | Wrong browser | Download Pi Browser from minepi.com |
| "Pi SDK is not loaded" | SDK script missing | Check index.html has Pi SDK script |
| "Authentication failed" | User cancelled | Try again or check network |
| "Invalid Pi access token" | Token expired | Clear cache, reload, try again |
| "Failed to save profile" | Database error | Check Supabase logs |

---

## Emoji Legend

- 🟢 = Start/Checkpoint
- ✅ = Success/Yes
- ❌ = Failure/No
- 🔍 = Inspection/Check
- 📋 = Information
- 📞 = Function call
- 📍 = Location/Checkpoint
- 📤 = Sending data
- 📥 = Receiving data
- 🔄 = Redirect/Navigation
- ⚠️ = Warning

---

Last Updated: December 5, 2025
