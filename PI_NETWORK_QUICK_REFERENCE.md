# Pi Network Quick Reference Guide

**Last Updated:** January 14, 2026

---

## 🚀 Quick Start Commands

```bash
# Validate all environment variables
npm run validate-pi-env

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

---

## 📱 Core Components & Services

### Authentication Service
**File:** `src/services/piMainnetAuthService.ts`

```typescript
import { authenticatePiUser } from '@/services/piMainnetAuthService';

// Complete auth flow
const user = await authenticatePiUser(accessToken, {
  createIfNotExists: true,
  displayName: 'User'
});
```

**Key Functions:**
- `validatePiAccessToken(token)` - Validate Pi token
- `getPiUserProfile(token)` - Get user info
- `linkPiUserToSupabase(piData)` - Create/link profile
- `authenticatePiUser(token, options)` - Full flow

---

### Payment Service
**File:** `src/services/piPaymentService.ts`

```typescript
import { PiPaymentService } from '@/services/piPaymentService';

// Request payment
const result = await PiPaymentService.createPayment(
  {
    amount: 3.14,
    memo: 'Subscription',
    metadata: { subscriptionId: '123' }
  },
  accessToken,
  (phase, details) => console.log(`${phase}: ${JSON.stringify(details)}`)
);
```

**Key Functions:**
- `createPayment(data, token, onProgress)` - 3-phase payment
- `approvePayment(paymentId, token)` - Phase I (server)
- `completePayment(paymentId, txid, token)` - Phase III (server)

---

### Ad Network Service
**File:** `src/services/piAdNetworkService.ts`

```typescript
import { PiAdNetworkService } from '@/services/piAdNetworkService';

// Check support
const supported = await PiAdNetworkService.checkAdNetworkSupport();

// Show interstitial ad
await PiAdNetworkService.showInterstitialAd();

// Show rewarded ad
const result = await PiAdNetworkService.showRewardedAd();
if (result.granted) {
  // User earned reward
}
```

**Key Functions:**
- `checkAdNetworkSupport()` - Check device support
- `showInterstitialAd()` - Full-screen ad
- `showRewardedAd()` - User-initiated ad with reward
- `loadBannerAd(position)` - Inline banner ad

---

## 🔐 Environment Variables Summary

### Critical (Don't Expose!)
```
VITE_PI_API_KEY
VITE_PI_VALIDATION_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Required
```
VITE_PI_APP_ID
VITE_PI_NETWORK=mainnet
VITE_PI_AUTHENTICATION_ENABLED=true
VITE_PI_PAYMENTS_ENABLED=true
VITE_PI_PAYMENT_RECEIVER_WALLET
VITE_PI_AD_NETWORK_ENABLED=true
VITE_SUPABASE_URL
```

---

## 📊 API Endpoints

### Pi Mainnet Endpoints
```
Base: https://api.minepi.com

/me                           - Get current user
/wallets                      - Get user wallets
/payments/{id}/approve        - Approve payment (server)
/payments/{id}/complete       - Complete payment (server)
/v2/payments/{id}             - Get payment status
```

### Supabase Endpoints
```
Base: https://jzzbmoopwnvgxxirulga.supabase.co

/functions/v1/pi-auth         - Validate Pi token
/functions/v1/pi-payment-approve    - Approve payment
/functions/v1/pi-payment-complete   - Complete payment
```

---

## 🔄 Data Flows

### Authentication Flow
```
User Login
    ↓
Pi.authenticate(scopes)
    ↓
Get accessToken
    ↓
validatePiAccessToken(token)
    ↓
Get Pi user profile
    ↓
linkPiUserToSupabase(piData)
    ↓
Create/update Supabase profile
    ↓
Authenticated ✅
```

### Payment Flow (3-Phase)
```
Phase I: Approval
  createPayment() → onReadyForServerApproval
  → Server: POST /v2/payments/{id}/approve
  → Return to SDK

Phase II: User Signs (automatic)
  Pi Wallet modal
  User reviews & signs
  → onReadyForServerCompletion(id, txid)

Phase III: Completion
  Server: POST /v2/payments/{id}/complete
  Verify transaction on blockchain
  → Return success
  
Payment Complete ✅
```

### Ad Network Flow
```
checkAdNetworkSupport()
    ↓
Is feature in nativeFeaturesList?
    ↓
If yes:
  showInterstitialAd() or showRewardedAd()
    ↓
  User views ad
    ↓
  If rewarded: verify & grant reward ✅
    
If no:
  Gracefully degrade UI
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Pi SDK not available" | Not in Pi Browser | Check user agent, use Pi Browser |
| "Token invalid" | Token expired | Refresh token, re-authenticate |
| "Approval failed" | API key wrong | Check VITE_PI_API_KEY in .env |
| "Payment timeout" | User delayed | Implement retry, check logs |
| "Ads not supported" | Old Pi Browser | Update to latest version |
| "Edge function error" | Function not deployed | Deploy to Supabase, check logs |
| "Wallet address null" | Scope not requested | Add 'wallet_address' to scopes |

---

## 💾 Database Schema

### profiles table
```sql
id              UUID PRIMARY KEY
username        TEXT UNIQUE
pi_wallet_address TEXT
theme_settings  JSONB
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### payments table
```sql
id              UUID PRIMARY KEY
user_id         UUID FOREIGN KEY
payment_id      TEXT (Pi payment ID)
txid            TEXT (Blockchain transaction)
amount          DECIMAL
memo            TEXT
metadata        JSONB
status          TEXT (pending, completed, failed)
created_at      TIMESTAMP
completed_at    TIMESTAMP
```

### subscriptions table
```sql
id              UUID PRIMARY KEY
user_id         UUID FOREIGN KEY
plan_id         TEXT
payment_id      UUID FOREIGN KEY
status          TEXT (active, cancelled)
started_at      TIMESTAMP
expires_at      TIMESTAMP
```

### ad_earnings table
```sql
id              UUID PRIMARY KEY
user_id         UUID FOREIGN KEY
ad_type         TEXT (interstitial, rewarded, banner)
amount          DECIMAL
earned_at       TIMESTAMP
withdrawn       BOOLEAN
```

---

## 🧪 Testing Checklist

- [ ] **Auth**: Login works, profile created
- [ ] **Payments**: Payment completes, tx verified
- [ ] **Ads**: Ads display, earnings tracked
- [ ] **Env vars**: All validated, no missing values
- [ ] **Edge Functions**: Deployed and responding
- [ ] **Database**: Records created correctly
- [ ] **Console**: No errors or warnings
- [ ] **Mobile**: Tested on actual Pi Browser

---

## 📚 Official Links

- 🔗 [Developer Guide](https://pi-apps.github.io/community-developer-guide/)
- 🔗 [Platform Docs](https://github.com/pi-apps/pi-platform-docs)
- 🔗 [Authentication](https://github.com/pi-apps/pi-platform-docs/blob/master/authentication.md)
- 🔗 [Payments](https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md)
- 🔗 [Ad Network](https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md)

---

## 🆘 Getting Help

1. **Check console logs** - Look for [PI SDK], [PI AUTH], [PI PAYMENT], [PI ADS]
2. **Review error message** - Usually tells you what's wrong
3. **Check .env variables** - Run `npm run validate-pi-env`
4. **Read official docs** - Links above cover everything
5. **Check edge function logs** - supabase.co → Functions → View Logs
6. **Test in Pi Browser** - Not Chrome or regular browser
7. **Try fallback methods** - Some features have fallbacks

---

## 📈 Monitoring

Track these metrics:
- Auth success rate
- Payment conversion rate
- Payment completion time
- Ad impression rate
- Ad completion rate
- Error rate by system

---

## 🔒 Security Notes

- ✅ Never expose PI_API_KEY
- ✅ Use HTTPS only (Pi Browser enforces this)
- ✅ Validate all server-side payments
- ✅ Store tokens securely (browser localStorage is okay for access tokens)
- ✅ Refresh tokens before expiry
- ✅ Don't trust client-side payment data
- ✅ Verify all blockchain transactions

---

## 📝 Useful Code Snippets

### Check if in Pi Browser
```typescript
export const isPiBrowserEnv = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.Pi && window.Pi.authenticate);
};
```

### Get Pi SDK Status
```typescript
console.log('Pi SDK Ready:', typeof window.Pi !== 'undefined');
console.log('Pi SDK Version:', window.Pi?.version);
```

### Format Pi Amount
```typescript
const formatPi = (amount: number) => `${amount.toFixed(2)} π`;
console.log(formatPi(3.14)); // "3.14 π"
```

### Retry Function
```typescript
async function retry<T>(
  fn: () => Promise<T>,
  times: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === times - 1) throw error;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Retry failed');
}
```

---

**Status:** ✅ Complete Reference  
**Last Updated:** January 14, 2026
