# Payment Metadata Flow Fix

## Problem
Payment creation was not properly preserving client-provided metadata (profileId, subscriptionPlan, billingPeriod) through the approval and completion steps. This caused subscription records to fail creation because the payment completion function couldn't determine which profile to create the subscription for.

## Root Cause
The metadata passed to `createPayment()` in the client was not being sent to the backend Supabase functions. The approval and completion functions were trying to extract metadata from the Pi API payment object, which doesn't store client-provided metadata by default.

## Solution

### 1. Updated `PiContext.tsx` - createPayment Function
**File**: `src/contexts/PiContext.tsx`

**Changes**:
- Modified `onReadyForServerApproval` callback to send client metadata to the approval function:
  ```typescript
  const { error } = await supabase.functions.invoke('pi-payment-approve', {
    body: { paymentId, metadata },  // Added metadata parameter
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  ```

- Modified `onReadyForServerCompletion` callback to send client metadata to the completion function:
  ```typescript
  const { error } = await supabase.functions.invoke('pi-payment-complete', {
    body: { paymentId, txid, metadata },  // Added metadata parameter
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  ```

### 2. Updated `pi-payment-approve` Function
**File**: `supabase/functions/pi-payment-approve/index.ts`

**Changes**:
- Extract client metadata from request body:
  ```typescript
  const { paymentId, metadata } = await req.json();
  console.log('[APPROVAL] Client metadata received:', JSON.stringify(metadata));
  ```

- Prioritize client-provided metadata over Pi SDK metadata:
  ```typescript
  const piMetadata = paymentDetails?.metadata || {};
  const clientMetadata = metadata || piMetadata;
  ```

- Store both client and Pi metadata in idempotency record:
  ```typescript
  metadata: {
    ...paymentDetails,
    clientMetadata: clientMetadata,
    piMetadata: piMetadata,
    approvedAt: new Date().toISOString()
  }
  ```

- Enhanced logging for debugging

### 3. Updated `pi-payment-complete` Function
**File**: `supabase/functions/pi-payment-complete/index.ts`

**Changes**:
- Properly extract client metadata from idempotency record:
  ```typescript
  const clientMetadata = storedMetadata?.clientMetadata || {};
  ```

- Prioritize multiple sources for profileId:
  ```typescript
  let finalProfileId = profileId || metadata?.profileId || clientMetadata?.profileId;
  ```

- Enhanced logging throughout the function to track metadata flow:
  ```typescript
  console.log('[COMPLETE] Retrieved metadata:', {
    existingPaymentId: existingPayment?.id,
    storedMetadata,
    clientMetadata,
    incomingMetadata: metadata
  });
  ```

## Data Flow After Fix

```
User initiates payment:
  Subscription.tsx calls:
    createPayment(price, memo, {
      subscriptionPlan: 'pro',
      billingPeriod: 'monthly',
      profileId: 'user-123',
      username: 'john_doe',
      type: 'subscription'
    })
    ↓
Client PiContext stores metadata and invokes Pi SDK:
    window.Pi.createPayment(paymentData, callbacks)
    ↓
Payment ready for approval:
    → onReadyForServerApproval callback
    → Calls: supabase.functions.invoke('pi-payment-approve', {
        body: { paymentId, metadata } ← Includes full metadata
      })
    ↓
Approval function stores metadata in idempotency table:
    payment_idempotency row:
      - payment_id: "abc123"
      - profile_id: "user-123"
      - metadata: {
          clientMetadata: { subscriptionPlan, billingPeriod, profileId, ... },
          piMetadata: { ... },
          ...
        }
    ↓
Payment ready for completion:
    → onReadyForServerCompletion callback
    → Calls: supabase.functions.invoke('pi-payment-complete', {
        body: { paymentId, txid, metadata }
      })
    ↓
Complete function retrieves stored metadata:
    - Gets idempotency record
    - Extracts clientMetadata from stored metadata
    - Creates subscription with:
        profile_id: finalProfileId (from clientMetadata.profileId)
        plan_type: clientMetadata.subscriptionPlan
        billing_period: clientMetadata.billingPeriod
```

## Key Metadata Fields

| Field | Source | Purpose |
|-------|--------|---------|
| `profileId` | Client metadata | Identify which user's subscription to create |
| `subscriptionPlan` | Client metadata | Determine plan type (pro, premium, etc.) |
| `billingPeriod` | Client metadata | Set subscription duration (monthly/yearly) |
| `username` | Client metadata | Fallback for profileId lookup if needed |
| `type` | Client metadata | Payment categorization |

## Testing the Fix

1. **Monitor logs** during payment completion:
   - `[APPROVAL] Client metadata received:` - Should show full metadata
   - `[COMPLETE] Retrieved metadata:` - Should show stored clientMetadata
   - `[SUBSCRIPTION CREATE]` - Should show subscription being created with correct plan

2. **Verify database** after payment:
   - Check `payment_idempotency` table has metadata stored
   - Check `subscriptions` table has new row with correct plan_type and billing_period
   - Check `payment_transactions` has payment recorded

3. **Check user features** are unlocked after payment completes

## Backward Compatibility
- Functions will work with or without client metadata
- If metadata is missing, falls back to stored Pi API metadata or profile resolution by username
- Non-breaking changes to existing API contracts
