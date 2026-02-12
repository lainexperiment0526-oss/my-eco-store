# Payment Metadata Fix - Testing Guide

## What Was Fixed
The payment flow now properly preserves all client-provided metadata (profileId, subscriptionPlan, billingPeriod) through the entire approval and completion pipeline, ensuring subscriptions are created correctly.

## Key Changes Made

### 1. Client Side (PiContext.tsx)
- ✅ `onReadyForServerApproval` callback now sends metadata with paymentId
- ✅ `onReadyForServerCompletion` callback now sends metadata with paymentId and txid
- ✅ Added debug logging for metadata transmission

### 2. Backend - Approval Function (pi-payment-approve)
- ✅ Accepts metadata from request body
- ✅ Prioritizes client-provided metadata over Pi SDK metadata
- ✅ Stores both clientMetadata and piMetadata in idempotency table
- ✅ Enhanced logging shows metadata sources

### 3. Backend - Completion Function (pi-payment-complete)
- ✅ Extracts clientMetadata from stored idempotency record
- ✅ Resolves profileId from multiple sources (auth, request, stored)
- ✅ Creates subscription with correct plan and billing period
- ✅ Enhanced logging throughout the flow

## Expected Browser Console Logs

### Approval Phase
```
[PAYMENT] 📋 Ready for server approval - Payment ID: abc123def456
[PAYMENT] 📦 Sending client metadata to approval: {
  subscriptionPlan: "pro",
  billingPeriod: "monthly", 
  username: "john_doe",
  profileId: "user-uuid-123",
  type: "subscription"
}
[APPROVAL] Client metadata received: {...}
[APPROVAL] Final metadata: {...}
[APPROVAL] profileId from client metadata: user-uuid-123
[APPROVAL] Idempotency record created: {...}
[PAYMENT] ✅ Payment approved by server
```

### Completion Phase
```
[PAYMENT] 🔄 Ready for server completion - Transaction ID: xyz789
[PAYMENT] 📦 Sending metadata to completion: {...}
[COMPLETE] Retrieved metadata: {
  clientMetadata: {
    subscriptionPlan: "pro",
    billingPeriod: "monthly",
    profileId: "user-uuid-123",
    ...
  },
  ...
}
[COMPLETE] Profile ID resolution: {
  fromAuth: null,
  fromRequestMetadata: {...},
  fromStoredMetadata: "user-uuid-123",
  final: "user-uuid-123"
}
[SUBSCRIPTION CREATE] 🎯 Creating subscription with: {
  profileId: "user-uuid-123",
  planType: "pro",
  billingPeriod: "monthly",
  ...
}
[SUBSCRIPTION CREATED] user-uuid-123 pro
[PAYMENT] ✅ Payment completed successfully - Transaction: xyz789
```

## Database Verification

After a successful payment, verify in Supabase:

### 1. payment_idempotency Table
```sql
SELECT * FROM payment_idempotency WHERE payment_id = 'YOUR_PAYMENT_ID';
```
Should show:
- `profile_id`: Not null (should be user's UUID)
- `status`: 'completed'
- `metadata` contains:
  - `clientMetadata.subscriptionPlan`: 'pro', 'premium', etc.
  - `clientMetadata.billingPeriod`: 'monthly' or 'yearly'
  - `clientMetadata.profileId`: matches profile_id

### 2. subscriptions Table
```sql
SELECT * FROM subscriptions WHERE profile_id = 'USER_UUID';
```
Should show:
- Latest row with new subscription
- `plan_type`: Matches the subscription plan purchased
- `billing_period`: 'monthly' or 'yearly'
- `status`: 'active'
- `start_date`: Current date
- `end_date`: +1 month or +1 year from start
- `pi_amount`: Payment amount

### 3. payment_transactions Table
```sql
SELECT * FROM payment_transactions WHERE payment_id = 'YOUR_PAYMENT_ID';
```
Should show:
- Complete transaction record
- `status`: 'completed'
- `txid`: Transaction ID from Pi blockchain

## Testing Checklist

### ✅ Subscription Purchase Flow
- [ ] Open Subscription page
- [ ] Click subscribe button
- [ ] Complete Pi Browser payment
- [ ] Check browser console for metadata logs
- [ ] Verify payment_idempotency has correct profile_id
- [ ] Verify new subscription created in database
- [ ] Check features are unlocked for user

### ✅ Metadata Preservation
- [ ] Metadata transmitted to approval function
- [ ] Metadata stored in idempotency table
- [ ] Metadata retrieved in completion function
- [ ] Profile ID resolved from metadata

### ✅ Edge Cases
- [ ] No Supabase session (Pi user only) - should still work
- [ ] Username resolution fallback - should work
- [ ] Different subscription plans (pro, premium) - all should work
- [ ] Monthly vs Yearly subscriptions - both should work

## Rollback Plan
If issues occur, revert changes to:
1. `src/contexts/PiContext.tsx` - remove metadata from function invocations
2. `supabase/functions/pi-payment-approve/index.ts` - revert to original version
3. `supabase/functions/pi-payment-complete/index.ts` - revert to original version

## Performance Impact
- Minimal: Only adds metadata storage in idempotency table (already stored as JSON)
- No additional API calls added
- No database schema changes required

## Backward Compatibility
- Functions gracefully handle missing metadata
- Falls back to profile resolution from username
- Non-breaking changes to API contracts
