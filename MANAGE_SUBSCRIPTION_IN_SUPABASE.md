# How to Manage Your Subscription in Supabase

## 🚨 CRITICAL FIX REQUIRED FIRST 🚨

If your subscriptions are not saving or updating correctly, you MUST run this fix first:

1. Copy the SQL from `supabase/migrations/20260207143000_fix_subscription_unique_constraint.sql`
2. Run it in the Supabase SQL Editor
3. This adds a UNIQUE constraint that is required for the subscription system to work.

Alternatively, double-click `FIX_SUBSCRIPTION_CONSTRAINT.bat` in the project root.

---

If the Dashboard cancel button isn't working, you can directly control your subscription in Supabase using SQL commands.

---

## STEP 1: Access Supabase SQL Editor

1. Go to: **https://supabase.co**
2. Log in with your account
3. Select your project: **jzzbmoopwnvgxxirulga**
4. Click **SQL Editor** (left sidebar)
5. Click **New Query**

---

## STEP 2: Find Your Profile ID

Run this query first to find YOUR profile ID:

```sql
SELECT id, username, email, subscription_status, has_premium 
FROM profiles 
WHERE email = 'YOUR_EMAIL@example.com'
LIMIT 1;
```

**Replace `YOUR_EMAIL@example.com` with your actual email address**

Copy the `id` value (it looks like: `550e8400-e29b-41d4-a716-446655440000`)

---

## STEP 3: View Your Active Subscriptions

```sql
SELECT * FROM subscriptions 
WHERE profile_id = 'PASTE_YOUR_PROFILE_ID_HERE'
ORDER BY created_at DESC;
```

This shows:
- `id` - subscription ID
- `status` - 'active', 'inactive', 'canceled'
- `plan_type` - '30pi', 'gift_card', 'premium', etc.
- `amount` - cost in Pi
- `start_date` - when it started
- `end_date` - when it expires
- `auto_renew` - true/false (auto renewal enabled)

---

## STEP 4: CANCEL/DELETE Subscription

### Option A: Immediately Delete Subscription

```sql
DELETE FROM subscriptions 
WHERE profile_id = 'PASTE_YOUR_PROFILE_ID_HERE' 
  AND status = 'active';
```

### Option B: Mark as Canceled (Keep History)

```sql
UPDATE subscriptions 
SET status = 'canceled', end_date = NOW() 
WHERE profile_id = 'PASTE_YOUR_PROFILE_ID_HERE' 
  AND status = 'active';
```

### Option C: Disable Auto-Renewal Only

```sql
UPDATE subscriptions 
SET auto_renew = false 
WHERE profile_id = 'PASTE_YOUR_PROFILE_ID_HERE' 
  AND status = 'active';
```

---

## STEP 5: Reset Profile to Free Tier

```sql
UPDATE profiles 
SET 
  subscription_status = 'free',
  has_premium = false,
  card_customization_enabled = false
WHERE id = 'PASTE_YOUR_PROFILE_ID_HERE';
```

---

## STEP 6: Delete Gift Cards (If Needed)

```sql
DELETE FROM gift_cards 
WHERE purchased_by_profile_id = 'PASTE_YOUR_PROFILE_ID_HERE' 
   OR redeemed_by_profile_id = 'PASTE_YOUR_PROFILE_ID_HERE';
```

---

## STEP 7: Delete Transaction History (Optional)

```sql
DELETE FROM subscription_transactions 
WHERE profile_id = 'PASTE_YOUR_PROFILE_ID_HERE';
```

---

## COMPLETE SCRIPT (Do Everything at Once)

Copy and paste this entire script into SQL Editor to cancel everything:

```sql
-- 1. Get your profile ID
SELECT id, username, email 
FROM profiles 
WHERE email = 'YOUR_EMAIL@example.com'
LIMIT 1;

-- 2. Replace PROFILE_ID below with the value from step 1
-- 3. Run the following:

DELETE FROM subscriptions 
WHERE profile_id = 'PROFILE_ID' 
  AND status = 'active';

DELETE FROM gift_cards 
WHERE purchased_by_profile_id = 'PROFILE_ID' 
   OR redeemed_by_profile_id = 'PROFILE_ID';

DELETE FROM subscription_transactions 
WHERE profile_id = 'PROFILE_ID';

UPDATE profiles 
SET 
  subscription_status = 'free',
  has_premium = false,
  card_customization_enabled = false
WHERE id = 'PROFILE_ID';

-- 4. Verify it worked
SELECT subscription_status, has_premium 
FROM profiles 
WHERE id = 'PROFILE_ID';
```

---

## VERIFY IT WORKED

After running the DELETE/UPDATE commands, check:

```sql
SELECT * FROM subscriptions 
WHERE profile_id = 'PROFILE_ID';

SELECT subscription_status, has_premium 
FROM profiles 
WHERE id = 'PROFILE_ID';
```

**Expected results:**
- ✅ No rows returned from subscriptions table (all deleted)
- ✅ `subscription_status = 'free'`
- ✅ `has_premium = false`

---

## TROUBLESHOOTING

### "Permission Denied" Error
- Make sure you're logged in with the correct Supabase account
- Check that you're in the correct project

### "Profile ID not found"
- Double-check your email address spelling
- Make sure you're using the exact email associated with your DropLink account

### Changes not reflecting on website
- **Clear browser cache** (Ctrl+Shift+Delete)
- **Log out and log back in**
- **Refresh the page** (F5)

---

## NEED HELP?

If you get errors, screenshot the error and send to: **support@droplink.space**

Include:
- The SQL query you ran
- The exact error message
- Your email address
