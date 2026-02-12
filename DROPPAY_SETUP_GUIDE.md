# 🔧 How to Fix DropPay Integration - Setup Guide

## ✅ Since DropPay is YOUR App

You need to configure your DropPay application at `https://droppay-v2.lovable.app` to properly handle payment creation requests from DropLink.

## 🎯 What Your DropPay App Must Do

### 1. **API Endpoint: POST /api/v1/payments**

Your DropPay app needs to have this endpoint that accepts:

**Request from DropLink:**
```json
POST https://droppay-v2.lovable.app/api/v1/payments
Headers:
  Authorization: Key dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV
  Content-Type: application/json

Body:
{
  "amount": 10,
  "currency": "PI",
  "description": "Basic Monthly Subscription",
  "metadata": {
    "profile_id": "uuid-here",
    "plan": "basic",
    "period": "monthly",
    "payment_type": "subscription"
  }
}
```

### 2. **Required Response Format**

Your DropPay app MUST return this format:

```json
{
  "checkout_url": "https://droppay-v2.lovable.app/checkout/PAYMENT_ID_HERE",
  "payment_id": "pay_123456789",
  "status": "pending",
  "amount": 10,
  "currency": "PI",
  "description": "Basic Monthly Subscription",
  "metadata": {
    "profile_id": "uuid-here",
    "plan": "basic",
    "period": "monthly",
    "payment_type": "subscription"
  }
}
```

**CRITICAL:** The response MUST include `checkout_url` field!

### 3. **Alternative Response Formats (Also Supported)**

If you can't use `checkout_url`, any of these will work:

```json
{
  "url": "https://droppay-v2.lovable.app/checkout/xxx"
}

// OR

{
  "payment_url": "https://droppay-v2.lovable.app/checkout/xxx"
}

// OR

{
  "payment": {
    "checkout_url": "https://droppay-v2.lovable.app/checkout/xxx"
  }
}

// OR

{
  "redirect_url": "https://droppay-v2.lovable.app/checkout/xxx"
}

// OR

{
  "checkoutUrl": "https://droppay-v2.lovable.app/checkout/xxx"
}
```

## 📋 Step-by-Step Setup in Your DropPay App

### Step 1: Create Payment Endpoint

In your DropPay app, create the API route:

**File: `api/v1/payments/index.ts` (or equivalent)**

```typescript
export default async function handler(req, res) {
  // Verify API key
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Key ', '');
  
  if (apiKey !== 'dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV') {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Get payment data
  const { amount, currency, description, metadata } = req.body;
  
  // Generate unique payment ID
  const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Store payment in your database
  // await savePayment({ paymentId, amount, currency, description, metadata, status: 'pending' });
  
  // IMPORTANT: Return checkout URL
  const checkoutUrl = `https://droppay-v2.lovable.app/checkout/${paymentId}`;
  
  return res.status(200).json({
    checkout_url: checkoutUrl,  // THIS IS REQUIRED!
    payment_id: paymentId,
    status: 'pending',
    amount: amount,
    currency: currency,
    description: description,
    metadata: metadata,
    created_at: new Date().toISOString()
  });
}
```

### Step 2: Create Checkout Page

Create the checkout page that users will be redirected to:

**File: `pages/checkout/[paymentId].tsx`**

```typescript
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const router = useRouter();
  const { paymentId } = router.query;
  const [payment, setPayment] = useState(null);
  
  useEffect(() => {
    // Load payment details
    async function loadPayment() {
      const res = await fetch(`/api/v1/payments/${paymentId}`);
      const data = await res.json();
      setPayment(data);
    }
    
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);
  
  const handlePayWithPi = async () => {
    // Use Pi SDK to process payment
    if (window.Pi) {
      const piPayment = await window.Pi.createPayment({
        amount: payment.amount,
        memo: payment.description,
        metadata: {
          ...payment.metadata,
          droppay_payment_id: paymentId
        }
      }, {
        onReadyForServerApproval: (paymentId) => {
          // Call your backend to approve
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          // Payment completed! Send webhook to DropLink
          fetch('https://droplink.space/api/droppay-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
              payment_id: payment.payment_id,
              txid: txid,
              amount: payment.amount,
              metadata: payment.metadata
            })
          });
          
          // Redirect user back
          window.location.href = 'https://droplink.space/subscription?payment=success';
        },
        onCancel: () => {
          alert('Payment cancelled');
        },
        onError: (error) => {
          alert('Payment error: ' + error.message);
        }
      });
    }
  };
  
  return (
    <div className="checkout-page">
      <h1>Complete Payment</h1>
      {payment && (
        <div>
          <p>Amount: {payment.amount} {payment.currency}</p>
          <p>Description: {payment.description}</p>
          <button onClick={handlePayWithPi}>Pay with Pi Network</button>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Configure Webhook

When payment completes in your DropPay app, send webhook to DropLink:

```typescript
// After Pi payment completes
const webhookUrl = 'https://droplink.space/api/droppay-webhook';
const webhookSecret = '1fe71a2bdac8f873d288fcbd712d0b16d23c977293064d2a2e3a079b177bb182';

// Create signature (optional but recommended)
const crypto = require('crypto');
const payload = JSON.stringify({
  status: 'completed',
  payment_id: paymentId,
  txid: piTransactionId,
  amount: paymentAmount,
  metadata: paymentMetadata
});

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

// Send webhook
await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Droppay-Signature': signature
  },
  body: payload
});
```

## 🚀 Quick Fix - Minimal Implementation

If you want the quickest fix, just add this to your DropPay app:

**File: `api/v1/payments.ts`**

```typescript
export default async function handler(req, res) {
  const { amount, currency, description, metadata } = req.body;
  const paymentId = 'pay_' + Date.now();
  
  // IMPORTANT: Return this exact format
  return res.json({
    checkout_url: `https://droppay-v2.lovable.app/checkout/${paymentId}`,
    payment_id: paymentId,
    status: 'pending',
    amount,
    currency,
    metadata
  });
}
```

## ✅ Testing Your DropPay App

### Test the Endpoint Manually:

```bash
curl -X POST https://droppay-v2.lovable.app/api/v1/payments \
  -H "Authorization: Key dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "currency": "PI",
    "description": "Test Payment",
    "metadata": {
      "test": true
    }
  }'
```

**Expected Response:**
```json
{
  "checkout_url": "https://droppay-v2.lovable.app/checkout/pay_xxx",
  "payment_id": "pay_xxx",
  "status": "pending"
}
```

## 📝 Checklist for Your DropPay App

- [ ] Create endpoint: `POST /api/v1/payments`
- [ ] Verify API key: `dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV`
- [ ] Return response with `checkout_url` field
- [ ] Create checkout page at `/checkout/[paymentId]`
- [ ] Integrate Pi Network SDK on checkout page
- [ ] Send webhook to DropLink when payment completes
- [ ] Test endpoint returns valid checkout URL
- [ ] Ensure DropPay app is deployed and running

## 🎯 Environment Variables Needed

In your DropPay app, set these:

```bash
# DropPay App (.env)
DROPPAY_API_KEY="dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV"
DROPPAY_WEBHOOK_SECRET="1fe71a2bdac8f873d288fcbd712d0b16d23c977293064d2a2e3a079b177bb182"
DROPLINK_WEBHOOK_URL="https://droplink.space/api/droppay-webhook"

# Pi Network (for checkout page)
VITE_PI_API_KEY="your-pi-api-key"
```

## 🔄 Complete Flow

```
1. User clicks "Subscribe with DropPay" on DropLink
   ↓
2. DropLink calls: POST https://droppay-v2.lovable.app/api/v1/payments
   ↓
3. Your DropPay app returns: { "checkout_url": "https://droppay-v2.lovable.app/checkout/xxx" }
   ↓
4. User redirected to your DropPay checkout page
   ↓
5. User completes payment with Pi Network on your checkout page
   ↓
6. Your DropPay app sends webhook to DropLink
   ↓
7. DropLink activates subscription
   ↓
8. User redirected back to DropLink with success message
```

## ⚠️ Important Notes

1. **Your DropPay app must be deployed and running** - Check that it's live at `https://droppay-v2.lovable.app`

2. **The API endpoint must respond quickly** - Timeout is usually 30 seconds

3. **Lovable.app projects can go to sleep** - If your DropPay app hasn't been accessed recently, it might take 10-20 seconds to wake up

4. **Make sure the checkout URL is accessible** - Test by visiting it in your browser

## 🆘 Still Not Working?

Check these common issues:

1. **Is your DropPay app running?** Visit `https://droppay-v2.lovable.app` - does it load?

2. **Is the API route configured?** Try accessing the endpoint directly

3. **Are you returning the correct format?** Check the response includes `checkout_url`

4. **Check Lovable.app logs** - Look for errors in your DropPay app console

Need help? Check the exact error in browser console (F12) when clicking "Subscribe with DropPay"
