# DropLink Pi Network Mainnet - Full Environment Setup

## ✅ Current Status

Your `.env` file has been configured for **Pi Network Mainnet** with:
- ✓ `VITE_PI_PAYMENTS_ENABLED=true` (enabled)
- ✓ `VITE_PI_MAINNET_MODE=true` (mainnet, not sandbox)
- ✓ `VITE_PI_SANDBOX_MODE=false` (production mode)
- ✓ `VITE_PI_NETWORK=mainnet` (mainnet network)
- ✓ All Pi API keys and validation keys configured
- ✓ Ad Network enabled: `VITE_PI_AD_NETWORK_ENABLED=true`

## 📋 Setup Checklist

### 1. **Set Supabase Edge Function Secrets** ⚠️ REQUIRED

Run the setup script to configure backend secrets:

```powershell
.\setup-supabase-secrets.ps1
```

This will set:
- `PI_API_KEY` → Used by pi-payment-approve & pi-payment-complete
- `SUPABASE_URL` → Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` → Backend access to database
- `SUPABASE_JWT_SECRET` → Token verification
- `PI_PAYMENT_RECEIVER_WALLET` → Payment destination wallet

**Manual Alternative** (if script fails):
```bash
supabase secrets set PI_API_KEY "6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59"
supabase secrets set SUPABASE_URL "https://jzzbmoopwnvgxxirulga.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwMzEyNSwiZXhwIjoyMDc0Nzc5MTI1fQ.BGsSUMxHQPHTNtrbKyPyRRx26CL2Qw3smDDOFYrjtTk"
supabase secrets set SUPABASE_JWT_SECRET "D3no6l6ZrwGN1uI7b3h2E74uXEnKTm+rNJI6nPjay/Uy8ZPo8ApMP2xhunVoxMA4E+YCuDg//O+jYVwfRrebTg=="
supabase secrets set PI_PAYMENT_RECEIVER_WALLET "GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ"
```

### 2. **Deploy Updated Edge Functions** ✨

```bash
supabase functions deploy pi-auth pi-payment-approve pi-payment-complete pi-ad-verify
```

**What these functions do:**
- `pi-auth`: Authenticates Pi Network users → creates/updates profiles in Supabase
- `pi-payment-approve`: Approves Pi payment with Pi API
- `pi-payment-complete`: Completes payment & creates subscription
- `pi-ad-verify`: Validates rewarded ads & distributes DROP tokens

### 3. **Verify Pi App Configuration**

Run verification script:
```powershell
.\verify-pi-config.ps1
```

This checks:
- ✓ `VITE_PI_API_KEY` matches `PI_API_KEY` in .env
- ✓ `VITE_PI_VALIDATION_KEY` matches `DOMAIN_VALIDATION_KEY`
- ✓ Public manifest.json has correct Pi app keys
- ✓ public/validation-key.txt has correct validation key

### 4. **Build & Deploy Frontend**

```bash
bun run build
```

Deployment options:
- **Vercel**: Connected via Git (auto-deploy on push)
- **Custom**: Upload `dist/` folder to your host
- **Local testing**: `bun run dev` or `bun run preview`

### 5. **Test the Integration in Pi Browser**

#### Test Pi Authentication
1. Open your app in Pi Browser (Pi Network mobile app)
2. Click "Sign in with Pi Network"
3. Approve the authentication popup
4. Verify you're logged in and profile appears

**Expected logs** (check with `supabase functions logs --project-ref <ref> pi-auth`):
```
✅ Pi user verified: {uid, username, ...}
✅ Profile created/updated
```

#### Test Pi Payments
1. Navigate to a payment feature (subscription or premium content)
2. Click payment button
3. Approve payments scope if prompted
4. Complete the payment flow
5. Check console logs and function logs

**Expected behavior:**
- Payment dialog appears
- After user approves: `pi-payment-approve` function logs approval
- After blockchain confirmation: `pi-payment-complete` function creates subscription
- Subscription created in Supabase `subscriptions` table
- Profile shows active subscription

#### Test Pi Ad Network
1. Navigate to rewarded ads section
2. Click "Watch Rewarded Ad"
3. Complete viewing the ad
4. DROP tokens should be credited to wallet

**Expected logs** (check `supabase functions logs --project-ref <ref> pi-ad-verify`):
```
[AD] Ad completed successfully
[REWARD] DROP tokens distributed
```

---

## 🔧 Environment Variables Reference

### Frontend (Vite - bundled into client)
```env
# Pi Network Config (Mainnet)
VITE_PI_MAINNET_MODE=true              # Use mainnet
VITE_PI_SANDBOX_MODE=false             # NOT sandbox
VITE_PI_NETWORK=mainnet                # Network name
VITE_PI_NETWORK_PASSPHRASE="Pi Mainnet"

# Pi App Keys (from Pi Dashboard)
VITE_PI_API_KEY=6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59
VITE_PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a

# Feature Toggles
VITE_PI_AUTHENTICATION_ENABLED=true    # Enable Pi auth
VITE_PI_PAYMENTS_ENABLED=true          # Enable payments ← IMPORTANT
VITE_PI_REWARDED_ADS_ENABLED=true      # Enable rewarded ads
VITE_PI_AD_NETWORK_ENABLED=true        # Enable ad network

# Payment Settings
VITE_PI_PAYMENT_RECEIVER_WALLET=GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ
VITE_PI_MIN_PAYMENT_AMOUNT=0.01
VITE_PI_MAX_PAYMENT_AMOUNT=10000
VITE_PI_PAYMENT_TIMEOUT=60000

# Ad Network Settings
VITE_PI_AD_COOLDOWN_MINUTES=5          # Cooldown between ads
VITE_PI_AD_FREQUENCY_CAP=3             # Max ads per period
VITE_PI_AD_NETWORK_VERSION=2.0

# Supabase (Frontend SDK)
VITE_SUPABASE_URL=https://jzzbmoopwnvgxxirulga.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (Edge Functions - set in Supabase Secrets)
```env
# Required for all edge functions
PI_API_KEY=6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59
SUPABASE_URL=https://jzzbmoopwnvgxxirulga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role)
SUPABASE_JWT_SECRET=D3no6l6ZrwGN1uI7b3h2E74uXEnKTm+rNJI6nPjay/...

# Optional
PI_PAYMENT_RECEIVER_WALLET=GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ
```

---

## ❌ Common Issues & Fixes

### "Payments scope not granted"
**Cause**: User didn't approve `payments` permission  
**Fix**: Sign out and re-authenticate, approve all permissions including payments

### "PI_API_KEY not configured"
**Cause**: Secret not set in Supabase  
**Fix**: Run `setup-supabase-secrets.ps1` or manually set in Dashboard → Settings → Edge Functions → Secrets

### Payment stuck in "pending"
**Cause**: `pi-payment-approve` or `pi-payment-complete` failing  
**Fix**: Check function logs: `supabase functions logs --project-ref <ref> pi-payment-approve`

### Ad rewards not credited
**Cause**: `pi-ad-verify` failing or DROP token distribution issue  
**Fix**: Check DROP wallet table exists, verify ad ID is being passed correctly, check function logs

### CORS errors with Edge Functions
**Cause**: Missing CORS headers in function response  
**Fix**: Already fixed in updated functions (includes `Access-Control-Allow-Methods: POST, OPTIONS`)

### "Invalid Pi access token"
**Cause**: Using sandbox token on mainnet, or token expired  
**Fix**: Ensure `VITE_PI_MAINNET_MODE=true`, `VITE_PI_SANDBOX_MODE=false`, re-authenticate

---

## 📊 Database Tables Required

Ensure these tables exist in Supabase:

```sql
-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  username TEXT UNIQUE,
  pi_user_id TEXT UNIQUE,
  business_name TEXT,
  profile_photo TEXT,
  ...
);

-- Payment idempotency (prevents duplicate charges)
CREATE TABLE IF NOT EXISTS payment_idempotency (
  payment_id TEXT PRIMARY KEY,
  profile_id UUID,
  status TEXT ('pending', 'approved', 'completed', 'failed'),
  txid TEXT,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  profile_id UUID PRIMARY KEY,
  plan_type TEXT,
  billing_period TEXT,
  pi_amount DECIMAL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT,
  auto_renew BOOLEAN
);

-- DROP token wallets
CREATE TABLE IF NOT EXISTS drop_wallets (
  id UUID PRIMARY KEY,
  profile_id UUID,
  wallet_address TEXT,
  balance DECIMAL,
  ...
);
```

---

## 🚀 Quick Deploy Command

All-in-one deployment:
```bash
# 1. Setup secrets
.\setup-supabase-secrets.ps1

# 2. Deploy functions
supabase functions deploy pi-auth pi-payment-approve pi-payment-complete pi-ad-verify

# 3. Build frontend
bun run build

# 4. Test locally
bun run preview
```

---

## 📚 References

- [Pi Network Documentation](https://pi-apps.github.io/community-developer-guide/)
- [Pi Payment API](https://pi-apps.github.io/community-developer-guide/#payment-api)
- [Pi Ad Network](https://github.com/pi-apps/pi-platform-docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✨ Success Indicators

You're ready when:
- ✅ All secrets set in Supabase
- ✅ All edge functions deployed without errors
- ✅ Frontend builds successfully
- ✅ Can sign in with Pi Network in Pi Browser
- ✅ Can complete a payment flow
- ✅ Profile appears in Supabase `profiles` table
- ✅ Payment recorded in `payment_idempotency` table
- ✅ Subscription created in `subscriptions` table
- ✅ Ad clicks trigger `pi-ad-verify` logs
