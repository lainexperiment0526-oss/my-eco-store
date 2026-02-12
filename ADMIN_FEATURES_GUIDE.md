# Admin Features - Complete Guide

## Overview
This document describes the admin-specific features available to users who sign in with Gmail accounts.

## Admin Identification
- **Admin users** are automatically identified by having a `@gmail.com` email address
- The `is_admin` column in the `profiles` table is automatically set to `TRUE` for Gmail users
- Admin status is updated via database trigger whenever a profile is created or updated

## Features Available to Admins

### 1. Username Change
**Location**: `/admin-mrwain` → Username Change section

**Features**:
- Admins can change their @username at any time
- Username validation ensures:
  - Minimum 3 characters
  - Only alphanumeric and underscore characters
  - Uniqueness check (no duplicates)
  - Automatic sanitization (lowercase, special chars removed)

**How to Use**:
1. Navigate to `/admin-mrwain`
2. Scroll to "Username Change" section
3. Enter new username in the input field
4. Click "Update" button
5. System will validate and update if available

**Example**:
```
Current: @admin_user_123
New: mynewusername
Result: @mynewusername
```

### 2. Theme Customization
**Location**: `/admin-mrwain` → Theme Customization section

**Customizable Elements**:
- **Primary Color**: Main color for buttons, links, highlights
- **Secondary Color**: Complementary color for gradients
- **Accent Color**: Special highlights, badges, accents
- **Background Style**: Solid, Gradient, or Image

**How to Use**:
1. Navigate to `/admin-mrwain`
2. Scroll to "Theme Customization" section
3. Use color pickers or enter hex codes
4. Select background style from dropdown
5. Click "Save Theme Settings"
6. Preview shows how colors will appear

**Color Inputs**:
- Color picker: Visual selection
- Hex code input: Precise color values (#0ea5e9)
- Synchronized: Both inputs update together

**Storage**:
- Theme settings saved in `profiles.theme_settings` JSONB column
- Persists across sessions
- Can be reset to defaults

### 3. VIP Badge in Search Results
**Location**: `/search-users` page

**Features**:
- Admin users appear with special styling in search results
- **Gold border**: 2px yellow border (#FBBF24) around profile card
- **VIP badge**: Yellow gradient badge with "VIP" text
- **Crown icon**: Small star/crown icon on profile picture
- **Enhanced shadow**: Gold-tinted shadow effect
- **Yellow username**: Username appears in gold color

**Visual Indicators**:
```
┌─────────────────────────────────┐
│ 👑 [Profile Pic - Gold Border]  │
│ @username (Yellow Text) [VIP]   │
│ 100 followers                    │
└─────────────────────────────────┘
     ↑ Gold Border + Shadow
```

**How It Works**:
1. System checks `is_admin` column from database
2. If `true`, applies special CSS classes
3. Adds crown icon, VIP badge automatically
4. Regular users see normal blue styling

## Database Schema

### Admin Column
```sql
ALTER TABLE profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

### Admin Check Function
```sql
CREATE FUNCTION check_if_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email LIKE '%@gmail.com';
END;
$$ LANGUAGE plpgsql;
```

### Auto-Update Trigger
```sql
CREATE TRIGGER trigger_set_admin_flag
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_admin_flag();
```

## Implementation Files

### Frontend Components
1. **UserSearchPage.tsx** - VIP badge display in search results
   - Location: `src/pages/UserSearchPage.tsx`
   - Features: Gold border, VIP badge, crown icon
   - Lines: ~430-460 (profile card rendering)

2. **AdminMrwain.tsx** - Admin panel with username & theme settings
   - Location: `src/pages/AdminMrwain.tsx`
   - Features: Username change, theme customization
   - Lines: ~700-900 (username and theme sections)

### Database Migration
1. **add-admin-role.sql** - Admin identification system
   - Location: `add-admin-role.sql`
   - Purpose: Add is_admin column, trigger, helper function

## Usage Examples

### Example 1: Changing Username
```typescript
// User inputs: "JohnDoe123"
// System sanitizes to: "johndoe123"
// Updates database: username = 'johndoe123'
// Result: @johndoe123
```

### Example 2: Theme Customization
```typescript
const themeSettings = {
  primaryColor: '#0ea5e9',    // Sky blue
  secondaryColor: '#38bdf8',  // Light blue
  accentColor: '#eab308',     // Yellow
  backgroundStyle: 'gradient'
};

// Saved to profiles.theme_settings JSONB column
```

### Example 3: VIP Badge Detection
```typescript
// In UserSearchPage.tsx
const isAdmin = profile.is_admin === true;

if (isAdmin) {
  // Apply gold border, VIP badge, crown icon
  cardClassName = 'border-2 border-yellow-500 shadow-yellow-200/50';
  usernameColor = 'text-yellow-600';
  showVIPBadge = true;
  showCrownIcon = true;
}
```

## Security Considerations

1. **Admin Detection**:
   - Based on email domain (@gmail.com)
   - Stored in database for performance
   - Auto-updated via trigger

2. **Username Change**:
   - Validates uniqueness before update
   - Sanitizes input (lowercase, alphanumeric)
   - Prevents empty or short usernames

3. **Theme Settings**:
   - Stored as JSONB in database
   - No executable code allowed
   - Only color hex codes and style values

## Deployment Steps

1. **Run SQL Migration**:
   ```bash
   # In Supabase SQL Editor
   # Copy and run: add-admin-role.sql
   ```

2. **Verify Admin Status**:
   ```sql
   SELECT username, email, is_admin 
   FROM profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE is_admin = TRUE;
   ```

3. **Test Features**:
   - Sign in with Gmail account
   - Navigate to `/admin-mrwain`
   - Try changing username
   - Customize theme colors
   - Search users and verify VIP badge appears

## Troubleshooting

### Issue: VIP Badge Not Showing
**Solution**:
1. Check if `is_admin` column exists in profiles table
2. Verify user has @gmail.com email
3. Run migration: `add-admin-role.sql`
4. Refresh page

### Issue: Username Change Fails
**Solution**:
1. Ensure username is at least 3 characters
2. Check if username already taken
3. Verify user is authenticated
4. Check browser console for errors

### Issue: Theme Not Saving
**Solution**:
1. Verify `theme_settings` column exists (JSONB type)
2. Check color hex codes are valid (#RRGGBB)
3. Ensure user is authenticated
4. Check Supabase connection

## Future Enhancements

Potential additions for admin features:
1. **Role-based permissions**: Add different admin levels
2. **Bulk user management**: Edit multiple users
3. **Analytics dashboard**: View system stats
4. **Custom badges**: Create unique badges for different user types
5. **Advanced theming**: Font selection, spacing, animations

## Support

For issues or questions:
- Check console logs for error messages
- Verify database migrations are applied
- Ensure Supabase connection is active
- Review this documentation for common solutions
