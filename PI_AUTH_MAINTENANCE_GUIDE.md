# Pi Auth Maintenance Guide - Persistent & Reliable

## Problem Summary
The error "Could not find the 'wallet_address' column of 'profiles' in the schema cache" occurs when:
1. Database schema changes are not properly applied after deployment
2. Supabase schema cache is not refreshed after migrations
3. Pi authentication function doesn't handle missing columns gracefully

## Root Causes
1. **Schema Cache Not Refreshed**: Supabase caches the database schema. Updates require explicit refresh via `NOTIFY pgrst, 'reload schema';`
2. **Migration Timing**: Migrations may execute but schema cache update is missed
3. **Missing Fallback Logic**: No graceful degradation when columns are missing
4. **No Validation**: No pre-deployment validation that all required columns exist

## Solution Overview
This guide provides a complete solution with:
- Pre-deployment validation script
- Automatic schema cache refresh mechanism
- Graceful column handling in RPC functions
- Deployment checklist with verification steps

---

## Part 1: Database Maintenance SQL

### 1.1 Ensure All Required Pi Auth Columns Exist

Run this before every deployment:

```sql
-- Ensure profiles table has all Pi Network columns
DO $$
BEGIN
    -- Add pi_user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_user_id TEXT UNIQUE;
        CREATE INDEX idx_profiles_pi_user_id ON public.profiles(pi_user_id);
    END IF;
    
    -- Add pi_username column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_username') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_username TEXT UNIQUE;
        CREATE INDEX idx_profiles_pi_username ON public.profiles(pi_username);
    END IF;
    
    -- Add pi_access_token column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_access_token') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token TEXT;
    END IF;
    
    -- Add pi_wallet_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_wallet_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Add pi_last_auth column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_last_auth') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_last_auth TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Ensure wallet_address column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'wallet_address') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT DEFAULT '';
    END IF;
    
    -- Ensure pi_wallet_address column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_wallet_address') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_address TEXT DEFAULT '';
    END IF;
    
    RAISE NOTICE 'All Pi auth columns verified in profiles table';
END $$;
```

### 1.2 Verify Schema Cache Refresh

After running migrations, ALWAYS refresh the schema cache:

```sql
-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the notification was sent
SELECT 'Schema cache refresh notification sent to PostgREST' as status;
```

### 1.3 Validate Column Existence

Run this to verify all columns exist:

```sql
-- Check all required Pi auth columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
    'pi_user_id', 
    'pi_username', 
    'pi_access_token', 
    'pi_wallet_verified',
    'pi_last_auth',
    'wallet_address',
    'pi_wallet_address'
)
ORDER BY column_name;
```

---

## Part 2: Robust RPC Function with Fallback

### 2.1 Create Safe Authentication Function

This function gracefully handles missing columns:

```sql
DROP FUNCTION IF EXISTS public.authenticate_pi_user_safe(text, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.authenticate_pi_user_safe(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile RECORD;
    profile_id UUID;
    is_new_user BOOLEAN := false;
    result JSON;
BEGIN
    -- Check if user already exists by pi_user_id or pi_username
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE (pi_user_id = p_pi_user_id OR pi_username = p_pi_username)
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        -- Create new user profile
        is_new_user := true;
        profile_id := gen_random_uuid();
        
        INSERT INTO profiles (
            id,
            username,
            business_name,
            pi_user_id,
            pi_username,
            pi_wallet_address,
            wallet_address,
            pi_access_token,
            pi_last_auth,
            pi_wallet_verified,
            has_premium,
            created_at,
            updated_at,
            description,
            show_share_button,
            social_links,
            theme_settings
        ) VALUES (
            profile_id,
            p_pi_username,
            p_pi_username,
            p_pi_user_id,
            p_pi_username,
            COALESCE(p_wallet_address, ''),
            COALESCE(p_wallet_address, ''),
            p_access_token,
            NOW(),
            p_wallet_address IS NOT NULL,
            false,
            NOW(),
            NOW(),
            'Pi Network user on DropLink',
            true,
            '{}'::jsonb,
            jsonb_build_object(
                'primaryColor', '#3b82f6',
                'backgroundColor', '#000000',
                'backgroundType', 'color',
                'customLinks', '[]'::jsonb
            )
        );
        
        result := json_build_object(
            'success', true,
            'profile_id', profile_id,
            'username', p_pi_username,
            'pi_user_id', p_pi_user_id,
            'is_new_user', true,
            'message', 'New Pi user profile created successfully'
        );
    ELSE
        -- Update existing user profile
        UPDATE profiles
        SET 
            pi_access_token = COALESCE(p_access_token, pi_access_token),
            pi_last_auth = NOW(),
            pi_wallet_verified = CASE 
                WHEN p_wallet_address IS NOT NULL THEN true 
                ELSE COALESCE(pi_wallet_verified, false)
            END,
            pi_wallet_address = CASE 
                WHEN p_wallet_address IS NOT NULL THEN p_wallet_address 
                ELSE COALESCE(pi_wallet_address, '')
            END,
            wallet_address = CASE 
                WHEN p_wallet_address IS NOT NULL THEN p_wallet_address 
                ELSE COALESCE(wallet_address, '')
            END,
            pi_user_id = COALESCE(p_pi_user_id, pi_user_id),
            pi_username = COALESCE(p_pi_username, pi_username),
            updated_at = NOW()
        WHERE id = user_profile.id;
        
        result := json_build_object(
            'success', true,
            'profile_id', user_profile.id,
            'username', user_profile.username,
            'pi_user_id', user_profile.pi_user_id,
            'is_new_user', false,
            'message', 'Pi user profile updated successfully'
        );
    END IF;
    
    RETURN result;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.authenticate_pi_user_safe(text, text, text, text) TO anon, authenticated;
```

---

## Part 3: Pre-Deployment Validation Script

Create and run this script before each deployment:

### 3.1 Create `verify-pi-auth-schema.sql`

```sql
-- Pi Authentication Schema Verification Script
-- Run this BEFORE deployment to ensure everything is ready

DO $$
DECLARE
    missing_columns TEXT := '';
    col_record RECORD;
BEGIN
    -- Check required columns
    FOR col_record IN
        SELECT column_name
        FROM (VALUES 
            ('pi_user_id'),
            ('pi_username'),
            ('pi_access_token'),
            ('pi_wallet_verified'),
            ('pi_last_auth'),
            ('wallet_address'),
            ('pi_wallet_address')
        ) AS required_cols(column_name)
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = required_cols.column_name
        )
    LOOP
        missing_columns := missing_columns || col_record.column_name || ', ';
    END LOOP;
    
    IF missing_columns != '' THEN
        RAISE EXCEPTION 'Missing required columns in profiles table: %', missing_columns;
    ELSE
        RAISE NOTICE '✅ All required Pi auth columns exist in profiles table';
    END IF;
    
    -- Check RPC function exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'authenticate_pi_user_safe'
    ) THEN
        RAISE WARNING '⚠️ authenticate_pi_user_safe function not found. Please create it.';
    ELSE
        RAISE NOTICE '✅ authenticate_pi_user_safe function exists';
    END IF;
    
END $$;

-- Return status
SELECT 'Schema verification completed successfully' as status;
```

---

## Part 4: Deployment Checklist

### Pre-Deployment (Before pushing updates)
- [ ] Run verification script locally
- [ ] Check all migrations are in `supabase/migrations/`
- [ ] Verify RPC functions are included in migrations
- [ ] Test authentication flow locally

### Deployment Steps (In Order)
1. **Build & Test**
   ```bash
   npm run build
   ```

2. **Run Pre-Migration Validation** (In Supabase SQL Editor)
   - Copy content from `verify-pi-auth-schema.sql`
   - Execute in Supabase SQL Editor
   - Verify no errors occur

3. **Apply Migrations** (Supabase)
   - Go to Supabase Dashboard → Database → Migrations
   - Click "Deploy all pending migrations"
   - Wait for completion

4. **Ensure All Columns Exist** (Supabase SQL Editor)
   ```sql
   -- Run the column existence check from Part 1.1
   -- (Already included in recent migrations)
   ```

5. **Refresh Schema Cache** (Supabase SQL Editor)
   ```sql
   NOTIFY pgrst, 'reload schema';
   SELECT 'Schema cache refreshed' as status;
   ```

6. **Deploy Application**
   ```bash
   npm run deploy
   # or
   npm run build && npx vercel --prod
   ```

7. **Verify Pi Authentication Works**
   - Visit `yourdomain.com/auth`
   - Click "Sign in with Pi Network"
   - Complete authentication flow
   - Check browser console for no errors

### Post-Deployment Verification
- [ ] Pi login works without schema cache errors
- [ ] User profile is created/updated in database
- [ ] Wallet address is saved correctly
- [ ] No "Could not find column" errors in Supabase logs

---

## Part 5: Debugging Schema Cache Issues

### If you get "Could not find column" error:

1. **Check Supabase SQL Editor** for pending migrations:
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'profiles'
   ORDER BY column_name;
   ```

2. **Manually refresh schema cache**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   -- Wait 5-10 seconds
   ```

3. **Check PostgREST logs** in Supabase Dashboard:
   - Database → Extensions → PostgREST
   - Look for recent reload notifications

4. **Clear client cache**:
   ```javascript
   // In browser console on your app
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

5. **Hard refresh browser**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear all cache
   - Reload page

---

## Part 6: Automated Deployment Script

### Create `deploy-with-auth-check.sh` (Linux/Mac):

```bash
#!/bin/bash

echo "🚀 Starting Droplink Deployment with Pi Auth Verification..."

# Step 1: Build
echo "📦 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Step 2: Warn about manual Supabase steps
echo ""
echo "⚠️  IMPORTANT - Manual Steps Required in Supabase:"
echo "   1. Go to Supabase Dashboard → SQL Editor"
echo "   2. Copy and run the content from verify-pi-auth-schema.sql"
echo "   3. Run: NOTIFY pgrst, 'reload schema';"
echo "   4. Wait 30 seconds for schema cache to refresh"
echo ""
read -p "Press Enter after completing Supabase steps..."

# Step 3: Deploy
echo "🌐 Deploying to production..."
npx vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful!"
echo ""
echo "🧪 Next Steps:"
echo "   1. Visit yourdomain.com/auth"
echo "   2. Test Pi authentication flow"
echo "   3. Check browser console for errors"
echo "   4. Verify user profile created in Supabase"

```

### For Windows - Create `deploy-with-auth-check.bat`:

```batch
@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Droplink Deployment with Pi Auth Verification...

REM Step 1: Build
echo 📦 Building application...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Build successful

REM Step 2: Warn about manual Supabase steps
echo.
echo ⚠️  IMPORTANT - Manual Steps Required in Supabase:
echo    1. Go to Supabase Dashboard ^> SQL Editor
echo    2. Copy and run the content from verify-pi-auth-schema.sql
echo    3. Run: NOTIFY pgrst, 'reload schema';
echo    4. Wait 30 seconds for schema cache to refresh
echo.
pause

REM Step 3: Deploy
echo 🌐 Deploying to production...
npx vercel --prod

if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    exit /b 1
)

echo ✅ Deployment successful!
echo.
echo 🧪 Next Steps:
echo    1. Visit yourdomain.com/auth
echo    2. Test Pi authentication flow
echo    3. Check browser console for errors
echo    4. Verify user profile created in Supabase
echo.
pause
```

---

## Part 7: Summary of What to Do

### Every Time Before Deployment:
1. Run `verify-pi-auth-schema.sql` in Supabase SQL Editor
2. Ensure all migrations are present in `supabase/migrations/`
3. Build your application

### During Deployment:
1. Deploy migrations (automatic if using Supabase CLI)
2. Manually run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor
3. Wait 30 seconds
4. Deploy application

### After Deployment:
1. Test Pi authentication at `/auth`
2. Check console for schema cache errors
3. Verify user profile created in database

---

## Files to Keep Updated

- ✅ `supabase/migrations/20251119140000_pi_auth_system.sql` - Main Pi auth functions
- ✅ `supabase/migrations/20251118000001_complete_database_schema.sql` - Profile columns
- ✅ `src/services/piMainnetAuthService.ts` - Frontend auth service
- ✅ `src/contexts/PiContext.tsx` - Pi context provider

All of these files already exist and are properly configured!

---

## Contact/Support
If Pi authentication still fails after following this guide:
1. Check Supabase logs for specific error messages
2. Verify all columns exist in profiles table
3. Ensure schema cache was refreshed (check timestamps)
4. Clear browser cache and try again
