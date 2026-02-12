# 🔧 Pi Network Mainnet Issues - FIXED

## Issues Identified

### 1. ❌ Payment Expiration Error
**Error**: "Payment Expired! The approval process has timed out."
**Cause**: Edge Function using old/incorrect Pi API Key

### 2. ❌ Database Constraint Error  
**Error**: "duplicate key value violates unique constraint 'profiles_pi_username_key'"
**Cause**: Unique constraint on `pi_username` preventing multiple accounts

### 3. ✅ FIXED: Migration Error
**Was**: "column 'metadata' does not exist"
**Fixed**: Removed references to non-existent metadata column

---

## ✅ Solutions Applied

### 1. Updated Pi Network API Key

**New API Key**: `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`

**Files Updated**:
- ✅ `src/config/pi-config.ts`
- ✅ `.env`

### 2. Fixed Database Constraint

**Created Migration**: `20241208000002_fix_duplicate_pi_username.sql`

**Changes**:
- ✅ Removed simple unique constraint on `pi_username`
- ✅ Added composite unique constraint on `(pi_user_id, pi_username)`
- ✅ Created trigger to prevent duplicates gracefully
- ✅ Cleaned up existing duplicate profiles

---

## 🚀 Deployment Steps

### Step 1: Update Supabase Secrets

Run the update script:

**On Windows**:
```powershell
.\update-pi-secrets.bat
```

**On Mac/Linux**:
```bash
chmod +x update-pi-secrets.sh
./update-pi-secrets.sh
```

**Or manually**:
```bash
npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz

npx supabase secrets set PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

### Step 2: Deploy Database Migration

```bash
npx supabase db push
```

Or use the Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the contents of `supabase/migrations/20241208000002_fix_duplicate_pi_username.sql`
5. Click "Run"

### Step 3: Redeploy Edge Functions

**CRITICAL**: Edge Functions must be redeployed to use the new API key

```bash
# Deploy payment approval function
npx supabase functions deploy pi-payment-approve

# Deploy payment completion function
npx supabase functions deploy pi-payment-complete
```

### Step 4: Rebuild Frontend

```bash
npm run build
```

---

## 🧪 Testing

### Test Payment Flow

1. **Open app in Pi Browser**
2. **Sign in with Pi Network**
3. **Navigate to Subscription page**
4. **Select a paid plan**
5. **Click "Subscribe with Pi"**
6. **Wait for payment dialog** (should appear within 2-3 seconds)
7. **Complete payment**
8. **Verify success message**

### Expected Console Logs

```javascript
[PAYMENT] 🚀 createPayment called with: {...}
[PAYMENT] ⚠️ REAL Pi Network MAINNET Payment
[PAYMENT] Amount: 10 Pi
[PAYMENT] 📦 Payment data prepared: {...}
[PAYMENT] 🎯 Calling window.Pi.createPayment()...
[PAYMENT] ✅ window.Pi.createPayment() invoked successfully
[PAYMENT] 📋 Ready for server approval - Payment ID: xxx
[PAYMENT] ✅ Payment approved by server
[PAYMENT] 🔄 Ready for server completion - Transaction ID: xxx
[PAYMENT] ✅ Payment completed successfully - Transaction: xxx
```

### Check Database

```sql
-- Verify payment was recorded
SELECT * FROM payment_idempotency 
WHERE status = 'completed' 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify subscription was created
SELECT * FROM subscriptions 
WHERE profile_id = 'your_profile_id' 
ORDER BY start_date DESC 
LIMIT 1;

-- Check for duplicate profiles (should return 0)
SELECT pi_username, pi_user_id, COUNT(*) 
FROM profiles 
WHERE pi_username IS NOT NULL 
GROUP BY pi_username, pi_user_id 
HAVING COUNT(*) > 1;
```

---

## 🔍 Troubleshooting

### Issue: Payment still expires

**Check**:
1. Verify Supabase secrets were updated:
   ```bash
   npx supabase secrets list
   ```
   Should show `PI_API_KEY` with value starting with `b00j4fel...`

2. Verify Edge Functions were redeployed:
   - Check deployment timestamp in Supabase Dashboard
   - Functions → pi-payment-approve → Should show recent deployment

3. Check Edge Function logs:
   - Supabase Dashboard → Functions → pi-payment-approve → Logs
   - Look for API key errors

### Issue: Still getting duplicate key error

**Check**:
1. Verify migration was applied:
   ```sql
   SELECT * FROM schema_migrations 
   WHERE version = '20241208000002';
   ```

2. Check constraint exists:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name = 'profiles' 
   AND constraint_name LIKE '%pi%';
   ```
   Should show `profiles_pi_user_composite_key`

3. Manually clean duplicates:
   ```sql
   -- Find duplicates
   SELECT pi_username, COUNT(*) 
   FROM profiles 
   WHERE pi_username IS NOT NULL 
   GROUP BY pi_username 
   HAVING COUNT(*) > 1;
   ```

### Issue: Edge Function returns 500 error

**Solutions**:
1. Check function logs in Supabase Dashboard
2. Verify all environment variables are set
3. Ensure service role key is configured
4. Check API key format (no extra spaces)

---

## 📊 Validation Checklist

Before going live:
- [ ] Supabase secrets updated with new API key
- [ ] Database migration applied successfully
- [ ] Edge Functions redeployed (check timestamps)
- [ ] Frontend rebuilt with new config
- [ ] Test payment completes successfully
- [ ] No duplicate profile errors
- [ ] Console logs show successful payment flow
- [ ] Database records created correctly
- [ ] No timeout errors in Edge Functions

---

## 🎯 What Changed

### API Key Update
```diff
- API_KEY: "96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5"
+ API_KEY: "b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz"
```

### Database Schema
```diff
- UNIQUE CONSTRAINT profiles_pi_username_key (pi_username)
+ UNIQUE INDEX profiles_pi_username_unique_idx (pi_username) WHERE pi_username IS NOT NULL
+ UNIQUE CONSTRAINT profiles_pi_user_composite_key (pi_user_id, pi_username)
+ TRIGGER prevent_duplicate_pi_user BEFORE INSERT
```

---

## 📞 Next Steps

1. **Deploy Now**:
   ```bash
   # Update secrets
   .\update-pi-secrets.bat
   
   # Apply migration
   npx supabase db push
   
   # Redeploy functions
   npx supabase functions deploy pi-payment-approve
   npx supabase functions deploy pi-payment-complete
   
   # Rebuild frontend
   npm run build
   ```

2. **Test Immediately**:
   - Open in Pi Browser
   - Test subscription payment
   - Verify no errors

3. **Monitor**:
   - Watch Edge Function logs
   - Check database for duplicates
   - Monitor payment success rate

---

## ✅ Success Criteria

Payment flow should now:
- ✅ Create payment dialog within 2-3 seconds
- ✅ Approve payment successfully (no timeout)
- ✅ Complete payment with transaction ID
- ✅ Record subscription in database
- ✅ No duplicate profile errors
- ✅ Show success toast notification

---

**Status**: ✅ Ready to Deploy  
**Date**: December 8, 2024  
**Priority**: CRITICAL - Deploy Immediately

## 🚨 IMPORTANT

The payment timeout is caused by the old API key in Supabase secrets. **You MUST**:
1. Update Supabase secrets (run `update-pi-secrets.bat`)
2. Redeploy Edge Functions (they won't use new secrets until redeployed)

Without these steps, payments will continue to timeout!
