# 🧪 Database and Public Sharing Test Script

## Step 1: Execute Database Migrations

### Run in Supabase SQL Editor:

```sql
-- First, run the core migration:
-- Copy all content from: supabase/migrations/20251111083853_remix_migration_from_pg_dump.sql

-- Then run the enhancements:
-- Copy all content from: supabase/migrations/20251118000002_pi_network_enhancements.sql
```

## Step 2: Test Database Setup

### Verify Tables Exist:
```sql
-- Check if core tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'products', 'analytics', 'followers', 
  'subscriptions', 'gifts', 'user_wallets', 'notifications',
  'custom_domains', 'link_icons', 'referral_codes', 'backup_exports'
);
```

### Test Functions:
```sql
-- Test public profile function
SELECT * FROM get_public_profile('testuser');

-- Test analytics tracking
SELECT track_profile_view('testuser', '127.0.0.1', 'test-agent', 'US', 'New York');
```

## Step 3: Test Application

### Local Development:
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:8084`
3. Authenticate with Pi Network or Email
4. Create/update your profile
5. Test public share link: `http://localhost:8084/u/[your-username]`

### Test Cases:

#### ✅ Profile Creation:
- [ ] Pi Network auth creates profile automatically
- [ ] Email auth creates profile automatically  
- [ ] Profile data saves to database
- [ ] No more "table not found" errors

#### ✅ Public Sharing:
- [ ] `/u/[username]` works without authentication
- [ ] `/profile/[username]` works without authentication
- [ ] `/:username` works without authentication
- [ ] Analytics tracking records page views
- [ ] Social links, products, and wallets display correctly

#### ✅ Pi Network Integration:
- [ ] Sandbox mode enabled (check console: "Sandbox Mode Enabled")
- [ ] Pi authentication works
- [ ] Pi donations work on public profiles
- [ ] Pi user data saves to database

#### ✅ Database Features:
- [ ] Followers system works
- [ ] Gift system works
- [ ] Analytics tracking works
- [ ] Notifications system works
- [ ] All CRUD operations work

## Step 4: Production Deployment

### Vercel Environment Variables:
```
VITE_SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
VITE_SUPABASE_ANON_KEY=[your_anon_key]
VITE_PI_API_KEY=[your_pi_api_key]  
VITE_OPENROUTER_API_KEY=[your_openrouter_key]
```

### Test Production URLs:
- Dashboard: `https://your-domain.vercel.app/`
- Public Profile: `https://your-domain.vercel.app/u/[username]`
- Alternative: `https://your-domain.vercel.app/profile/[username]`

## 🎯 Success Criteria:

### Database Setup Complete:
- ✅ All tables created without errors
- ✅ RLS policies active and working
- ✅ Functions created and executable
- ✅ Triggers and indexes in place

### Public Sharing Working:
- ✅ Anyone can access public profile URLs
- ✅ No authentication required for viewing
- ✅ Analytics tracking works for anonymous users
- ✅ Pi Network features work on public profiles
- ✅ SEO-friendly URLs and meta tags

### Pi Network Integration:
- ✅ Sandbox mode consistently enabled
- ✅ Authentication creates real database records
- ✅ Payments and donations work
- ✅ User data stored securely

## 🚨 Troubleshooting:

### Common Issues:
1. **"Table not found"** - Database migration not executed
2. **"Function not found"** - Enhancement migration not run  
3. **Public links 404** - Vercel routing not configured
4. **Pi sandbox inconsistent** - Browser cache, refresh app

### Debug Commands:
```sql
-- Check table exists
SELECT * FROM profiles LIMIT 1;

-- Check functions exist  
SELECT proname FROM pg_proc WHERE proname LIKE 'get_public%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test public access
SELECT * FROM get_public_profile('testuser');
```

## 📊 Expected Database Schema:

After setup, you should have:
- **11 Core Tables** (profiles, products, analytics, etc.)
- **4 Enhanced Tables** (notifications, domains, etc.)
- **5+ Functions** (public profile, analytics, etc.)
- **20+ RLS Policies** (secure but public-friendly)
- **10+ Indexes** (optimized performance)
- **5+ Triggers** (auto-updates)

**Once all tests pass, your Droplink app is production-ready with full database backend and public sharing! 🚀**