# Real Pi Payment Safeguards

## Purpose
This document outlines safeguards to prevent mock, fake, or test payments from being used in the subscription system.

## Existing Safeguards in Code

### 1. Configuration-Level Protection (src/config/pi-config.ts)

```typescript
SANDBOX_MODE: false,  // CRITICAL: Disabled for mainnet

SDK: {
  sandbox: false,     // CRITICAL: Disabled for mainnet
}
```

**Protection**: Configuration enforces mainnet-only mode

### 2. Runtime Payment Validation (src/contexts/PiContext.tsx)

```typescript
const createPayment = async (amount: number, memo: string, metadata?: any) => {
  if (PI_CONFIG.SANDBOX_MODE) {
    throw new Error('CRITICAL ERROR: Sandbox mode is enabled! Payments must be mainnet only.');
  }
}
```

**Protection**: System throws error if sandbox mode detected at runtime

### 3. Environment Variable Enforcement (.env)

```
VITE_PI_SANDBOX_MODE=false      # Must be false
VITE_PI_MAINNET_MODE=true       # Must be true
VITE_PI_PAYMENTS_ENABLED=true   # Payments enabled
```

**Protection**: Environment must be configured for mainnet

### 4. User Confirmation Dialog (src/pages/Subscription.tsx)

```typescript
const confirmed = window.confirm(
  `⚠️ REAL Pi PAYMENT\n\n` +
  `This is a REAL Pi Network mainnet transaction. Actual Pi coins will be deducted from your wallet.`
);
```

**Protection**: Users cannot proceed without acknowledging real mainnet payment

### 5. Server-Side Verification (supabase/functions/pi-payment-*.ts)

```typescript
const getPaymentUrl = `https://api.minepi.com/v2/payments/${paymentId}`;

// Validates payment with real Pi API
// No mock endpoints or test servers
```

**Protection**: All server-side payments validated with real Pi API

## Code Review Checklist for Developers

When adding or modifying payment code, verify:

### Before Commit
- [ ] No "mock", "fake", "test", or "sandbox" keywords in payment code
- [ ] SANDBOX_MODE is false in pi-config.ts
- [ ] Environment variables use mainnet endpoints
- [ ] User confirmation shows "REAL Pi PAYMENT"
- [ ] API calls use api.minepi.com (not testnet)
- [ ] Console logs indicate "REAL MAINNET PAYMENT"

### Testing
- [ ] Test with real Pi Network account
- [ ] Verify user sees mainnet warning
- [ ] Check that sandbox=false in SDK
- [ ] Confirm payment recorded in database
- [ ] Validate subscription created correctly

### Deployment
- [ ] Verify PI_API_KEY is set in Supabase
- [ ] Confirm SANDBOX_MODE is disabled in production
- [ ] Check environment uses mainnet configuration
- [ ] Test full payment flow before release

## Critical Files to Protect

### Configuration Files
1. **src/config/pi-config.ts** - SANDBOX_MODE must be false
2. **.env** - VITE_PI_SANDBOX_MODE must be false
3. **src/main.tsx** - No mock Pi SDK

### Payment Logic
1. **src/pages/Subscription.tsx** - Real payment flow
2. **src/contexts/PiContext.tsx** - createPayment function
3. **supabase/functions/pi-payment-approve/index.ts** - Approval handler
4. **supabase/functions/pi-payment-complete/index.ts** - Completion handler

### Database
1. **subscriptions table** - Stores real subscription data
2. **payment_idempotency table** - Tracks real payments

## Monitoring & Alerts

### Payment Logging
All payments logged with:
```
[SUBSCRIPTION] ⚠️ REAL MAINNET PAYMENT
[PAYMENT] ⚠️ REAL Pi Network MAINNET Payment
[APPROVAL SUCCESS] Real payment approved
[SUBSCRIPTION CREATE] Real subscription created
```

### Database Monitoring
Monitor `subscriptions` table for:
- Increasing count of active subscriptions
- Correct pi_amount values
- Correct plan_type values
- Proper end_date calculations

### Error Alerts
- "CRITICAL ERROR: Sandbox mode is enabled!" - Immediately investigate
- "Payment is not ready for approval" - Check Pi API status
- "Unable to determine profile for payment" - Verify metadata flow

## Backup Safeguards

### 1. Git Hooks (for future implementation)
```bash
# Pre-commit hook to prevent committing SANDBOX_MODE: true
grep -r "SANDBOX_MODE.*true" src/
grep -r "sandbox.*true" src/config/
```

### 2. Deployment Checklist
Before deploying to production:
```bash
# Verify mainnet configuration
grep "SANDBOX_MODE" src/config/pi-config.ts | grep "false"

# Verify no mock payments
grep -r "mockPayment\|fakePayment\|testPayment" src/ | wc -l
# Should return: 0

# Verify Pi API is mainnet
grep "api.minepi.com" supabase/functions/*/index.ts
```

### 3. Production Environment Check
```bash
echo $VITE_PI_SANDBOX_MODE    # Should be: false
echo $VITE_PI_MAINNET_MODE    # Should be: true
echo $PI_API_KEY              # Should contain mainnet credentials
```

## What NOT To Do

❌ **NEVER**:
- Set SANDBOX_MODE to true in production
- Create a mock payment function
- Use test API endpoints
- Skip user confirmation dialog
- Remove mainnet validation
- Change PI_CONFIG.NETWORK from "mainnet"
- Add fallback test payments
- Create alternate payment flows

## What TO Do

✅ **ALWAYS**:
- Use real Pi SDK only
- Validate with real Pi API
- Show user confirmation
- Log all transactions
- Store real subscription data
- Monitor payment logs
- Test with real Pi Network account
- Report errors immediately

## Emergency Procedures

### If Mock Payment Detected
1. STOP all operations
2. Review git history for changes
3. Identify when mock code was added
4. Revert to last known good state
5. Audit all transactions
6. Report to security team
7. Re-deploy with real payments

### If Sandbox Mode Enabled
1. System will throw CRITICAL ERROR
2. Payment will not be created
3. Review deployment configuration
4. Verify .env file
5. Check pi-config.ts
6. Re-deploy with proper configuration

## Documentation

- **Main Reference**: https://pi-apps.github.io/community-developer-guide/
- **Payment API**: https://pi-apps.github.io/community-developer-guide/ → Payments
- **Mainnet Config**: DROPLINK_MAINNET_CONFIG.md (this repo)
- **Setup Guide**: MAINNET_SETUP_CHECKLIST.md (this repo)

## Sign-Off

This document confirms that Droplink subscription system:

✅ Uses REAL Pi mainnet payments only  
✅ Has no mock payment implementations  
✅ Validates all payments with real Pi API  
✅ Shows user confirmations  
✅ Stores transaction data in database  
✅ Has runtime safeguards against sandbox mode  

**Status**: PRODUCTION READY ✅

---

**Last Updated**: December 7, 2025  
**Audit Status**: PASSED ✅
