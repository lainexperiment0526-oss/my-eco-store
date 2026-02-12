# Fix Notifications Column Error

## Issue
The error `column "payload" of relation "notifications" does not exist` is appearing because:
1. The notifications table exists but is missing the `payload` JSONB column
2. Database functions are trying to insert into this missing column

## Solution
A migration has been created at: `supabase/migrations/20251225_add_payload_to_notifications.sql`

## Steps to Apply Fix

### Option 1: Using Supabase Dashboard (Recommended for Testnet)
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the entire content from the migration file
5. Click **"Run"**
6. Wait for success message

### Option 2: Using Supabase CLI
```bash
# In your project root
supabase migration up
```

## What the Migration Does
1. ✅ Adds `payload JSONB` column to notifications table
2. ✅ Updates `fn_notify_followers()` function to insert correct columns
3. ✅ Updates `fn_notify_messages()` function to insert correct columns
4. ✅ Refreshes the schema cache (NOTIFY pgrst)

## After Applying
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R)
3. The error should be gone!

## Verification
Run this in Supabase SQL Editor to verify:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY column_name;
```

Should see these columns:
- id (uuid)
- created_at (timestamp with time zone)
- profile_id (uuid)
- title (text)
- message (text)
- type (text)
- is_read (boolean)
- action_url (text)
- **payload (jsonb)** ← This is what we added
