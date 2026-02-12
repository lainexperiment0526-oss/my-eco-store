# 🔍 Complete Feature Verification Checklist

## ✅ Dashboard Features

### Profile Management
- [ ] Profile displays correctly
- [ ] Edit profile info (name, bio, avatar)
- [ ] Save changes to database
- [ ] Avatar/logo displays on profile

### Links & Products
- [ ] Add links (social, websites, etc.)
- [ ] Add products for sale
- [ ] Edit/delete links and products
- [ ] Links are clickable on public bio

### Preferences
- [ ] Set user category (content creator, gamer, etc.)
- [ ] Background music URL (if available)
- [ ] Theme preferences
- [ ] Notification settings

### Subscription/Plan
- [ ] View current plan status
- [ ] See plan expiration date
- [ ] Plan features unlock properly
- [ ] Premium features available at premium/pro tier

### Messages
- [ ] Access messages from dashboard
- [ ] See inbox count
- [ ] Navigation to /inbox works
- [ ] Messages load correctly

---

## ✅ Search Users Page (`/search-users`)

### Navigation & UI
- [ ] Page loads without errors
- [ ] Search bar is responsive
- [ ] Can type in search box
- [ ] Filter dropdowns work (category, sort)
- [ ] Recent searches appear below

### View All / Friends Buttons
- [ ] "Friends" button loads correctly (sky blue color)
- [ ] "View All" button shows all users
- [ ] "Search" button color is sky blue
- [ ] Buttons trigger ads (optional)

### User Cards Display
- [ ] User avatars show correctly
- [ ] Usernames display with @ prefix
- [ ] Follower count shows accurately
- [ ] Admin/VIP badges display properly
- [ ] "View" button is sky blue (clickable)
- [ ] "Follow" button is sky blue (clickable)

### Follow Functionality
- [ ] Click "Follow" button → Ad shows (YES)
- [ ] After ad → Follow count increases
- [ ] Toast shows "Following!" message
- [ ] Follow status persists after refresh
- [ ] Can unfollow by clicking again
- [ ] Button changes to show follow status

### View Profile Trigger
- [ ] Click "View" button → Ad shows
- [ ] After ad completes → Navigate to public bio
- [ ] Error handling if ad fails

### Search Functionality
- [ ] Type username → Results filter
- [ ] Sort by followers → Works
- [ ] Sort by recent → Works
- [ ] Category filter → Works
- [ ] Results are accurate

---

## ✅ Public Bio Page (`/@username`)

### Page Load & Display
- [ ] Page loads without 404 error
- [ ] User profile displays correctly
- [ ] Avatar/logo shows
- [ ] Username displays
- [ ] Bio/description shows
- [ ] Category badge shows (if set)

### Ad Trigger on Page Load
- [ ] Ad shows when page first loads (1 sec delay)
- [ ] Ad only shows if user is Pi authenticated
- [ ] Ad doesn't block page content
- [ ] No duplicate ads on page refresh
- [ ] Non-authenticated users see no ad

### Profile Stats
- [ ] Follower count displays
- [ ] Following count displays  
- [ ] View/visit count displays
- [ ] Stats update after follow/unfollow
- [ ] No console errors fetching stats

### Follow Button
- [ ] Button visible and clickable
- [ ] Click → Follow/Unfollow action
- [ ] Button text updates (Follow/Unfollow)
- [ ] Follower count updates instantly
- [ ] Change persists in database
- [ ] Work for both authenticated & anonymous

### FollowersSection Component
- [ ] Displays follower count
- [ ] Displays following count
- [ ] Follow/Unfollow button works
- [ ] User cannot follow themselves
- [ ] Business name displays if set

### Links Section
- [ ] All links display correctly
- [ ] Links are clickable (external links work)
- [ ] Social icons display (Twitter, Instagram, etc.)
- [ ] Link icons are visible
- [ ] No broken links

### Message Form
- [ ] Message input field visible
- [ ] Can type message text
- [ ] Image attachment button works
- [ ] Image preview shows after selection
- [ ] "Send Message" button is clickable
- [ ] Success toast after sending

### Send Message
- [ ] Click "Send" → Message saved
- [ ] Toast: "Message sent successfully!"
- [ ] Message appears in receiver's inbox
- [ ] Image uploads (if included)
- [ ] No console errors
- [ ] Works without authentication

### Visitor Tracking (if enabled)
- [ ] View count increments
- [ ] Visitor info tracked
- [ ] Stats update after each visit
- [ ] No duplicate counts

### Subscription/Plan Features
- [ ] Premium users see premium features
- [ ] Ads hide for premium/pro plans
- [ ] Free users see ads (Pi Ad Banner)
- [ ] Expired plans show ads
- [ ] Plan status displays correctly

### Products Section
- [ ] Products display if any added
- [ ] Product images show
- [ ] Product titles visible
- [ ] Product prices show
- [ ] Clickable to view details

### Background Music (if enabled)
- [ ] Background music player visible
- [ ] Music plays on loop
- [ ] User can control volume
- [ ] Mute/unmute works
- [ ] No audio errors

### Social Share
- [ ] Share button visible
- [ ] QR code generates
- [ ] Copy link button works
- [ ] Share dialog opens

---

## ✅ Inbox Page (`/inbox`)

### Page Load
- [ ] Page loads without errors
- [ ] User authenticated check works
- [ ] Back button works
- [ ] Correct layout/styling

### Message Display
- [ ] All received messages show
- [ ] Sender info displays (username, avatar)
- [ ] Message content shows
- [ ] Timestamp displays (time ago)
- [ ] Unread badge appears for new messages
- [ ] Messages sorted by newest first

### Message Images
- [ ] Image attachments display
- [ ] Images are clickable/zoomable
- [ ] No broken image errors
- [ ] Proper sizing/styling

### Message Actions
- [ ] Mark as read (check button) works
- [ ] Delete message works (trash button)
- [ ] Refresh button reloads messages
- [ ] No errors on action

### Real-time Updates
- [ ] When new message arrives → Toast notification
- [ ] New messages auto-appear without refresh
- [ ] Unread count updates
- [ ] No duplicates

### Empty State
- [ ] If no messages → Shows helpful message
- [ ] Doesn't break layout
- [ ] Navigation still works

---

## ✅ Follow System (Database)

### Follow Persistence
- [ ] Follow saved to `followers` table
- [ ] Can query follows in Supabase
- [ ] Follower counts accurate
- [ ] Following counts accurate
- [ ] Unique constraint prevents duplicates

### Follower/Following Counts
- [ ] Profiles show accurate follower count
- [ ] Search results show accurate counts
- [ ] Public bio shows accurate counts
- [ ] Counts update in real-time
- [ ] Counts persist after page refresh

### Follow-Unfollow Flow
- [ ] Follow → Count +1 ✅
- [ ] Unfollow → Count -1 ✅
- [ ] Self-follow prevention ✅
- [ ] Duplicate follow prevention ✅

---

## ✅ Ad Network

### Search Users Ads
- [ ] Click "View" → Ad shows
- [ ] Ad prevents navigation until watched
- [ ] Navigation happens after ad
- [ ] User gets Pi rewards

### Public Bio Ads
- [ ] Page load → Ad shows (1 sec delay)
- [ ] Only for authenticated users
- [ ] Only for free/basic/expired plans
- [ ] Premium/pro users skip ad

### Ad Detection
- [ ] Pi SDK loaded correctly
- [ ] Ad network supported
- [ ] Fallback if ads unavailable
- [ ] No console errors

---

## ✅ Messaging System

### Send Message
- [ ] Form visible on public bio
- [ ] Text input works
- [ ] Image upload works
- [ ] Send button works
- [ ] Database insert succeeds
- [ ] Toast confirms send

### Receive Message
- [ ] Message appears in receiver's inbox
- [ ] Sender info accurate
- [ ] Content displays correctly
- [ ] Timestamps accurate
- [ ] Images display if attached

### Storage
- [ ] Images uploaded to correct bucket
- [ ] Public URLs generated
- [ ] Images accessible
- [ ] No storage permission errors

---

## ✅ Plans & Subscriptions

### Plan Display
- [ ] Current plan shown on dashboard
- [ ] Plan expiration date visible
- [ ] Plan features listed
- [ ] Upgrade option available

### Plan Benefits
- [ ] Free: Basic features
- [ ] Basic: Additional features
- [ ] Premium: Ad-free, extra features
- [ ] Pro: All features

### Ad Logic by Plan
- [ ] Free plan → Shows ads ✅
- [ ] Basic plan → Shows ads ✅
- [ ] Premium plan → No ads ✅
- [ ] Pro plan → No ads ✅
- [ ] Expired plan → Shows ads ✅

---

## 🧪 Quick Test Scenarios

### Scenario 1: View Profile from Search
```
1. Go to /search-users
2. Click "View" on any user
3. Ad should show
4. After ad → Redirected to public bio
5. Public bio ad shows after 1 sec
6. Verify both ads work
```

### Scenario 2: Follow from Search
```
1. Go to /search-users
2. Click "Follow" on a user
3. Follower count increments
4. Refresh page
5. Follow status persists
```

### Scenario 3: Follow from Public Bio
```
1. Open public bio /@username
2. Ad shows on page load
3. Click Follow button
4. Follower count increments
5. View followers section
6. Shows accurate counts
```

### Scenario 4: Send and Receive Message
```
1. Open public bio
2. Fill message form
3. Click Send
4. Toast confirms
5. Go to /inbox (other user)
6. Message appears
7. Sender info correct
```

### Scenario 5: Plan Features
```
1. Check current plan on dashboard
2. Visit public bio as that user
3. If premium → No ads show
4. If free/basic → Ads show
5. Ad logic works correctly
```

### Scenario 6: Database Persistence
```
1. Follow a user
2. Refresh page
3. Follow status shows
4. Follower count accurate
5. Send message
6. Refresh inbox
7. Message still there
```

---

## 🔧 Database Verification Queries

Run in Supabase SQL Editor to verify:

```sql
-- Check follow relationships
SELECT * FROM public.followers ORDER BY created_at DESC LIMIT 10;

-- Check messages
SELECT * FROM public.messages ORDER BY created_at DESC LIMIT 10;

-- Check profiles follower counts
SELECT username, follower_count, following_count FROM public.profiles LIMIT 10;

-- Count follows for a specific user
SELECT COUNT(*) as follower_count 
FROM public.followers 
WHERE following_profile_id = 'USER_ID';

-- Check message images in storage
SELECT * FROM storage.objects 
WHERE bucket_id = 'message-images' 
ORDER BY created_at DESC LIMIT 10;
```

---

## ✨ Final Checklist

Before considering complete:
- [ ] All dashboard features work
- [ ] Search users page functional
- [ ] Public bio displays correctly
- [ ] Follow system works (database persistence)
- [ ] Messaging works (send & receive)
- [ ] Ads trigger correctly
- [ ] Plan logic respected
- [ ] No console errors
- [ ] Responsive design (mobile & desktop)
- [ ] All buttons styled correctly (sky blue)
- [ ] Follower/following counts accurate
- [ ] Real-time updates working
- [ ] Page refreshes maintain state

---

## 📝 Notes

- All sky blue buttons: `bg-sky-500 hover:bg-sky-600`
- Ad triggers: View profile (search) + Page load (bio)
- Plan-based ads: Free/Basic/Expired show ads
- Database: Followers table uses `follower_profile_id` & `following_profile_id`
- Messages table: Has `sender_profile_id`, `receiver_profile_id`, `image_url`
- Storage: `message-images` bucket for attachments

---

Use this checklist to verify all features are working end-to-end!
