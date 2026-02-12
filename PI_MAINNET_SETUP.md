# DropLink Pi Network Mainnet Setup Guide

## ✅ Configuration Complete

The DropLink application has been configured for **Pi Network Mainnet** with proper payment scope support.

### Updated Configuration Details

#### **1. Pi Configuration (`src/config/pi-config.ts`)**

| Setting | Value | Purpose |
|---------|-------|---------|
| **API_KEY** | `96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5` | Mainnet API authentication |
| **Network** | `mainnet` | Running on Pi Network mainnet (NOT sandbox) |
| **SANDBOX_MODE** | `false` | MAINNET enabled - REAL Pi payments |
| **SDK Version** | `2.0` | Latest Pi SDK version |
| **Scopes** | `['username', 'payments', 'wallet_address']` | Required for subscriptions & tips |
| **Validation Key** | `7511661aac...` | Pi Network app validation |
| **Platform URL** | `https://droplink.space` | Official DropLink domain |

#### **2. Manifest Configuration (`public/manifest.json`)**

```json
{
  "pi_app": {
    "api_key": "96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5",
    "validation_key": "7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a",
    "version": "2.0",
    "name": "DropLink",
    "domain": "droplink.space",
    "network": "mainnet",
    "mainnet_ready": true,
    "browser_detection": true,
    "validation_url": "https://droplink.space/validation-key.txt"
  }
}
```

#### **3. Validation Key File (`public/validation-key.txt`)**

Contains the validation key for Pi Network app verification:
```
7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

---

## 🔐 Payment Scopes Explained

### Required Scopes for DropLink Features

```typescript
scopes: ['username', 'payments', 'wallet_address']
```

1. **`username`** - Allows user identification and profile creation
   - Used for account creation and login
   - Required for user profile management

2. **`payments`** - Enables real Pi Network payments
   - Subscription upgrades (Basic, Premium, Pro plans)
   - Allows users to pay from their Pi wallet
   - **MAINNET ONLY** - Real Pi coins are transferred

3. **`wallet_address`** - Access to user's Pi wallet
   - Display wallet address for tips/donations
   - Enable Pi tips functionality
   - Show wallet balance and transaction history

---

## 🚀 Payment Flow with Proper Scopes

### User Authentication with All Scopes

```typescript
// In Dashboard.tsx on Pi auth modal
await signIn(["username", "payments", "wallet_address"]);

// OR explicit scope request
const result = await signIn(['username', 'payments', 'wallet_address']);
```

### Subscription Payment Flow

1. **User clicks "Subscribe"** → Shows payment confirmation
2. **Pi SDK requests approval** with `payments` scope
3. **User authorizes payment** in Pi Browser
4. **Payment is processed** (REAL Pi deducted from wallet)
5. **Server approves & completes** transaction
6. **Subscription recorded** in database with transaction ID
7. **User gets access** to premium features

### Sample Payment Request

```typescript
// From Subscription.tsx
const result = await createPayment(
  price,  // e.g., 10 Pi for Basic monthly
  `Droplink ${planName} ${isYearly ? 'Yearly' : 'Monthly'} Subscription`,
  {
    subscriptionPlan: planName.toLowerCase(),
    billingPeriod: isYearly ? 'yearly' : 'monthly',
    username: piUser.username,
    profileId: profileId,
    type: 'subscription'
  }
);
```

---

## 📊 Pi Network API Endpoints (Mainnet)

All endpoints configured in `PI_CONFIG.ENDPOINTS`:

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **ME** | `/v2/me` | Get authenticated user info |
| **PAYMENTS** | `/v2/payments` | Create/manage payments |
| **WALLETS** | `/v2/wallets` | Access wallet information |
| **TRANSACTIONS** | `/v2/transactions` | View transaction history |
| **OPERATIONS** | `/v2/operations` | Stellar operations |
| **FEE_STATS** | `/v2/fee_stats` | Network fee information |

**Base URL:** `https://api.minepi.com` (Mainnet only)

---

## ⚠️ Important: MAINNET vs SANDBOX

### Current Configuration: **MAINNET** ✅

```typescript
SANDBOX_MODE: false  // ✅ MAINNET - Real Pi coins
```

| Feature | Mainnet | Sandbox |
|---------|---------|---------|
| Real Pi Coins | ✅ **YES** | ❌ NO |
| Payment Processing | ✅ **Real** | ❌ Mock |
| User Wallet | ✅ **Real Pi** | ❌ Test Pi |
| Fee Processing | ✅ **Real** | ❌ Simulated |
| Data Persistence | ✅ **Real DB** | ❌ Test DB |

### ⚠️ CRITICAL: Never Use Sandbox for Production

If you accidentally enable sandbox mode:
```typescript
SANDBOX_MODE: true  // ❌ WRONG - Use for testing only
```

This will:
- Use TEST Pi coins only
- Prevent real payments
- Show "mock" payment dialogs
- Not record real transactions

---

## 🔍 Verification Checklist

✅ **API Configuration**
- [x] Mainnet API key: `96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5`
- [x] SANDBOX_MODE: `false`
- [x] Network: `mainnet`

✅ **Scope Configuration**
- [x] Scopes include: `username`, `payments`, `wallet_address`
- [x] Payment scope enabled for subscriptions
- [x] Wallet scope enabled for tips

✅ **Manifest Configuration**
- [x] api_key matches Pi config
- [x] validation_key present and correct
- [x] network: `mainnet`
- [x] mainnet_ready: `true`

✅ **Validation Setup**
- [x] Validation key file: `public/validation-key.txt`
- [x] Validation URL: `https://droplink.space/validation-key.txt`

✅ **Payment Processing**
- [x] Subscription payments use REAL Pi
- [x] Server approval/completion callbacks configured
- [x] Transaction IDs recorded in database
- [x] User notifications at each stage (approval → completion → success)

---

## 🛠️ Testing Mainnet Payments

### Prerequisites
- Pi Browser (official app)
- Pi Network account with wallet
- Some Pi coins in wallet (minimum payment amount)
- Connected to Mainnet in Pi Browser settings

### Test Steps

1. **Open DropLink in Pi Browser**
   ```
   https://droplink.space
   ```

2. **Sign In with Pi Auth**
   - Scopes requested: username, payments, wallet_address
   - Approve in Pi Browser

3. **Navigate to Plans**
   - Click "My Plan" button or go to `/subscription`

4. **Select a Paid Plan**
   - Choose Basic (10π), Premium (20π), or Pro (30π)
   - Monthly or Yearly

5. **Confirm Payment**
   - Dialog: "REAL Pi PAYMENT - $X Pi"
   - Click Confirm

6. **Pi Browser Payment Dialog**
   - Shows payment request
   - You approve with your Pi password
   - Payment processes on mainnet

7. **Verify Results**
   - Toast notification: "✅ Payment completed successfully!"
   - Check database: `subscriptions` table shows new record
   - Check wallet: Pi coins deducted from balance
   - Dashboard: Plan displays as active with expiry date

---

## 📚 Additional Resources

- **Pi Developer Guide**: https://pi-apps.github.io/community-developer-guide/
- **Pi Platform Docs**: https://github.com/pi-apps/pi-platform-docs
- **Pi Ad Network**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **Sandbox (Testing)**: https://sandbox.minepi.com/app/droplink-317d26f51b67e992

---

## 🚨 Troubleshooting

### "Pi Browser Required"
- Open in official Pi Browser only
- Not available in Chrome, Firefox, etc.

### "Payment Failed - Insufficient Funds"
- User needs more Pi in wallet
- Check wallet balance in Pi Browser

### "Scope Not Approved"
- User may have denied `payments` or `wallet_address` scope
- Have them sign in again and approve all scopes
- Or use `signIn(['username', 'payments', 'wallet_address'])`

### "Transaction Failed on Server"
- Check Supabase logs for `pi-payment-approve` function
- Verify validation key is correct
- Check API key has proper permissions

### "Payment Shows Success but No Database Update"
- Check Supabase `subscriptions` table
- Verify profile_id matches user profile
- Check server function logs

---

## 📝 Summary

DropLink is now **fully configured for Pi Network Mainnet** with:
- ✅ Real Pi payment processing
- ✅ Proper payment scope authorization
- ✅ Subscription system with database persistence
- ✅ Transaction tracking with blockchain confirmation
- ✅ User notifications at each payment stage
- ✅ Mainnet-only configuration (sandbox disabled)

**Users can now subscribe with real Pi coins!** 🎉
