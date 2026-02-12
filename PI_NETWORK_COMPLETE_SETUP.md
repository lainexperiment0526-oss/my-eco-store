# Pi Network Complete Setup Guide for DropLink

**Last Updated:** January 14, 2026  
**Status:** Complete Configuration Ready  
**Network:** Mainnet (Production)

---

## 📋 Quick Overview

This guide covers the complete setup of three critical Pi Network integrations for DropLink:
1. **Pi Authentication** - User login and profile management
2. **Pi Payments** - Subscription and product payments
3. **Pi Ad Network** - Monetization through ads

All systems are configured for **Mainnet only** (production-ready).

---

## 1️⃣ Pi Network Authentication Setup

### Overview
Pi authentication allows users to sign in using their Pi Network credentials. The system uses:
- **Pi SDK 2.0** for frontend authentication
- **Supabase Edge Functions** for secure server-side token validation
- **Fallback to direct API** if edge functions unavailable

### Configuration

#### Environment Variables Required
```
VITE_PI_APP_ID="droplink-317d26f51b67e992"
VITE_PI_API_KEY="qowpmsqwdemax5e27bsvld5h90hiqb0s7arw1uzp0uhm8un71ejxhrulirbrnosm"
VITE_PI_VALIDATION_KEY="7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"
VITE_PI_NETWORK="mainnet"
VITE_PI_MAINNET_MODE="true"
VITE_PI_AUTHENTICATION_ENABLED="true"
```

#### Core Service File
📄 **File:** `src/services/piMainnetAuthService.ts`

**Key Functions:**
- `validatePiAccessToken(accessToken)` - Validates token with Pi Mainnet
- `getPiUserProfile(accessToken)` - Retrieves user profile data
- `linkPiUserToSupabase(piData, options)` - Links Pi user to Supabase profile
- `authenticatePiUser(accessToken, options)` - Complete authentication flow

### Authentication Flow

```
1. User initiates login in Pi Browser
   ↓
2. Pi.authenticate(scopes) called with ['username', 'payments', 'wallet_address']
   ↓
3. Pi returns accessToken to frontend
   ↓
4. Token validated via Supabase Edge Function
   (or direct API fallback)
   ↓
5. Pi user data retrieved:
   - uid
   - username
   - wallet_address
   ↓
6. Supabase profile created/linked:
   - Find existing profile by username
   - Create new if not exists
   - Update with Pi wallet address
   ↓
7. User authenticated and session established
```

### Implementation Example

```typescript
import { authenticatePiUser } from '@/services/piMainnetAuthService';

// In your login component
async function handlePiLogin(accessToken: string) {
  try {
    const piUser = await authenticatePiUser(accessToken, {
      createIfNotExists: true,
      displayName: 'Pi User'
    });
    
    console.log('✅ Authenticated:', piUser);
    // Redirect to dashboard
  } catch (error) {
    console.error('❌ Auth failed:', error);
    // Show error to user
  }
}
```

### Scopes Explanation

- **`username`** - User's Pi username (required for profile)
- **`payments`** - Permission to request payments (required for subscriptions)
- **`wallet_address`** - Access to user's wallet address (optional, for tips)

### Troubleshooting Authentication

**Issue:** "Failed to validate Pi access token"
- ✅ Ensure VITE_PI_API_KEY is set correctly
- ✅ Verify running in Pi Browser (not regular Chrome)
- ✅ Check internet connection and HTTPS

**Issue:** "Edge function not available"
- ✅ Falls back to direct API automatically
- ✅ Check Supabase Edge Function deployment status
- ✅ Review `src/integrations/supabase/client.ts`

**Issue:** "Profile already exists"
- ✅ User already signed up - auto-links existing profile
- ✅ Updates wallet address if changed

---

## 2️⃣ Pi Network Payments Setup

### Overview
Pi payments enable users to pay for subscriptions and digital products using Pi cryptocurrency. The system uses a **3-phase payment flow**:

1. **Phase I:** Create payment & request server approval
2. **Phase II:** User signs transaction in Pi Wallet
3. **Phase III:** Complete payment & verify blockchain

### Configuration

#### Environment Variables Required
```
VITE_PI_PAYMENT_RECEIVER_WALLET="GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ"
VITE_PI_PAYMENTS_ENABLED="true"
VITE_PI_PAYMENT_CURRENCY="PI"
VITE_PI_PAYMENT_TIMEOUT="60000"
VITE_PI_MAX_PAYMENT_AMOUNT="10000"
VITE_PI_MIN_PAYMENT_AMOUNT="0.01"
VITE_PI_PAYMENT_MEMO_ENABLED="true"
VITE_SUPABASE_URL="https://jzzbmoopwnvgxxirulga.supabase.co"
```

#### Core Service File
📄 **File:** `src/services/piPaymentService.ts`

**Key Functions:**
- `createPayment(paymentData, accessToken, onProgress)` - Initiates 3-phase payment
- `approvePayment(paymentId, accessToken)` - Phase I approval (server-side)
- `completePayment(paymentId, txid, accessToken)` - Phase III completion (server-side)

### Payment Flow Details

```
PHASE I: CREATE & APPROVE
├─ Call Pi.createPayment(paymentData, callbacks)
├─ paymentData includes: amount, memo, metadata
├─ Trigger: onReadyForServerApproval callback
├─ Server calls Pi API to approve: /v2/payments/{paymentId}/approve
└─ Return to Phase II

PHASE II: USER SIGNS (Handled by Pi SDK)
├─ Pi Wallet modal appears to user
├─ User reviews and signs transaction
├─ Pi SDK handles transaction signing
└─ Trigger: onReadyForServerCompletion callback

PHASE III: COMPLETE & VERIFY
├─ Trigger: onReadyForServerCompletion(paymentId, txid)
├─ Server verifies transaction on blockchain
├─ Server calls Pi API to complete: /v2/payments/{paymentId}/complete
├─ Update database with payment status
└─ Return success to frontend
```

### Implementation Example

```typescript
import { PiPaymentService } from '@/services/piPaymentService';

// Request payment from user
async function requestSubscriptionPayment(
  amount: number,
  subscriptionId: string,
  accessToken: string
) {
  const result = await PiPaymentService.createPayment(
    {
      amount: amount,
      memo: `DropLink Subscription - ${subscriptionId}`,
      metadata: {
        subscriptionId,
        userId: currentUser.id,
        type: 'subscription'
      }
    },
    accessToken,
    (phase, details) => {
      console.log(`Payment ${phase}:`, details);
      // Update UI with payment progress
    }
  );

  if (result.success) {
    console.log('✅ Payment completed:', result.txid);
    // Grant subscription access
  } else {
    console.error('❌ Payment failed:', result.error);
  }
}
```

### Server-Side Endpoints Required

You need to implement these Supabase Edge Functions:

#### `/functions/pi-payment-approve`
```
POST /functions/v1/pi-payment-approve
Authorization: Bearer {accessToken}
Body: { paymentId: string }

Returns: { success: boolean }
```

**Server Implementation:**
```typescript
// Calls Pi API with API key:
POST https://api.minepi.com/v2/payments/{paymentId}/approve
Authorization: key {PI_API_KEY}
```

#### `/functions/pi-payment-complete`
```
POST /functions/v1/pi-payment-complete
Authorization: Bearer {accessToken}
Body: { paymentId: string, txid: string }

Returns: { success: boolean }
```

**Server Implementation:**
```typescript
// Verifies transaction and calls Pi API:
POST https://api.minepi.com/v2/payments/{paymentId}/complete
Authorization: key {PI_API_KEY}
Body: { txid: string }
```

### Payment Metadata

Store payment metadata for tracking:
```typescript
metadata: {
  subscriptionId: string,      // Link to subscription
  userId: string,              // Link to user
  planId: string,              // Which plan purchased
  type: 'subscription' | 'product' | 'tip',
  customData: object           // Any additional data
}
```

### Troubleshooting Payments

**Issue:** "Payment timeout"
- ✅ User can retry within VITE_PI_PAYMENT_TIMEOUT (60s default)
- ✅ Store incomplete payments in database for recovery
- ✅ Implement retry UI

**Issue:** "Approval failed"
- ✅ Check PI_API_KEY on server is correct
- ✅ Verify Edge Function has internet access
- ✅ Check payment amount within limits (0.01 to 10000 PI)

**Issue:** "Transaction verification failed"
- ✅ Transaction must be on blockchain before completion
- ✅ Allow 5-10 seconds for blockchain confirmation
- ✅ Implement polling for txid verification

**Issue:** "Insufficient balance"
- ✅ User doesn't have enough Pi balance
- ✅ Show error message and suggest ways to earn Pi
- ✅ Implement free trial as fallback

---

## 3️⃣ Pi Ad Network Setup

### Overview
Pi Ad Network allows you to display ads within your app and earn Pi in return. The system supports:
- **Interstitial Ads** - Full-screen ads between actions
- **Rewarded Ads** - User-initiated ads for rewards
- **Banner Ads** - Small ads within content

### Configuration

#### Environment Variables Required
```
VITE_PI_AD_NETWORK_ENABLED="true"
VITE_PI_AD_NETWORK_VERSION="2.0"
VITE_PI_INTERSTITIAL_ADS_ENABLED="true"
VITE_PI_REWARDED_ADS_ENABLED="true"
VITE_PI_AD_FREQUENCY_CAP="3"
VITE_PI_AD_COOLDOWN_MINUTES="5"
```

#### Core Service File
📄 **File:** `src/services/piAdNetworkService.ts`

**Key Functions:**
- `checkAdNetworkSupport()` - Check if device supports ads
- `showInterstitialAd()` - Display full-screen ad
- `loadRewardedAd()` - Load rewarded ad
- `showRewardedAd()` - Display and verify rewarded ad
- `loadBannerAd()` - Load banner ad
- `showBannerAd()` - Display banner ad

### Ad Types & When to Use

#### Interstitial Ads (Full-Screen)
**When to show:**
- Between link clicks
- When user navigates between pages
- Natural transition points

**Example:**
```typescript
import { PiAdNetworkService } from '@/services/piAdNetworkService';

// When user clicks a link
async function handleLinkClick(link) {
  // Show ad before navigating
  await PiAdNetworkService.showInterstitialAd();
  
  // Navigate after ad
  window.open(link.url, '_blank');
}
```

#### Rewarded Ads (User-Initiated)
**When to show:**
- "Watch ad to unlock feature"
- "Watch ad for bonus credits"
- Completely user's choice

**Example:**
```typescript
// User clicks "Watch ad for credits"
async function watchAdForReward() {
  const result = await PiAdNetworkService.showRewardedAd();
  
  if (result.granted) {
    // Give user reward (e.g., 0.1 Pi)
    console.log('✅ User granted reward');
    await grantUserReward(0.1);
  } else {
    console.log('❌ User cancelled ad');
  }
}
```

#### Banner Ads (Inline)
**When to show:**
- Bottom of page
- Sidebar content
- Between sections

**Example:**
```typescript
// Load banner on component mount
useEffect(() => {
  PiAdNetworkService.loadBannerAd('bottom');
}, []);
```

### Ad Network Initialization

```typescript
// On app startup
import { PiAdNetworkService } from '@/services/piAdNetworkService';

useEffect(() => {
  // Check if device supports ads
  const supported = await PiAdNetworkService.checkAdNetworkSupport();
  
  if (supported) {
    console.log('✅ Ad Network is supported');
    setAdsEnabled(true);
  } else {
    console.log('⚠️ Update Pi Browser to enable ads');
    setAdsEnabled(false);
  }
}, []);
```

### Ad Response Types

```typescript
interface AdResponse {
  type: 'interstitial' | 'rewarded';
  result: 
    | 'AD_CLOSED'              // User closed ad
    | 'AD_REWARDED'            // User earned reward
    | 'AD_DISPLAY_ERROR'       // Error displaying ad
    | 'AD_NETWORK_ERROR'       // Network issue
    | 'AD_NOT_AVAILABLE'       // No ads available
    | 'ADS_NOT_SUPPORTED'      // Pi Browser too old
    | 'USER_UNAUTHENTICATED';  // User not logged in
}
```

### Frequency Capping

**Default Configuration:**
- `VITE_PI_AD_FREQUENCY_CAP="3"` - Max 3 ads per hour
- `VITE_PI_AD_COOLDOWN_MINUTES="5"` - 5 minute cooldown between ads

**Implementation:**
```typescript
// Track ad views
const lastAdTime = localStorage.getItem('lastAdTime');
const adCount = parseInt(localStorage.getItem('adCount') || '0');

if (Date.now() - lastAdTime < 5 * 60 * 1000) {
  console.log('⏳ Ad cooldown active, try again later');
  return;
}

if (adCount >= 3) {
  console.log('📊 Frequency cap reached today');
  return;
}

// Show ad
const result = await PiAdNetworkService.showInterstitialAd();

// Update tracking
localStorage.setItem('lastAdTime', Date.now().toString());
localStorage.setItem('adCount', (adCount + 1).toString());
```

### Troubleshooting Ad Network

**Issue:** "Ad Network NOT supported"
- ✅ User running old Pi Browser version
- ✅ Device not supported
- ✅ Gracefully degrade UI without ads

**Issue:** "AD_NOT_AVAILABLE"
- ✅ No ads currently available in user's region
- ✅ Try again in a few minutes
- ✅ Don't show repeated ads to same user

**Issue:** "AD_NETWORK_ERROR"
- ✅ Temporary network issue
- ✅ Implement retry logic with exponential backoff
- ✅ Log error for monitoring

---

## 🔐 Environment Variables Checklist

### Required Variables
```yaml
# Pi App & Authentication
VITE_PI_APP_ID: droplink-317d26f51b67e992
VITE_PI_API_KEY: qowpmsqwdemax5e27bsvld5h90hiqb0s7arw1uzp0uhm8un71ejxhrulirbrnosm
VITE_PI_VALIDATION_KEY: 7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a

# Network Configuration
VITE_PI_NETWORK: mainnet
VITE_PI_NETWORK_PASSPHRASE: "Pi Mainnet"
VITE_PI_MAINNET_MODE: "true"
VITE_PI_STELLAR_NETWORK: mainnet

# Authentication
VITE_PI_AUTHENTICATION_ENABLED: "true"

# Payments
VITE_PI_PAYMENTS_ENABLED: "true"
VITE_PI_PAYMENT_RECEIVER_WALLET: GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ
VITE_PI_PAYMENT_CURRENCY: "PI"
VITE_PI_PAYMENT_TIMEOUT: "60000"
VITE_PI_MAX_PAYMENT_AMOUNT: "10000"
VITE_PI_MIN_PAYMENT_AMOUNT: "0.01"
VITE_PI_PAYMENT_MEMO_ENABLED: "true"

# Ad Network
VITE_PI_AD_NETWORK_ENABLED: "true"
VITE_PI_AD_NETWORK_VERSION: "2.0"
VITE_PI_INTERSTITIAL_ADS_ENABLED: "true"
VITE_PI_REWARDED_ADS_ENABLED: "true"
VITE_PI_AD_FREQUENCY_CAP: "3"
VITE_PI_AD_COOLDOWN_MINUTES: "5"

# Supabase (for Edge Functions)
VITE_SUPABASE_URL: https://jzzbmoopwnvgxxirulga.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDMxMjUsImV4cCI6MjA3NDc3OTEyNX0.5DqetNG0bvN620X8t5QP-sGEInb17ZCgY0Jfp7_qZWU
```

### Verification Script
```bash
# Run this to check all variables are set:
node validate-env.js
```

---

## ✅ Integration Verification Checklist

### Before Going Live

- [ ] **Authentication**
  - [ ] App registered in Pi Developer Portal
  - [ ] App ID matches VITE_PI_APP_ID
  - [ ] Validation key is correct
  - [ ] Test login in Pi Browser works
  - [ ] User profile creates in Supabase
  - [ ] Wallet address is stored

- [ ] **Payments**
  - [ ] Payment receiver wallet set correctly
  - [ ] API key working for server-side approval
  - [ ] Edge Functions deployed to Supabase
  - [ ] Test payment in Pi Browser succeeds
  - [ ] Payment verified on blockchain
  - [ ] Amount limits (0.01 - 10000 PI) enforced

- [ ] **Ad Network**
  - [ ] Ad Network enabled in Pi Browser
  - [ ] Device supports ad network
  - [ ] Interstitial ads display correctly
  - [ ] Rewarded ads show and verify properly
  - [ ] Frequency cap prevents ad spam
  - [ ] Earn Pi from ads works

- [ ] **Error Handling**
  - [ ] Auth failures show clear messages
  - [ ] Payment timeouts handled gracefully
  - [ ] Ad errors don't crash app
  - [ ] Fallbacks work when edge functions down
  - [ ] All errors logged to console

---

## 📚 Official Documentation Links

- 🔗 **Developer Guide:** https://pi-apps.github.io/community-developer-guide/
- 🔗 **Platform Docs:** https://github.com/pi-apps/pi-platform-docs
- 🔗 **Authentication:** https://github.com/pi-apps/pi-platform-docs/blob/master/authentication.md
- 🔗 **Payments:** https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md
- 🔗 **Advanced Payments:** https://github.com/pi-apps/pi-platform-docs/blob/master/payments_advanced.md
- 🔗 **Ad Network:** https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md
- 🔗 **SDK Reference:** https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md

---

## 🆘 Support & Troubleshooting

### Common Issues & Solutions

#### Issue: "Pi SDK not loaded"
**Solutions:**
1. Check running in Pi Browser (user agent detection)
2. Verify SDK URL: `https://sdk.minepi.com/pi-sdk.js`
3. Check Content Security Policy allows sdk.minepi.com
4. Add CORS headers in your server

#### Issue: "Authentication failed: token not valid"
**Solutions:**
1. Verify token is fresh (not expired)
2. Check VITE_PI_API_KEY is correct
3. Verify timestamp is synchronized
4. Try in Pi Browser, not regular Chrome

#### Issue: "Payment stuck in Phase I"
**Solutions:**
1. Check server can reach Pi API
2. Verify API key has payment permissions
3. Check payment amount is within limits
4. Implement manual approval retry

#### Issue: "No ads available"
**Solutions:**
1. User region might not support ads
2. Device might not meet requirements
3. Check ad frequency cap not exceeded
4. Try different ad type (interstitial vs rewarded)

### Debug Mode

Enable debug logging:
```typescript
// In your main.tsx or App.tsx
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  // Detailed console logging enabled
  console.log('[DROPLINK DEBUG] All systems initialized');
}
```

---

## 📝 Next Steps

1. **Test Authentication**
   - Open app in Pi Browser
   - Click "Sign in with Pi"
   - Verify profile creates in Supabase

2. **Test Payments**
   - Create a test subscription
   - Request payment
   - Verify transaction on blockchain

3. **Test Ad Network**
   - Display an ad on page
   - Verify earning Pi
   - Check frequency cap

4. **Monitor Production**
   - Set up error logging (Sentry)
   - Track payment conversions
   - Monitor ad revenue

---

**Status:** ✅ Ready for Production  
**Last Validated:** January 14, 2026
