# How to Deploy Your Schema to Supabase

Your Supabase project has lost its schema. Follow these steps to restore it:

## Quick Deploy via Dashboard (Recommended)

### Step 1: Access Your SQL Editor
1. Open your browser and go to: https://supabase.com/dashboard
2. Select your project: **droplink-testnet-35167**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query** button

### Step 2: Copy the Schema
Open the file `supabase/full_user_data_schema.sql` and copy ALL the SQL code.

### Step 3: Paste and Execute
1. Paste the SQL into the query editor
2. Click the **RUN** button (or press Ctrl+Enter)
3. Wait for completion (should take a few seconds)

### Step 4: Verify
Go to **Table Editor** to see your new tables:
- ✓ profiles
- ✓ activity_logs
- ✓ profile_changes
- ✓ user_links
- ✓ payments
- ✓ subscriptions

---

## Deploy via Script (Advanced)

If you prefer automated deployment:

```bash
# Make sure you have Node.js installed
node deploy-schema.mjs
```

Or via npm/yarn:
```bash
npm run deploy-schema
```

---

## Your Supabase Credentials

- **URL**: https://idkjfuctyukspexmijvb.supabase.co
- **Project ID**: idkjfuctyukspexmijvb
- **API Key**: [Found in .env.production]

---

## Tables Being Created

### 1. profiles
User profile information with Pi Network integration

### 2. activity_logs
Track user actions for audit trails

### 3. profile_changes
Historical record of profile modifications

### 4. user_links
Store user's custom links/URLs

### 5. payments
Payment transaction records

### 6. subscriptions
User subscription plans and status

---

## Troubleshooting

**Q: Tables still not showing?**
- Clear your browser cache
- Refresh the Supabase dashboard
- Check the SQL execution returned no errors

**Q: Foreign key errors?**
- Make sure you run ALL statements (tables must be created in order)
- Don't skip the profiles table - it's referenced by others

**Q: Need to delete and retry?**
Run this in SQL Editor first:
```sql
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS user_links CASCADE;
DROP TABLE IF EXISTS profile_changes CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

Then run the full schema again.

---

**Need help?** Check the Supabase docs: https://supabase.com/docs
