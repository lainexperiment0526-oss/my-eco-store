# Quick Deploy Guide

## Step 1: Login to Supabase

Get your access token from: https://supabase.com/account/tokens

Then run:
```powershell
supabase login --token YOUR_TOKEN_HERE
```

## Step 2: Run Setup Commands

Copy and paste these commands one by one:

```powershell
# Link project
supabase link --project-ref jzzbmoopwnvgxxirulga

# Set secrets
supabase secrets set SUPABASE_URL="https://jzzbmoopwnvgxxirulga.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwMzEyNSwiZXhwIjoyMDc0Nzc5MTI1fQ.BGsSUMxHQPHTNtrbKyPyRRx26CL2Qw3smDDOFYrjtTk"
supabase secrets set PI_API_KEY="6okfd8avdrj2qj9kebfoi5f9qgrzzyagopg1fqygopkfcj2yslb4ai5kkmdenx59"

# Verify secrets
supabase secrets list

# Deploy functions
supabase functions deploy pi-auth --no-verify-jwt
supabase functions deploy pi-payment-approve --no-verify-jwt
supabase functions deploy pi-payment-complete --no-verify-jwt
supabase functions deploy pi-ad-verify --no-verify-jwt
supabase functions deploy subscription --no-verify-jwt

# Check deployment
supabase functions list

# Check logs
supabase functions logs pi-auth --limit 20
supabase functions logs pi-payment-approve --limit 20
supabase functions logs pi-ad-verify --limit 20
```

## What Was Fixed

1. ✅ **Project Config**: Updated to `jzzbmoopwnvgxxirulga`
2. ✅ **JWT Verification**: Disabled for `pi-auth`, `pi-payment-*`, `pi-ad-verify`, `subscription`
3. ✅ **Edge Functions**: Using `SUPABASE_SERVICE_ROLE_KEY` for admin operations
4. ✅ **Secrets**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PI_API_KEY configured
5. ✅ **Pi Ad Network**: `pi-ad-verify` function ready to deploy

## Functions That Will Be Deployed

- **pi-auth**: Authenticates Pi Network users
- **pi-payment-approve**: Approves Pi payments
- **pi-payment-complete**: Completes Pi payments  
- **pi-ad-verify**: Verifies Pi ad network views and rewards
- **subscription**: Manages subscriptions

All functions are configured to work with your custom backend.
