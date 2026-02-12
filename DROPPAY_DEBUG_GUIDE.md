# DropPay Debugging Guide

## Issue: "Missing checkout URL from DropPay response"

This error occurs when the DropPay API doesn't return a valid checkout URL in the expected format.

## What Was Fixed

### 1. Enhanced Logging ✅
Added comprehensive logging to track the entire payment flow:

**API Endpoint (`api/droppay-create.ts`):**
- Logs request body
- Logs DropPay API configuration
- Logs full API response
- Logs all attempts to extract checkout URL
- Returns error with debug info if no checkout URL found

**Frontend (`src/pages/Subscription.tsx`):**
- Logs payment creation data
- Logs full API response
- Logs all attempts to extract checkout URL
- Shows detailed error messages to user

### 2. Expanded URL Detection ✅
Now checks for checkout URL in multiple possible locations:
- `checkout_url`
- `url`
- `payment_url`
- `payment.checkout_url`
- `checkoutUrl`
- `payment.url`
- `payment.payment_url`
- `redirect_url`
- `links.checkout`

### 3. Better Error Messages ✅
- User sees clear error with instructions
- Console shows complete response structure
- API returns debug information

## How to Debug

### Step 1: Open Browser Console (F12)
Look for messages starting with `[SUBSCRIPTION]` and `[DROPPAY_CREATE]`

### Step 2: Check Vercel Logs
```bash
vercel logs your-deployment-url --follow
```
Look for `[DROPPAY_CREATE]` messages

### Step 3: Verify DropPay API Response
The logs will show:
```
[DROPPAY_CREATE] Response text: {...}
[DROPPAY_CREATE] Parsed response: {...}
[DROPPAY_CREATE] Extracted checkout URL: ...
```

### Step 4: Check Response Structure
If no URL is found, you'll see:
```
[DROPPAY_CREATE] Response keys: [array of keys]
[DROPPAY_CREATE] Payment object keys: [array of keys]
```

## Common Causes

### 1. DropPay API is Down
**Symptoms:** API returns error or timeout
**Solution:** Wait for DropPay service to recover, or contact DropPay support

### 2. API Key is Invalid
**Symptoms:** 401 or 403 error
**Solution:** Verify `DROPPAY_API_KEY` in Vercel environment variables

### 3. API Response Format Changed
**Symptoms:** Response is successful but no checkout URL
**Solution:** Check the logs to see the actual response structure and update code accordingly

### 4. Network Issues
**Symptoms:** Timeout or connection errors
**Solution:** Check internet connection and firewall settings

## Testing Checklist

### Before Testing
- [ ] Verify `VITE_DROPPAY_API_KEY` is set in `.env`
- [ ] Verify Vercel environment variables are set:
  - `DROPPAY_API_KEY`
  - `DROPPAY_BASE_URL`
  - `DROPPAY_AUTH_SCHEME`
- [ ] Deploy latest changes to Vercel
- [ ] Clear browser cache

### During Testing
1. Open browser console (F12) → Console tab
2. Go to subscription page
3. Click "Subscribe with DropPay"
4. Watch console for logs
5. If error occurs, copy all `[SUBSCRIPTION]` and `[DROPPAY_CREATE]` logs

### Expected Behavior
```
[SUBSCRIPTION] Starting DropPay subscription: {planName: "Basic", price: 10, isYearly: false}
[SUBSCRIPTION] Creating DropPay payment with data: {...}
[SUBSCRIPTION] DropPay API response: {success: true, payment: {...}}
[SUBSCRIPTION] Full payment object: {...}
[SUBSCRIPTION] Payment keys: ["id", "checkout_url", ...]
[SUBSCRIPTION] Extracted checkout URL: https://...
[SUBSCRIPTION] Redirecting to: https://...
```

## If Issue Persists

### Check DropPay API Directly
Test the API endpoint manually:

```bash
curl -X POST https://droppay-v2.lovable.app/api/v1/payments \
  -H "Authorization: Key dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "currency": "PI",
    "description": "Test Payment",
    "metadata": {
      "test": "true"
    }
  }'
```

Expected response should include a checkout URL field.

### Alternative: Use Pi Network Payment Instead
If DropPay continues to have issues, users can use the "Subscribe with Pi" button which uses the Pi Network SDK directly.

## Contact Information

### DropPay Support
- Check DropPay documentation: https://droppay-v2.lovable.app/
- Contact DropPay support team
- Verify API status

### Development Support
- Check Vercel deployment logs
- Review browser console logs
- Test with different plans/amounts
- Try both monthly and yearly subscriptions

## Quick Fix: Temporarily Disable DropPay

If DropPay is unavailable, you can temporarily hide the button by commenting out in `.env`:

```bash
# VITE_DROPPAY_API_KEY="dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV"
```

This will hide the "Subscribe with DropPay" button until the issue is resolved.

## Updated Files

1. ✅ `api/droppay-create.ts` - Enhanced logging and error handling
2. ✅ `src/pages/Subscription.tsx` - Better error messages and debugging
3. ✅ `DROPPAY_SUBSCRIPTION_FIX.md` - Original fix documentation
4. ✅ `DROPPAY_DEBUG_GUIDE.md` - This debugging guide

## Status

🔍 **Debugging tools deployed** - The system now provides comprehensive logging to identify the exact cause of the missing checkout URL issue.

📊 **Next Steps:**
1. Test the subscription flow
2. Check browser console for detailed logs
3. Check Vercel logs for API response
4. Share the logs if issue persists
