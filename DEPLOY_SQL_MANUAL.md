# 🚀 Supabase Schema Deployment - Manual Method

Since the automated script requires the service role key, follow these steps to deploy manually:

## ✅ Method 1: Supabase Dashboard (Recommended)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `idkjfuctyukspexmijvb`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query** button
2. Open this file: `supabase/migrations/20251205000000_mainnet_production_schema.sql`
3. Copy ALL the SQL content (476 lines)
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Installation
1. Click **New Query** again
2. Open this file: `verify-supabase-schema.sql`
3. Copy and paste the verification queries
4. Click **Run**
5. Check results:
   - All tables should show `exists = true`
   - Profile columns should list multiple `pi_*` columns
   - 4 functions should be listed
   - Row counts should display without errors

### Step 4: Check for Errors
If you see errors:
- ✅ "already exists" errors are OK - means tables/columns already exist
- ✅ "duplicate constraint" errors are OK - means constraints already set
- ❌ "permission denied" - you need admin access
- ❌ "syntax error" - copy the SQL again carefully

---

## ✅ Method 2: Using Supabase CLI (Alternative)

### Prerequisites
```bash
npm install -g supabase
```

### Login to Supabase
```bash
supabase login
```

### Link to your project
```bash
supabase link --project-ref idkjfuctyukspexmijvb
```

### Push migration
```bash
supabase db push
```

---

## ✅ Method 3: Direct PostgreSQL Connection

If you have database credentials:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.idkjfuctyukspexmijvb.supabase.co:5432/postgres" -f supabase/migrations/20251205000000_mainnet_production_schema.sql
```

---

## 📊 What Gets Created

### New Tables:
1. ✅ `pi_transactions` - Pi Network payment history
2. ✅ `pi_ad_interactions` - Ad network tracking
3. ✅ `wallet_tokens` - Detected wallet tokens

### Enhanced Tables:
- ✅ `profiles` - Added 8 new Pi mainnet columns
- ✅ `user_sessions` - Added Pi Network session tracking
- ✅ `analytics` - Added Pi-specific event tracking

### New Functions:
1. ✅ `record_pi_transaction()` - Log transactions
2. ✅ `update_pi_transaction_status()` - Update transaction status
3. ✅ `record_pi_ad_interaction()` - Log ad views
4. ✅ `upsert_wallet_token()` - Track wallet tokens

### Security:
- ✅ Row Level Security (RLS) enabled on all new tables
- ✅ Policies created for user data isolation
- ✅ Indexes added for performance

---

## 🧪 Test Queries

After deployment, run these in SQL Editor to test:

### Test 1: Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pi_transactions', 'pi_ad_interactions', 'wallet_tokens')
ORDER BY table_name;
```
Expected: 3 rows

### Test 2: Check Profile Columns
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name LIKE 'pi_%'
ORDER BY column_name;
```
Expected: Multiple `pi_*` columns

### Test 3: Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%pi%'
ORDER BY routine_name;
```
Expected: 4 functions

### Test 4: Test Function (Replace UUID with your profile_id)
```sql
-- Get a profile ID first
SELECT id FROM profiles LIMIT 1;

-- Then test recording a transaction (use the ID from above)
SELECT record_pi_transaction(
  'YOUR-PROFILE-UUID-HERE'::uuid,
  'test_user',
  'test_txn_' || gen_random_uuid()::text,
  'test_pay_' || gen_random_uuid()::text,
  'payment',
  1.00,
  'Test',
  '{}'::jsonb
);

-- Verify it was created
SELECT * FROM pi_transactions 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ❌ Troubleshooting

### Error: "permission denied for schema public"
**Solution:** You need to be logged in as the project owner or service role

### Error: "relation already exists"
**Solution:** This is fine! It means the table already exists. The migration will skip creating it.

### Error: "column already exists"
**Solution:** This is fine! The migration uses `IF NOT EXISTS` for columns.

### Error: "could not connect to server"
**Solution:** Check your internet connection and Supabase project status

### Error: "invalid input syntax"
**Solution:** Make sure you copied the entire SQL file without any truncation

---

## ✅ Verification Checklist

After running the migration, verify:

- [ ] All 3 new tables exist (`pi_transactions`, `pi_ad_interactions`, `wallet_tokens`)
- [ ] Profile table has new columns (`pi_mainnet_wallet`, `pi_access_token`, etc.)
- [ ] All 4 functions are created
- [ ] Can query the tables without permission errors
- [ ] RLS policies are active
- [ ] Indexes are created

Run the `verify-supabase-schema.sql` file to check all of these automatically!

---

## 📝 Next Steps After Deployment

1. ✅ Test Pi authentication saves data to `profiles`
2. ✅ Test payment creates record in `pi_transactions`
3. ✅ Test ad interaction logs to `pi_ad_interactions`
4. ✅ Monitor the tables in Supabase Dashboard > Table Editor

---

## 🆘 Need Help?

If deployment fails:
1. Copy the error message
2. Check which line number failed
3. Run that specific section manually
4. Or reach out for assistance with the exact error

The migration is designed to be idempotent - you can run it multiple times safely!
