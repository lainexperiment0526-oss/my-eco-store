# Pi Network Production Setup Guide

## API Key Configuration

### Mainnet API Key
```
96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5
```

### Validation Key (for webhook validation if needed)
```
7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## Supabase Edge Functions Environment Variables

Set the following environment variable in your Supabase project:

### For Payment Functions (pi-payment-approve, pi-payment-complete)

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add environment variable:
   - **Key**: `PI_API_KEY`
   - **Value**: `96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5`

### Setting via Supabase CLI (Alternative)

```bash
supabase secrets set PI_API_KEY=96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5
```

## Pi Network Integration Status

### ✅ Pi Authentication
- SDK loaded from: `https://sdk.minepi.com/pi-sdk.js`
- Initialization: `Pi.init({ version: "2.0" })` (Production mode)
- Scopes: `["username", "payments"]`
- Backend verification: `/v2/me` endpoint

### ✅ Pi Payments
- Payment approval: `/v2/payments/{paymentId}/approve`
- Payment completion: `/v2/payments/{paymentId}/complete`
- Payment validation: `/v2/payments/{paymentId}`
- API Key format: `Key ${PI_API_KEY}`

### ✅ Pi Ad Network
- Rewarded ads: `Pi.Ads.requestAd("rewarded")` → `Pi.Ads.showAd("rewarded")`
- Interstitial ads: `Pi.Ads.requestAd("interstitial")` → `Pi.Ads.showAd("interstitial")`
- Ad ready check: `Pi.Ads.isAdReady(adType)`

## Production Checklist

- [x] Pi SDK loaded in HTML
- [x] SDK initialized with production settings (no sandbox)
- [x] API key configured in edge functions
- [x] Payment approval endpoint secured with JWT
- [x] Payment completion endpoint secured with JWT
- [x] Idempotency protection implemented
- [x] Payment validation with Pi API
- [x] Ad network integration with error handling

## Testing

### Test Authentication
1. Open app in Pi Browser
2. Click "Sign in with Pi Network"
3. Verify backend sync completes

### Test Payments
1. Navigate to subscription page
2. Select a plan
3. Complete payment flow
4. Verify payment is processed

### Test Ads
1. As free user, try to access premium feature
2. Watch rewarded ad
3. Verify access is granted

## Documentation Links

- Pi Network Developer Guide: https://pi-apps.github.io/community-developer-guide/
- Pi Platform Docs: https://github.com/pi-apps/pi-platform-docs
- Pi Ad Network: https://minepi.com/blog/ad-network-expansion/

