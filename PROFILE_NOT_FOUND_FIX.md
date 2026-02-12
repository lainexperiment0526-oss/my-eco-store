# 🚨 Profile Not Found - Complete Fix Guide

## 🎯 **Root Cause**
Your store URL is showing "Profile Not Found" because:
1. **Database tables haven't been set up yet**
2. **Your profile hasn't been created in the database**
3. **Missing database migration scripts**

## ✅ **Quick Diagnosis**

### **Step 1: Check Database Status**
Visit: `http://localhost:8084/debug`

This debug page will show you:
- ✅ Database tables status
- ✅ Profiles count  
- ✅ Authentication status
- ✅ Any errors

### **Step 2: Set Up Database (REQUIRED)**

1. **Go to Supabase Dashboard**:
   - Visit: [https://app.supabase.com/](https://app.supabase.com/)
   - Select project: `idkjfuctyukspexmijvb`
   - Navigate to **SQL Editor**

2. **Run Core Migration**:
   ```sql
   -- Copy ALL content from: supabase/migrations/20251111083853_remix_migration_from_pg_dump.sql
   -- Paste into SQL Editor and click "Run"
   ```

3. **Run Enhancement Migration**:
   ```sql
   -- Copy ALL content from: supabase/migrations/20251118000002_pi_network_enhancements.sql
   -- Paste into SQL Editor and click "Run"
   ```

### **Step 3: Create Your Profile**

After database setup:
1. **Refresh your app**: `http://localhost:8084`
2. **Sign in** with Pi Network or Email
3. **Profile auto-created** - check console for success messages
4. **Test your store URL**: `http://localhost:8084/u/[your-username]`

## 🔧 **Manual Profile Creation** (If Auto-Creation Fails)

### **Via Debug Page**:
1. Go to `/debug`
2. Make sure you're signed in
3. Click **"Create Test Profile"**
4. Test the generated URL

### **Via SQL (Advanced)**:
```sql
-- Replace these values with your actual data
INSERT INTO public.profiles (
  user_id,
  username,
  business_name,
  description,
  social_links,
  theme_settings
) VALUES (
  'YOUR_USER_ID_HERE',
  'your_username',
  'Your Business Name',
  'Your description here',
  '{}',
  '{"primaryColor": "#3b82f6", "backgroundColor": "#000000"}'
);
```

## 🎯 **Common Issues & Solutions**

### **Issue 1: "Table does not exist"**
**Solution**: Run the database migrations (Step 2 above)

### **Issue 2: "Profile auto-creation failed"**
**Solution**: 
1. Check console errors
2. Use debug page to create test profile
3. Verify authentication works

### **Issue 3: "Username already exists"**
**Solution**: 
1. Choose a different username
2. Check existing profiles in debug page

### **Issue 4: "Permission denied"**
**Solution**: Database migrations will set up proper permissions

## 📋 **Verification Checklist**

After fixing:
- [ ] Visit `/debug` - should show ✅ green status
- [ ] Your profile should appear in profiles list
- [ ] Visit `/u/[username]` - should load your store
- [ ] No "Profile Not Found" error
- [ ] Follow buttons work (when signed in)

## 🎨 **Store URL Formats**

Once working, your store will be accessible via:
- **Primary**: `http://localhost:8084/u/[username]`
- **Alternative**: `http://localhost:8084/profile/[username]`
- **Direct**: `http://localhost:8084/[username]`

## 🚀 **Production Deployment**

For production (Vercel):
1. **Set Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
   VITE_SUPABASE_ANON_KEY=[your_anon_key]
   VITE_PI_API_KEY=[your_pi_api_key]
   ```

2. **Same database setup** (migrations run once)
3. **Test production URLs**: `https://your-domain.vercel.app/u/[username]`

## 🆘 **If Still Having Issues**

1. **Check browser console** for detailed error messages
2. **Visit `/debug`** for system diagnostics
3. **Verify Supabase project** is the correct one (`idkjfuctyukspexmijvb`)
4. **Check database permissions** in Supabase dashboard
5. **Try creating profile manually** via debug page

## 📊 **Expected Result**

After following this guide:
- ✅ Store URL loads properly
- ✅ Profile information displays
- ✅ Follow buttons work
- ✅ Analytics track page views  
- ✅ No "Profile Not Found" errors

**The main issue is that your database tables don't exist yet. Run the migration scripts and your store URLs will work perfectly! 🎉**