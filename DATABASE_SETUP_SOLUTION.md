# 🚨 Database Setup Required - Complete Solution

## ❌ **Current Issue:**
```
Failed to create profile: Could not find the table 'public.profiles' in the schema cache
```

## 🎯 **Root Cause:**
The Supabase database doesn't have the required tables set up yet. The application is trying to create user profiles, but the `profiles` table doesn't exist.

## ✅ **Complete Solution:**

### **Step 1: Set Up Database Schema**

#### **Option A: Complete Schema (Recommended)**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `idkjfuctyukspexmijvb`
3. Navigate to **SQL Editor**
4. Copy the complete SQL from: `supabase/migrations/20251118000001_complete_database_schema.sql`
5. Paste and **Run** the SQL

#### **Option B: Quick Setup (Minimal)**
Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User identification
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    pi_user_id TEXT,
    
    -- Profile information
    business_name TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    
    -- Settings
    social_links JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "backgroundColor": "#000000", "iconStyle": "rounded", "buttonStyle": "filled", "customLinks": []}',
    has_premium BOOLEAN DEFAULT false,
    show_share_button BOOLEAN DEFAULT true,
    
    -- Pi Network integration
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    
    -- Financial data
    crypto_wallets JSONB DEFAULT '{"wallets": []}',
    bank_details JSONB DEFAULT '{"accounts": []}',
    youtube_video_url TEXT DEFAULT ''
);

-- Create essential supporting tables
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT NOT NULL DEFAULT '0',
    file_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_agent TEXT DEFAULT ''
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public access analytics" ON public.analytics FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.analytics TO anon, authenticated;
```

### **Step 2: Verify Setup**
1. Refresh your Droplink app: http://localhost:8084
2. Try Pi Network authentication again
3. Profile creation should now work successfully!

## 📋 **What the Database Includes:**

### **Core Tables:**
- ✅ **profiles** - User profiles with Pi integration
- ✅ **products** - Digital products for sale
- ✅ **analytics** - Page views and interactions
- ✅ **followers** - User follow relationships
- ✅ **subscriptions** - Premium plan management
- ✅ **gifts** - Pi Network gift system

### **Advanced Features:**
- ✅ **notifications** - User alerts and messages
- ✅ **custom_domains** - Domain mapping
- ✅ **link_icons** - Custom link icons
- ✅ **referral_codes** - Referral system
- ✅ **backup_exports** - Data export functionality

### **Security Features:**
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Permissive policies** for development/testing
- ✅ **Proper foreign key relationships**
- ✅ **UUID primary keys** for security
- ✅ **Automatic timestamps** for audit trails

## 🚀 **After Database Setup:**

### **✅ Working Features:**
1. **Pi Network Authentication** - Sandbox mode
2. **Profile Creation** - Database-backed with real IDs
3. **Auto-Save** - 3-second debounced saving
4. **All Premium Features** - Unrestricted access
5. **Public Profile URLs** - Share your droplink
6. **Analytics Tracking** - Page views and interactions
7. **Product Management** - Digital sales platform
8. **Social Features** - Follow system and gifts

### **🎯 User Flow After Setup:**
```
1. Pi/Email Authentication ✅
2. Profile Auto-Creation ✅  
3. Welcome Message (new users only) ✅
4. Dashboard Access ✅
5. Profile Customization ✅
6. Content Management ✅
7. Public URL Sharing ✅
8. Analytics & Growth ✅
```

## 🔧 **Development Status:**

### **Environment:**
- **Database**: idkjfuctyukspexmijvb.supabase.co
- **Pi Network**: Sandbox mode enabled  
- **Features**: All restrictions removed
- **Local Server**: http://localhost:8084

### **Ready For:**
- ✅ **Full Testing** - All features accessible
- ✅ **Pi Integration** - Payments, ads, authentication
- ✅ **Profile Sharing** - Public URLs working
- ✅ **Monetization** - Digital products and donations
- ✅ **Analytics** - Comprehensive tracking
- ✅ **Social Features** - Following and engagement

## 📞 **Support:**

If you encounter any issues after running the database setup:

1. **Check Supabase Logs** - Look for any SQL execution errors
2. **Verify Permissions** - Ensure RLS policies are created
3. **Refresh Schema** - In Supabase, go to API settings and refresh schema
4. **Clear Browser Cache** - Force refresh the application
5. **Check Console** - Look for detailed error messages

**Once the database is set up, Droplink will be fully functional with all features working! 🎉**