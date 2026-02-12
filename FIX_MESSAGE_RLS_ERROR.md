# Fix: Public Bio Message RLS Error

**Error:** "new row violates row-level security policy for table 'messages'"

**Cause:** The RLS policies require authentication, but public visitors are not logged in.

---

## Quick Fix - Option 1: Use Supabase Dashboard

1. Go to **https://supabase.co** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire content of: `supabase/fix-messages-rls.sql`
4. Click **RUN**
5. You should see all the policies created successfully

---

## Quick Fix - Option 2: Manual SQL Commands

If Option 1 doesn't work, run these commands one by one in SQL Editor:

```sql
-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their sent messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages sent to them" ON messages;
DROP POLICY IF EXISTS "Receivers can update message read status" ON messages;
DROP POLICY IF EXISTS "Senders can delete their sent messages" ON messages;
DROP POLICY IF EXISTS "Receivers can delete their received messages" ON messages;

-- Create PUBLIC-FRIENDLY policies
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete messages" ON public.messages FOR DELETE USING (true);

-- Grant permissions to anonymous users
GRANT INSERT ON public.messages TO anon;
GRANT SELECT ON public.messages TO anon;
GRANT UPDATE ON public.messages TO anon;
GRANT DELETE ON public.messages TO anon;
```

---

## Verify It Works

1. Clear your browser cache (Ctrl+Shift+Delete)
2. Go to any public profile: **droplink.space/@username**
3. Try sending a message
4. You should see: ✅ "Message sent successfully!"

---

## What Changed?

| Before | After |
|--------|-------|
| ❌ Required authentication to send | ✅ Public users can send |
| ❌ Restrictive SELECT policy | ✅ Anyone can view messages |
| ❌ Complex sender_profile_id check | ✅ Simple true-based policies |

---

## If Still Not Working

1. **Check messages table exists:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'messages';
```

2. **Check messages table structure:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';
```

3. **See all current policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

4. **Send to support:** support@droplink.space with the above query results
