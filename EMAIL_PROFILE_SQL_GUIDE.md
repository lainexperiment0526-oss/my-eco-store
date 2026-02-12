# Gmail Profile SQL Setup Guide

## Quick Apply (Recommended)

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste from `apply-email-migration.sql`
6. Click **Run** (or press F5)

### Option 2: Full Migration File

For production, use the full migration:
```bash
# File: supabase/migrations/20251216000000_add_email_to_profiles.sql
```

Copy to your Supabase project and apply via CLI:
```bash
supabase db push
```

## What This SQL Does

### 1. Adds Email Column
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;
```
- Stores user email addresses
- Used for email/Gmail authentication

### 2. Adds Auth Method Tracking
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pi_network';
```
Tracks how users signed up:
- `pi_network` - Pi Network authentication
- `email` - Email/password
- `google` - Gmail OAuth
- `github` - GitHub OAuth

### 3. Syncs Existing Data
```sql
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;
```
- Copies email from Supabase auth.users
- Updates existing profiles

### 4. Creates Indexes
```sql
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE UNIQUE INDEX idx_profiles_email_unique ON public.profiles(email);
```
- Faster email lookups
- Ensures unique emails

### 5. Auto-Sync Trigger
```sql
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();
```
- Automatically syncs email changes
- Keeps profiles in sync with auth.users

## Verify Installation

After running the SQL, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email', 'auth_method');

-- Check existing profiles
SELECT id, username, email, auth_method 
FROM profiles 
LIMIT 5;
```

## Usage Examples

### Create Profile for Gmail User
```sql
INSERT INTO profiles (id, username, business_name, email, auth_method)
VALUES (
  'user-uuid-here',
  'john_doe',
  'John Doe',
  'john@gmail.com',
  'google'
);
```

### Update Auth Method
```sql
UPDATE profiles 
SET auth_method = 'email' 
WHERE email = 'user@example.com';
```

### Find Gmail Users
```sql
SELECT username, email, created_at 
FROM profiles 
WHERE auth_method = 'google' 
ORDER BY created_at DESC;
```

### Find All Email-Based Users
```sql
SELECT username, email, auth_method, created_at 
FROM profiles 
WHERE auth_method IN ('email', 'google') 
ORDER BY created_at DESC;
```

## Schema After Migration

```typescript
profiles {
  id: UUID
  username: VARCHAR
  business_name: VARCHAR
  email: TEXT                    // ✅ NEW
  auth_method: TEXT              // ✅ NEW (pi_network, email, google, github)
  user_id: UUID
  pi_user_id: TEXT              // For Pi Network users
  pi_username: TEXT             // For Pi Network users
  pi_wallet_address: TEXT
  pi_wallet_verified: BOOLEAN
  has_premium: BOOLEAN
  logo: TEXT
  description: TEXT
  social_links: JSONB
  crypto_wallets: JSONB
  bank_details: JSONB
  theme_settings: JSONB
  youtube_video_url: TEXT
  pi_donation_message: TEXT
  show_share_button: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## Troubleshooting

### Error: Column already exists
**Cause**: Migration already ran
**Solution**: This is fine! The `IF NOT EXISTS` clause prevents errors.

### Error: Permission denied
**Cause**: Insufficient database permissions
**Solution**: Run in Supabase SQL Editor (has full permissions)

### Profiles missing email
**Cause**: User hasn't signed in since migration
**Solution**: Run the UPDATE query to sync existing data:
```sql
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;
```

### Duplicate email error
**Cause**: Multiple profiles with same email
**Solution**: Check and clean duplicates:
```sql
SELECT email, COUNT(*) 
FROM profiles 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Update TypeScript Types (Optional)

After migration, regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id idkjfuctyukspexmijvb > src/integrations/supabase/types.ts
```

Or manually add to types:
```typescript
profiles: {
  Row: {
    // ... existing fields
    email: string | null
    auth_method: 'pi_network' | 'email' | 'google' | 'github'
  }
}
```

## Next Steps

After applying SQL:
1. ✅ Test admin page sign-up at `/admin-mrwain`
2. ✅ Verify email is stored in profiles table
3. ✅ Test Google OAuth (if configured)
4. ✅ Check auth_method is set correctly

## Files Created

- `supabase/migrations/20251216000000_add_email_to_profiles.sql` - Full migration
- `apply-email-migration.sql` - Quick apply script
- `EMAIL_PROFILE_SQL_GUIDE.md` - This guide

---

**Status**: Ready to apply ✅  
**Time to Apply**: 10 seconds  
**Risk Level**: Low (uses IF NOT EXISTS)
