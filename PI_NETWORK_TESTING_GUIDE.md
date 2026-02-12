# Pi Network Integration Testing Guide

**Last Updated:** January 14, 2026  
**Status:** Complete Testing Framework

---

## 🧪 Testing Overview

This guide provides step-by-step instructions to test all three Pi Network integrations:
1. ✅ Pi Authentication
2. ✅ Pi Payments
3. ✅ Pi Ad Network

---

## 📱 Prerequisites

- **Pi Browser** installed on mobile device or emulator
- **DropLink app** running and accessible in Pi Browser
- **Test Pi Network account** with balance for payments
- **Developer mode** enabled (optional, for debugging)

---

## Test 1: Pi Authentication

### Test Scenario
User can sign in using Pi credentials and have profile created in Supabase.

### Steps

```
1. Open app in Pi Browser
   └─ Navigate to https://droplink.space (or localhost in dev)

2. Click "Sign in with Pi" button
   └─ Should not show error

3. Pi authentication dialog appears
   └─ Shows scopes: username, payments, wallet_address
   └─ Shows app name: DropLink

4. Review permissions and click "Authorize"
   └─ Should not ask twice (consent cached)

5. App redirects to dashboard
   └─ User is logged in
   └─ See username and profile info

6. Check Supabase for new profile
   └─ supabase.co → SQL Editor
   └─ SELECT * FROM profiles WHERE username = '{username}'
   └─ Should see: username, pi_wallet_address, created_at
```

### Expected Results

| Step | Expected | Status |
|------|----------|--------|
| Sign in button visible | ✅ Always shown | |
| Auth dialog appears | ✅ Shows permission request | |
| Scopes correct | ✅ username, payments, wallet_address | |
| Redirect successful | ✅ App initializes after auth | |
| Profile created | ✅ New entry in profiles table | |
| Wallet address saved | ✅ pi_wallet_address populated | |

### Troubleshooting

**Issue:** "Failed to validate Pi access token"
```
Debug: Open Pi Browser DevTools (F12)
   └─ Check console for error message
   └─ Look for: "[PI SDK]" or "[Pi Auth Service]" logs
   
Fix: Try these steps:
   1. Refresh page (Cmd+R / Ctrl+R)
   2. Force close Pi Browser and reopen
   3. Check internet connection
   4. Verify VITE_PI_API_KEY in .env
```

**Issue:** "Profile already exists error"
```
This is normal! Means you're logging in again with same username.
   └─ App should auto-link existing profile
   └─ Check logs: "Found existing Supabase profile"
```

**Issue:** "Edge function not available"
```
This is okay! Falls back to direct API validation.
   └─ Check logs: "Falling back to direct Pi API validation"
   └─ Direct validation should work in Pi Browser
```

---

## Test 2: Pi Payments

### Prerequisite
- ✅ Completed Test 1 (Authentication)
- ✅ Test account has Pi balance (>1 PI)

### Test Scenario
User can request and complete a payment for subscription.

### Steps

```
1. Log in (use Test 1 results)
   └─ Must be authenticated first

2. Navigate to Subscription page
   └─ Should see subscription plans
   └─ Click "Subscribe Now" button

3. Select a plan and click "Pay with Pi"
   └─ Should see payment amount and description

4. Payment dialog shows
   └─ Amount: 3.14 Pi (or selected amount)
   └─ Memo: "DropLink Subscription - [plan name]"
   └─ Buttons: "Sign", "Cancel"

5. Review transaction details
   └─ Check amount is correct
   └─ Check memo is clear
   └─ Recipient: DropLink app

6. Click "Sign" button
   └─ Transaction goes to blockchain
   └─ Should see "Processing..." message

7. Wait for completion (5-10 seconds)
   └─ Should see success message
   └─ Subscription activated
   └─ Redirection to dashboard

8. Verify in Supabase
   └─ SELECT * FROM subscriptions WHERE user_id = '{userId}'
   └─ Should see: status='active', payment_id, txid
   └─ SELECT * FROM payments
   └─ Should see payment record with status='completed'
```

### Expected Results

| Step | Expected | Status |
|------|----------|--------|
| Subscription plans visible | ✅ Shows pricing | |
| Payment button visible | ✅ "Pay with Pi" available | |
| Payment dialog shows | ✅ Correct amount and memo | |
| Transaction signs | ✅ Pi Wallet shows dialog | |
| Payment completes | ✅ Success message shown | |
| Subscription activated | ✅ User gains access | |
| Payment recorded | ✅ In payments table | |
| Transaction verified | ✅ On blockchain | |

### Payment Phases

Monitor the payment flow in browser console:

```
[PI PAYMENT] 🚀 Starting payment creation...
[PI PAYMENT] 📝 Calling Pi.createPayment()...
[PI PAYMENT] ⏳ Phase I - Server approval needed...
[PI PAYMENT] 📡 Sending approval request to server...
[PI PAYMENT] ✅ Phase I - Payment approved by server
[PI PAYMENT] ⏳ Phase II - User signs transaction...
[PI PAYMENT] 🎯 Phase II - Transaction signed by user
[PI PAYMENT] ⏳ Phase III - Completing payment...
[PI PAYMENT] 📡 Sending completion request to server...
[PI PAYMENT] ✅ Phase III - Payment completed successfully
```

### Troubleshooting

**Issue:** "Payment creation failed"
```
Check logs for Phase I error:
   └─ Look for: "❌ Payment creation failed"
   └─ Read error message carefully
   
Fix:
   1. Check payment amount (0.01 - 10000 PI)
   2. Verify user has sufficient Pi balance
   3. Check timestamp is synchronized
   4. Try again in 5 minutes
```

**Issue:** "Approval failed"
```
Server-side issue with Pi API.
   
Check logs for: "Phase I - Approval failed"
   
Fix:
   1. Verify VITE_PI_API_KEY on server
   2. Check Supabase Edge Function is deployed:
      └─ supabase.co → Functions → pi-payment-approve
      └─ Should show "Status: Active"
   3. Check function logs for errors
   4. Verify API key has correct permissions
```

**Issue:** "Payment timeout"
```
User took too long to sign transaction.
   └─ Default timeout: 60 seconds
   
Fix:
   1. User can retry payment
   2. Implement manual retry button
   3. Store incomplete payments in database
   4. Implement recovery flow
```

**Issue:** "Transaction verification failed"
```
Blockchain transaction not confirmed yet.
   
Check logs: "Failed to verify transaction"
   
Fix:
   1. Transaction needs 5-10 seconds to confirm
   2. Implement polling retry
   3. Check blockchain: https://api.minepi.com/
   4. Verify txid is correct
```

---

## Test 3: Pi Ad Network

### Prerequisite
- ✅ Pi Browser with latest version (supports ad_network)
- ✅ Device/region supports ads

### Test Scenario
User can view ads and earn Pi from them.

### Steps

```
1. Open app in Pi Browser
   └─ Any page works for ads

2. Look for ad placement
   └─ Interstitial: Full-screen when navigating
   └─ Rewarded: User clicks "Watch ad for reward"
   └─ Banner: Bottom of page

3. Interstitial Ad Test:
   Click link or trigger ad
   └─ Full-screen ad appears
   └─ Shows countdown (skip after 5s)
   └─ Click X or wait for auto-close

4. Rewarded Ad Test:
   Click "Watch ad for reward"
   └─ Ad loads and plays
   └─ Shows "Watch for reward"
   └─ Check: Did you earn reward?
   └─ Verify in console

5. Banner Ad Test:
   Scroll to bottom
   └─ Small banner ad appears
   └─ Ad stays visible while scrolling

6. Check Frequency Cap
   Try to show another ad immediately
   └─ Should see: "Ad cooldown active"
   └─ Wait 5 minutes (config: VITE_PI_AD_COOLDOWN_MINUTES)
   └─ Try again after cooldown

7. Verify in Console
   Look for logs starting with "[PI ADS]"
   └─ [PI ADS] ✅ Ad Network is supported
   └─ [PI ADS] 🎬 Showing interstitial ad...
   └─ [PI ADS] ✅ Interstitial ad closed by user
```

### Expected Results

| Step | Expected | Status |
|------|----------|--------|
| Ad Network supported | ✅ Feature detection works | |
| Ad displays | ✅ Appears full-screen or inline | |
| Reward granted | ✅ For completed rewarded ads | |
| Cooldown enforced | ✅ Prevents ad spam | |
| Earnings tracked | ✅ Logged in database | |
| No errors | ✅ Graceful handling | |

### Console Logs to Check

```javascript
// Open DevTools: F12 in Pi Browser
// Look for these logs:

[PI ADS] ✅ Ad Network is supported
[PI ADS] 🎬 Showing interstitial ad...
[PI ADS] 🎯 Loading rewarded ad...
[PI ADS] ✅ Interstitial ad closed by user
[PI ADS] ✅ Rewarded ad granted reward
[PI ADS] ⚠️ Ad cooldown active
```

### Troubleshooting

**Issue:** "Ad Network NOT supported"
```
Check:
   1. Pi Browser version (must support ad_network)
   2. Device compatibility
   3. User region (some regions don't support ads yet)
   
Logs to see: "[PI ADS] ⚠️ Ad Network NOT supported"
   
Fix:
   1. Update to latest Pi Browser
   2. Try in different region
   3. Gracefully show message: "Ads not available in your region"
```

**Issue:** "AD_NOT_AVAILABLE"
```
No ads currently available for this user.
   
This can happen:
   1. User seen too many ads today (frequency cap)
   2. No ads available in user's region
   3. Temporary ad network issue
   
Fix:
   1. Wait and try later
   2. Try different ad type
   3. Implement fallback (free credits)
```

**Issue:** "AD_NETWORK_ERROR"
```
Network connection or Pi Browser error.
   
Logs to see: "[PI ADS] ❌ Failed to show ad: ..."
   
Fix:
   1. Check internet connection
   2. Restart Pi Browser
   3. Try again
   4. Log error for monitoring
```

**Issue:** "ADS_NOT_SUPPORTED"
```
Pi Browser version too old for ad network.
   
Fix:
   1. Update Pi Browser to latest
   2. Show message: "Update Pi Browser to earn from ads"
   3. Disable ad features gracefully
```

---

## Test 4: Integration Test (All Systems Together)

### Scenario
Complete user journey: Sign in → Browse → Subscribe → View ads → Earn

### Steps

```
1. SIGN IN
   └─ Use Test 1 steps
   └─ Verify authenticated

2. BROWSE CONTENT
   └─ Interstitial ads show when navigating
   └─ User can click links

3. SUBSCRIBE
   └─ Use Test 2 steps
   └─ Make payment for subscription
   └─ Verify subscription active

4. VIEW REWARDED ADS
   └─ Click "Watch ad for bonus credits"
   └─ Ad plays
   └─ Verify earnings added to account

5. VERIFY DATA
   └─ Check Supabase profiles table
   └─ Check subscriptions table
   └─ Check payments table
   └─ Check ad_earnings table
```

### Integration Checklist

- [ ] Authentication working
  - [ ] User profile created
  - [ ] Wallet address saved
  
- [ ] Payments working
  - [ ] Payment completes
  - [ ] Subscription activates
  - [ ] Payment recorded
  
- [ ] Ad Network working
  - [ ] Ads display
  - [ ] Earnings tracked
  - [ ] Frequency cap enforced
  
- [ ] Database consistency
  - [ ] All records created
  - [ ] Foreign keys correct
  - [ ] Timestamps accurate
  
- [ ] Error handling
  - [ ] Graceful error messages
  - [ ] No console errors
  - [ ] Recovery works

---

## Environment Variable Testing

### Validate Configuration

Run the validation script:

```bash
npm run validate-pi-env
```

Expected output:
```
✅ VITE_PI_APP_ID is set
✅ VITE_PI_API_KEY is set (64 chars)
✅ VITE_PI_VALIDATION_KEY is set (128 chars)
✅ VITE_PI_PAYMENTS_ENABLED=true
✅ VITE_PI_AD_NETWORK_ENABLED=true
...

📊 Summary
Total Checks: 18
Passed: 18
Failed: 0

✅ Configuration Valid
All Pi Network environment variables are correctly configured!
```

---

## Debug Mode

### Enable Detailed Logging

Set in `.env`:
```
VITE_DEBUG_MODE="true"
VITE_DISABLE_DEBUG_LOGS="false"
```

This enables:
- Detailed [PI SDK] logs
- Detailed [PI AUTH] logs
- Detailed [PI PAYMENT] logs
- Detailed [PI ADS] logs

### Browser Console

Open DevTools (F12) and filter by:
```javascript
// Show all Pi logs
$0.textContent.includes('[PI')

// Filter by system:
// [PI SDK] - SDK loading
// [PI AUTH] - Authentication
// [PI PAYMENT] - Payments
// [PI ADS] - Ad network
```

---

## Performance Testing

### Auth Response Time
Test token validation speed:
```javascript
console.time('pi-auth');
// ... perform auth ...
console.timeEnd('pi-auth');

// Expected: < 1000ms
// Acceptable: < 3000ms
```

### Payment Processing Time
Test full payment flow:
```javascript
console.time('pi-payment');
// ... create payment ...
console.timeEnd('pi-payment');

// Expected: Phase I < 2s, Phase III < 5s
// Total time: < 10s
```

### Ad Load Time
Test ad network responsiveness:
```javascript
console.time('pi-ads-load');
// ... show ad ...
console.timeEnd('pi-ads-load');

// Expected: < 3000ms
```

---

## Monitoring & Analytics

### Track Metrics

1. **Authentication**
   - Sign-in success rate
   - Time to authenticate
   - Failed auth attempts

2. **Payments**
   - Payment success rate
   - Average payment amount
   - Dropout by phase (I, II, III)
   - Payment processing time

3. **Ad Network**
   - Ad impressions
   - Ad completion rate
   - Earnings per user
   - Ad type performance

### Set Up Error Tracking

Install Sentry or similar:
```typescript
import * as Sentry from "@sentry/react";

Sentry.captureException(error);
// Logs all Pi network errors
```

---

## Regression Testing

After any changes, test:

- [ ] Auth still works
- [ ] Payments still complete
- [ ] Ads still display
- [ ] No console errors
- [ ] Edge functions still responding

---

## Submit Test Results

Document your findings:

```markdown
## Test Results - [Date]

### Authentication
- Status: ✅ Pass / ❌ Fail
- Time: 2.3s
- Notes: [Any issues]

### Payments
- Status: ✅ Pass / ❌ Fail
- Amount tested: 3.14 PI
- Time: 8.5s
- Notes: [Any issues]

### Ad Network
- Status: ✅ Pass / ❌ Fail
- Ad types: Interstitial, Rewarded
- Earnings: 0.01 PI
- Notes: [Any issues]

### Overall
- Ready for production: ✅ Yes / ❌ No
- Issues found: [List]
- Recommendations: [List]
```

---

**Status:** ✅ Ready for Testing  
**Last Updated:** January 14, 2026
