# 🔧 Fix: Missing Notifications Table

## Error
```
ERROR: 42P01: relation "public.notifications" does not exist
```

## Root Cause
The notifications table was defined in migrations but never actually created in your Supabase database. This is a common issue when migrations aren't applied to the database.

## Solution
A complete migration has been created: `supabase/migrations/20251225000100_create_notifications_table.sql`

---

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended for Testnet)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Navigate to: **SQL Editor**
   - Click: **"New Query"**

3. **Copy the Migration SQL**
   - Open: `supabase/migrations/20251225000100_create_notifications_table.sql`
   - Copy ALL the content

4. **Paste into SQL Editor**
   - Click in the SQL Editor box
   - Paste the entire migration (Ctrl+V)

5. **Run the Query**
   - Click: **"Run"** button (or Ctrl+Enter)
   - Wait for success message

6. **Verify Success**
   - Should see: ✅ notifications table created successfully
   - No red error messages

### Option 2: Using Supabase CLI

```bash
# In your project directory
cd c:\Users\SIBIYA GAMING\Downloads\droplink-testnet-35167

# Push migrations
supabase migration up

# Or if using Docker
docker-compose exec supabase supabase migration up
```

### Option 3: Using Node.js/JavaScript

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

const sql = ` [PASTE THE ENTIRE MIGRATION CONTENT HERE] `

const { data, error } = await supabase.rpc('execute_raw_sql', {
  sql: sql
})

if (error) console.error('Error:', error)
else console.log('✅ Migration applied:', data)
```

---

## What This Migration Does

### ✅ Creates notifications table with:
- `id` - UUID primary key
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)
- `profile_id` - Reference to user profile
- `title` - Notification title
- `message` - Notification message
- `type` - Type of notification (info, success, warning, error, follow, message, gift, payment)
- `is_read` - Boolean flag for read status
- `action_url` - Optional URL to navigate to
- `payload` - JSONB data field (for flexible data)
- `delivered` - Boolean for delivery status
- `delivery_channel` - How notification was delivered
- `webhook_url` - Optional webhook URL

### ✅ Creates indexes for:
- profile_id (fast lookups by user)
- is_read (fast filtering of unread)
- created_at (fast sorting by date)
- type (fast filtering by notification type)

### ✅ Sets up Row Level Security:
- Users can only view their own notifications
- Users can only insert/update their own notifications

### ✅ Creates triggers:
- Auto-updates `updated_at` field on changes

### ✅ Grants permissions:
- Both authenticated and anonymous users can access

### ✅ Reloads schema cache:
- PostgREST knows about the new table immediately

---

## Testing the Fix

### Step 1: Apply Migration
Follow "How to Apply" section above

### Step 2: Verify Table Exists
Run this query in SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY column_name;
```

**Expected output:**
```
action_url | text
created_at | timestamp with time zone
delivery_channel | text
delivered | boolean
id | uuid
is_read | boolean
message | text
payload | jsonb
profile_id | uuid
title | text
type | text
updated_at | timestamp with time zone
webhook_url | text
```

### Step 3: Test Insert
```sql
-- Insert a test notification
INSERT INTO public.notifications (
    profile_id, 
    title, 
    message, 
    type, 
    payload
)
VALUES (
    (SELECT id FROM public.profiles LIMIT 1),
    'Test Notification',
    'This is a test',
    'info',
    '{"test": true}'
);
```

**Expected:** No errors, 1 row inserted

### Step 4: Test Select
```sql
-- Query the notification
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 1;
```

**Expected:** See your test notification

### Step 5: Check App
- Go to your app URL
- Reload page (Ctrl+Shift+R hard reload)
- No more "relation does not exist" errors

---

## If Migration Fails

### Error: "relation already exists"
- The table already exists (that's good!)
- Problem is likely permissions or schema
- Run: `NOTIFY pgrst, 'reload schema';` to refresh cache

### Error: "permission denied"
- Check that you're using a role with DDL permissions
- Use: Service Role key (not anon key)
- Dashboard SQL Editor should work

### Error: "profiles table doesn't exist"
- profiles table needs to be created first
- Run migrations in order:
  1. profiles table
  2. Other base tables
  3. notifications table

---

## Related Issues Fixed

This migration also:
- ✅ Adds `payload` column (fixes earlier error)
- ✅ Adds proper RLS policies
- ✅ Creates all necessary indexes
- ✅ Sets up auto-update triggers

---

## Configuration After Fix

Make sure your `.env` has:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## Troubleshooting

### Q: Still getting "relation does not exist" error?
**A:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R)
3. Restart dev server
4. Run schema reload: `NOTIFY pgrst, 'reload schema';`

### Q: Can I delete and recreate the table?
**A:** Yes, but only if no data needs to be preserved:
```sql
DROP TABLE IF EXISTS public.notifications CASCADE;
-- Then run the migration again
```

### Q: How do I check if migration was applied?
**A:** Run this in SQL Editor:
```sql
SELECT version FROM _migrations 
WHERE name LIKE '%notifications%';
```

---

## Next Steps

1. ✅ Apply the migration
2. ✅ Verify table exists
3. ✅ Clear browser cache
4. ✅ Reload app
5. ✅ Test notification functionality

**The error should be gone!** 🎉

---

## Files Related

- 📄 `supabase/migrations/20251225000100_create_notifications_table.sql` - The migration
- 📄 `supabase/migrations/20251225_add_payload_to_notifications.sql` - Payload column fix
- 📄 `FIX_NOTIFICATIONS_PAYLOAD.md` - Previous related fix

---

## Questions?

- Check SQL Editor for error messages
- Verify columns match the migration
- Ensure profiles table exists first
- Check that you have proper permissions

**Support**: All steps and troubleshooting covered above.
