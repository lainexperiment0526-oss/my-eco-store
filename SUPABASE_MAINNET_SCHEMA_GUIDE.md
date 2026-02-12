# Supabase Mainnet Production Schema Update

**Date:** December 5, 2025  
**Purpose:** Ensure all user data, Pi Network integrations, and settings are properly saved to Supabase for mainnet production

---

## 📋 What This Update Adds

### New Tables:
1. **`pi_transactions`** - Complete Pi Network payment and transaction history
2. **`pi_ad_interactions`** - Pi Ad Network interaction tracking with rewards
3. **`wallet_tokens`** - Detected tokens in user wallets (mainnet)

### Enhanced Tables:
- **`profiles`** - Added mainnet-specific columns:
  - `pi_mainnet_wallet` - Primary mainnet wallet address
  - `pi_access_token` - Encrypted access token storage
  - `pi_access_token_expiry` - Token expiration tracking
  - `last_pi_auth` - Last authentication timestamp
  - `environment` - Network environment (mainnet/testnet)
  - `wallet_verified` - Wallet verification status
  - `pi_payment_enabled` - Payment feature toggle
  - `pi_ads_enabled` - Ad network feature toggle

- **`user_sessions`** - Enhanced session tracking with Pi Network details
- **`analytics`** - Added Pi Network specific event tracking

### New Functions:
1. **`record_pi_transaction()`** - Record payment/transaction
2. **`update_pi_transaction_status()`** - Update transaction status
3. **`record_pi_ad_interaction()`** - Log ad interactions
4. **`upsert_wallet_token()`** - Add/update detected tokens

---

## 🚀 Quick Deployment (Option 1: Automated)

### Run the deployment script:

```bash
# Make sure you have @supabase/supabase-js installed
npm install @supabase/supabase-js

# Run the migration script
node push-mainnet-schema.cjs
```

### Expected Output:
```
🚀 Starting Mainnet Production Schema Migration...
📄 Migration file loaded
⚙️  Executing migration...
✅ Migration executed successfully!
🔍 Verifying schema...
✅ Table 'profiles' exists
✅ Table 'pi_transactions' exists
✅ Table 'pi_ad_interactions' exists
✅ Table 'wallet_tokens' exists
✅ Mainnet Production Schema Migration Complete!
```

---

## 📝 Manual Deployment (Option 2: Supabase Dashboard)

### Step 1: Open Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `idkjfuctyukspexmijvb`
3. Navigate to **SQL Editor**

### Step 2: Execute Migration
1. Click **New Query**
2. Open the migration file: `supabase/migrations/20251205000000_mainnet_production_schema.sql`
3. Copy the entire SQL content
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Tables Created
Run this verification query:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'pi_transactions', 'pi_ad_interactions', 'wallet_tokens', 'user_sessions')
ORDER BY table_name;
```

Expected result: All 5 tables listed

### Step 4: Verify Functions Created
```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%pi%'
ORDER BY routine_name;
```

Expected result: 4 functions listed

---

## 🔍 What Gets Saved to Supabase

### 1. **User Authentication Data**
```typescript
// When user authenticates with Pi Network
{
  pi_user_id: "user_pi_id",
  pi_username: "username",
  pi_wallet_address: "G...",
  pi_access_token: "encrypted_token",
  pi_access_token_expiry: "2025-12-06T...",
  last_pi_auth: "2025-12-05T...",
  environment: "mainnet",
  wallet_verified: true
}
```

### 2. **Pi Network Transactions**
Every payment/transaction is recorded:
```typescript
{
  transaction_id: "txn_123",
  payment_id: "pay_456",
  transaction_type: "payment", // or 'subscription', 'donation', 'purchase'
  amount: 10.50,
  memo: "Premium subscription",
  status: "completed",
  blockchain_txid: "stellar_txid",
  from_address: "G...",
  to_address: "G...",
  network: "mainnet"
}
```

### 3. **Pi Ad Network Interactions**
Every ad view is logged:
```typescript
{
  ad_type: "rewarded", // or 'interstitial'
  ad_id: "ad_123",
  ad_result: "AD_REWARDED",
  reward_granted: true,
  reward_amount: 0.10,
  reward_type: "pi_coins"
}
```

### 4. **Wallet Tokens**
All detected tokens are stored:
```typescript
{
  wallet_address: "G...",
  asset_code: "TOKEN",
  asset_issuer: "G...",
  balance: 1000.50,
  token_name: "Token Name",
  home_domain: "token.com",
  has_trustline: true,
  detected_via: "pi_api",
  network: "mainnet"
}
```

### 5. **User Sessions**
Active sessions tracked:
```typescript
{
  session_id: "session_123",
  auth_method: "pi_network",
  pi_access_token: "token",
  pi_user_id: "user_id",
  pi_username: "username",
  pi_wallet_address: "G...",
  last_active: "2025-12-05T...",
  is_active: true,
  environment: "mainnet"
}
```

### 6. **Analytics Events**
All user interactions tracked:
```typescript
{
  event_type: "pi_payment", // or 'pi_ad_view', 'wallet_connect'
  event_data: {
    payment_id: "pay_123",
    amount: 10.50,
    currency: "pi"
  },
  pi_user_id: "user_id",
  payment_id: "pay_123"
}
```

---

## 🔧 Using the New Functions

### Record a Payment Transaction
```typescript
// In your Supabase Edge Function or client code
const { data, error } = await supabase.rpc('record_pi_transaction', {
  p_profile_id: profileId,
  p_pi_user_id: piUserId,
  p_transaction_id: transactionId,
  p_payment_id: paymentId,
  p_transaction_type: 'payment',
  p_amount: 10.50,
  p_memo: 'Premium subscription',
  p_metadata: { plan: 'premium', duration: '1_month' }
});
```

### Update Transaction Status
```typescript
const { data, error } = await supabase.rpc('update_pi_transaction_status', {
  p_transaction_id: transactionId,
  p_status: 'completed',
  p_blockchain_txid: 'stellar_tx_123'
});
```

### Record Ad Interaction
```typescript
const { data, error } = await supabase.rpc('record_pi_ad_interaction', {
  p_profile_id: profileId,
  p_pi_user_id: piUserId,
  p_ad_type: 'rewarded',
  p_ad_id: adId,
  p_ad_result: 'AD_REWARDED',
  p_reward_granted: true,
  p_reward_amount: 0.10,
  p_metadata: { session_id: sessionId }
});
```

### Track Wallet Tokens
```typescript
const { data, error } = await supabase.rpc('upsert_wallet_token', {
  p_profile_id: profileId,
  p_wallet_address: walletAddress,
  p_asset_code: 'TOKEN',
  p_asset_issuer: issuerAddress,
  p_balance: 1000.50,
  p_token_name: 'Token Name',
  p_home_domain: 'token.com',
  p_has_trustline: true,
  p_detected_via: 'pi_api'
});
```

---

## 🔐 Row Level Security (RLS)

All new tables have RLS enabled with these policies:

### Pi Transactions:
- ✅ Users can view their own transactions
- ✅ Users can insert their own transactions
- ✅ Users can update their own transactions

### Pi Ad Interactions:
- ✅ Users can view their own ad interactions
- ✅ Users can insert their own ad interactions

### Wallet Tokens:
- ✅ Users can view their own wallet tokens
- ✅ Users can manage (CRUD) their own wallet tokens

### User Sessions:
- ✅ Users can view their own sessions
- ✅ Users can manage their own sessions

---

## 🧪 Testing the Schema

### Test 1: Check Tables Exist
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pi_transactions', 'pi_ad_interactions', 'wallet_tokens');
```
Expected: `table_count = 3`

### Test 2: Check Profile Columns
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name LIKE 'pi_%'
ORDER BY column_name;
```
Expected: Multiple `pi_*` columns including `pi_mainnet_wallet`, `pi_access_token`, etc.

### Test 3: Test Transaction Recording
```sql
-- Insert a test transaction (replace with your profile_id)
SELECT record_pi_transaction(
  'your-profile-uuid'::uuid,
  'test_pi_user_id',
  'test_txn_' || gen_random_uuid()::text,
  'test_payment_' || gen_random_uuid()::text,
  'payment',
  1.00,
  'Test transaction',
  '{"test": true}'::jsonb
);

-- Verify it was created
SELECT * FROM pi_transactions 
WHERE pi_user_id = 'test_pi_user_id' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Test 4: Test Ad Interaction Recording
```sql
-- Insert a test ad interaction
SELECT record_pi_ad_interaction(
  'your-profile-uuid'::uuid,
  'test_pi_user_id',
  'rewarded',
  'test_ad_123',
  'AD_REWARDED',
  true,
  0.10,
  '{"test": true}'::jsonb
);

-- Verify it was created
SELECT * FROM pi_ad_interactions 
WHERE pi_user_id = 'test_pi_user_id' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📊 Monitoring & Queries

### View Recent Transactions
```sql
SELECT 
  t.transaction_id,
  t.transaction_type,
  t.amount,
  t.status,
  t.created_at,
  p.username
FROM pi_transactions t
JOIN profiles p ON t.profile_id = p.id
WHERE t.network = 'mainnet'
ORDER BY t.created_at DESC
LIMIT 10;
```

### View Ad Performance
```sql
SELECT 
  ad_type,
  ad_result,
  COUNT(*) as interaction_count,
  SUM(CASE WHEN reward_granted THEN 1 ELSE 0 END) as rewards_granted,
  SUM(reward_amount) as total_rewards
FROM pi_ad_interactions
GROUP BY ad_type, ad_result
ORDER BY interaction_count DESC;
```

### View Wallet Token Balances
```sql
SELECT 
  p.username,
  wt.asset_code,
  wt.balance,
  wt.has_trustline,
  wt.updated_at
FROM wallet_tokens wt
JOIN profiles p ON wt.profile_id = p.id
WHERE wt.network = 'mainnet'
ORDER BY wt.updated_at DESC;
```

### View Active Sessions
```sql
SELECT 
  s.session_id,
  s.pi_username,
  s.auth_method,
  s.last_active,
  s.environment,
  p.username
FROM user_sessions s
JOIN profiles p ON s.profile_id = p.id
WHERE s.is_active = true
ORDER BY s.last_active DESC;
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] All 3 new tables created (`pi_transactions`, `pi_ad_interactions`, `wallet_tokens`)
- [ ] Profile table has new mainnet columns
- [ ] All 4 new functions exist and are executable
- [ ] RLS policies are active on all tables
- [ ] Indexes are created for performance
- [ ] Triggers are active (e.g., `update_last_pi_auth`)
- [ ] Test transaction can be recorded
- [ ] Test ad interaction can be recorded
- [ ] Test wallet token can be upserted

---

## 🐛 Troubleshooting

### Issue: "relation already exists"
**Solution:** Tables already exist. This is fine - the migration uses `IF NOT EXISTS`.

### Issue: "column already exists"
**Solution:** Columns already exist. The migration uses `ADD COLUMN IF NOT EXISTS`.

### Issue: "function already exists"
**Solution:** The migration uses `CREATE OR REPLACE FUNCTION`.

### Issue: "permission denied"
**Solution:** Make sure you're using the service role key, not the anon key.

### Issue: RPC function not found
**Solution:** Execute the SQL directly in Supabase Dashboard SQL Editor.

---

## 📚 Related Documentation

- [Pi Network Mainnet Production Status](./PI_MAINNET_PRODUCTION_STATUS.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Pi Network SDK Documentation](https://developers.minepi.com)

---

## 🎯 Summary

This migration ensures **ALL** data from your Pi Network mainnet integration is properly saved to Supabase:

✅ **User authentication data** - Tokens, wallet addresses, auth timestamps  
✅ **Payment transactions** - Complete payment history with status tracking  
✅ **Ad interactions** - Every ad view and reward granted  
✅ **Wallet tokens** - All detected tokens in user wallets  
✅ **User sessions** - Active session tracking with environment  
✅ **Analytics events** - Pi Network specific event tracking  

**Result:** Complete data persistence for production mainnet deployment! 🚀
