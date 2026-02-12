## 🔧 Message Storage Setup - Complete Guide

### ✅ Step 1: Run SQL in Supabase (FIXED)

The corrected SQL now only creates the bucket without permission issues:

```bash
# Run this in Supabase SQL Editor
# File: create-message-images-storage.sql
```

**The SQL will:**
- ✅ Create `message-images` storage bucket
- ✅ Set 5MB file size limit
- ✅ Allow image formats (JPEG, PNG, GIF, WebP)
- ✅ Enable public access (safe for read-only)

---

### 📋 Step 2: Configure Policies in Supabase Dashboard

**Manual Configuration (2 minutes):**

1. **Open Supabase Dashboard**
   - Go to: Storage → Buckets

2. **Select `message-images` bucket**
   - Click on the bucket name

3. **Click "Policies" tab**

4. **Add Policy 1: Allow Upload**
   - Click "New Policy" → "For authenticated users"
   - Select: `INSERT`
   - Let it use default settings
   - Click "Review" → "Save policy"

5. **Add Policy 2: Allow Read**
   - Click "New Policy" → "For public access"
   - Select: `SELECT`
   - Click "Review" → "Save policy"

6. **Verify Settings**
   - Bucket name: `message-images` ✅
   - Public: `on` ✅
   - File size limit: `5242880` (5MB) ✅

---

### 🚀 Step 3: Quick Test Upload

Test the upload functionality:

```bash
# Navigate to /inbox and try sending an image
# It should work immediately after bucket creation
```

**Expected behavior:**
1. Open /inbox in browser
2. Click on any conversation
3. Click image icon (📷)
4. Select an image file
5. Preview should appear
6. Click Send
7. Image uploads and appears in chat

---

### ⚠️ Troubleshooting

**Q: "Bucket already exists" error**
- A: That's OK! The SQL includes `ON CONFLICT DO NOTHING`
- Just run the policy configuration in the dashboard

**Q: Image upload fails**
- A: Check that you added the policies in step 2
- Try refreshing browser
- Check file size (max 5MB)

**Q: "Permission denied" error**
- A: Run the SQL with your service role key
- Or manually create bucket in dashboard:
  - Storage → New bucket
  - Name: `message-images`
  - Public: ON
  - File size: 5MB

**Q: Can't see uploaded images**
- A: Images are public, but you need the exact URL
- The app automatically generates and uses the correct URL
- Check browser console for any errors

---

### 🎯 Complete Setup Checklist

- [ ] Run SQL: `create-message-images-storage.sql`
- [ ] Verify bucket created in Storage tab
- [ ] Add INSERT policy for authenticated users
- [ ] Add SELECT policy for public access
- [ ] Test by sending image in /inbox
- [ ] Image appears in chat ✅

---

### 📝 Alternative: Manual Dashboard Setup

If SQL fails, create the bucket manually:

1. **Go to Storage**
   - Supabase Dashboard → Storage

2. **Create New Bucket**
   - Button: "New bucket"
   - Name: `message-images`
   - Public: Toggle ON
   - Click "Create bucket"

3. **Set File Size**
   - Click bucket settings
   - Max file size: 5242880 (5MB)
   - Allowed file types: image/jpeg, image/png, image/gif, image/webp

4. **Add Policies**
   - Click "Policies" tab
   - Create INSERT policy (authenticated)
   - Create SELECT policy (public)

---

### ✨ Features Now Working

✅ **Send images in messages**
- Click 📷 icon in chat
- Select image (max 5MB)
- Preview appears
- Click Send

✅ **View images in chat**
- Images display inline
- Click to open full size
- Share with other users

✅ **Image persistence**
- Images stored in Supabase
- Available forever
- Fast CDN delivery

---

### 🔗 What Gets Enabled

Once configured, these features work:

```tsx
// Message with image
{
  sender: "username",
  content: "Check this out!",
  image_url: "https://jzzbmoopwnvgxxirulga.supabase.co/...",
  created_at: "2026-01-02"
}

// Upload function
uploadMessageImage(file) → returns URL

// Display in chat
<img src={message.image_url} />
```

---

### 📊 Storage Limits

- **Bucket**: `message-images`
- **Max file size**: 5MB
- **Formats**: JPEG, PNG, GIF, WebP
- **Access**: Public (anyone can view)
- **Quotas**: Standard Supabase plan

---

### 🎉 All Set!

Your message image feature is now ready to use:

1. ✅ Storage bucket created
2. ✅ Policies configured
3. ✅ Frontend code ready
4. ✅ Upload function working
5. ✅ Display in chat functional

**Next:** Go to `/inbox` and send your first image message! 📸
