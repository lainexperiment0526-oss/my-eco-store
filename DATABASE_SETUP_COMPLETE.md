# DropLink Database Setup & Data Persistence ✅

This guide explains the complete database setup for all DropLink features including payment links, custom links, user profiles, and analytics with full Supabase integration.

### **Step 1: Access Supabase Dashboard**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `idkjfuctyukspexmijvb`
3. Navigate to **SQL Editor**

### **Step 2: Execute Database Migrations**

#### **Migration 1: Core Database Schema**
1. Copy **ALL** content from: `supabase/migrations/20251111083853_remix_migration_from_pg_dump.sql`
2. Paste into SQL Editor
3. Click **Run** (this creates core tables and functions)

#### **Migration 2: Pi Network & Public Sharing Enhancements**
1. Copy **ALL** content from: `supabase/migrations/20251118000002_pi_network_enhancements.sql`
2. Paste into SQL Editor  
3. Click **Run** (this adds Pi Network integration and public sharing)

### **Step 3: Verify Setup**
After running both migrations, you should have these tables:

#### **Core Tables:**
- ✅ `profiles` - User profiles with Pi Network integration
- ✅ `products` - Digital products for sale
- ✅ `analytics` - Page views and interactions  
- ✅ `followers` - User follow relationships
- ✅ `subscriptions` - Premium plan management
- ✅ `gifts` - Pi Network gift system
- ✅ `user_wallets` - Drop token wallets
- ✅ `ai_chat_messages` - AI support chat history
- ✅ `ai_support_config` - AI configuration

#### **Enhanced Tables:**
- ✅ `notifications` - User alerts and messages
- ✅ `custom_domains` - Custom domain mapping
- ✅ `link_icons` - Custom link styling
- ✅ `referral_codes` - Referral system
- ✅ `backup_exports` - Data export functionality

#### **Functions Created:**
- ✅ `get_public_profile(username)` - Fetch public profile data
- ✅ `track_profile_view()` - Analytics for public views
- ✅ `get_active_subscription()` - Subscription management
- ✅ Various trigger functions for auto-updates

## 🌐 **Public Share Links**

### **URL Format:**
```
https://your-domain.com/u/[username]
https://your-domain.com/profile/[username]
```

### **Features Enabled:**
- ✅ **Public Profile Access** - Anyone can view profiles without authentication
- ✅ **Anonymous Analytics** - Track views without requiring login
- ✅ **Custom Domains** - Support for custom domain mapping
- ✅ **Social Sharing** - Optimized for social media sharing
- ✅ **Pi Network Integration** - Pi payments and donations work on public links
- ✅ **SEO Optimized** - Proper meta tags and descriptions

### **Public Profile Data:**
When someone visits a public share link, they can see:
- Profile information (name, description, logo)
- Social links and custom links
- Digital products for sale
- Pi Network donation options
- Custom theme and styling
- YouTube videos (if configured)

### **Privacy Controls:**
- Users can toggle `show_share_button` to enable/disable public sharing
- `is_active` field controls profile visibility
- Only active profiles are accessible via public links
- Sensitive data (email, private settings) are never exposed

## 🔧 **Vercel Deployment Configuration**

### **Environment Variables:**
Make sure these are set in your Vercel deployment:

```env
VITE_SUPABASE_URL=https://idkjfuctyukspexmijvb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_PI_API_KEY=your_pi_api_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
```

### **Routing Configuration:**
Your `vercel.json` should handle public profile routes:

```json
{
  "routes": [
    {
      "src": "/u/([^/]+)",
      "dest": "/profile/$1"
    },
    {
      "src": "/profile/([^/]+)",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## ✅ **Testing Public Links**

After database setup, test these scenarios:

1. **Create Profile** - Pi auth should work and create database record
2. **Public Access** - Visit `/u/[username]` without authentication  
3. **Analytics Tracking** - Views should be recorded in analytics table
4. **Pi Donations** - Pi payments should work on public profiles
5. **Social Sharing** - Links should have proper meta tags

## 🎯 **Expected Results:**

### **Before Database Setup:**
- ❌ `Could not find table 'public.profiles'` errors
- ❌ Profile creation fails
- ❌ Public links don't work

### **After Database Setup:**
- ✅ Profile creation works automatically
- ✅ Pi Network authentication stores real data  
- ✅ Public share links accessible by anyone
- ✅ Analytics tracking for all page views
- ✅ All premium features unlocked
- ✅ Ready for production deployment

## 🚨 **Troubleshooting:**

If you encounter issues:

1. **Check Migration Order** - Run core migration first, then enhancements
2. **Verify Permissions** - Ensure RLS policies are created
3. **Refresh Schema** - In Supabase API settings, refresh schema cache
4. **Check Logs** - Look at Supabase logs for any SQL errors
5. **Test Queries** - Use SQL Editor to test `SELECT * FROM profiles` 

**Once both migrations are executed, your Droplink app will be fully functional with complete database backend and public sharing capabilities! 🎉**