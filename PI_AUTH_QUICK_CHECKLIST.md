# Pi Auth - Quick Deployment Checklist ⚡

## Problem
"Could not find the 'wallet_address' column of 'profiles' in the schema cache"

## Root Cause
Supabase caches database schema. After migrations, the cache must be manually refreshed.

---

## ✅ Quick Fix (Do This Every Time You Deploy)

### Step 1: Build Your App
```bash
npm run build
```

### Step 2: Verify Schema in Supabase (Takes 2 minutes)
1. Open Supabase Dashboard
2. Click **Database** → **SQL Editor**
3. **Create New Query** and paste this:
   ```sql
   -- Copy from: verify-pi-auth-schema.sql file
   ```
4. Click **RUN**
5. Wait for all checks to complete (see green ✅)

### Step 3: Refresh Schema Cache (Critical!)
Copy and paste in a NEW SQL query:
```sql
NOTIFY pgrst, 'reload schema';
SELECT 'Schema cache refreshed at ' || NOW()::text as status;
```
Click **RUN** and wait 30 seconds.

### Step 4: Deploy App
```bash
npm run deploy
# OR use our script:
deploy-with-pi-auth-check.bat
```

### Step 5: Test Pi Auth
- Visit https://yourdomain.com/auth
- Click "Sign in with Pi Network"
- Should work without schema errors!

---

## 🚨 If It Still Fails

### Check 1: Verify Columns Exist
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'pi_%';
```
Should show: pi_user_id, pi_username, pi_access_token, pi_wallet_verified, pi_last_auth

### Check 2: Function Exists
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'authenticate_pi_user_safe';
```
Should return 1 result

### Check 3: Clear Browser Cache
Press: **Ctrl + Shift + Delete** → Select "All time" → Clear

### Check 4: Check Supabase Logs
Database → Logs → Look for errors

---

## 📋 Files You Need

| File | Purpose |
|------|---------|
| `verify-pi-auth-schema.sql` | Run in Supabase to setup columns & function |
| `deploy-with-pi-auth-check.bat` | Windows deployment script (runs build + prompts for Supabase steps) |
| `PI_AUTH_MAINTENANCE_GUIDE.md` | Detailed troubleshooting guide |

---

## 🎯 Summary

**Before every deployment:**
1. ✅ Build app
2. ✅ Run `verify-pi-auth-schema.sql` in Supabase
3. ✅ Run `NOTIFY pgrst, 'reload schema';` in Supabase
4. ✅ Wait 30 seconds
5. ✅ Deploy app
6. ✅ Test Pi login

**That's it!** Pi auth will work reliably.

---

## 💡 Pro Tips

- **Save time**: Use `deploy-with-pi-auth-check.bat` to automate steps 1 & 5
- **Always wait 30 seconds** after running NOTIFY before deploying
- **Bookmark this file** for quick reference
- **Test immediately** after deployment to catch issues early

---

## Need Help?

See `PI_AUTH_MAINTENANCE_GUIDE.md` for detailed troubleshooting and explanation of what's happening.
