# FIX-ALL-FEATURES.sql - Complete Database Setup Guide

## Overview
This comprehensive SQL script fixes and ensures all features work correctly:
- ✅ **Dashboard** - Stats, followers, wallets, products
- ✅ **Public Bio** - Profile display, follower/view counts
- ✅ **Search** - User search with category filters
- ✅ **Followers** - Follow/unfollow system with counts
- ✅ **Card Generator** - QR codes, bio links

## What This Script Does

### 1. **Profiles Table** 
Adds all missing columns needed for features:
- `category` - For search filtering
- `follower_count` - Cached follower count
- `following_count` - Cached following count
- `view_count` / `profile_views_count` - Profile view tracking
- `bio` - User biography text
- `card_*_color` - Card customization colors
- `card_design_data` - Card design JSON
- `is_verified` - Verification badge
- `subscription_status` - 'free', 'basic', 'pro'

### 2. **Followers Table** 
Ensures correct schema with proper constraints:
```sql
followers (
  id, 
  follower_profile_id,      -- Who is following
  following_profile_id,      -- Who they're following
  created_at,
  UNIQUE(follower_profile_id, following_profile_id),
  CHECK (follower_profile_id != following_profile_id)
)
```

### 3. **Analytics Table**
Tracks all events for Dashboard and PublicBio:
- Views, clicks, follows
- IP address, user agent, referrer
- Session tracking

### 4. **Helper Functions**
SQL functions for efficient queries:
- `get_follower_count(profile_id)` - Get follower count
- `get_following_count(profile_id)` - Get following count
- `get_view_count(profile_id)` - Get view count
- `is_following(follower_id, following_id)` - Check follow status

### 5. **Indexes**
Performance indexes for:
- Follower queries: `follower_profile_id`, `following_profile_id`
- Search: `username`, `business_name`, `category`
- Analytics: `profile_id`, `event_type`, `created_at`

### 6. **Security (RLS)**
Row-level security policies for:
- `followers` - Public read, authenticated insert/delete
- `analytics` - Public insert, profile-owner read
- `user_wallets` - Authenticated only

## How to Apply

### Option 1: Supabase Dashboard SQL Editor
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy entire contents of `FIX-ALL-FEATURES.sql`
5. Paste and execute

### Option 2: Command Line (psql)
```bash
psql postgresql://user:password@db.supabase.co:5432/postgres < FIX-ALL-FEATURES.sql
```

### Option 3: Supabase CLI
```bash
supabase db push
# Place FIX-ALL-FEATURES.sql in supabase/migrations/
```

## Frontend Integration

### Dashboard.tsx
- Fetches profile data with follower/view counts
- Displays wallet balances
- Shows products and links

### PublicBio.tsx
- Displays profile with all fields
- Shows follower count from `followers` table
- Tracks views in `analytics` table
- Follow/unfollow button works with proper constraints

### CardGenerator.tsx
- Fetches full profile data after Pi auth
- Shows follower count
- QR code links to `/@username`

### UserSearchPage.tsx
- Filters by `category`
- Sorts by `follower_count`, `created_at`
- Full-text search on `username`, `business_name`

## Database Schema Verification

After running the script, verify with these queries:

```sql
-- Check profiles columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check followers structure
SELECT * FROM public.followers LIMIT 1;

-- Check row counts
SELECT 'profiles' as table, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'followers', COUNT(*) FROM public.followers
UNION ALL
SELECT 'analytics', COUNT(*) FROM public.analytics;
```

## Feature-by-Feature Checklist

### Dashboard ✓
- [ ] Profile loads with full data
- [ ] Follower count displays
- [ ] Wallet balance shows
- [ ] Products list appears
- [ ] View count updates

### Public Bio ✓
- [ ] Profile displays correctly
- [ ] Follower count accurate
- [ ] Follow button works
- [ ] View count increments
- [ ] Social links display

### Search ✓
- [ ] Search by username works
- [ ] Category filter works
- [ ] Results sort by followers
- [ ] Recent searches save

### Card Generator ✓
- [ ] Pi auth loads profile
- [ ] Follower count shows
- [ ] QR code generates
- [ ] Link to `/@username`

## Troubleshooting

### "Column doesn't exist" error
- Run FIX-ALL-FEATURES.sql first
- Check column names are snake_case in SQL, but accessed as-is in TypeScript

### Followers not showing
- Verify `followers` table has correct schema
- Check RLS policies are enabled
- Ensure `follower_profile_id` and `following_profile_id` are used correctly

### Search not working
- Verify `category` column exists
- Check indexes are created
- Ensure `LOWER()` function works for case-insensitive search

### View counts not updating
- Insert events into `analytics` table
- Verify `event_type = 'view'` filter
- Check RLS policies allow inserts

## Performance Tips

1. **Indexes are pre-created** - No need to add manually
2. **Cached counts** - `follower_count`, `view_count` updated regularly
3. **Functions** - Use provided functions instead of COUNT() queries
4. **Analytics** - Archive old events periodically to keep table lean

## Security Notes

- RLS enabled on all tables
- Follower operations require authentication
- Views can be public (tracked anonymously)
- Wallets only visible to owner

## Questions?

Check these files for integration details:
- `src/pages/Dashboard.tsx` - Dashboard features
- `src/pages/PublicBio.tsx` - Public bio features
- `src/pages/UserSearchPage.tsx` - Search features
- `src/pages/CardGenerator.tsx` - Card generator features

---

**Status**: ✅ Ready to Deploy
**Last Updated**: December 27, 2025
