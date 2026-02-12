# Payment Error Fix Guide

## Issue
"Payment failed - Edge Function returned a non-2xx status code"

## Root Cause
The Supabase Edge Functions (`pi-payment-approve` and `pi-payment-complete`) require the `PI_API_KEY` environment variable to be configured, but it's not set in the Supabase project.

## Solution

### 1. Set PI_API_KEY in Supabase Dashboard

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - Name: `PI_API_KEY`
   - Value: `6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59`
5. Click **Save**

**Option B: Via Supabase CLI**
```powershell
# From project root
supabase secrets set PI_API_KEY="6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59"
```

### 2. Deploy Edge Functions

Run the deployment script:
```powershell
.\deploy-edge-functions.ps1
```

Or manually deploy each function:
```powershell
supabase functions deploy pi-payment-approve --no-verify-jwt
supabase functions deploy pi-payment-complete --no-verify-jwt
supabase functions deploy subscription --no-verify-jwt
```

### 3. Verify Configuration

Check if the secret is set:
```powershell
supabase secrets list
```

### 4. Test Payment Flow

1. Open the app in Pi Browser
2. Navigate to Subscription page
3. Try to purchase a Basic or Premium plan
4. The payment should now work without errors

## What Was Fixed

### 1. **Error Handling Improvements**
   - Edge functions now return status 500 (instead of 400) for server errors
   - Added detailed error messages and troubleshooting hints
   - Added stack traces for better debugging

### 2. **Payment Service Error Messages**
   - Better error propagation from edge functions
   - Detailed error descriptions for users
   - Enhanced logging for troubleshooting

### 3. **Deployment Script**
   - Created `deploy-edge-functions.ps1` for easy deployment
   - Automatically loads PI_API_KEY from .env
   - Sets secrets in Supabase before deployment

## Files Modified

1. `supabase/functions/pi-payment-approve/index.ts` - Better error handling
2. `supabase/functions/pi-payment-complete/index.ts` - Better error handling
3. `src/services/realPiPaymentService.ts` - Enhanced error messages
4. `deploy-edge-functions.ps1` - New deployment script (created)

## Troubleshooting

### Still getting errors?

1. **Check Supabase logs:**
   ```powershell
   supabase functions logs pi-payment-approve
   supabase functions logs pi-payment-complete
   ```

2. **Verify environment:**
   - Ensure you're using Pi Browser
   - Check that Pi Network is on mainnet
   - Verify you have sufficient Pi balance

3. **Check console errors:**
   - Open browser DevTools (F12)
   - Look for detailed error messages in Console tab
   - Check Network tab for failed requests

## Notes

- The PI_API_KEY is for your DropLink Pi app on mainnet
- This is a **real mainnet key** - payments will use actual Pi coins
- Keep your API key secure and never commit it to public repositories
- Edge functions need to be redeployed after setting secrets
