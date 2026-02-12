# Supabase Login Instructions

## Option 1: Login with Personal Access Token (Recommended - No Browser)

1. **Generate a token:**
   - Go to: https://supabase.com/account/tokens
   - Click "Generate New Token"
   - Copy the token

2. **Login with token:**
   ```powershell
   supabase login --token YOUR_TOKEN_HERE
   ```

## Option 2: Browser Login (Alternative)

If the browser method works for you:
```powershell
supabase login
```
Then press Enter when prompted to open the browser.

## After Login

Once logged in, run this to complete setup:
```powershell
.\setup-secrets.ps1
.\deploy-edge-functions.ps1
```

## Manual Commands (if scripts don't work)

```powershell
# 1. Link project
supabase link --project-ref jzzbmoopwnvgxxirulga

# 2. Set secrets (run these one by one)
supabase secrets set SUPABASE_URL="https://jzzbmoopwnvgxxirulga.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_FROM_ENV"
supabase secrets set PI_API_KEY="YOUR_PI_API_KEY_FROM_ENV"

# 3. Deploy functions
supabase functions deploy pi-auth --no-verify-jwt
supabase functions deploy pi-payment-approve --no-verify-jwt
supabase functions deploy pi-payment-complete --no-verify-jwt
supabase functions deploy subscription --no-verify-jwt

# 4. Verify
supabase secrets list
supabase functions list
```
