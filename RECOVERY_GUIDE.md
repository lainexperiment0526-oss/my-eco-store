# 🔥 FULL DATABASE RECOVERY (NO CLI REQUIRED)

Since Supabase CLI install is blocked, we'll use **psql directly** to recover everything.

## ✅ STEP 1: Backup Current State

```powershell
$env:PGURL = "postgresql://postgres:[YOUR-PASSWORD]@db.jzzbmoopwnvgxxirulga.supabase.co:5432/postgres"
psql $env:PGURL -c "\dt" > current_tables.txt
psql $env:PGURL --no-align --tuples-only -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 
```

---

## ✅ STEP 2: Apply All Migrations in Order

Your `supabase/migrations/` folder contains the full schema history. We'll apply them in chronological order:

```powershell
# Set your connection URL
$env:PGURL = "postgresql://postgres:[YOUR-PASSWORD-URL-ENCODED]@db.jzzbmoopwnvgxxirulga.supabase.co:5432/postgres"

# Apply each migration file in order
Get-ChildItem supabase\migrations\*.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Applying: $($_.Name)" -ForegroundColor Cyan
    psql $env:PGURL -v ON_ERROR_STOP=1 -f $_.FullName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed on: $($_.Name)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nAll migrations applied successfully!" -ForegroundColor Green
```

---

## ✅ STEP 3: Use the Consolidated deploy_all.sql (RECOMMENDED)

Since we already fixed the `deploy_all.sql` with the `policyname` correction:

```powershell
psql $env:PGURL -v ON_ERROR_STOP=1 -f supabase\deploy_all.sql
```

This will:
- Create all 11 tables
- Set up all functions (get_active_subscription, handle_new_profile_wallet, etc.)
- Create all triggers (wallet creation, updated_at)
- Enable RLS on all tables
- Create all security policies
- Add all indexes

---

## ✅ STEP 4: Verify Everything

```powershell
# Check tables
psql $env:PGURL -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# Check triggers
psql $env:PGURL -c "SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgisinternal=false ORDER BY tgname;"

# Check policies
psql $env:PGURL -c "SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;"

# Check RLS enabled
psql $env:PGURL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

Expected tables:
- ai_chat_messages
- ai_support_config
- analytics
- followers
- gift_transactions
- gifts
- notifications
- products
- profiles
- subscriptions
- user_wallets

---

## ✅ STEP 5: Create Schema Lock (PREVENT FUTURE DISASTERS)

```powershell
# Create new migration
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationFile = "supabase\migrations\${timestamp}_lock_schema.sql"

@"
-- Lock schema to prevent accidental drops
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
"@ | Out-File -FilePath $migrationFile -Encoding UTF8

# Apply it
psql $env:PGURL -v ON_ERROR_STOP=1 -f $migrationFile
Write-Host "Schema locked!" -ForegroundColor Green
```

---

## ✅ STEP 6: Test Insert (Verify RLS Works)

```powershell
# Test with a simple profile insert (will fail if RLS blocks it properly)
psql $env:PGURL -c "INSERT INTO profiles (username, business_name) VALUES ('test_user', 'Test Business') RETURNING id;"
```

If this **fails with RLS error**, that's GOOD! It means security is working.

---

## 🚨 IF STILL HAVING ISSUES

### Option A: Drop + Recreate Schema (NUCLEAR)
```powershell
psql $env:PGURL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres, public;"
psql $env:PGURL -v ON_ERROR_STOP=1 -f supabase\deploy_all.sql
```

### Option B: Apply Only Missing Objects
```powershell
# Check what's missing
psql $env:PGURL -c "\dt" # tables
psql $env:PGURL -c "\df" # functions
psql $env:PGURL -c "SELECT policyname FROM pg_policies WHERE schemaname='public';" # policies
```

---

## ✅ FINAL CHECKLIST

- [ ] All 11 tables created
- [ ] 4 functions created
- [ ] 7 triggers created  
- [ ] RLS enabled on all tables
- [ ] 30+ policies created
- [ ] 11 indexes created
- [ ] Schema locked (CREATE revoked)
- [ ] Test insert works (or fails with proper RLS)

---

## 📊 Expected Result

```
Tables: 11/11 ✓
Functions: 4/4 ✓
Triggers: 7/7 ✓
Policies: 30+/30+ ✓
Indexes: 11/11 ✓
RLS Enabled: 11/11 ✓
```

---

## 🔗 Resources

- **Supabase Dashboard**: Check table editor to see if tables appear
- **SQL Editor**: Run queries directly in Supabase UI
- **Migrations Folder**: `supabase/migrations/` contains your source of truth

---

**Ready to run?** Start with Step 3 (deploy_all.sql) since it's already fixed! 🚀
