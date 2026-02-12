# Complete Payment Fix - Step by Step Guide

## Current Issue
**"Payment Failed - Edge Function returned a non-2xx status code"**

This error appears when:
- ❌ Purchasing subscriptions (Basic, Premium, Pro)
- ❌ Buying gift cards
- ❌ Any Pi Network payment transactions

## Root Cause
The Supabase Edge Functions (`pi-payment-approve` and `pi-payment-complete`) require the `PI_API_KEY` environment variable, but it's **not configured in your Supabase project**.

---

## ✅ SOLUTION - 3 Steps

### Step 1: Set PI_API_KEY in Supabase Dashboard

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to: https://supabase.com/dashboard
2. Select your **DropLink project**
3. Navigate to: **Settings** → **Edge Functions** → **Secrets**
4. Click **"Add new secret"**
5. Enter:
   - **Name:** `PI_API_KEY`
   - **Value:** `6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59`
6. Click **Save**

**Option B: Via Supabase CLI**

```powershell
# Make sure you're in the project directory
cd "c:\Users\SIBIYA GAMING\Downloads\droplink-testnet-35167"

# Set the secret
supabase secrets set PI_API_KEY="6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59"
```

---

### Step 2: Deploy Edge Functions

**Automated (Recommended):**
```powershell
.\deploy-edge-functions.ps1
```

**Manual:**
```powershell
# Deploy payment approval function
supabase functions deploy pi-payment-approve --no-verify-jwt

# Deploy payment completion function
supabase functions deploy pi-payment-complete --no-verify-jwt

# Deploy subscription function (optional, for backend subscriptions)
supabase functions deploy subscription --no-verify-jwt
```

---

### Step 3: Verify Configuration

**Check if secret is set:**
```powershell
supabase secrets list
```

**Expected output:**
```
PI_API_KEY: 6okfd8avd... (hidden)
```

---

## 🧪 Testing

After completing the steps above:

### Test Subscription Purchase:
1. Open app in **Pi Browser**
2. Sign in with Pi Network
3. Go to **Subscription** page
4. Select **Basic** plan (10 Pi monthly)
5. Click **"Subscribe with Pi"**
6. Complete Pi payment flow
7. ✅ Should see: "Successfully subscribed!"

### Test Gift Card Purchase:
1. On Subscription page
2. Click **"Buy Gift Card"** tab
3. Select plan and period
4. Click **"Purchase with Pi"**
5. Complete Pi payment flow
6. ✅ Should see: "Gift card created!"

---

## 🔍 Troubleshooting

### Still getting errors?

#### 1. Check Supabase Logs
```powershell
# Check approval function logs
supabase functions logs pi-payment-approve --limit 50

# Check completion function logs
supabase functions logs pi-payment-complete --limit 50
```

#### 2. Verify Edge Functions are Deployed
```powershell
supabase functions list
```

Should show:
- `pi-payment-approve`
- `pi-payment-complete`

#### 3. Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for error messages with `[PAYMENT]` prefix
4. Common issues:
   - "PI_API_KEY not configured" → Secret not set
   - "Failed to fetch payment" → Wrong API key
   - "Payment cannot be approved" → Payment already processed

#### 4. Test Edge Function Directly

Test if the function is accessible:
```powershell
# Get your Supabase URL and Anon Key from .env file
$SUPABASE_URL = "https://bkwzzqamruwlqwfohgjr.supabase.co"
$SUPABASE_ANON_KEY = "your-anon-key-here"

# Test the function
curl -X POST "$SUPABASE_URL/functions/v1/pi-payment-approve" `
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"paymentId":"test123","metadata":{}}'
```

---

## 📋 Quick Reference

### Your Pi API Key:
```
6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59
```

### Supabase Project URL:
```
https://bkwzzqamruwlqwfohgjr.supabase.co
```

### Edge Functions to Deploy:
- `pi-payment-approve` - Approves payments with Pi Network
- `pi-payment-complete` - Completes and verifies payments
- `subscription` - (Optional) Manages subscriptions

---

## ⚠️ Important Notes

1. **This is MAINNET** - Real Pi coins will be used
2. **Keep API Key Secret** - Never share or commit to public repos
3. **Test Small First** - Try Basic plan (10 Pi) before larger purchases
4. **Pi Browser Required** - Payments only work in official Pi Browser
5. **Mainnet Network** - Ensure Pi app is on mainnet (production)

---

## 🎯 What We Fixed

### Code Improvements:
1. ✅ Better error messages in edge functions
2. ✅ Enhanced logging for debugging
3. ✅ Status code 500 for server errors (instead of 400)
4. ✅ Detailed error descriptions

### Files Modified:
- `supabase/functions/pi-payment-approve/index.ts`
- `supabase/functions/pi-payment-complete/index.ts`
- `src/services/realPiPaymentService.ts`

### Scripts Created:
- `deploy-edge-functions.ps1` - Automated deployment
- `PAYMENT_ERROR_FIX.md` - Payment error guide
- `FOLLOW_ERROR_FIX.md` - Follow feature guide
- `fix-followers-rls-policy.sql` - Database policy fix
- `COMPLETE_PAYMENT_SETUP.md` - This guide

---

## 🆘 Still Need Help?

If you're still experiencing issues after following all steps:

1. **Check all secrets are set:**
   ```powershell
   supabase secrets list
   ```

2. **Verify you're linked to correct project:**
   ```powershell
   supabase projects list
   supabase link
   ```

3. **Re-deploy with verbose output:**
   ```powershell
   supabase functions deploy pi-payment-approve --no-verify-jwt --debug
   ```

4. **Check browser console** for detailed error messages

5. **View real-time logs** while testing:
   ```powershell
   supabase functions logs pi-payment-approve --follow
   ```

---

## ✅ Success Checklist

Before testing payments, ensure:

- [ ] PI_API_KEY secret is set in Supabase
- [ ] Edge functions are deployed
- [ ] Secrets list shows PI_API_KEY
- [ ] Using Pi Browser (not Chrome/Safari)
- [ ] Signed in with Pi Network
- [ ] Have sufficient Pi balance
- [ ] On mainnet network

Once all checked, payments should work! 🎉
