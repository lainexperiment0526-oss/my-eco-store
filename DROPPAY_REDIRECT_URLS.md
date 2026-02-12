# DropPay Redirect URLs Configuration

## Success URLs (Configure these in DropPay)

### Basic Plan - Monthly
```
https://droplink.space/payment-success?plan=basic&period=monthly&amount=10
```

### Basic Plan - Yearly  
```
https://droplink.space/payment-success?plan=basic&period=yearly&amount=96
```

### Premium Plan - Monthly
```
https://droplink.space/payment-success?plan=premium&period=monthly&amount=20
```

### Premium Plan - Yearly
```
https://droplink.space/payment-success?plan=premium&period=yearly&amount=192
```

### Pro Plan - Monthly
```
https://droplink.space/payment-success?plan=pro&period=monthly&amount=30
```

### Pro Plan - Yearly
```
https://droplink.space/payment-success?plan=pro&period=yearly&amount=288
```

## Cancel URLs (Configure these in DropPay)

### Basic Plan - Monthly
```
https://droplink.space/payment-cancel?plan=basic&period=monthly&amount=10
```

### Basic Plan - Yearly
```
https://droplink.space/payment-cancel?plan=basic&period=yearly&amount=96
```

### Premium Plan - Monthly
```
https://droplink.space/payment-cancel?plan=premium&period=monthly&amount=20
```

### Premium Plan - Yearly
```
https://droplink.space/payment-cancel?plan=premium&period=yearly&amount=192
```

### Pro Plan - Monthly
```
https://droplink.space/payment-cancel?plan=pro&period=monthly&amount=30
```

### Pro Plan - Yearly
```
https://droplink.space/payment-cancel?plan=pro&period=yearly&amount=288
```

## How to Configure in DropPay

1. **Payment Creation**: When creating payment in DropPay, include these redirect URLs
2. **Success Flow**: After successful payment, DropPay redirects to success URL
3. **Cancel Flow**: If payment cancelled/failed, DropPay redirects to cancel URL
4. **Auto-Activation**: Success page automatically activates subscription in DropLink

## Workflow Steps

1. **User clicks "Subscribe with DropPay"** → DropLink creates payment
2. **Redirect to DropPay** → User completes payment on DropPay
3. **Payment Success** → DropPay redirects to: `payment-success?plan=X&period=Y&amount=Z`
4. **Auto-Activation** → DropLink success page activates subscription
5. **User Dashboard** → User returns to DropLink with active subscription

## Alternative: Webhook Method

You can also use the existing webhook endpoint:
```
POST https://droplink.space/api/droppay-webhook
```

Webhook payload should include:
```json
{
  "status": "completed",
  "payment_id": "pay_xxx",
  "amount": 10,
  "metadata": {
    "profile_id": "user_profile_id",
    "plan": "basic",
    "period": "monthly"
  }
}
```

## Test URLs (Replace droplink.space with your domain if different)

For testing, you can manually visit these URLs to test the activation flow:
- Success: `http://localhost:3000/payment-success?plan=premium&period=monthly&amount=20`
- Cancel: `http://localhost:3000/payment-cancel?plan=premium&period=monthly&amount=20`