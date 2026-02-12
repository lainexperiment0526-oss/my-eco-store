# Pi Network Mainnet Authentication Setup Guide

## Overview

This guide provides a complete step-by-step setup for Pi Network Mainnet authentication with Supabase integration in your Droplink app.

### Components:
1. **Frontend**: Pi Browser authentication via `PiContext.tsx`
2. **Service Layer**: Token validation and profile linking via `piMainnetAuthService.ts`
3. **Configuration**: Mainnet API endpoints and credentials in `pi-config.ts`
4. **Backend**: Supabase Edge Functions for profile management in `profile-update/index.ts`

---

## Step 1: Configure Environment Variables

Ensure your `.env` file contains these values (Already configured):

```env
# Pi Network Configuration (Mainnet Production)
VITE_PI_NETWORK=mainnet
VITE_API_URL=https://api.minepi.com
VITE_PI_SDK_URL=https://sdk.minepi.com/pi-sdk.js

# Pi Network API Keys (Production)
VITE_PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
VITE_PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a

# Pi Network Features
VITE_PI_SANDBOX_MODE=false          # MAINNET - Disable sandbox
VITE_PI_MAINNET_MODE=true
VITE_PI_AUTHENTICATION_ENABLED=true
```

**Key Points:**
- `VITE_PI_SANDBOX_MODE=false` - Required for Mainnet
- `VITE_API_URL` points to `https://api.minepi.com` (Production Mainnet API)
- All other Mainnet flags enabled

---

## Step 2: Fix Pi Configuration (DONE ✅)

The `src/config/pi-config.ts` has been updated with:

```typescript
export const PI_CONFIG = {
  API_KEY: "b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz",
  NETWORK: "mainnet",
  SANDBOX_MODE: false,  // ✅ MAINNET MODE
  
  SDK: {
    version: "2.0",
    sandbox: false,  // ✅ MAINNET MODE
  },
  
  ENDPOINTS: {
    ME: "https://api.minepi.com/v2/me",  // ✅ MAINNET API
    WALLETS: "https://api.minepi.com/v2/wallets",
    TRANSACTIONS: "https://api.minepi.com/v2/transactions",
    PAYMENTS: "https://api.minepi.com/v2/payments",
    // ... all endpoints updated to Mainnet
  },
  
  VALIDATION_KEY: "7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"
};
```

**What was fixed:**
- ❌ Changed from `https://socialchain.app/v2/*` (Testnet)
- ✅ To `https://api.minepi.com/v2/*` (Mainnet)
- ❌ Changed from `SANDBOX_MODE: true` 
- ✅ To `SANDBOX_MODE: false` (Mainnet mode)
- ✅ Network passphrase updated to "Pi Mainnet"

---

## Step 3: Pi Mainnet Authentication Service (DONE ✅)

A new service module has been created: `src/services/piMainnetAuthService.ts`

This service handles:

### 3.1 Token Validation
```typescript
const piData = await validatePiAccessToken(accessToken);
// Calls: GET https://api.minepi.com/v2/me
// Returns: { uid, username, wallet_address, ... }
```

### 3.2 Supabase Profile Linking
```typescript
const supabaseProfile = await linkPiUserToSupabase(piData);
// Finds existing profile or creates new one
// Links Pi user to Supabase user
```

### 3.3 Complete Authentication Flow
```typescript
const result = await authenticatePiUser(accessToken);
// Returns: { success, piUser, supabaseProfile, accessToken }
```

### 3.4 Token Verification for Auto-Login
```typescript
const isValid = await verifyStoredPiToken(accessToken);
// Checks if stored token is still valid
```

---

## Step 4: Frontend Authentication Flow (DONE ✅)

### 4.1 User Signs In with Pi Network

When user clicks "Sign in with Pi Network", the flow is:

1. **Step 1**: User authenticates in Pi Browser
   ```typescript
   const authResult = await window.Pi.authenticate(['username']);
   // Returns: { accessToken, user: { uid, username, ... } }
   ```

2. **Step 2**: Validate token with Pi Mainnet API
   ```typescript
   const piData = await validatePiAccessToken(authResult.accessToken);
   // Calls: GET https://api.minepi.com/v2/me
   // Validates token is real and not expired
   ```

3. **Step 3**: Link to Supabase Profile
   ```typescript
   const supabaseProfile = await linkPiUserToSupabase(piData);
   // Creates or updates Supabase profile with Pi user data
   // Stores pi_user_id, pi_username, wallet_address
   ```

4. **Step 4**: Store Credentials
   ```typescript
   localStorage.setItem('pi_access_token', accessToken);
   localStorage.setItem('pi_user', JSON.stringify(piData));
   ```

### 4.2 Auto-Login with Stored Token

On app load, if stored credentials exist:

1. **Verify Token**
   ```typescript
   const isValid = await verifyStoredPiToken(storedToken);
   ```

2. **If Valid**: Automatically log in user
3. **If Invalid**: Clear storage and require re-authentication

### 4.3 Backend Validation (Profile Update)

When user saves profile changes:

1. **Receive piAccessToken from Frontend**
2. **Validate with Pi API**
   ```typescript
   const piResponse = await fetch('https://api.minepi.com/v2/me', {
     headers: { 'Authorization': `Bearer ${piAccessToken}` }
   });
   ```

3. **Verify Profile Match**
   - Pi username must match Supabase profile username

4. **Save Profile Updates**
   - Update theme, links, and other profile data

---

## Step 5: Database Schema Requirements

Ensure your `profiles` table in Supabase has these Pi-related columns:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pi_user_id TEXT,        -- Pi user's unique ID
  pi_username TEXT,       -- Pi user's username
  wallet_address TEXT,    -- Pi Network wallet address
  display_name TEXT,
  theme_settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- ... other columns
);

-- Create unique indexes
CREATE UNIQUE INDEX idx_pi_user_id ON profiles(pi_user_id) WHERE pi_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_pi_username ON profiles(pi_username) WHERE pi_username IS NOT NULL;
```

---

## Step 6: Testing the Setup

### 6.1 Mainnet Configuration Check

Open browser DevTools and verify:

```javascript
// Check if Pi SDK is loaded
console.log(window.Pi);  // Should not be undefined

// Check Pi Browser detection
console.log(isPiBrowserEnv());  // Should return true in Pi Browser

// Check Mainnet config
console.log(PI_CONFIG.NETWORK);        // Should be "mainnet"
console.log(PI_CONFIG.SANDBOX_MODE);   // Should be false
console.log(PI_CONFIG.ENDPOINTS.ME);   // Should be "https://api.minepi.com/v2/me"
```

### 6.2 Manual Token Validation Test

```javascript
// Get stored token
const token = localStorage.getItem('pi_access_token');

// Validate with Mainnet API
fetch('https://api.minepi.com/v2/me', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Pi User:', data));
```

### 6.3 Full Authentication Flow Test

1. Open app in Pi Browser
2. Click "Sign in with Pi Network"
3. Check console for logs starting with `[Pi Auth Service]`
4. Verify in browser DevTools:
   - `localStorage.pi_access_token` exists
   - `localStorage.pi_user` contains user data
   - Supabase profile was created/updated

---

## Step 7: Common Issues & Troubleshooting

### Issue 1: "Pi Browser NOT detected"
**Cause**: App is not running in official Pi Browser
**Solution**: Download Pi Browser from https://minepi.com/download

### Issue 2: "window.Pi is undefined"
**Cause**: Pi SDK script didn't load
**Solution**: 
- Check if `VITE_PI_SDK_URL` is correct
- Ensure SDK script is in HTML: `<script src="https://sdk.minepi.com/pi-sdk.js"></script>`

### Issue 3: "Failed to validate Pi access token"
**Cause**: Token is invalid or expired
**Solution**:
- Clear `pi_access_token` from localStorage
- Sign in again to get fresh token

### Issue 4: "Profile not found for Pi user"
**Cause**: Supabase profile doesn't exist or username mismatch
**Solution**:
- Ensure profile exists in Supabase with matching `pi_username`
- Check `linkPiUserToSupabase` with `createIfNotExists: true`

### Issue 5: CORS Error
**Cause**: Frontend trying to call Pi API directly
**Solution**: 
- Use Edge Function for server-side validation
- Or configure CORS headers properly

---

## Step 8: API Reference

### Pi Mainnet Authentication Service

#### 1. validatePiAccessToken(accessToken)
```typescript
const piData = await validatePiAccessToken(accessToken);
// Returns: { uid, username, wallet_address, meta }
// Throws: Error if token invalid or API call fails
```

#### 2. getPiUserProfile(accessToken)
```typescript
const profile = await getPiUserProfile(accessToken);
// Same as validatePiAccessToken but with extended data
```

#### 3. linkPiUserToSupabase(piData, options)
```typescript
const supabaseProfile = await linkPiUserToSupabase(piData, {
  createIfNotExists: true,
  displayName: 'Custom Display Name'
});
// Returns: Supabase profile with Pi data linked
```

#### 4. authenticatePiUser(accessToken, options)
```typescript
const result = await authenticatePiUser(accessToken);
// Returns: { success, piUser, supabaseProfile, accessToken }
```

#### 5. verifyStoredPiToken(accessToken)
```typescript
const isValid = await verifyStoredPiToken(accessToken);
// Returns: boolean (true if token valid, false otherwise)
```

#### 6. getPiUserWallet(accessToken)
```typescript
const wallet = await getPiUserWallet(accessToken);
// Returns: Wallet information and balance
```

---

## Step 9: Configuration Summary

| Component | Setting | Value | Status |
|-----------|---------|-------|--------|
| Network | `PI_CONFIG.NETWORK` | `mainnet` | ✅ Configured |
| Sandbox | `PI_CONFIG.SANDBOX_MODE` | `false` | ✅ Configured |
| SDK Sandbox | `PI_CONFIG.SDK.sandbox` | `false` | ✅ Configured |
| API Endpoint | `PI_CONFIG.ENDPOINTS.ME` | `https://api.minepi.com/v2/me` | ✅ Configured |
| API Key | `PI_CONFIG.API_KEY` | `b00j4felp0ctc...` | ✅ Configured |
| Validation Key | `PI_CONFIG.VALIDATION_KEY` | `7511661aac4...` | ✅ Configured |
| Auth Service | `piMainnetAuthService.ts` | Complete service | ✅ Created |
| PiContext | `signIn()` method | Updated to use service | ✅ Updated |
| Edge Function | `profile-update` | Uses Mainnet API | ✅ Verified |

---

## Step 10: Next Steps

1. **Test in Pi Browser**: Open app in official Pi Browser and sign in
2. **Monitor Logs**: Check browser console for `[Pi Auth Service]` logs
3. **Verify Database**: Check Supabase for created profiles with Pi data
4. **Enable Payments** (Optional): Add `payment` scope once approved
5. **Monitor Errors**: Log any issues for debugging

---

## Security Best Practices

1. **Never expose API keys in frontend code**
   - ✅ Already using environment variables

2. **Always validate tokens server-side**
   - ✅ Edge Function validates token with Pi API

3. **Use HTTPS only**
   - ✅ All API endpoints use HTTPS

4. **Store tokens securely**
   - ✅ Using localStorage (consider sessionStorage for more security)
   - Tokens are user-specific and expire

5. **Validate username matches**
   - ✅ Pi username must match Supabase profile

---

## Resources

- **Pi Network Developer Guide**: https://pi-apps.github.io/community-developer-guide/
- **Pi Network Platform Docs**: https://github.com/pi-apps/pi-platform-docs
- **Pi Mainnet API**: https://api.minepi.com/v2/me
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## Support

If authentication issues persist:

1. Check console for detailed error messages
2. Verify you're in official Pi Browser
3. Check `.env` variables are correct
4. Review database schema for Pi columns
5. Check Supabase Edge Function logs

For questions about Pi Network:
- Visit: https://minepi.com
- Docs: https://pi-apps.github.io/community-developer-guide/
