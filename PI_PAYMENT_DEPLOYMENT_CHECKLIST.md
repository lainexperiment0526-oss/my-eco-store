# Pi Payment Deployment Checklist

## Pre-Deployment Verification

### Frontend Configuration
- [x] API Key in `src/config/pi-config.ts`: `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`
- [x] Validation Key: `7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a`
- [x] Network set to: `mainnet`
- [x] SANDBOX_MODE: `false`
- [x] `.env` file has `VITE_PI_API_KEY`
- [x] Payment timeout handling added (45s)
- [x] Callback deduplication implemented

### Backend Configuration (Supabase)
- [ ] **CRITICAL**: Set PI_API_KEY in Supabase secrets
- [ ] Deploy `pi-payment-approve` function
- [ ] Deploy `pi-payment-complete` function
- [ ] Verify database tables exist:
  - [ ] `payment_idempotency`
  - [ ] `subscriptions`
- [ ] Test database connectivity

### Database Schema Verification

Run this query in Supabase SQL Editor:

```sql
-- Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_idempotency', 'subscriptions');

-- Check subscriptions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';

-- Check payment_idempotency table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_idempotency';
```

Expected output:
- ✅ Both tables exist
- ✅ `subscriptions` has columns: profile_id, plan_type, billing_period, pi_amount, start_date, end_date, status, auto_renew
- ✅ `payment_idempotency` has columns: payment_id, profile_id, amount, status, txid, metadata, completed_at

---

## Deployment Steps

### Step 1: Set Supabase Secrets (REQUIRED)

**Method A: Using Supabase CLI**
```powershell
# Navigate to project directory
cd "c:\Users\SIBIYA GAMING\droplink-testnet-35167-4"

# Login to Supabase (if not already)
supabase login

# Link to your project (if not already)
supabase link --project-ref <your-project-ref>

# Set the API key secret
supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz

# Verify secret was set
supabase secrets list
```

**Method B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/<your-project>
2. Click **Settings** → **Edge Functions** → **Secrets**
3. Click **Create New Secret**
4. Name: `PI_API_KEY`
5. Value: `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`
6. Click **Save**

### Step 2: Deploy Edge Functions

```powershell
# Deploy payment approval function
supabase functions deploy pi-payment-approve

# Deploy payment completion function
supabase functions deploy pi-payment-complete

# Verify deployment
supabase functions list
```

Expected output:
```
NAME                    STATUS    VERSION    CREATED
pi-payment-approve      ACTIVE    1          2025-12-10
pi-payment-complete     ACTIVE    1          2025-12-10
```

### Step 3: Test Payment Flow (Local Testing)

**Test 1: Verify API Key is Available**
```bash
# Test that edge function has access to PI_API_KEY
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/pi-payment-approve \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"test123","metadata":{}}'
```

Expected: Should NOT return "PI_API_KEY not configured"

**Test 2: End-to-End Payment Test**

1. Open your app in Pi Browser
2. Navigate to `/subscription`
3. Select **Premium Monthly** (15π)
4. Click "Create Payment Link"
5. Approve payment in Pi wallet
6. Wait for completion (~20-40 seconds total)
7. Verify success message

**Test 3: Check Database Records**

```sql
-- Check latest payment
SELECT * FROM payment_idempotency 
ORDER BY created_at DESC 
LIMIT 1;

-- Check latest subscription
SELECT * FROM subscriptions 
ORDER BY start_date DESC 
LIMIT 1;
```

Expected:
- ✅ payment_idempotency status = 'completed'
- ✅ subscriptions status = 'active'
- ✅ subscription end_date is 1 month from start_date

### Step 4: Monitor Logs

**Check Edge Function Logs:**

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **pi-payment-approve**
4. View **Logs** tab
5. Look for:
   - `[APPROVAL] 🔄 Payment approval started`
   - `[APPROVAL SUCCESS] ✅`

6. Click **pi-payment-complete**
7. View **Logs** tab
8. Look for:
   - `[COMPLETE] 🔄 Payment completion started`
   - `[SUBSCRIPTION] ✅ CREATED/UPDATED`
   - `[COMPLETE] ✅ SUCCESS`

**Check Browser Console:**
```
[PAYMENT] ⚠️ REAL Pi Network MAINNET Payment
[PAYMENT] Amount: 15 Pi
[PAYMENT] 🎯 Calling Pi.createPayment()...
[PAYMENT] ✅ Pi.createPayment() invoked successfully
[PAYMENT] 📋 onReadyForServerApproval - Payment ID: ...
[PAYMENT] ✅ Payment approved by server
[PAYMENT] 🔄 onReadyForServerCompletion
[PAYMENT] ✅ Payment completed successfully - TXID: ...
```

---

## Post-Deployment Testing

### Test Case 1: Premium Monthly Subscription
- User: Test Pi user
- Plan: Premium
- Billing: Monthly
- Amount: 15π
- Expected: Subscription created, expires in 1 month

### Test Case 2: Basic Yearly Subscription
- User: Test Pi user
- Plan: Basic
- Billing: Yearly (20% discount)
- Amount: 48π
- Expected: Subscription created, expires in 1 year

### Test Case 3: Payment Timeout Recovery
- User: Test Pi user
- Scenario: Delay payment approval in Pi wallet for 50+ seconds
- Expected: Should get timeout warning but not hang forever

### Test Case 4: Duplicate Payment Prevention
- User: Test Pi user
- Scenario: Try to pay for same plan twice quickly
- Expected: Second payment should be blocked by idempotency check

### Test Case 5: Subscription Upgrade
- User: Test Pi user with Basic subscription
- Scenario: Purchase Premium subscription
- Expected: Subscription should be updated (upsert) to Premium

---

## Rollback Plan

If issues occur during deployment:

### Rollback Step 1: Verify API Key
```bash
# Check if API key is set
supabase secrets list | grep PI_API_KEY
```

### Rollback Step 2: Redeploy Functions
```bash
# Redeploy with previous version
supabase functions deploy pi-payment-approve --legacy-bundle
supabase functions deploy pi-payment-complete --legacy-bundle
```

### Rollback Step 3: Check Database State
```sql
-- Check for incomplete payments
SELECT * FROM payment_idempotency 
WHERE status != 'completed' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Manually complete if needed
UPDATE payment_idempotency 
SET status = 'failed', 
    metadata = jsonb_set(metadata, '{rollback}', 'true')
WHERE payment_id = '<payment-id>';
```

---

## Known Issues & Solutions

### Issue: "Cannot read property 'createPayment' of undefined"
**Cause**: Pi SDK not loaded
**Solution**: Only test in Pi Browser or with Pi SDK mock

### Issue: "Payment expired after 60 seconds"
**Cause**: Backend approval took too long
**Solution**: ✅ Already fixed with timeout optimizations

### Issue: "Subscription not created but payment completed"
**Cause**: Metadata not passed correctly
**Solution**: ✅ Already fixed with improved metadata handling

### Issue: "Multiple subscription records for same user"
**Cause**: Concurrent payment completions
**Solution**: ✅ Already prevented with `onConflict: 'profile_id'`

---

## Performance Benchmarks

Expected timings for payment flow:

| Stage | Target Time | Max Time |
|-------|-------------|----------|
| Payment initiation | < 1s | 2s |
| User approval in wallet | 10-30s | Variable |
| Server approval callback | 5-15s | 30s |
| Server completion callback | 5-15s | 30s |
| **Total end-to-end** | **20-60s** | **90s max** |

If timings exceed these, check:
- Supabase function cold start latency
- Network connectivity issues
- Pi API response times
- Database query performance

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Payment Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'completed') as completed,
     COUNT(*) FILTER (WHERE status = 'failed') as failed,
     COUNT(*) FILTER (WHERE status = 'pending') as pending
   FROM payment_idempotency
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Average Payment Time**
   ```sql
   SELECT 
     AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
   FROM payment_idempotency
   WHERE status = 'completed'
   AND created_at > NOW() - INTERVAL '24 hours';
   ```

3. **Subscription Creation Rate**
   ```sql
   SELECT COUNT(*) as new_subscriptions
   FROM subscriptions
   WHERE start_date > NOW() - INTERVAL '24 hours';
   ```

### Set Up Alerts

Configure alerts for:
- Payment failure rate > 10%
- Average payment time > 60 seconds
- Pending payments older than 5 minutes
- Completed payments without subscription record

---

## Production Readiness Checklist

- [ ] PI_API_KEY set in Supabase secrets
- [ ] Edge functions deployed successfully
- [ ] Database tables verified
- [ ] Test payment completed successfully
- [ ] Subscription created in database
- [ ] Logs show successful flow
- [ ] Frontend shows updated subscription status
- [ ] User can access premium features
- [ ] Timeout handling tested
- [ ] Error recovery tested
- [ ] Documentation reviewed
- [ ] Team trained on troubleshooting

---

## Support Contacts

- **Pi Network Developer Support**: https://pi.app/developers
- **Supabase Support**: https://supabase.com/support
- **Pi Community Forum**: https://chat.pi-blockchain.com/

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Sign-off**: _________________

**Status**: ⚠️ **AWAITING SUPABASE API KEY SETUP** ⚠️
