# Pi Auth Fix - Quick Troubleshooting

**Status:** Auth Service Reset & Fixed ✅

---

## 🎯 Quick Verification

### Step 1: Check if Auth Service Loads
```typescript
// Open browser console
import { authenticatePiUser } from '@/services/piMainnetAuthService';
console.log('✅ Auth service loaded');
```

### Step 2: Test Token Validation
```typescript
// With a valid token from Pi.authenticate()
const accessToken = window.localStorage.getItem('piAccessToken');
const result = await authenticatePiUser(accessToken);
console.log(result); // Should show: {success: true, piUser: {...}, supabaseProfile: {...}}
```

### Step 3: Check Console Logs
```
[Pi Auth Service] 🔐 Validating Pi access token...
[Pi Auth Service] ✅ Pi token validated. Username: wain2020
[Pi Auth Service] 🔗 Linking Pi user to Supabase profile...
[Pi Auth Service] ✅ Step 1: Token validated
[Pi Auth Service] ✅ Step 2: Profile linked
[Pi Auth Service] ✅ Authentication complete!
```

---

## ❌ Common Issues & Fixes

### Issue 1: "Invalid or expired Pi access token"
```
❌ Problem: Token is invalid or expired

✅ Fix:
  1. Try signing in again with Pi.authenticate()
  2. Get fresh token before calling authenticatePiUser()
  3. Make sure token is being passed correctly
  4. Check you're in Pi Browser, not Chrome
```

### Issue 2: "Token validation failed: 401"
```
❌ Problem: Token is unauthorized

✅ Fix:
  1. Verify token is complete (should be long string)
  2. Check VITE_PI_API_KEY is set in .env
  3. Verify you're on mainnet (not sandbox)
  4. Try clearing browser cache and re-auth
```

### Issue 3: "Profile linking failed"
```
❌ Problem: Supabase profile creation/update failed

✅ Fix:
  1. Check profiles table exists in Supabase
  2. Verify Supabase connection is working
  3. Check username doesn't have special characters
  4. Look at Supabase error in console for details
```

### Issue 4: "Still showing login page after auth"
```
❌ Problem: PiContext not updating after auth

✅ Fix:
  1. Check usePi().signIn() calls authenticatePiUser()
  2. Verify result.success === true
  3. Check PiContext saves authenticated state
  4. Verify navigate() is called after auth
```

### Issue 5: "Network request failed"
```
❌ Problem: CORS or network issue

✅ Fix:
  1. Check internet connection
  2. Verify Pi Browser version is latest
  3. Check api.minepi.com is reachable
  4. Try in different browser/device
```

---

## 🧪 Test Cases

### Test 1: Basic Auth Flow
```
1. Open app in Pi Browser
2. Click "Sign in with Pi Network"
3. Authorize in Pi dialog
4. Check console for ✅ logs
5. Should redirect to dashboard
6. Profile should exist in Supabase
```

### Test 2: Token Validation
```
1. Sign in successfully
2. Copy access token from localStorage
3. In console:
   const token = window.localStorage.getItem('piAccessToken');
   const result = await authenticatePiUser(token);
   console.log(result.piUser.username);
4. Should show your Pi username
```

### Test 3: Profile Creation
```
1. Sign in with new Pi account
2. Check Supabase > profiles table
3. Should see new row with:
   - username: your Pi username
   - pi_wallet_address: your wallet
   - created_at: current time
4. Second login should update, not create new row
```

### Test 4: Existing Profile
```
1. Sign in again with same account
2. Check console for "Profile already exists, updating..."
3. No new row should be created
4. pi_wallet_address should be updated
5. updated_at should have new timestamp
```

---

## 📊 Debug Console Output

### Expected Success Output
```
[Pi Auth Service] 🔐 Validating Pi access token...
[Pi Auth Service] ✅ Pi token validated. Username: wain2020
[Pi Auth Service] 🔗 Linking Pi user to Supabase profile...
[Pi Auth Service] ✅ Profile already exists, updating...
[Pi Auth Service] ✅ Step 1: Token validated
[Pi Auth Service] ✅ Step 2: Profile linked
[Pi Auth Service] ✅ Authentication complete!
```

### Expected Error Output
```
[Pi Auth Service] 🔐 Validating Pi access token...
[Pi Auth Service] ❌ Token validation error: Invalid or expired Pi access token

// Clear, single error message
```

---

## 🔍 What Changed

**Old (Broken):**
- 368 lines of code
- Multiple fallback layers
- Edge function dependency
- Complex error handling
- Wallet functions (unnecessary)

**New (Fixed):**
- 230 lines of code  
- Direct API calls only
- No edge function needed
- Simple error handling
- Only auth functions needed

---

## ✅ Checklist for Successful Auth

- [ ] `src/services/piMainnetAuthService.ts` is simplified (230 lines)
- [ ] `validatePiAccessToken()` makes direct API calls
- [ ] `authenticatePiUser()` is simple 2-step flow
- [ ] No edge function calls needed
- [ ] Console shows ✅ status messages
- [ ] Supabase profile is created/updated
- [ ] Auth completes in < 2 seconds
- [ ] No CORS or network errors

---

## 📞 Still Having Issues?

### Check These Files:
1. `src/services/piMainnetAuthService.ts` - Auth logic (FIXED ✅)
2. `src/contexts/PiContext.tsx` - Should call authenticatePiUser()
3. `src/pages/PiAuth.tsx` - Should call usePi().signIn()
4. `src/config/pi-config.ts` - Check ENDPOINTS.ME is correct

### Enable Debug Mode:
```typescript
// In main.tsx
if (true) { // Enable debug
  window.piDebug = true;
}

// Then in code:
if (window.piDebug) {
  console.log('[DEBUG]', ...args);
}
```

### Check Supabase:
```sql
-- In Supabase SQL Editor
SELECT * FROM profiles WHERE username = 'wain2020';

-- Should show:
-- id, username, pi_wallet_address, created_at, updated_at
```

---

**Status:** 🟢 Authentication Fixed  
**Ready to Test:** Yes  
**Issues:** Check above for solutions

---

**Date:** January 14, 2026
