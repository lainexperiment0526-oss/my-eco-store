# 🚀 Supabase Storage - Quick Start

## Setup (2 minutes)

### Step 1: Create Storage Buckets

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste and run:
```sql
-- Quick setup - creates all storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('logos', 'logos', true),
  ('avatars', 'avatars', true),
  ('backgrounds', 'backgrounds', true),
  ('profile-images', 'profile-images', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Enable Public Access

For each bucket, run:
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
```

Repeat for: `avatars`, `backgrounds`, `profile-images`, `product-images`

### Step 3: Test Upload

1. Navigate to `/admin-mrwain`
2. Sign in with email or Google
3. Click "Upload Logo" button
4. Select an image (max 5MB)
5. ✅ Image uploads to Supabase Storage!

## ✅ That's It!

Your files are now stored at:
```
https://idkjfuctyukspexmijvb.supabase.co/storage/v1/object/public/...
```

## Usage

### In Your Code
```typescript
import { uploadProfileLogo } from '@/lib/supabase-storage';

// Upload logo
const url = await uploadProfileLogo(file, userId);
console.log('Logo URL:', url);
```

### Admin Panel
- `/admin-mrwain` - Full upload interface
- Upload logos, avatars, backgrounds
- Automatic URL saving to profile
- Image previews

## Files Created

- ✅ `src/lib/supabase-storage.ts` - Helper functions
- ✅ `setup-storage-buckets.sql` - Full SQL setup
- ✅ Admin panel with upload UI

---

**Storage Endpoint**: `https://jzzbmoopwnvgxxirulga.storage.supabase.co`  
**Max File Size**: 5MB per image  
**Supported**: JPEG, PNG, GIF, WebP
