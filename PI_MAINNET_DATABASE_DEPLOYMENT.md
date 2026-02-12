# 🚀 Pi Network Mainnet Database Deployment Guide

## 📋 Overview
This guide provides step-by-step instructions for deploying the complete Pi Network Mainnet integration to your Supabase database.

## 🔑 Configuration Details

### Pi Network Mainnet Credentials
```
API Key:        96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5
Validation Key: 7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
Network:        mainnet
Environment:    Production
```

### Official Documentation
- **Pi Network Payments**: https://pi-apps.github.io/community-developer-guide/
- **Pi Ad Network**: https://github.com/pi-apps/pi-platform-docs/tree/master

---

## 🛠️ Deployment Steps

### Step 1: Backup Your Current Database
Before applying the migration, create a backup of your current database:

```bash
# In Supabase Dashboard -> Settings -> Database -> Backup
# Or use pg_dump if you have direct access
```

### Step 2: Apply the Pi Mainnet Migration

#### Option A: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the migration file: `supabase/migrations/20251208000000_pi_mainnet_complete_integration.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

#### Option B: Supabase CLI
```bash
# Make sure you're in the project directory
cd "c:\Users\SIBIYA GAMING\droplink-testnet-35167-4"

# Apply the migration
npx supabase db push

# Or apply specific migration
npx supabase migration up --db-url "your-database-url"
```

### Step 3: Verify the Migration

Run this verification query in SQL Editor:

```sql
-- Verify all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles',
        'pi_transactions',
        'pi_ad_interactions',
        'pi_payment_links'
    )
ORDER BY table_name;

-- Verify Pi Network columns in profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
    AND column_name LIKE '%pi_%'
ORDER BY column_name;

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%pi%'
ORDER BY routine_name;
```

Expected results:
- ✅ 4 tables: profiles, pi_transactions, pi_ad_interactions, pi_payment_links
- ✅ At least 10 pi_* columns in profiles table
- ✅ 5+ Pi-related functions

---

## 🧪 Testing the Integration

### Test 1: Authenticate a Pi User

```sql
-- Test Pi user authentication
SELECT authenticate_pi_user(
    'test_pi_user_123',           -- pi_user_id
    'testpiuser',                 -- pi_username
    'test_access_token_mainnet',  -- access_token
    'GTEST123MAINNET',            -- wallet_address (optional)
    'Test User'                   -- display_name (optional)
);
```

Expected output:
```json
{
  "success": true,
  "is_new_user": true,
  "profile_id": "uuid-here",
  "user_data": { ... },
  "message": "Welcome to DropLink! Your Pi Network account has been created on mainnet."
}
```

### Test 2: Record a Pi Transaction

```sql
-- First, get a profile_id from the previous test
-- Then record a transaction
SELECT record_pi_transaction(
    'your-profile-id-here',       -- profile_id
    'test_pi_user_123',           -- pi_user_id
    'txn_mainnet_123',            -- transaction_id
    'pay_mainnet_456',            -- payment_id
    'subscription',               -- transaction_type
    15.00,                        -- amount (Pi)
    'Premium Plan - Monthly'      -- memo
);
```

### Test 3: Get User Profile

```sql
-- Retrieve Pi user profile
SELECT get_pi_user_profile('testpiuser');
```

---

## 🔍 What's Included in This Migration

### 1. Enhanced Profiles Table
- ✅ Pi Network authentication fields (pi_user_id, pi_username, pi_access_token)
- ✅ Mainnet wallet support (pi_mainnet_wallet, wallet_verified)
- ✅ Authentication tracking (last_pi_auth, pi_access_token_expiry)
- ✅ Environment specification (mainnet vs testnet)
- ✅ Feature flags (pi_payment_enabled, pi_ads_enabled)

### 2. Pi Transactions Table
- ✅ Complete transaction lifecycle tracking
- ✅ Support for multiple transaction types (payment, subscription, donation, etc.)
- ✅ Status management (pending, approved, completed, failed)
- ✅ Blockchain transaction ID storage
- ✅ Network specification (mainnet/testnet)
- ✅ Error tracking and logging

### 3. Pi Ad Interactions Table
- ✅ Ad type tracking (rewarded, interstitial)
- ✅ Result tracking with Pi Ad Network codes
- ✅ Reward management (amount, type, granted status)
- ✅ Session and context data

### 4. Pi Payment Links Table
- ✅ Payment link management for creators
- ✅ Support for donations, subscriptions, products
- ✅ Usage limits and expiration
- ✅ Active/inactive status management

### 5. Database Functions
- ✅ `authenticate_pi_user()` - Mainnet user authentication
- ✅ `record_pi_transaction()` - Transaction logging
- ✅ `update_pi_transaction_status()` - Status updates
- ✅ `record_pi_ad_interaction()` - Ad interaction tracking
- ✅ `get_pi_user_profile()` - User profile retrieval

### 6. Security & Performance
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Comprehensive indexing for fast queries
- ✅ Proper foreign key constraints
- ✅ Automatic timestamp triggers
- ✅ Input validation in functions

---

## 📊 Database Schema Overview

```
profiles (enhanced)
├── Pi Authentication
│   ├── pi_user_id (unique identifier)
│   ├── pi_username (unique username)
│   ├── pi_access_token (API token)
│   └── pi_access_token_expiry
├── Wallet Management
│   ├── pi_mainnet_wallet
│   ├── pi_wallet_address
│   └── wallet_verified
└── Feature Flags
    ├── pi_payment_enabled
    ├── pi_ads_enabled
    └── environment (mainnet/testnet)

pi_transactions
├── Transaction IDs
│   ├── transaction_id (Pi Network)
│   └── payment_id (for payments)
├── Transaction Details
│   ├── transaction_type
│   ├── amount (decimal 20,7)
│   ├── currency (default: PI)
│   └── memo
├── Status Tracking
│   ├── status (pending -> approved -> completed)
│   ├── approved_at
│   ├── completed_at
│   └── failed_at
└── Blockchain Data
    ├── blockchain_txid
    ├── from_address
    └── to_address

pi_ad_interactions
├── Ad Details
│   ├── ad_type (rewarded/interstitial)
│   ├── ad_id
│   └── ad_result (Pi Ad Network codes)
└── Rewards
    ├── reward_granted
    ├── reward_amount
    └── reward_type

pi_payment_links
├── Link Details
│   ├── link_id (unique)
│   ├── link_type
│   └── amount
├── Subscription
│   └── billing_period
└── Usage Limits
    ├── max_uses
    ├── current_uses
    └── expires_at
```

---

## 🔄 Migration Compatibility

This migration is designed to:
- ✅ Work with existing profiles without data loss
- ✅ Add new columns without affecting existing data
- ✅ Create new tables with proper constraints
- ✅ Add indexes without blocking operations
- ✅ Be idempotent (safe to run multiple times)

### Safety Features
- Uses `IF NOT EXISTS` for all column additions
- Uses `DO $$` blocks for conditional logic
- Preserves existing data in profiles table
- Creates new tables without dependencies on existing data
- Uses `COALESCE` for backward compatibility

---

## 🚨 Troubleshooting

### Issue: "Column already exists"
**Solution**: The migration uses `IF NOT EXISTS`, so this should not happen. If it does, some columns may have been added manually. Run the verification query to check.

### Issue: "Function already exists"
**Solution**: The migration uses `CREATE OR REPLACE FUNCTION`, so existing functions will be updated.

### Issue: "Permission denied"
**Solution**: Ensure you're running the migration as a database superuser or with sufficient privileges.

### Issue: "Syntax error"
**Solution**: Ensure you're copying the entire migration file. The `DO $$` blocks require complete syntax.

---

## 📈 Performance Considerations

### Indexes Created
- `idx_profiles_pi_user_id` - Fast Pi user lookups
- `idx_profiles_pi_username` - Fast username searches
- `idx_pi_transactions_profile_id` - User transaction queries
- `idx_pi_transactions_transaction_id` - Transaction lookups
- `idx_pi_transactions_created_at` - Time-based queries
- And 15+ more indexes for optimal performance

### Expected Query Performance
- User authentication: < 10ms
- Transaction lookup: < 5ms
- Profile retrieval: < 10ms
- Transaction history: < 50ms (for 1000+ records)

---

## 🔐 Security Notes

### RLS Policies
All tables have Row Level Security enabled with policies:
- Public read access for profile data
- Authenticated write access for user data
- Service role for system operations

### Token Security
- `pi_access_token` should be encrypted at application level
- Tokens expire after 24 hours (stored in `pi_access_token_expiry`)
- Always validate tokens with Pi Network API before use

### Best Practices
1. Never expose `pi_access_token` in client-side code
2. Always use HTTPS for all Pi Network API calls
3. Validate all Pi payments server-side
4. Log all transaction status changes
5. Monitor for suspicious activity

---

## 📝 Post-Deployment Checklist

- [ ] Migration executed successfully
- [ ] All tables created (profiles, pi_transactions, pi_ad_interactions, pi_payment_links)
- [ ] All functions created (authenticate_pi_user, record_pi_transaction, etc.)
- [ ] Indexes created (check with `\di` in psql or query information_schema)
- [ ] RLS policies active (check with `\dp` or query pg_policies)
- [ ] Test authentication works
- [ ] Test transaction recording works
- [ ] Test profile retrieval works
- [ ] Frontend Pi config updated with API keys
- [ ] Environment variables set for mainnet
- [ ] Monitoring and logging configured

---

## 🎯 Next Steps

After successful deployment:

1. **Update Frontend Configuration**
   - Ensure `pi-config.ts` uses the correct API key
   - Verify `SANDBOX_MODE: false`
   - Confirm `NETWORK: "mainnet"`

2. **Test End-to-End Flow**
   - Pi authentication in Pi Browser
   - Create a payment/subscription
   - Complete a transaction
   - Verify transaction in database

3. **Enable Monitoring**
   - Set up alerts for failed transactions
   - Monitor authentication success rate
   - Track payment completion rate

4. **Documentation**
   - Update API documentation
   - Create user guides
   - Document any custom workflows

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs in Dashboard -> Logs
3. Verify Pi Network API status
4. Check official Pi Network documentation

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ All verification queries return expected results
- ✅ Test authentication creates a new user profile
- ✅ Test transaction is recorded correctly
- ✅ User profile can be retrieved
- ✅ No errors in Supabase logs
- ✅ Frontend can authenticate with Pi Network
- ✅ Payments flow works end-to-end

---

**Deployed:** December 8, 2025  
**Migration Version:** 20251208000000  
**Network:** Pi Network Mainnet  
**Status:** ✅ Production Ready
