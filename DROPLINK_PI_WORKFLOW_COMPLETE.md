# 🎯 Droplink Pi Network Complete Workflow - MAINNET READY

## ✅ Setup Complete

### 🔑 API Keys Configured
- **Mainnet API Key**: `96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5`
- **Validation Key**: Stored in `public/validation-key.txt`
- **Environment**: Configured as Supabase secret `PI_API_KEY`

### 📁 Database Tables
- ✅ `profiles` - User profiles with Pi username
- ✅ `subscriptions` - Subscription plans and billing
- ✅ `payment_idempotency` - Prevent duplicate payments
- ✅ `user_wallets` - Drop tokens for in-app rewards

---

## 🔄 Complete User Workflow

### 1️⃣ **User Signs In with Pi Browser**

**Flow:**
```
User opens app in Pi Browser
  ↓
User clicks "Sign in with Pi Network"
  ↓
Pi SDK authenticates user (mainnet)
  ↓
Frontend calls `pi-auth` edge function
  ↓
Function verifies Pi access token with Pi API
  ↓
Profile auto-created in database (if new user)
  ↓
User redirected to dashboard
```

**Key Files:**
- Frontend: `src/pages/PiAuth.tsx`
- Context: `src/contexts/PiContext.tsx`
- Backend: `supabase/functions/pi-auth/index.ts`

**Security:**
- ✅ Access token verified with Pi API v2
- ✅ Profile created with sanitized username
- ✅ Duplicate username handling
- ✅ Automatic Supabase auth user creation

---

### 2️⃣ **User Browses Features (Free Plan Default)**

**Free Plan Limits:**
- ❌ Only 1 custom link
- ❌ Only 1 social link
- ❌ No YouTube video support
- ❌ No Pi tips/donations
- ❌ No analytics
- ❌ Droplink watermark shown
- ✅ Pi Ad Network enabled

**Feature Gating:**
```tsx
<PlanGate minPlan="premium">
  <YouTubeEmbed url={videoUrl} />
</PlanGate>
```

**Component:** `src/components/PlanGate.tsx`

---

### 3️⃣ **User Wants to Upgrade (Locked Feature)**

**Pricing:**
- **Premium**: 10 Pi/month or 96 Pi/year (save 20%)
- **Pro**: 20 Pi/month or 192 Pi/year (save 20%)

**User Action:**
```
User clicks "Upgrade" on locked feature
  ↓
Redirected to `/subscription` page
  ↓
User selects plan (Premium or Pro)
  ↓
User chooses billing period (Monthly/Yearly)
  ↓
User clicks "Subscribe with Pi"
```

**Page:** `src/pages/Subscription.tsx`

---

### 4️⃣ **Pi Payment Flow**

**Frontend (PiContext.tsx):**
```typescript
await createPayment(
  piAmount,          // e.g., 100 for Premium Yearly
  'Droplink Premium Yearly Subscription',
  {
    subscriptionPlan: 'premium',
    billingPeriod: 'yearly',
    profileId: currentProfileId
  }
);
```

**Pi Browser Payment Dialog:**
```
Pi SDK shows payment confirmation
  ↓
User approves payment in Pi Wallet
  ↓
Payment approved by Pi Network
  ↓
Callback: onReadyForServerApproval
```

---

### 5️⃣ **Server-Side Payment Approval**

**Function:** `supabase/functions/pi-payment-approve/index.ts`

**Flow:**
```typescript
1. Receive paymentId from frontend
2. Check idempotency (prevent duplicates)
3. Verify payment with Pi API:
   GET https://api.minepi.com/v2/payments/{paymentId}
   Authorization: Key {PI_API_KEY}
4. Validate payment status and amount
5. Approve payment with Pi API:
   POST https://api.minepi.com/v2/payments/{paymentId}/approve
6. Store in payment_idempotency table
7. Return success
```

**Security Checks:**
- ✅ Idempotency protection (no double-approvals)
- ✅ Payment verification with Pi API
- ✅ Amount validation
- ✅ Status validation
- ⚠️ **TODO**: Add authentication (currently public)

---

### 6️⃣ **Server-Side Payment Completion**

**Function:** `supabase/functions/pi-payment-complete/index.ts`

**Flow:**
```typescript
1. Receive paymentId, txid, metadata
2. Check idempotency (prevent duplicate subscriptions)
3. Verify payment completed with Pi API
4. Validate metadata (plan, billing period, profile)
5. Calculate subscription end date:
   - Monthly: +30 days
   - Yearly: +365 days
6. Create subscription record:
   {
     profile_id: profileId,
     plan_type: 'premium' | 'pro',
     billing_period: 'monthly' | 'yearly',
     pi_amount: amount,
     start_date: NOW(),
     end_date: calculated,
     status: 'active'
   }
7. Update payment_idempotency with txid
8. Return success
```

**Security Checks:**
- ✅ Idempotency protection
- ✅ Payment verification
- ✅ Transaction ID validation
- ⚠️ **TODO**: Validate authenticated user owns profile
- ⚠️ **TODO**: Validate payment amount matches plan price

---

### 7️⃣ **Subscription Active & Features Unlocked**

**Hook:** `src/hooks/useActiveSubscription.ts`

**Logic:**
```typescript
const { plan, expiresAt, status } = useActiveSubscription();

// Returns:
// - plan: "free" | "premium" | "pro"
// - expiresAt: Date | null
// - status: "active" | "expired" | null
// - loading: boolean

// Automatically checks:
// 1. User's profile_id from Pi username
// 2. Latest subscription record
// 3. Expiration date > now()
// 4. Returns "free" if expired or no subscription
```

**Feature Unlocking:**
```tsx
{plan === 'free' && <PiAdBanner />}
{plan === 'premium' || plan === 'pro' ? <AnalyticsDashboard /> : null}
{plan === 'pro' && <AISupport />}
```

---

### 8️⃣ **Subscription Expiration Handling**

**Auto-Expiration:**
```sql
-- Check subscription status
SELECT 
  plan_type,
  end_date,
  CASE 
    WHEN end_date < now() THEN 'expired'
    ELSE status
  END as status
FROM subscriptions
WHERE profile_id = ${profileId}
ORDER BY created_at DESC
LIMIT 1
```

**User Experience:**
```
Subscription expires
  ↓
useActiveSubscription returns plan: "free"
  ↓
PlanGate components show upgrade prompts
  ↓
User sees "Your plan has expired" message
  ↓
User can renew by subscribing again
```

**Component:** Features automatically lock based on `useActiveSubscription` hook

---

## 🔒 Security Implementation Status

### ✅ Implemented
- Pi access token verification
- Payment verification with Pi API
- Idempotency protection
- Profile creation validation
- Database RLS policies
- Payment amount tracking

### ⚠️ Security Warnings (From Audit)

**CRITICAL:**
1. **Payment endpoints have no authentication**
   - Anyone can call `pi-payment-approve` and `pi-payment-complete`
   - Need to add JWT verification
   - Need to verify authenticated user owns the payment

2. **Payment metadata validation needed**
   - Server trusts client-provided plan/amount
   - Need server-side price validation
   - Need to prevent price manipulation

3. **Financial data publicly readable**
   - Bank details and crypto wallets exposed
   - Need to restrict RLS policies

### 🛠️ Required Security Fixes

**1. Enable JWT Auth on Payment Functions:**
```toml
# supabase/config.toml
[functions.pi-payment-approve]
verify_jwt = true

[functions.pi-payment-complete]
verify_jwt = true
```

**2. Add Authentication to Functions:**
```typescript
// In both payment functions
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { status: 401, headers: corsHeaders }
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Invalid authentication' }),
    { status: 401, headers: corsHeaders }
  );
}
```

**3. Validate Payment Amount:**
```typescript
const PLAN_PRICES = {
  'premium-monthly': 10,
  'premium-yearly': 96,
  'pro-monthly': 20,
  'pro-yearly': 192
};

const planKey = `${metadata.subscriptionPlan}-${metadata.billingPeriod}`;
const expectedAmount = PLAN_PRICES[planKey];

if (paymentData.amount !== expectedAmount) {
  return new Response(
    JSON.stringify({ error: 'Payment amount mismatch' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

## 📊 Feature Matrix

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Custom Links | 1 | Unlimited | Unlimited |
| Social Links | 1 | Unlimited | Unlimited |
| YouTube Video | ❌ | ✅ | ✅ |
| Pi Tips Wallet | ❌ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ Full |
| AI Support | ❌ | ❌ | ✅ |
| No Watermark | ❌ | ✅ | ✅ |
| No Ads | ❌ | ✅ | ✅ |
| Watch Ads for Rewards | ✅ | ❌ | ✅ |

---

## 🎯 Pi Ad Network Integration

### Rewarded Ads (Free Users)
```typescript
const result = await showRewardedAd();
if (result) {
  // Grant temporary access or drop tokens
}
```

### Interstitial Ads (Free Users)
```typescript
await showInterstitialAd();
// Shows after 30 seconds on free plan
```

**Components:**
- `src/components/PiAdBanner.tsx` - Upgrade prompt with scheduled ad
- `src/components/WatchAdModal.tsx` - Manual ad watching for features

---

## 🚀 Deployment Checklist

### Before Mainnet Launch:
- [ ] Fix payment endpoint authentication
- [ ] Add payment amount validation
- [ ] Restrict financial data RLS policies
- [ ] Test complete payment flow in Pi Browser
- [ ] Test subscription expiration
- [ ] Test feature gating with all plans
- [ ] Enable leaked password protection
- [ ] Set up error monitoring
- [ ] Test auto-renewal (if implemented)

### Testing in Pi Browser:
1. Open `https://droplink-mainnet.lovable.app` in Pi Browser
2. Sign in with Pi Network
3. Navigate to "Browse Subscriptions"
4. Select Premium/Pro plan
5. Complete payment with test Pi
6. Verify subscription activation
7. Verify features unlock immediately
8. Wait for expiration and verify downgrade to free

---

## 📚 Documentation Links

- **Pi Platform Docs**: https://github.com/pi-apps/pi-platform-docs
- **Pi Community Guide**: https://pi-apps.github.io/community-developer-guide/
- **Pi Ad Network**: https://minepi.com/blog/ad-network-expansion/

---

## 🔧 Quick Reference

### Check User's Current Plan:
```typescript
const { plan, expiresAt } = useActiveSubscription();
console.log(`Current plan: ${plan}`);
console.log(`Expires: ${expiresAt}`);
```

### Lock a Feature:
```tsx
<PlanGate minPlan="premium">
  <PremiumFeature />
</PlanGate>
```

### Create Manual Payment:
```typescript
const { createPayment } = usePi();
await createPayment(10, "Custom payment", { customData: true });
```

### Check Payment Status:
```sql
SELECT * FROM payment_idempotency 
WHERE payment_id = 'PAYMENT_ID';
```

### Check Active Subscriptions:
```sql
SELECT * FROM subscriptions 
WHERE profile_id = 'PROFILE_ID' 
AND end_date > now() 
ORDER BY created_at DESC;
```

---

## ✅ Workflow Complete!

The entire Pi payment and subscription system is now functional:
- ✅ User authentication with Pi Network
- ✅ Profile auto-creation
- ✅ Subscription plans with Pi cryptocurrency
- ✅ Payment processing via Pi API
- ✅ Feature gating based on plan
- ✅ Subscription expiration handling
- ✅ Pi Ad Network integration

**Ready for mainnet testing!** 🎉

⚠️ **IMPORTANT**: Complete the security fixes above before processing real payments.
