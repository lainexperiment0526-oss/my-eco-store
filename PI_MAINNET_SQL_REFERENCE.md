# 🔧 Pi Network Mainnet SQL - Quick Reference

## 📚 Database Functions Reference

### 1. authenticate_pi_user()
Authenticates or creates a Pi Network user account.

**Signature:**
```sql
authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL
) RETURNS JSON
```

**Example:**
```sql
SELECT authenticate_pi_user(
    'pi_user_mainnet_123',
    'johndoe',
    'access_token_xyz',
    'GKXYZ123...',
    'John Doe'
);
```

**Returns:**
```json
{
  "success": true,
  "is_new_user": true,
  "profile_id": "uuid",
  "user_data": { ... },
  "message": "Welcome to DropLink!"
}
```

---

### 2. record_pi_transaction()
Records a Pi Network transaction.

**Signature:**
```sql
record_pi_transaction(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_transaction_id TEXT,
    p_payment_id TEXT,
    p_transaction_type TEXT,
    p_amount DECIMAL,
    p_memo TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSON
```

**Transaction Types:**
- `payment` - One-time payment
- `subscription` - Recurring subscription
- `donation` - Donation/tip
- `purchase` - Product purchase
- `ad_reward` - Ad network reward
- `account_creation` - Account creation fee
- `premium_upgrade` - Premium plan upgrade
- `gift` - Gift between users

**Example:**
```sql
SELECT record_pi_transaction(
    'profile-uuid',
    'pi_user_mainnet_123',
    'txn_abc123',
    'pay_xyz789',
    'subscription',
    15.00,
    'Premium Plan - Monthly',
    '{"plan": "premium", "billing": "monthly"}'::jsonb
);
```

---

### 3. update_pi_transaction_status()
Updates the status of a Pi transaction.

**Signature:**
```sql
update_pi_transaction_status(
    p_transaction_id TEXT,
    p_status TEXT,
    p_blockchain_txid TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS JSON
```

**Status Values:**
- `pending` - Initial state
- `approved` - User approved in Pi wallet
- `completed` - Transaction completed on blockchain
- `failed` - Transaction failed
- `cancelled` - User cancelled
- `developer_approved` - Developer approved
- `developer_completed` - Developer completed

**Example:**
```sql
-- Mark as approved
SELECT update_pi_transaction_status(
    'txn_abc123',
    'approved'
);

-- Mark as completed with blockchain txid
SELECT update_pi_transaction_status(
    'txn_abc123',
    'completed',
    'blockchain_txid_xyz'
);

-- Mark as failed with error
SELECT update_pi_transaction_status(
    'txn_abc123',
    'failed',
    NULL,
    'Insufficient balance'
);
```

---

### 4. record_pi_ad_interaction()
Records a Pi Ad Network interaction.

**Signature:**
```sql
record_pi_ad_interaction(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_ad_type TEXT,
    p_ad_result TEXT,
    p_reward_granted BOOLEAN DEFAULT false,
    p_reward_amount DECIMAL DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSON
```

**Ad Types:**
- `rewarded` - Rewarded video ad
- `interstitial` - Full-screen ad

**Ad Results:**
- `AD_CLOSED` - User closed ad
- `AD_REWARDED` - User earned reward
- `AD_DISPLAY_ERROR` - Display error
- `AD_NETWORK_ERROR` - Network error
- `AD_NOT_AVAILABLE` - No ad available
- `ADS_NOT_SUPPORTED` - Ads not supported
- `USER_UNAUTHENTICATED` - User not authenticated

**Example:**
```sql
-- Successful rewarded ad
SELECT record_pi_ad_interaction(
    'profile-uuid',
    'pi_user_mainnet_123',
    'rewarded',
    'AD_REWARDED',
    true,
    0.001,
    '{"campaign_id": "camp_123"}'::jsonb
);

-- Failed ad display
SELECT record_pi_ad_interaction(
    'profile-uuid',
    'pi_user_mainnet_123',
    'interstitial',
    'AD_NOT_AVAILABLE',
    false
);
```

---

### 5. get_pi_user_profile()
Retrieves a Pi user profile by identifier.

**Signature:**
```sql
get_pi_user_profile(
    p_identifier TEXT  -- Can be pi_user_id, pi_username, or username
) RETURNS JSON
```

**Example:**
```sql
-- By Pi user ID
SELECT get_pi_user_profile('pi_user_mainnet_123');

-- By Pi username
SELECT get_pi_user_profile('johndoe');

-- By regular username
SELECT get_pi_user_profile('johndoe');
```

**Returns:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "username": "johndoe",
    "pi_user_id": "pi_user_mainnet_123",
    "pi_mainnet_wallet": "GKXYZ123...",
    "wallet_verified": true,
    "has_premium": false,
    "environment": "mainnet",
    ...
  }
}
```

---

## 📊 Common Queries

### Get User's Transaction History
```sql
SELECT 
    transaction_id,
    transaction_type,
    amount,
    status,
    memo,
    blockchain_txid,
    created_at,
    completed_at
FROM pi_transactions
WHERE pi_user_id = 'pi_user_mainnet_123'
ORDER BY created_at DESC
LIMIT 20;
```

### Get Completed Transactions for a Profile
```sql
SELECT 
    t.*,
    p.username,
    p.business_name
FROM pi_transactions t
JOIN profiles p ON t.profile_id = p.id
WHERE t.status = 'completed'
    AND t.network = 'mainnet'
ORDER BY t.completed_at DESC;
```

### Get Total Revenue for a User
```sql
SELECT 
    pi_user_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue
FROM pi_transactions
WHERE pi_user_id = 'pi_user_mainnet_123'
    AND transaction_type IN ('payment', 'subscription', 'purchase')
GROUP BY pi_user_id;
```

### Get Ad Interaction Statistics
```sql
SELECT 
    ad_type,
    ad_result,
    COUNT(*) as interaction_count,
    SUM(CASE WHEN reward_granted THEN 1 ELSE 0 END) as rewards_granted,
    SUM(COALESCE(reward_amount, 0)) as total_rewards
FROM pi_ad_interactions
WHERE pi_user_id = 'pi_user_mainnet_123'
GROUP BY ad_type, ad_result
ORDER BY interaction_count DESC;
```

### Get Pending Transactions
```sql
SELECT 
    t.transaction_id,
    t.payment_id,
    t.amount,
    t.memo,
    p.username,
    t.created_at
FROM pi_transactions t
JOIN profiles p ON t.profile_id = p.id
WHERE t.status = 'pending'
    AND t.network = 'mainnet'
ORDER BY t.created_at ASC;
```

### Get Active Payment Links
```sql
SELECT 
    pl.link_id,
    pl.link_type,
    pl.amount,
    pl.memo,
    pl.current_uses,
    pl.max_uses,
    p.username,
    p.business_name
FROM pi_payment_links pl
JOIN profiles p ON pl.profile_id = p.id
WHERE pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > NOW())
    AND (pl.max_uses IS NULL OR pl.current_uses < pl.max_uses)
ORDER BY pl.created_at DESC;
```

---

## 🔍 Useful Monitoring Queries

### Transaction Success Rate
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) as success_rate
FROM pi_transactions
WHERE network = 'mainnet'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Active Users (Last 24 Hours)
```sql
SELECT 
    COUNT(DISTINCT pi_user_id) as active_users
FROM profiles
WHERE last_pi_auth >= NOW() - INTERVAL '24 hours'
    AND environment = 'mainnet';
```

### Revenue by Transaction Type
```sql
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM pi_transactions
WHERE status = 'completed'
    AND network = 'mainnet'
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY transaction_type
ORDER BY total_amount DESC;
```

### Failed Transactions Analysis
```sql
SELECT 
    error_message,
    COUNT(*) as occurrence_count,
    MAX(created_at) as last_occurrence
FROM pi_transactions
WHERE status = 'failed'
    AND network = 'mainnet'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY occurrence_count DESC;
```

---

## 🔐 Security Best Practices

### 1. Token Management
```sql
-- Check for expired tokens
SELECT 
    id,
    username,
    pi_user_id,
    pi_access_token_expiry,
    EXTRACT(EPOCH FROM (pi_access_token_expiry - NOW())) / 3600 as hours_until_expiry
FROM profiles
WHERE pi_access_token_expiry < NOW() + INTERVAL '1 hour'
    AND environment = 'mainnet';
```

### 2. Wallet Verification Status
```sql
-- Get unverified wallet users
SELECT 
    id,
    username,
    pi_user_id,
    pi_mainnet_wallet,
    wallet_verified,
    created_at
FROM profiles
WHERE pi_mainnet_wallet IS NOT NULL 
    AND pi_mainnet_wallet != ''
    AND wallet_verified = false
    AND environment = 'mainnet';
```

### 3. Audit Trail
```sql
-- Recent profile updates
SELECT 
    id,
    username,
    pi_user_id,
    last_pi_auth,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400 as days_since_creation
FROM profiles
WHERE updated_at >= NOW() - INTERVAL '24 hours'
    AND environment = 'mainnet'
ORDER BY updated_at DESC;
```

---

## 📈 Performance Optimization

### Index Usage Check
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as rows_read,
    idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND (tablename LIKE '%pi_%' OR tablename = 'profiles')
ORDER BY idx_scan DESC;
```

### Table Size Statistics
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
    AND (tablename LIKE '%pi_%' OR tablename = 'profiles')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚨 Emergency Procedures

### Rollback a Transaction
```sql
-- Mark transaction as cancelled
SELECT update_pi_transaction_status(
    'txn_to_cancel',
    'cancelled',
    NULL,
    'Cancelled by admin'
);
```

### Disable Pi Payments for User
```sql
UPDATE profiles 
SET pi_payment_enabled = false
WHERE pi_user_id = 'pi_user_to_disable';
```

### Force Token Refresh
```sql
UPDATE profiles 
SET 
    pi_access_token_expiry = NOW() - INTERVAL '1 hour',
    updated_at = NOW()
WHERE pi_user_id = 'pi_user_to_refresh';
```

---

## 📞 Support Information

- **Pi Network Docs**: https://pi-apps.github.io/community-developer-guide/
- **Pi Ad Network**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **API Key**: `96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5`
- **Validation Key**: `7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a`
- **Network**: Mainnet (Production)

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
