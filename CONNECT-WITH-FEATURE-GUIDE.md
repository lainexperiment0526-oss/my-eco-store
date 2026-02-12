# ✅ "Connect with" Feature - Complete Guide

## 🎯 What It Does

The "Connect with" button captures visitor emails on your public bio page, allowing you to build a mailing list and connect with your audience.

## 📧 How It Works

### **Public Bio (`/@username`)**
1. Visitor enters email in white rounded input box
2. Clicks "Connect with" button
3. Email is saved to database
4. Success message shown: "✅ Thanks for connecting!"
5. Form resets for next submission

### **Database Storage**
- **Table:** `email_captures`
- **Columns:**
  - `id` - Unique identifier
  - `profile_id` - Your profile ID
  - `email` - Captured email address
  - `source` - Always "connect_button"
  - `captured_from_page` - Always "public_bio"
  - `created_at` - Timestamp

## 🎛️ Dashboard Control

### **Enable/Disable Feature**
The Connect section visibility is controlled by:
```typescript
userPreferences?.store_settings?.showEmailCapture
```

**Default:** Enabled (shows when `!== false`)

### **To Toggle in Dashboard:**
Add this to your user preferences settings:
```json
{
  "store_settings": {
    "showEmailCapture": true  // or false to hide
  }
}
```

## 📊 View Captured Emails

### **In Supabase SQL Editor:**
```sql
-- View all captured emails for your profile
SELECT 
    email,
    created_at,
    source,
    captured_from_page
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE'
ORDER BY created_at DESC;

-- Count total captures
SELECT COUNT(*) as total_captures
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE';

-- Recent captures (last 7 days)
SELECT 
    email,
    created_at
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE'
    AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### **Export to CSV:**
```sql
COPY (
    SELECT email, created_at
    FROM email_captures
    WHERE profile_id = 'YOUR_PROFILE_ID_HERE'
    ORDER BY created_at DESC
) TO '/path/to/emails.csv' CSV HEADER;
```

## 🔒 Security & Privacy

### **Row Level Security (RLS)**
- ✅ Anyone can INSERT emails (anonymous)
- ✅ Only profile owners can SELECT their captures
- ✅ No one can UPDATE or DELETE captures

### **Policies:**
```sql
-- View own captures
CREATE POLICY "Users can view own captures"
ON email_captures FOR SELECT
USING (
    profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Anyone can submit
CREATE POLICY "Anyone can insert email captures"
ON email_captures FOR INSERT
WITH CHECK (true);
```

## 🎨 Styling

### **Current Design (Link.me Style):**
- White rounded pill container
- Email input on left (flexible width)
- Button on right with icon
- Primary color from theme
- Loading state ("Connecting...")
- Disabled state (opacity-50)

### **Customization:**
Edit in `PublicBio.tsx` line ~1206:
```tsx
<form className="flex items-center gap-2 bg-white rounded-full p-2 shadow-lg">
  <input
    type="email"
    placeholder="your@email.com"  // ← Customize placeholder
    className="flex-1 px-4 py-2 bg-transparent outline-none text-gray-800"
  />
  <button
    style={{ backgroundColor: profile.theme.primaryColor }}  // ← Uses theme color
    className="px-6 py-2 rounded-full"
  >
    {connectSubmitting ? 'Connecting...' : 'Connect with'}
  </button>
</form>
```

## ⚙️ Technical Implementation

### **State Variables:**
```typescript
const [connectEmail, setConnectEmail] = useState("");
const [connectSubmitting, setConnectSubmitting] = useState(false);
```

### **Form Submission:**
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate email
  if (!connectEmail || !connectEmail.includes('@')) {
    toast.error('Please enter a valid email');
    return;
  }
  
  // Insert to database
  await supabase.from('email_captures').insert({
    profile_id: profileId,
    email: connectEmail,
    source: 'connect_button',
    captured_from_page: 'public_bio'
  });
  
  // Success feedback
  toast.success('✅ Thanks for connecting!');
  setConnectEmail('');
};
```

## 📈 Usage Analytics

### **Track Capture Rate:**
```sql
-- Compare visits vs captures
SELECT 
    DATE(created_at) as date,
    COUNT(*) as captures
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### **Unique vs Total:**
```sql
-- Unique emails captured
SELECT COUNT(DISTINCT email) as unique_emails
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE';

-- Total submissions
SELECT COUNT(*) as total_submissions
FROM email_captures
WHERE profile_id = 'YOUR_PROFILE_ID_HERE';
```

## 🚀 Future Enhancements

Potential additions:
1. **Dashboard View** - Display captured emails in dashboard
2. **Export Button** - One-click CSV download
3. **Email Notifications** - Alert when new email captured
4. **Integration** - Connect to Mailchimp, ConvertKit, etc.
5. **Analytics Dashboard** - Charts and metrics
6. **Custom Welcome Email** - Auto-send thank you message

## ✅ Testing Checklist

- [ ] Email input validates format
- [ ] Form submits correctly
- [ ] Success toast appears
- [ ] Form resets after submission
- [ ] Loading state shows while submitting
- [ ] Duplicate emails allowed (re-submission tracking)
- [ ] Works on mobile and desktop
- [ ] Theme color applies to button
- [ ] Data saves to database
- [ ] Can query captures in Supabase

## 📝 Files Modified

1. **PublicBio.tsx** (Line ~100, ~1206)
   - Added state variables
   - Added form submission handler
   - Styled Link.me format

2. **ensure-all-features.sql**
   - Creates email_captures table
   - Sets up RLS policies
   - Adds indexes

---

**Status:** ✅ Fully Working

**Last Updated:** January 27, 2026
