# Payment Metadata Fix - Deployment Guide

## Pre-Deployment Checklist

### Code Review
- [x] Changes reviewed in 3 files
- [x] No breaking changes introduced
- [x] Backward compatible implementation
- [x] Enhanced logging added for debugging

### Files Modified
1. `src/contexts/PiContext.tsx` - Client-side payment metadata transmission
2. `supabase/functions/pi-payment-approve/index.ts` - Metadata acceptance and storage
3. `supabase/functions/pi-payment-complete/index.ts` - Metadata extraction and subscription creation

### Testing Environment
- [ ] Development: Ready for testing
- [ ] Staging: Ready for deployment  
- [ ] Production: Ready after staging validation

---

## Deployment Steps

### Step 1: Deploy Backend Functions (Supabase)

**Timing**: Deploy functions first to ensure they're ready before clients start sending metadata

```bash
# Deploy pi-payment-approve function
supabase functions deploy pi-payment-approve

# Deploy pi-payment-complete function
supabase functions deploy pi-payment-complete
```

**Verification**:
```bash
# Check function status
supabase functions list

# Should show both functions as deployed
```

**Expected Output**:
```
π supabase functions list
  Name                    Status    Created At
  pi-payment-approve      Active    2025-12-08T...
  pi-payment-complete     Active    2025-12-08T...
```

### Step 2: Deploy Frontend Code

**Timing**: Deploy after backend functions are confirmed active

```bash
# Build the project
npm run build
# or
bun run build

# Deploy to your hosting
npm run deploy
# or use your CI/CD pipeline
```

**Verification**:
- Check that the deployed site loads
- Verify no console errors on page load

### Step 3: Smoke Testing

**Duration**: ~10 minutes per test

#### Test 1: Browser Console Logs
1. Open Subscription page in Pi Browser
2. Click "Subscribe" button
3. Complete payment in Pi Wallet
4. **Expected logs in console**:
   ```
   [PAYMENT] 📋 Ready for server approval
   [PAYMENT] 📦 Sending client metadata to approval
   [APPROVAL] Client metadata received
   [PAYMENT] ✅ Payment approved by server
   [PAYMENT] 🔄 Ready for server completion
   [PAYMENT] 📦 Sending metadata to completion
   [COMPLETE] Retrieved metadata
   [SUBSCRIPTION CREATE] 🎯 Creating subscription
   [SUBSCRIPTION CREATED] user-uuid pro
   [PAYMENT] ✅ Payment completed successfully
   ```

#### Test 2: Database Verification
After payment completes, run:

```sql
-- Check payment_idempotency table
SELECT 
  payment_id,
  profile_id,
  status,
  metadata->>'clientMetadata' as client_metadata
FROM payment_idempotency
ORDER BY created_at DESC
LIMIT 1;

-- Check subscriptions table
SELECT 
  profile_id,
  plan_type,
  billing_period,
  status,
  start_date,
  end_date
FROM subscriptions
WHERE profile_id = 'TEST_USER_UUID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results**:
- payment_idempotency: status = 'completed', clientMetadata populated
- subscriptions: New row with correct plan_type and status = 'active'

#### Test 3: Feature Access
1. Complete payment as test user
2. Verify user is redirected to dashboard/features page
3. Check that premium features are visible and accessible
4. Verify locked features are now unlocked

---

## Rollback Plan (if needed)

### Quick Rollback Steps

```bash
# 1. Revert backend functions to previous version
supabase functions deploy pi-payment-approve --code-dir ../backup/pi-payment-approve
supabase functions deploy pi-payment-complete --code-dir ../backup/pi-payment-complete

# 2. Redeploy previous frontend code
npm run deploy:previous-version

# 3. Clear function cache
# Contact Supabase support or wait for cache refresh
```

### Verification After Rollback
- Test payment flow works with previous code
- Verify no metadata transmission in console logs
- Confirm subscriptions still create (with fallback logic)

### Root Cause Analysis (if rollback needed)
1. Check Supabase function logs for errors
2. Review database error logs
3. Check for API key or environment variable issues
4. Verify Pi Network API connectivity

---

## Monitoring Post-Deployment

### Key Metrics to Monitor

#### Success Rate
- Payments completed / Payments initiated
- Target: > 95% completion rate

#### Subscription Creation
- Subscriptions created / Payments completed
- Target: 100% (or > 99.5%)

#### Error Rate
- Failed subscriptions / Total subscriptions
- Target: < 0.5%

### Logs to Monitor

**Supabase Function Logs**:
```sql
-- View pi-payment-approve logs
select * from audit_log where function_name = 'pi-payment-approve' 
order by created_at desc limit 50;

-- View pi-payment-complete logs
select * from audit_log where function_name = 'pi-payment-complete' 
order by created_at desc limit 50;
```

**Browser Console**:
- Watch for [PAYMENT], [APPROVAL], [COMPLETE] logs
- Monitor for error messages
- Track metadata in console

### Alert Conditions

Set up alerts for:
1. **Function errors**: If error rate > 5%
2. **Subscription failures**: If creation fails > 1%
3. **Missing metadata**: If clientMetadata is null/undefined in logs
4. **Profile ID resolution**: If finalProfileId is null in logs

---

## Performance Impact

### Expected Impact
- **Minimal**: Only adds JSON metadata storage in idempotency table
- **No additional API calls** to external services
- **No database schema changes**
- **Negligible latency increase** (< 10ms)

### Load Testing Recommendations
- [ ] Test with 100 concurrent payments
- [ ] Monitor function execution time
- [ ] Check database write latency
- [ ] Verify metadata storage doesn't exceed quotas

---

## Known Issues & Mitigations

| Issue | Mitigation | Status |
|-------|-----------|--------|
| Metadata missing in request | Falls back to Pi API metadata | ✅ Handled |
| Profile ID null | Resolves via username | ✅ Handled |
| Subscription already exists | Upserts (updates) existing | ✅ Handled |
| Payment completed twice | Idempotency prevents duplicates | ✅ Handled |
| Function timeout | Extended timeout limits set | ✅ Verified |

---

## Success Criteria

### Before Deployment
- [x] All code changes reviewed
- [x] No syntax errors
- [x] Type checking passes
- [x] Backward compatibility confirmed

### After Deployment
- [ ] Smoke tests pass
- [ ] Database shows correct data
- [ ] Users receive features after payment
- [ ] Console logs show metadata flow
- [ ] No unexpected errors in logs
- [ ] Error rate stays below 1%
- [ ] Performance metrics acceptable

### Final Sign-Off
- [ ] QA Lead approval
- [ ] Product Lead approval
- [ ] Operations approval
- [ ] Ready for production

---

## Contacts & Support

### If Issues Occur During Deployment

1. **Function Deploy Issues**
   - Check Supabase status page
   - Verify API keys are correct
   - Check function syntax with `deno check`

2. **Payment Flow Issues**
   - Check Pi Network API status
   - Verify API_KEY and VALIDATION_KEY in env
   - Check browser network tab for failed requests

3. **Database Issues**
   - Check Supabase database quotas
   - Verify connection strings
   - Check for row-level security policy conflicts

4. **Escalation Path**
   - Level 1: Review logs and check checklist
   - Level 2: Rollback deployment
   - Level 3: Contact Supabase support / Pi Network support

---

## Post-Deployment Communication

### Notify Team
- [ ] QA Team: Ready for testing
- [ ] Product Team: Feature is live
- [ ] Support Team: Payment flow has improved
- [ ] Users: (Optional) Payment features are enhanced

### Documentation Updates
- [ ] Update user guides if payment flow changed
- [ ] Update developer docs with metadata structure
- [ ] Add to changelog / release notes

---

## Next Steps

1. **Immediate**: Follow "Deployment Steps" above
2. **Short-term**: Run smoke tests and verify database
3. **Medium-term**: Monitor metrics for 24-48 hours
4. **Long-term**: Gather user feedback on payment experience

---

## Appendix: Quick Reference

### Environment Variables Required
```
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
PI_API_KEY=...
DENO_ENV=production
```

### Metadata Structure in Database
```json
{
  "clientMetadata": {
    "subscriptionPlan": "pro",
    "billingPeriod": "monthly",
    "profileId": "uuid",
    "username": "user@example.com",
    "type": "subscription"
  },
  "piMetadata": { /* Pi API response */ },
  "approvedAt": "2025-12-08T10:30:00Z"
}
```

### Database Queries for Verification

```sql
-- Recent successful payments with subscriptions
SELECT 
  i.payment_id,
  i.profile_id,
  i.status,
  s.plan_type,
  s.status as subscription_status,
  i.created_at
FROM payment_idempotency i
LEFT JOIN subscriptions s ON s.profile_id = i.profile_id
WHERE i.status = 'completed'
ORDER BY i.created_at DESC
LIMIT 20;

-- Payments without subscriptions (potential issues)
SELECT 
  i.payment_id,
  i.profile_id,
  i.status,
  i.metadata
FROM payment_idempotency i
LEFT JOIN subscriptions s ON s.profile_id = i.profile_id
WHERE i.status = 'completed'
  AND s.id IS NULL
ORDER BY i.created_at DESC;
```
