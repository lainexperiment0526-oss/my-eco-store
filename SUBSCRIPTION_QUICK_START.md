# 🚀 Subscription & Payment Quick Start

## ✅ What's Been Fixed

### 1. Beautiful Subscription Modal ✨
- Modern gradient designs with animations
- Yearly/monthly toggle with savings
- Responsive layout (mobile, tablet, desktop)
- Plan badges (Popular, Current)
- Mainnet payment warning

### 2. Pi Payment Creation 💰
- Comprehensive validation checks
- Detailed error messages
- Better user feedback
- Payment flow logging
- Mainnet verification

## 📱 How to Use

### For Users

#### 1. Open Subscription Page
- Navigate to `/subscription` or click "View Plans" button
- Modal opens automatically with all plans displayed

#### 2. Choose Your Plan
- Toggle between Monthly and Yearly billing (20% savings on yearly)
- Review plan features
- Free plan: Click to activate immediately
- Paid plans: Click "Subscribe with Pi" button

#### 3. Complete Payment (Paid Plans)
- Pi Browser payment dialog opens
- Review payment details
- Confirm with your Pi wallet password
- Wait for blockchain confirmation
- Success! Your subscription is activated

### For Developers

#### 1. Testing in Development
```bash
# Open in Pi Browser (required for payments)
# Cannot test in regular browsers - Pi SDK only works in Pi Browser
```

#### 2. Check Console Logs
```javascript
// Look for these logs:
[PAYMENT] 🚀 createPayment called with: {...}
[PAYMENT] ⚠️ REAL Pi Network MAINNET Payment
[PAYMENT] 📦 Payment data prepared: {...}
[PAYMENT] 🎯 Calling window.Pi.createPayment()...
[PAYMENT] ✅ window.Pi.createPayment() invoked successfully

[SUBSCRIPTION] ⚠️ REAL MAINNET PAYMENT: 10 Pi for Basic
[SUBSCRIPTION] Network: MAINNET (Production)
[SUBSCRIPTION] User: @username
[SUBSCRIPTION] Profile ID: uuid
[SUBSCRIPTION] Payment result: txid_hash
```

#### 3. Database Verification
```sql
-- Check subscriptions table
SELECT * FROM subscriptions 
WHERE profile_id = 'user_id' 
ORDER BY start_date DESC;

-- Should show:
-- plan_type: 'basic', 'premium', 'pro', or 'free'
-- status: 'active'
-- pi_amount: actual Pi paid
-- pi_transaction_id: blockchain transaction hash
-- billing_period: 'monthly' or 'yearly'
-- start_date: subscription start
-- end_date: subscription expiry
```

## 🔧 Component Integration

### Using SubscriptionModal in Other Components
```typescript
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useState } from "react";
import { usePi } from "@/contexts/PiContext";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const { createPayment, piUser, isAuthenticated } = usePi();
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (
    planName: string, 
    price: number, 
    isYearly: boolean
  ) => {
    if (!isAuthenticated || !piUser) {
      toast.error('Please sign in first');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createPayment(
        price,
        `Subscription: ${planName} ${isYearly ? 'Yearly' : 'Monthly'}`,
        {
          type: 'subscription',
          plan: planName.toLowerCase(),
          period: isYearly ? 'yearly' : 'monthly'
        }
      );
      
      if (result) {
        // Success! Update UI
        setCurrentPlan(planName);
        toast.success(`Subscribed to ${planName}!`);
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        View Plans
      </button>
      
      <SubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
        currentPlan={currentPlan}
        onSubscribe={handleSubscribe}
        loading={loading}
      />
    </>
  );
}
```

## 🎨 Customization

### Modify Plan Features
Edit `src/components/SubscriptionModal.tsx`:
```typescript
const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Your custom feature 1",
      "Your custom feature 2"
    ]
  },
  // ... more plans
];
```

### Change Colors
```typescript
// Free plan - Purple
className="bg-gradient-to-br from-purple-500/10 to-purple-500/5"

// Basic plan - Pink (Popular)
className="bg-gradient-to-br from-pink-500/10 to-pink-500/5"

// Premium plan - Blue
className="bg-gradient-to-br from-blue-500/10 to-blue-500/5"

// Pro plan - Orange
className="bg-gradient-to-br from-orange-500/10 to-orange-500/5"
```

### Adjust Animations
```typescript
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const scaleIn = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } }
};
```

## 🐛 Troubleshooting

### Issue: Modal doesn't open
**Solution**: Check `open` and `onOpenChange` props are correctly set
```typescript
const [showModal, setShowModal] = useState(false);
<SubscriptionModal open={showModal} onOpenChange={setShowModal} />
```

### Issue: Payment fails with "Pi SDK not available"
**Solution**: Must be in Pi Browser
- Download Pi Browser from minepi.com
- Open your app in Pi Browser
- Regular browsers don't support Pi SDK

### Issue: "User not authenticated"
**Solution**: Sign in first
```typescript
const { signIn, isAuthenticated } = usePi();

if (!isAuthenticated) {
  await signIn();
}
```

### Issue: Payment approved but subscription not created
**Solution**: Check Supabase Edge Functions
1. Verify `pi-payment-approve` function is deployed
2. Verify `pi-payment-complete` function is deployed
3. Check Edge Function logs in Supabase dashboard
4. Ensure RLS policies allow subscription inserts

### Issue: Console shows validation errors
**Solution**: Check all required data is present
```typescript
// Required for payment:
- piUser (authenticated user)
- accessToken (from Pi authentication)
- profileId (from Supabase profiles table)
- amount > 0
- PI_CONFIG.SANDBOX_MODE === false
```

## 📊 Payment Flow Diagram

```
User Clicks Subscribe
        ↓
  Validation Checks
  ✓ Pi Browser?
  ✓ Authenticated?
  ✓ Access Token?
  ✓ Profile ID?
  ✓ Amount > 0?
  ✓ Mainnet Mode?
        ↓
createPayment(amount, memo, metadata)
        ↓
window.Pi.createPayment(paymentData, callbacks)
        ↓
Pi Browser Payment Dialog Opens
        ↓
User Confirms Payment
        ↓
  ┌─────────────────────────┐
  │ onReadyForServerApproval│
  │ - Call pi-payment-approve│
  │ - Validate with Pi API   │
  │ - Show "approved" toast  │
  └──────────┬──────────────┘
             ↓
  ┌─────────────────────────┐
  │onReadyForServerCompletion│
  │ - Get transaction ID     │
  │ - Call pi-payment-complete│
  │ - Record in Supabase     │
  │ - Update subscription    │
  │ - Show "success" toast   │
  └──────────┬──────────────┘
             ↓
  ✅ Payment Complete!
  ✅ Subscription Active!
  ✅ User Redirected to Dashboard
```

## 🎯 Testing Checklist

Before deployment:
- [ ] Modal opens and closes smoothly
- [ ] All 4 plans display correctly
- [ ] Yearly/monthly toggle works
- [ ] Prices update when toggling
- [ ] Popular badge shows on Basic
- [ ] Current plan has green ring
- [ ] Mainnet warning displays
- [ ] Loading states work
- [ ] Free plan activates immediately
- [ ] Paid plans open Pi payment dialog
- [ ] Payment approval works
- [ ] Payment completion works
- [ ] Subscription record created
- [ ] User redirected after success
- [ ] Cancel handling works
- [ ] Error messages display
- [ ] Console logs appear
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

## 📝 Files Reference

### Main Files
- `src/components/SubscriptionModal.tsx` - Modal component (323 lines)
- `src/pages/Subscription.tsx` - Subscription page (250 lines)
- `src/contexts/PiContext.tsx` - Pi Network integration (1530 lines)

### Supporting Files
- `src/config/pi-config.ts` - Pi Network configuration
- `src/config/subscription-plans.ts` - Plan definitions
- `supabase/migrations/*_pi_mainnet_complete_integration.sql` - Database schema

## 🔐 Security Notes

### Mainnet Mode
- Always verify `PI_CONFIG.SANDBOX_MODE === false`
- Real Pi coins are charged
- Transactions are irreversible
- Test thoroughly before production

### Access Tokens
- Never expose access tokens in client-side code
- Tokens stored in localStorage (encrypted)
- Validated on server via Edge Functions
- Auto-cleared on sign out

### Payment Validation
- All payments verified with Pi Network API
- Server-side approval required
- Blockchain transaction confirmation
- Database records for audit trail

## 🚀 Deployment

### Before Deploying
1. ✅ Test all payment flows in Pi Browser
2. ✅ Verify database migrations deployed
3. ✅ Verify Edge Functions deployed
4. ✅ Verify Pi API credentials in Supabase secrets
5. ✅ Test free plan activation
6. ✅ Test monthly paid plan
7. ✅ Test yearly paid plan
8. ✅ Test payment cancellation
9. ✅ Test error handling
10. ✅ Verify RLS policies

### Deploy Commands
```bash
# Deploy Supabase migrations
npm run deploy:db

# Deploy Edge Functions
npm run deploy:functions

# Build and deploy frontend
npm run build
npm run deploy
```

## 📞 Support

### Common Questions
**Q: Can I test payments without Pi Browser?**
A: No, Pi SDK only works in official Pi Browser.

**Q: Are test payments available?**
A: No, this is mainnet only. All payments are real Pi coins.

**Q: Can I refund a payment?**
A: Contact Pi Network support for refund requests.

**Q: How do I update plan prices?**
A: Edit `src/components/SubscriptionModal.tsx` plan definitions.

**Q: Can I add more plans?**
A: Yes, add to the `plans` array in SubscriptionModal.tsx.

---

**Status**: ✅ Ready for Testing
**Last Updated**: December 8, 2024
**Version**: 2.0.0
