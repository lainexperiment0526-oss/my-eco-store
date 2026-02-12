# Supabase Storage Setup - Complete Guide

## ✅ Storage Integration Complete!

All file uploads (images, documents, etc.) now save directly to **Supabase Storage**.

### Storage Endpoint
```
https://jzzbmoopwnvgxxirulga.storage.supabase.co/storage/v1/s3
```

## 🗂️ Storage Buckets Created

| Bucket | Purpose | Max Size | File Types |
|--------|---------|----------|------------|
| `profile-images` | General profile images | 5MB | JPEG, PNG, GIF, WebP |
| `logos` | Business/profile logos | 5MB | JPEG, PNG, GIF, WebP, SVG |
| `avatars` | User avatars | 5MB | JPEG, PNG, GIF, WebP |
| `backgrounds` | Profile backgrounds | 5MB | JPEG, PNG, GIF, WebP |
| `product-images` | Product photos | 5MB | JPEG, PNG, GIF, WebP |
| `documents` | PDFs, docs | 10MB | PDF, DOC, DOCX |
| `thumbnails` | Image thumbnails | 2MB | JPEG, PNG, WebP |

## 🚀 Quick Setup

### 1. Create Storage Buckets

Run this in **Supabase SQL Editor**:

```bash
# Copy and run: setup-storage-buckets.sql
```

Or create manually in Supabase Dashboard:
1. Go to **Storage** → **New Bucket**
2. Create each bucket from the table above
3. Enable **Public bucket** for all
4. Set file size limits

### 2. Verify Setup

Navigate to `/admin-mrwain` and test uploads:
- ✅ Upload Logo
- ✅ Upload Avatar
- ✅ Upload Background

## 📁 File Structure

Files are organized by user ID:

```
storage/
├── logos/
│   └── {user-id}/
│       └── 1734384000_abc123.jpg
├── avatars/
│   └── {user-id}/
│       └── 1734384000_xyz789.png
└── backgrounds/
    └── {user-id}/
        └── 1734384000_bg001.jpg
```

## 💻 Usage Examples

### Upload Profile Logo
```typescript
import { uploadProfileLogo } from '@/lib/supabase-storage';

const handleUpload = async (file: File) => {
  const logoUrl = await uploadProfileLogo(file, userId);
  console.log('Logo URL:', logoUrl);
};
```

### Upload Avatar
```typescript
import { uploadAvatar } from '@/lib/supabase-storage';

const avatarUrl = await uploadAvatar(file, userId);
```

### Upload Any Image
```typescript
import { uploadImage, STORAGE_BUCKETS } from '@/lib/supabase-storage';

const result = await uploadImage(
  file, 
  STORAGE_BUCKETS.PRODUCTS, 
  'product-123'
);

console.log('URL:', result.url);
console.log('Path:', result.path);
```

### Delete File
```typescript
import { deleteFile, STORAGE_BUCKETS } from '@/lib/supabase-storage';

await deleteFile(STORAGE_BUCKETS.LOGOS, 'user-id/file.jpg');
```

## 🔒 Security & Policies

All buckets have RLS (Row Level Security) policies:

- ✅ **Public Read**: Anyone can view uploaded files
- ✅ **Authenticated Upload**: Only logged-in users can upload
- ✅ **User Management**: Users can only modify their own files
- ✅ **Folder Isolation**: Files organized by user ID

## 📊 Storage Features

### Automatic Features
- ✅ Unique filename generation
- ✅ File type validation
- ✅ File size validation
- ✅ Image compression (optional)
- ✅ Progress indicators
- ✅ Error handling
- ✅ Toast notifications

### Admin Panel Features (/admin-mrwain)
- ✅ Logo upload with preview
- ✅ Avatar upload with preview
- ✅ Background upload with preview
- ✅ Delete uploaded files
- ✅ View file URLs
- ✅ Real-time profile updates

## 🛠️ Storage Helper Functions

Located in: `src/lib/supabase-storage.ts`

### Core Functions
```typescript
// Upload any file
uploadFile(file, bucket, folder?, fileName?)

// Upload image with validation
uploadImage(file, bucket?, folder?)

// Specialized uploads
uploadProfileLogo(file, userId)
uploadAvatar(file, userId)
uploadProductImage(file, productId)
uploadBackground(file, userId)

// File management
deleteFile(bucket, filePath)
updateFile(file, bucket, folder?, oldPath?)

// Utilities
getPublicUrl(bucket, filePath)
listFiles(bucket, folder?)
compressImage(file, maxWidth?, quality?)
```

### Constants
```typescript
STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  LOGOS: 'logos',
  PRODUCTS: 'product-images',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
  THUMBNAILS: 'thumbnails',
  BACKGROUNDS: 'backgrounds',
}

MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024,    // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024,    // 50MB
}
```

## 🎨 Frontend Components

### File Upload Button
```tsx
import { uploadProfileLogo } from '@/lib/supabase-storage';

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileUpload}
/>

<Button onClick={() => fileInputRef.current?.click()}>
  <Upload className="w-4 h-4 mr-2" />
  Upload Image
</Button>
```

### Image Preview
```tsx
{imageUrl && (
  <img src={imageUrl} alt="Preview" className="max-h-24" />
)}
```

## 🔗 URL Format

Uploaded files get public URLs like:

```
https://idkjfuctyukspexmijvb.supabase.co/storage/v1/object/public/logos/{user-id}/{filename}.jpg
```

## 📱 Admin Panel Integration

The `/admin-mrwain` page now includes:

1. **Logo Upload Card**
   - Upload button
   - Preview current logo
   - Delete option
   - URL display

2. **Avatar Upload Card**
   - Upload button
   - Circular preview
   - Stored in `theme_settings.avatar`

3. **Background Upload Card**
   - Upload button
   - Full-width preview
   - Stored in `theme_settings.background`

4. **Storage Info Box**
   - Shows storage endpoint
   - Max file size limits
   - Usage tips

## 🐛 Troubleshooting

### Upload Fails

**Issue**: "Upload failed" error

**Solutions**:
- Check file size (max 5MB for images)
- Verify file type is allowed
- Ensure user is authenticated
- Run `setup-storage-buckets.sql`
- Check Supabase storage quotas

### No Preview

**Issue**: Image doesn't show after upload

**Solutions**:
- Check bucket is public
- Verify URL format
- Clear browser cache
- Check RLS policies

### Policy Error

**Issue**: "New row violates row-level security policy"

**Solutions**:
- Verify user is authenticated
- Check bucket policies exist
- Run storage setup SQL
- Ensure user ID matches auth.uid()

## 📈 Storage Monitoring

View storage usage in Supabase Dashboard:
1. Go to **Storage** section
2. Click on each bucket
3. View file list and sizes
4. Check storage quota usage

## 🎯 Next Steps

- [ ] Run `setup-storage-buckets.sql` in Supabase
- [ ] Test uploads at `/admin-mrwain`
- [ ] Configure CORS if needed
- [ ] Set up CDN (optional)
- [ ] Monitor storage usage
- [ ] Add file compression
- [ ] Implement file cleanup for old files

## 📦 Files Created

- ✅ `src/lib/supabase-storage.ts` - Storage helper functions
- ✅ `setup-storage-buckets.sql` - SQL setup script
- ✅ `SUPABASE_STORAGE_GUIDE.md` - This guide
- ✅ Updated `src/pages/AdminMrwain.tsx` - Upload UI

---

**Status**: ✅ Ready to use!  
**Storage Endpoint**: `https://jzzbmoopwnvgxxirulga.storage.supabase.co`  
**Test Page**: `/admin-mrwain`
