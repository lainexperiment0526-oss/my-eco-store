# 🚀 Quick Setup Guide - Enhanced Inbox

## ⚡ Immediate Action Required

Run this SQL in Supabase SQL Editor to enable image uploads:

```sql
-- Create message-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload message images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'message-images');

-- Allow public read access
CREATE POLICY "Public can view message images" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'message-images');

-- Allow users to delete their images
CREATE POLICY "Users can delete their message images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'message-images');
```

## ✅ What's New

### Pages
- `/inbox` - Conversation list (updated)
- `/chat/:username` - Full chat interface (new)

### Features
1. **Organized Inbox** - Messages grouped by conversation
2. **Full Chat Page** - WhatsApp-style messaging
3. **Image Support** - Send & view images in messages
4. **Reply Functionality** - Two-way conversations
5. **Real-time Updates** - Instant message delivery
6. **Search** - Find conversations quickly

## 🧪 Test It Now

1. Navigate to http://localhost:8086/inbox
2. Sign in with Pi Network if not already
3. Click any conversation or start new chat
4. Send text message - press Enter
5. Click 📷 to attach image
6. Messages appear instantly!

## 📱 User Flow

```
Inbox (/inbox)
  └─ See all conversations
  └─ Click conversation
      └─ Opens Chat (/chat/username)
          └─ Send messages
          └─ Share images
          └─ Real-time updates
```

## ⚠️ Important Notes

- **Storage Bucket**: Must run SQL above to enable image uploads
- **Authentication**: Users must be signed in with Pi Network
- **Image Limit**: 5MB max per image
- **Formats**: JPEG, PNG, GIF, WebP only

## 🎯 Quick Test Checklist

- [ ] Run SQL migration for storage bucket
- [ ] Open /inbox page
- [ ] See conversation list
- [ ] Click a conversation
- [ ] Chat page loads
- [ ] Send text message
- [ ] Attach and send image
- [ ] Receive message from another user
- [ ] Unread count updates

## 🔧 Troubleshooting

**Images not uploading?**
→ Run the SQL migration above

**Messages not appearing?**
→ Check browser console for errors
→ Verify both users are authenticated

**Can't see conversations?**
→ Need at least one message sent/received
→ Sign in with Pi Network

## 📖 Full Documentation

See `INBOX_ENHANCED_COMPLETE.md` for complete technical documentation.

---

**Status**: ✅ All features implemented and ready to use!
**Server**: Running on port 8086
**Next Step**: Test the features in your browser!
