# Fix: authenticate_pi_user RPC Function Missing

## Problem
The error message indicates that the `authenticate_pi_user` RPC function is missing from your Supabase database:
```
Could not find the function public.authenticate_pi_user(p_access_token, p_pi_user_id, p_pi_username)
```

## Solution
The function has been defined but needs to be deployed to your Supabase database. You have two options:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **+ New Query**
4. Copy and paste the contents of `fix-authenticate-pi-user.sql`
5. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI
1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Run the SQL file against your database:
   ```bash
   supabase db push fix-authenticate-pi-user.sql
   ```

### Option 3: Using psql (If you have direct database access)
```bash
psql -h db.xxxxxx.supabase.co -U postgres -d postgres -f fix-authenticate-pi-user.sql
```

## What the Function Does
The `authenticate_pi_user` function:
1. Accepts Pi user credentials (pi_user_id, pi_username, access_token, wallet_address)
2. Checks if the user already exists in the profiles table
3. Creates a new profile if the user is new
4. Updates the existing profile if the user already exists
5. Returns a JSON response with success status and profile information

## Function Signature
```sql
authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT (optional)
) -> JSON
```

## Parameters
- **p_pi_user_id**: Unique Pi Network user ID
- **p_pi_username**: Pi Network username (human-readable)
- **p_access_token**: Valid Pi access token for authentication
- **p_wallet_address** (optional): User's Pi wallet address

## Response Format
### Success
```json
{
    "success": true,
    "profile_id": "uuid",
    "username": "username",
    "pi_user_id": "pi_id",
    "is_new_user": true/false,
    "message": "Profile created/updated successfully"
}
```

### Error
```json
{
    "success": false,
    "error": "error message",
    "message": "Error authenticating Pi user: ..."
}
```

## Troubleshooting

### If you still get "function not found" error:
1. Verify the function was created:
   - Go to **SQL Editor** → **Functions** in Supabase Dashboard
   - Look for `authenticate_pi_user` in the list
   
2. If it's not there, try executing the SQL again
3. Make sure the function is in the `public` schema

### If you get permission errors:
The function includes grant statements for both `anon` and `authenticated` roles:
```sql
GRANT EXECUTE ON FUNCTION public.authenticate_pi_user(...) TO anon, authenticated;
```

This allows both anonymous and authenticated users to call the function.

### If the profiles table structure is different:
The function expects these columns in the profiles table:
- id (UUID)
- username (TEXT)
- business_name (TEXT)
- pi_user_id (TEXT)
- pi_username (TEXT)
- pi_wallet_address (TEXT)
- pi_access_token (TEXT)
- pi_last_auth (TIMESTAMP)
- pi_wallet_verified (BOOLEAN)
- has_premium (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- description (TEXT)
- show_share_button (BOOLEAN)
- social_links (JSONB)
- theme_settings (JSONB)
- crypto_wallets (JSONB)
- bank_details (JSONB)
- youtube_video_url (TEXT)

If your table structure differs, the function may need to be modified.

## Next Steps
After applying the fix:
1. Try signing in again with Pi Network
2. The function should now properly authenticate your Pi user
3. Your profile should be created/updated in Supabase
4. Check the browser console for confirmation messages

## File Location
- SQL Fix File: `fix-authenticate-pi-user.sql`
- Original Migration: `supabase/migrations/20251119140000_pi_auth_system.sql`
