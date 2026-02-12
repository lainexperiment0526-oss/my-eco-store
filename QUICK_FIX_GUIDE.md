# 🚨 CRITICAL FIX - Quick Reference

## Problem
- ❌ Payments timeout: "Payment Expired! The approval process has timed out"
- ❌ Database error: "duplicate key value violates unique constraint"

## Root Cause
1. Old Pi API key in Supabase Edge Functions
2. Database constraint blocking duplicate Pi usernames

## Solution (5 Minutes)

### Option A: Automated (Recommended)
```bash
.\deploy-pi-fixes.bat
```
**Done!** Script handles everything.

### Option B: Manual Steps

#### 1. Update Supabase Secrets (2 min)
```bash
npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
```

#### 2. Apply Database Fix (1 min)
```bash
npx supabase db push
```

#### 3. Redeploy Edge Functions (2 min) ⚠️ **CRITICAL**
```bash
npx supabase functions deploy pi-payment-approve
npx supabase functions deploy pi-payment-complete
```

**Without this step, payments will still timeout!**

---

## Test Immediately
1. Open app in Pi Browser
2. Click Subscribe on any plan
3. Payment dialog should appear in 2-3 seconds
4. Complete payment
5. ✅ Success!

---

## Files Changed
- ✅ `src/config/pi-config.ts` - New API key
- ✅ `.env` - New API key
- ✅ New migration: `20241208000002_fix_duplicate_pi_username.sql`
- ✅ Scripts: `update-pi-secrets.bat`, `deploy-pi-fixes.bat`

---

## Quick Deploy
```bash
.\deploy-pi-fixes.bat
```

## Verify Success
```bash
# Check secrets
npx supabase secrets list | findstr PI_API_KEY

# Should show: PI_API_KEY = b00j4fel...
```

---

**Time to Fix**: 5 minutes  
**Difficulty**: Easy (automated script)  
**Impact**: CRITICAL (fixes payment timeouts)

**Deploy NOW** → Test → ✅ Working!
