# Payment Metadata Fix - QA Testing Checklist

## Test Environment Setup

### Prerequisites
- [ ] Test Pi Browser setup with test wallet
- [ ] Test account with known credentials
- [ ] Access to Supabase dashboard
- [ ] Browser DevTools console ready
- [ ] Test payment amount (suggest 1 Pi for testing)

### Test Data Preparation
```
Test User:
  Username: [test_username]
  Profile ID: [test_uuid]
  Pi Wallet: [test_wallet_address]
  
Test Plans:
  - Pro Plan: 10 Pi
  - Premium Plan: 25 Pi
  - Yearly Plan: 100 Pi
```

---

## Test Suite 1: Metadata Transmission

### Test 1.1: Metadata Sent to Approval Function
**Objective**: Verify metadata reaches approval function

**Steps**:
1. Open browser DevTools Console
2. Navigate to Subscription page
3. Click "Subscribe" for Pro plan (monthly)
4. Complete payment in Pi Wallet

**Expected Result**:
- Console shows: `[PAYMENT] 📦 Sending client metadata to approval:`
- Metadata object contains:
  - `subscriptionPlan: "pro"`
  - `billingPeriod: "monthly"`
  - `profileId: "test_uuid"`
  - `username: "test_username"`
  - `type: "subscription"`

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 1.2: Metadata Sent to Completion Function
**Objective**: Verify metadata reaches completion function

**Steps**:
1. Same as Test 1.1 - watch console during payment
2. After approval, watch for completion phase

**Expected Result**:
- Console shows: `[PAYMENT] 📦 Sending metadata to completion:`
- Metadata object matches approval phase

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 1.3: Metadata Stored in Backend
**Objective**: Verify metadata persists in database

**Steps**:
1. Complete payment (Test 1.1)
2. Wait for completion logs
3. Query payment_idempotency table:
   ```sql
   SELECT payment_id, profile_id, metadata 
   FROM payment_idempotency 
   WHERE profile_id = 'test_uuid' 
   ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Result**:
- Row exists with status 'completed'
- metadata JSON contains:
  - `clientMetadata.subscriptionPlan: "pro"`
  - `clientMetadata.billingPeriod: "monthly"`
  - `clientMetadata.profileId: "test_uuid"`

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 2: Subscription Creation

### Test 2.1: Subscription Created After Payment
**Objective**: Verify subscription record is created

**Steps**:
1. Complete payment (use different plan than previous test)
2. Wait for `[SUBSCRIPTION CREATED]` log
3. Query subscriptions table:
   ```sql
   SELECT * FROM subscriptions 
   WHERE profile_id = 'test_uuid' 
   ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Result**:
- New row in subscriptions table
- `plan_type`: matches purchased plan (pro/premium)
- `billing_period`: "monthly" or "yearly"
- `status`: "active"
- `start_date`: today's date
- `end_date`: +1 month from today

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 2.2: Monthly Subscription Dates
**Objective**: Verify monthly subscription end date

**Steps**:
1. Subscribe to Pro Monthly plan
2. Check subscription in database
3. Calculate expected end date: today + 1 month

**Expected Result**:
- `end_date` = start_date + 1 month
- Example: 2025-12-08 + 1 month = 2026-01-08

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 2.3: Yearly Subscription Dates
**Objective**: Verify yearly subscription end date

**Steps**:
1. Subscribe to premium yearly plan
2. Check subscription in database
3. Calculate expected end date: today + 1 year

**Expected Result**:
- `end_date` = start_date + 1 year
- Example: 2025-12-08 + 1 year = 2026-12-08

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 2.4: Subscription Upsert (Update Existing)
**Objective**: Verify existing subscription is updated

**Steps**:
1. Note current subscription end_date
2. Complete new payment for same plan
3. Check subscription record

**Expected Result**:
- Same subscription record is updated
- `end_date` extends by another month/year
- `updated_at` timestamp is recent
- No duplicate subscription rows

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 3: Feature Unlock

### Test 3.1: Features Visible After Payment
**Objective**: Verify premium features appear after subscription

**Steps**:
1. Note: Do this test with fresh user (no prior subscription)
2. Complete payment for Pro plan
3. Navigate to Dashboard or Features page
4. Check for pro-level features

**Expected Result**:
- Premium features are visible
- Locked features show as "Unlocked"
- User can access premium content

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 3.2: Different Plans Show Different Features
**Objective**: Verify plan-specific features

**Steps**:
1. Use test user A: Subscribe to Pro plan
2. Check features available
3. Use test user B: Subscribe to Premium plan
4. Check features available
5. Compare feature sets

**Expected Result**:
- Pro user sees pro-tier features
- Premium user sees all features
- Feature sets match plan definitions

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 4: Profile ID Resolution

### Test 4.1: Profile ID from Metadata
**Objective**: Verify profile ID comes from client metadata

**Steps**:
1. Enable "Detailed Logs" in browser
2. Subscribe to any plan
3. Check console for profile resolution logs:
   ```
   [COMPLETE] Profile ID resolution: {
     fromAuth: null,
     fromRequestMetadata: "uuid",
     fromStoredMetadata: "uuid",
     final: "uuid"
   }
   ```

**Expected Result**:
- `final` profileId matches test user's UUID
- Logs show which source was used

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 4.2: Profile ID from Username (Fallback)
**Objective**: Verify fallback to username lookup

**Steps**:
1. Clear profileId from metadata (developer option)
2. Complete payment
3. Check console logs

**Expected Result**:
- System falls back to username lookup
- Correct profile is still found
- Subscription is created for correct user

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 5: Error Handling

### Test 5.1: Payment Cancelled
**Objective**: Verify cancellation is handled gracefully

**Steps**:
1. Click Subscribe
2. Start payment in Pi Wallet
3. Click Cancel in Pi Wallet dialog
4. Check console for cancel log

**Expected Result**:
- Console shows: `[PAYMENT] ⛔ Payment cancelled by user`
- Toast notification appears: "Payment cancelled"
- No subscription created
- No database records

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 5.2: Payment Error Recovery
**Objective**: Verify error handling

**Steps**:
1. (If possible) Simulate network error during payment
2. Check console for error logs
3. Verify user can retry

**Expected Result**:
- Error message displayed to user
- Console shows error details
- User can attempt payment again

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 5.3: Duplicate Payment Prevention
**Objective**: Verify idempotency

**Steps**:
1. Complete payment successfully
2. Simulate duplicate request (if possible)
3. Check database

**Expected Result**:
- Only one subscription created
- Idempotency table shows status 'completed'
- No duplicate charges

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 6: Console Logging

### Test 6.1: Complete Log Chain
**Objective**: Verify all expected logs appear

**Expected Log Sequence**:
1. `[PAYMENT] 🚀 createPayment called with: {...}`
2. `[PAYMENT] 📋 Ready for server approval - Payment ID: ...`
3. `[PAYMENT] 📦 Sending client metadata to approval: {...}`
4. `[PAYMENT] ✅ Payment approved by server`
5. `[PAYMENT] 🔄 Ready for server completion - Transaction ID: ...`
6. `[PAYMENT] 📦 Sending metadata to completion: {...}`
7. `[COMPLETE] Retrieved metadata: {...}`
8. `[COMPLETE] Profile ID resolution: {...}`
9. `[SUBSCRIPTION CREATE] 🎯 Creating subscription with: {...}`
10. `[SUBSCRIPTION CREATED] [uuid] [plan]`
11. `[PAYMENT] ✅ Payment completed successfully`

**Steps**:
1. Open Console with filter: `[PAYMENT] or [APPROVAL] or [COMPLETE] or [SUBSCRIPTION]`
2. Complete payment
3. Verify all logs appear in order

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 6.2: No Error Logs
**Objective**: Verify no errors in console

**Steps**:
1. Complete payment
2. Filter console for "error" or "Error"
3. Check for red error indicators

**Expected Result**:
- No JavaScript errors
- No console.error() calls
- No network errors (404, 500, etc.)

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 7: Database Consistency

### Test 7.1: Metadata in payment_idempotency
**Objective**: Verify correct data stored

**Query**:
```sql
SELECT 
  payment_id,
  profile_id,
  status,
  metadata->>'clientMetadata' as client_metadata
FROM payment_idempotency
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result**:
- `status`: 'completed'
- `profile_id`: test user's UUID
- `client_metadata` contains subscriptionPlan and billingPeriod

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 7.2: Subscription in subscriptions Table
**Objective**: Verify subscription data

**Query**:
```sql
SELECT 
  id,
  profile_id,
  plan_type,
  billing_period,
  status,
  start_date,
  end_date,
  pi_amount
FROM subscriptions
WHERE profile_id = 'test_uuid'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result**:
- `plan_type`: 'pro' or 'premium' (lowercase)
- `billing_period`: 'monthly' or 'yearly'
- `status`: 'active'
- `pi_amount`: matches payment amount
- `end_date`: start_date + duration

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 7.3: Cross-table Consistency
**Objective**: Verify data consistency

**Query**:
```sql
SELECT 
  i.payment_id,
  i.profile_id,
  i.status,
  s.id as subscription_id,
  s.plan_type,
  s.status as sub_status,
  i.created_at as payment_created,
  s.created_at as sub_created
FROM payment_idempotency i
LEFT JOIN subscriptions s ON s.profile_id = i.profile_id
WHERE i.payment_id = 'PAYMENT_ID';
```

**Expected Result**:
- payment_idempotency.profile_id = subscriptions.profile_id
- Both statuses are appropriate
- Creation timestamps are close (within seconds)

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 8: Edge Cases

### Test 8.1: Rapid Successive Payments
**Objective**: Verify system handles multiple payments

**Steps**:
1. Complete payment
2. Immediately complete another payment
3. Check database

**Expected Result**:
- Both payments processed
- No conflicts or errors
- Each subscription is separate or properly merged

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 8.2: Very Large Metadata
**Objective**: Verify large metadata is handled

**Steps**:
1. (Developer) Add large data to metadata
2. Complete payment
3. Check database and logs

**Expected Result**:
- Metadata stored completely
- No truncation or data loss
- Performance acceptable

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 8.3: Special Characters in Metadata
**Objective**: Verify special characters handled

**Steps**:
1. (Developer) Add special chars to username: `user@test.com`, `user_#123`
2. Complete payment
3. Check database

**Expected Result**:
- Metadata preserved correctly
- No SQL injection attempts
- Database shows proper escaping

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Test Suite 9: Performance

### Test 9.1: Payment Completion Time
**Objective**: Measure payment completion latency

**Steps**:
1. Note timestamp at "Ready for Approval"
2. Note timestamp at "Payment Completed"
3. Calculate duration

**Expected Result**:
- Total time < 10 seconds
- Approval < 3 seconds
- Completion < 7 seconds
- Database operations < 2 seconds

**Actual Time**: ___________

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

### Test 9.2: Database Query Performance
**Objective**: Verify database queries are fast

**Steps**:
1. Run performance query:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM payment_idempotency 
   WHERE profile_id = 'test_uuid'
   ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Result**:
- Planning time < 1ms
- Execution time < 10ms
- Rows scanned < 10

**Actual Time**: ___________

**Pass/Fail**: ___

**Notes**: ___________________________________________

---

## Final Summary

### Overall Results
- **Total Tests**: 26
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Pass Rate**: ___%

### Critical Issues Found
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Non-Critical Issues
1. _________________________________________________
2. _________________________________________________

### Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | _______________ | ________ | __________ |
| Product Lead | _______________ | ________ | __________ |
| Ops Lead | _______________ | ________ | __________ |

### Approval for Production
- [ ] All critical tests passed
- [ ] No blockers remain
- [ ] Approved for production deployment
- [ ] Monitor plan established

### Post-Deployment Monitoring
- [ ] Monitor payment success rate (target > 95%)
- [ ] Monitor subscription creation rate (target 100%)
- [ ] Monitor error rate (target < 0.5%)
- [ ] Gather user feedback on payment experience
- [ ] Plan post-launch improvements

---

## Appendix: Database Cleanup

If you need to clean up test data:

```sql
-- Delete test payment (CAREFUL!)
DELETE FROM payment_idempotency 
WHERE payment_id = 'TEST_PAYMENT_ID';

-- Delete test subscription (CAREFUL!)
DELETE FROM subscriptions 
WHERE profile_id = 'TEST_USER_UUID' 
  AND created_at > now() - interval '1 hour';

-- Verify deletion
SELECT COUNT(*) FROM payment_idempotency 
WHERE profile_id = 'TEST_USER_UUID';
```

**Warning**: Be very careful with DELETE statements! Use WHERE clauses to limit deletion scope.
