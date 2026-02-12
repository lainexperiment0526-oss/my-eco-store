# Pi Payment Tutorial → DropLink Adaptation

## 📖 Tutorial Reference: FlappyPi Implementation

This document shows how the FlappyPi tutorial was adapted for DropLink.

---

## 🔄 Key Adaptations

### 1. Configuration

**Tutorial (FlappyPi):**
```typescript
PI_API_KEY=your_api_key_here
VITE_PI_DOMAIN=yourdomain.com
```

**DropLink:**
```typescript
PI_API_KEY=nw4apm1epi1dt6onaiihiauyvgyis0omo5gbumog6zrhkrupvnjtnibinlrg6caf
VITE_PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
VITE_PI_DOMAIN=droplink.space
VITE_PI_PAYMENT_RECEIVER_WALLET=GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ
```

### 2. Payment Items

**Tutorial (FlappyPi):**
```typescript
type: 'coins' | 'powerup' | 'skin'
// Game items like coins, power-ups
```

**DropLink:**
```typescript
type: 'subscription' | 'product' | 'coins'
// Subscription plans, products, DROP tokens
```

### 3. Backend Functions

**Tutorial:**
```typescript
// Node.js Express server
app.post('/api/payments/approve', ...)
app.post('/api/payments/complete', ...)
```

**DropLink:**
```typescript
// Supabase Edge Functions (Deno)
supabase/functions/pi-payment-approve/index.ts
supabase/functions/pi-payment-complete/index.ts
```

### 4. Database Storage

**Tutorial:**
```typescript
// MongoDB or simple file storage
```

**DropLink:**
```typescript
// Supabase PostgreSQL
- profiles table (user data)
- subscriptions table (plan data)
- payment_idempotency table (payment tracking)
```

---

## 📁 File Mapping

| Tutorial File | DropLink File | Changes |
|--------------|---------------|---------|
| `src/config/piConfig.ts` | ✅ Same | Using DropLink API keys |
| `src/config/piSDK.ts` | ✅ Same | No changes needed |
| `src/services/realPiPaymentService.ts` | ✅ Adapted | Supabase endpoints instead of Express |
| `src/hooks/usePiNetwork.ts` | ✅ Same | No changes needed |
| `src/hooks/useRealPiPayment.ts` | ✅ Same | No changes needed |
| `src/components/PiBrowserPrompt.tsx` | ✅ Customized | DropLink branding |
| Backend API | ✅ Adapted | Supabase Edge Functions |

---

## 🔧 Implementation Differences

### Payment Service Backend Calls

**Tutorial:**
```typescript
const response = await fetch('/api/pi/approve-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ paymentId }),
});
```

**DropLink:**
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pi-payment-approve`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ paymentId }),
  }
);
```

### Metadata Structure

**Tutorial (FlappyPi):**
```typescript
metadata: {
  itemId: 'coins-100',
  itemType: 'coins',
  userId: user.uid,
  gameLevel: 5
}
```

**DropLink:**
```typescript
metadata: {
  subscriptionPlan: 'premium',
  billingPeriod: 'monthly',
  username: piUser.username,
  profileId: profileId,
  type: 'subscription'
}
```

---

## ✅ What Stayed the Same

These parts work exactly as in the tutorial:

1. **Pi SDK initialization** - Same pattern
2. **Authentication flow** - Identical
3. **3-phase payment flow** - Same callbacks
4. **Payment creation** - Same `window.Pi.createPayment()`
5. **Environment detection** - Same logic
6. **Error handling** - Same patterns

---

## 🎯 DropLink-Specific Features

Added features not in the tutorial:

1. **Subscription Management**
   - Database table for subscriptions
   - Auto-renewal tracking
   - Plan type validation

2. **Profile Integration**
   - Links payments to user profiles
   - Tracks subscription status per profile
   - Multiple account support

3. **Idempotency**
   - Prevents duplicate payments
   - Tracks payment status
   - Stores metadata for debugging

4. **Progress Tracking**
   - Real-time payment phase updates
   - UI feedback for users
   - Toast notifications

---

## 🔐 Security Enhancements

DropLink adds these security features:

1. **Profile Ownership Validation**
   ```typescript
   if (metadata?.profileId && profileId && 
       metadata.profileId !== profileId) {
     throw new Error('Payment does not belong to authenticated user');
   }
   ```

2. **Transaction Verification**
   ```typescript
   if (!result.verified) {
     console.error('Transaction not verified on blockchain!');
     throw new Error('Transaction verification failed');
   }
   ```

3. **Timeout Protection**
   ```typescript
   const TIMEOUT_MS = 45000; // 45 seconds
   if (elapsedMs > TIMEOUT_MS) {
     throw new Error('Payment timeout');
   }
   ```

---

## 📊 Subscription Plans (DropLink Specific)

```typescript
export const SUBSCRIPTION_PLANS = {
  free: { price: 0, features: [...] },
  basic: { price: 10, features: [...] },
  premium: { price: 20, features: [...] },
  pro: { price: 30, features: [...] }
};
```

When payment completes, subscription is created:

```typescript
await supabase
  .from('subscriptions')
  .upsert({
    profile_id: profileId,
    plan_type: planType,
    status: 'active',
    start_date: new Date(),
    end_date: calculateEndDate(billingPeriod),
    pi_amount: amount,
    pi_transaction_id: txid
  });
```

---

## 🧪 Testing Differences

**Tutorial Testing:**
- Simple in-game purchases
- Immediate delivery
- No recurring billing

**DropLink Testing:**
- Subscription plans with renewal dates
- Profile-based activation
- Database verification required
- Check subscription status in UI

---

## 📝 Usage Comparison

### Tutorial Usage (FlappyPi)
```typescript
// Buy coins in game
const result = await processPayment({
  id: 'coins-100',
  name: '100 Coins',
  type: 'coins',
  price: 0.99,
  description: 'Get 100 game coins'
});
```

### DropLink Usage
```typescript
// Subscribe to plan
const result = await processPayment({
  id: 'subscription-premium',
  name: 'Premium Subscription',
  type: 'subscription',
  price: 20,
  description: 'Monthly premium plan',
  metadata: {
    subscriptionPlan: 'premium',
    billingPeriod: 'monthly',
    profileId: profileId
  }
});
```

---

## 🎉 Summary

The tutorial's core payment flow works **exactly as documented**, with adaptations for:

1. ✅ DropLink's API keys and domain
2. ✅ Supabase backend instead of Express
3. ✅ Subscription system instead of one-time purchases
4. ✅ Profile-based user management
5. ✅ Enhanced security and validation

**The payment mechanism itself is 100% from the working FlappyPi tutorial!**

---

## 🚀 Result

You now have a production-ready Pi payment system that:
- Uses your actual DropLink API keys
- Follows proven working patterns from FlappyPi
- Integrates with your Supabase backend
- Manages subscription plans properly
- Includes all necessary security features

**Ready to test and deploy!** 🎊
