# Supabase Environment Setup Guide

## Quick Setup (Automated)

Run the PowerShell script:

```powershell
cd "c:\Users\SIBIYA GAMING\droplink-testnet-35167-4"
powershell -ExecutionPolicy Bypass -File setup-supabase-env.ps1
```

---

## Manual Setup Steps

### 1. Install Supabase CLI

**Windows (Scoop):**
```powershell
scoop install supabase
```

**Windows (Direct Download):**
Download from: https://github.com/supabase/cli/releases

**Verify Installation:**
```powershell
supabase --version
```

---

### 2. Login to Supabase

```powershell
supabase login
```

A browser window will open. Login with your Supabase account.

---

### 3. Link to Your Project

```powershell
cd "c:\Users\SIBIYA GAMING\droplink-testnet-35167-4"
supabase link --project-ref idkjfuctyukspexmijvb
```

You'll be asked to enter your database password.

---

### 4. Set Environment Secrets

**Critical: Set PI_API_KEY for payment functions**

```powershell
supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
```

**Verify secrets:**
```powershell
supabase secrets list
```

Expected output:
```
NAME         CREATED AT
PI_API_KEY   2025-12-10...
```

---

### 5. Deploy Edge Functions

Deploy payment functions:

```powershell
# Pi Payment Approval
supabase functions deploy pi-payment-approve --no-verify-jwt

# Pi Payment Completion
supabase functions deploy pi-payment-complete --no-verify-jwt

# Pi Authentication
supabase functions deploy pi-auth --no-verify-jwt

# Profile Update
supabase functions deploy profile-update --no-verify-jwt
```

**Verify deployments:**
```powershell
supabase functions list
```

---

### 6. Check Database Migrations

```powershell
# View migration status
supabase migration list

# Apply pending migrations (if any)
supabase db push
```

---

## Alternative: Supabase Dashboard Setup

If you don't want to use CLI, you can set secrets via the dashboard:

### Setting PI_API_KEY via Dashboard

1. Go to: https://supabase.com/dashboard/project/idkjfuctyukspexmijvb
2. Click **Settings** (left sidebar)
3. Click **Edge Functions**
4. Click **Secrets** tab
5. Click **New Secret**
6. Enter:
   - **Name:** `PI_API_KEY`
   - **Value:** `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`
7. Click **Save**

### Deploying Functions via Dashboard

1. Go to: https://supabase.com/dashboard/project/idkjfuctyukspexmijvb
2. Click **Edge Functions** (left sidebar)
3. For each function (`pi-payment-approve`, `pi-payment-complete`):
   - Click the function name
   - Click **Deploy**
   - Select the latest version
   - Click **Deploy**

---

## Environment Variables Summary

### Local Development (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Pi Network
VITE_PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
VITE_PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54...
```

### Supabase Secrets (Edge Functions)

Required for serverless functions:

| Secret Name | Value | Used By |
|-------------|-------|---------|
| `PI_API_KEY` | `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz` | Payment functions |

---

## Verification Checklist

After setup, verify:

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Logged into Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] `PI_API_KEY` secret set (`supabase secrets list`)
- [ ] Edge functions deployed (`supabase functions list`)
- [ ] Database migrations applied (`supabase migration list`)
- [ ] Local `.env` file configured
- [ ] Test payment in app works

---

## Testing the Setup

### Test 1: Verify Secrets

```powershell
supabase secrets list
```

Expected: Should show `PI_API_KEY`

### Test 2: Check Function Logs

```powershell
supabase functions serve pi-payment-approve
```

Then test a payment in your app and watch the logs.

### Test 3: Database Connection

```powershell
supabase db pull
```

Should download current schema without errors.

### Test 4: End-to-End Payment Test

1. Open app in Pi Browser
2. Go to Subscription page
3. Select a plan
4. Complete payment
5. Check Supabase Dashboard → Edge Functions → Logs

Expected: See approval and completion logs

---

## Troubleshooting

### "Command not found: supabase"

**Solution:** Install Supabase CLI
```powershell
scoop install supabase
```

### "Project not linked"

**Solution:** Link the project
```powershell
supabase link --project-ref idkjfuctyukspexmijvb
```

### "PI_API_KEY not configured" error in logs

**Solution:** Set the secret
```powershell
supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
```

Then redeploy functions:
```powershell
supabase functions deploy pi-payment-approve --no-verify-jwt
supabase functions deploy pi-payment-complete --no-verify-jwt
```

### "Payment approval timeout"

**Cause:** Edge functions not deployed or secrets not set

**Solution:**
1. Verify secrets are set
2. Redeploy functions
3. Check function logs in dashboard

### "Profile not found" on public pages

**Cause:** Database hasn't synced or profile not created

**Solution:**
1. Login to dashboard
2. Check if profile is created in profiles table
3. If not, logout and login again to trigger profile creation

---

## Quick Commands Reference

```powershell
# Setup
supabase login
supabase link --project-ref idkjfuctyukspexmijvb

# Secrets
supabase secrets set PI_API_KEY=<your-key>
supabase secrets list

# Functions
supabase functions deploy <function-name> --no-verify-jwt
supabase functions list
supabase functions serve <function-name>  # Local testing

# Database
supabase db pull
supabase db push
supabase migration list

# Status
supabase status
```

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase CLI:** https://supabase.com/docs/guides/cli
- **Pi Network:** https://pi-apps.github.io/community-developer-guide/
- **Dashboard:** https://supabase.com/dashboard/project/idkjfuctyukspexmijvb

---

**Setup Complete!** 🎉

Your Supabase environment is now configured for Pi Network payments and authentication.
