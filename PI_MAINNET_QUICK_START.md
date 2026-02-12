# 🚀 Pi Network Mainnet Database Integration - Quick Start

## ⚡ Quick Deployment (3 Steps)

### 1️⃣ Run Deployment Script
```bash
# Windows
deploy-pi-mainnet.bat

# Linux/Mac
chmod +x deploy-pi-mainnet.sh
./deploy-pi-mainnet.sh
```

**OR** Deploy manually via Supabase Dashboard:
1. Open Supabase Dashboard → SQL Editor
2. Copy `supabase/migrations/20251208000000_pi_mainnet_complete_integration.sql`
3. Paste and click "Run"

### 2️⃣ Verify Installation
Run verification script in Supabase SQL Editor:
- File: `supabase/migrations/20251208000001_verify_pi_mainnet.sql`
- Should show: ✅ All tests passed

### 3️⃣ Test Integration
```sql
-- Test Pi user authentication
SELECT authenticate_pi_user(
    'test_user_123',
    'testuser',
    'access_token',
    'GWALLET123',
    'Test User'
);
```

---

## 🔑 Configuration

```
API Key:        96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5
Validation Key: 7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
Network:        mainnet
Environment:    Production
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **PI_MAINNET_COMPLETE_SUMMARY.md** | 📖 Complete overview and summary |
| **PI_MAINNET_DATABASE_DEPLOYMENT.md** | 🚀 Detailed deployment guide |
| **PI_MAINNET_SQL_REFERENCE.md** | 🔧 SQL functions and queries reference |
| **20251208000000_pi_mainnet_complete_integration.sql** | 💾 Main migration file |
| **20251208000001_verify_pi_mainnet.sql** | ✅ Verification script |

---

## 🗄️ What's Included

### Tables Created/Enhanced
- ✅ **profiles** - Enhanced with Pi Network fields
- ✅ **pi_transactions** - Transaction tracking
- ✅ **pi_ad_interactions** - Ad network tracking
- ✅ **pi_payment_links** - Payment link management

### Database Functions
- ✅ `authenticate_pi_user()` - User authentication
- ✅ `record_pi_transaction()` - Transaction logging
- ✅ `update_pi_transaction_status()` - Status updates
- ✅ `record_pi_ad_interaction()` - Ad tracking
- ✅ `get_pi_user_profile()` - Profile retrieval

### Features
- ✅ Mainnet environment support
- ✅ Wallet verification tracking
- ✅ Token expiry management
- ✅ Transaction lifecycle tracking
- ✅ Ad network integration
- ✅ Payment link management
- ✅ Comprehensive indexing
- ✅ Row Level Security (RLS)
- ✅ Error handling & logging

---

## 🧪 Quick Test

After deployment, test with these SQL commands:

```sql
-- 1. Create test user
SELECT authenticate_pi_user(
    'pi_test_001',
    'testuser',
    'test_token',
    'GTEST123',
    'Test User'
);

-- 2. Record transaction
SELECT record_pi_transaction(
    (SELECT id FROM profiles WHERE pi_user_id = 'pi_test_001'),
    'pi_test_001',
    'txn_001',
    'pay_001',
    'subscription',
    15.00,
    'Premium Plan'
);

-- 3. Get user profile
SELECT get_pi_user_profile('testuser');
```

---

## 📊 Common Operations

### Authenticate User
```sql
SELECT authenticate_pi_user(
    p_pi_user_id := 'pi_user_id',
    p_pi_username := 'username',
    p_access_token := 'token',
    p_wallet_address := 'wallet',
    p_display_name := 'Display Name'
);
```

### Record Transaction
```sql
SELECT record_pi_transaction(
    p_profile_id := 'profile-uuid',
    p_pi_user_id := 'pi_user_id',
    p_transaction_id := 'txn_id',
    p_payment_id := 'pay_id',
    p_transaction_type := 'subscription',
    p_amount := 15.00,
    p_memo := 'Premium Plan - Monthly'
);
```

### Get Transaction History
```sql
SELECT * FROM pi_transactions
WHERE pi_user_id = 'pi_user_id'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔗 External Resources

- **Pi Payment Docs**: https://pi-apps.github.io/community-developer-guide/
- **Pi Ad Network**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **Supabase Docs**: https://supabase.com/docs

---

## 🆘 Need Help?

1. **Deployment Issues**: Check `PI_MAINNET_DATABASE_DEPLOYMENT.md`
2. **Function Usage**: See `PI_MAINNET_SQL_REFERENCE.md`
3. **Complete Overview**: Read `PI_MAINNET_COMPLETE_SUMMARY.md`
4. **Verification Failed**: Run verification script and check output

---

## ✅ Success Checklist

- [ ] Migration applied successfully
- [ ] Verification script passed
- [ ] Test user authentication works
- [ ] Test transaction recorded
- [ ] Frontend config updated
- [ ] No errors in Supabase logs

---

## 🎯 Frontend Integration

Update your `src/config/pi-config.ts`:

```typescript
export const PI_CONFIG = {
  API_KEY: "96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5",
  VALIDATION_KEY: "7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a",
  NETWORK: "mainnet",
  SANDBOX_MODE: false,
  SDK: { version: "2.0", sandbox: false }
};
```

---

## 🚨 Important Notes

- ⚠️ This is for **MAINNET** (Production) only
- ⚠️ All transactions are **REAL** Pi coins
- ⚠️ Keep API keys **SECURE** - never commit to git
- ⚠️ Always **test** in staging first
- ⚠️ **Monitor** transactions closely
- ⚠️ **Backup** database before deployment

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Date:** December 8, 2025  
**Network:** Pi Network Mainnet

🎉 **Ready to deploy and accept real Pi payments!**
