# 💾 Pi Network GIF Background Data Persistence

## Overview
This document details how custom GIF background data is saved and retrieved for Pi Network users in DropLink.

## Data Flow for Pi Users

### 1. **GIF Upload Process**
```typescript
// User selects GIF file (max 10MB)
// File is converted to base64 data URL
// Stored in theme.backgroundGif as data:image/gif;base64,<data>
```

### 2. **Validation Before Save**
```typescript
// Dashboard.tsx - handleSave()
if (profile.theme.backgroundGif && profile.theme.backgroundGif.startsWith('data:')) {
  const gifSizeEstimate = (profile.theme.backgroundGif.length * 0.75) / (1024 * 1024);
  if (gifSizeEstimate > 15) { // ~12MB after base64 encoding
    toast.error("GIF file too large for database storage");
    return;
  }
}
```

### 3. **Pi Auth Data Transmission**
```typescript
// Data sent to profile-update edge function
const profilePayload = {
  theme_settings: {
    ...profile.theme,
    backgroundGif: profile.theme.backgroundGif || "",
    backgroundType: profile.theme.backgroundType || "color",
  }
};

// Headers for Pi users
headers["X-Pi-Access-Token"] = piAccessToken;
functionBody.piAccessToken = piAccessToken;
```

### 4. **Edge Function Processing**
```typescript
// supabase/functions/profile-update/index.ts

// Validates Pi access token with Pi Network API
const piResponse = await fetch('https://api.minepi.com/v2/me', {
  headers: {
    'Authorization': `Bearer ${piAccessToken}`,
  },
});

// Size validation in edge function
if (profileData.theme_settings?.backgroundGif?.startsWith?.('data:')) {
  const gifSizeEstimate = (profileData.theme_settings.backgroundGif.length * 0.75) / (1024 * 1024);
  if (gifSizeEstimate > 20) { // Edge function size limit
    throw new Error('GIF file too large for database storage');
  }
}
```

### 5. **Supabase Database Storage**
```sql
-- Stored in profiles table
UPDATE profiles 
SET theme_settings = jsonb_set(
  theme_settings, 
  '{backgroundGif}', 
  '"data:image/gif;base64,<base64_data>"'
)
WHERE username = $1;
```

### 6. **Data Retrieval**
```typescript
// Dashboard.tsx - loadProfile()
const themeSettings = profileData.theme_settings;
setProfile({
  theme: {
    backgroundGif: themeSettings?.backgroundGif || "",
    backgroundType: themeSettings?.backgroundType || "color",
  }
});
```

## Pi Network Authentication Flow

### **User Authentication**
1. User signs in with Pi Network
2. Pi access token stored in `localStorage.getItem("pi_access_token")`
3. Token sent with profile updates

### **Profile Update Security**
1. Edge function validates Pi access token with Pi API
2. Retrieves Pi user data (username, etc.)
3. Matches Pi username with profile in database
4. Updates profile using service role (bypasses RLS)

## Database Schema

### **profiles.theme_settings (JSONB)**
```json
{
  "primaryColor": "#3b82f6",
  "backgroundColor": "#000000",
  "backgroundType": "gif",
  "backgroundGif": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "iconStyle": "rounded",
  "buttonStyle": "filled",
  "customLinks": []
}
```

## Size Limitations

### **Frontend Validation**
- **File Upload**: 10MB maximum
- **Base64 Encoding**: ~33% size increase
- **Database Storage**: ~13MB maximum after encoding

### **Backend Validation**
- **Edge Function**: 20MB limit (safety buffer)
- **Database Field**: JSONB supports large values
- **Network Transfer**: Efficient for Pi Network users

## Error Handling

### **Upload Errors**
```typescript
// File type validation
if (!file.type.includes('gif')) {
  alert('Please select a GIF file only.');
  return;
}

// Size validation
if (file.size > 10 * 1024 * 1024) {
  alert('File size must be less than 10MB.');
  return;
}
```

### **Save Errors**
```typescript
// Database size validation
if (gifSizeEstimate > 15) {
  toast.error("GIF file too large for database storage");
  return;
}

// Pi auth validation
if (!piAccessToken) {
  throw new Error('Missing Pi access token');
}
```

## Performance Considerations

### **Loading Optimization**
- Base64 data URLs load instantly (no network requests)
- No external dependency on image hosting services
- Cached in browser automatically

### **Storage Efficiency**
- One-time upload, permanent storage
- No ongoing hosting costs
- Reliable availability (no broken links)

### **Network Usage**
- Initial upload: Full file size
- Subsequent loads: Cached locally
- Profile saves: Include full GIF data

## Monitoring & Debugging

### **Frontend Logging**
```typescript
console.log(`Saving uploaded GIF, estimated size: ${gifSizeEstimate.toFixed(2)}MB`);
console.log(`GIF uploaded successfully, data URL length: ${result.length} characters`);
```

### **Backend Logging**
```typescript
console.log(`Pi user ${username} saving custom GIF background, estimated size: ${gifSizeEstimate.toFixed(2)}MB`);
console.log(`✅ Successfully saved custom GIF background for Pi user ${username}`);
```

### **Success Messages**
```typescript
// Different messages based on GIF type
if (profile.theme.backgroundGif.startsWith('data:')) {
  toast.success("Profile saved with custom GIF background!");
} else if (profile.theme.backgroundGif) {
  toast.success("Profile saved with GIF background!");
}
```

## Security Features

### **Data Validation**
- File type enforcement (GIF only)
- Size limits prevent abuse
- Base64 format validation

### **Authentication**
- Pi Network token validation
- Username matching with Pi account
- Service role database access (secure)

### **Privacy**
- GIF data stored with user profile only
- No public file URLs exposed
- Direct database storage (no file system)

---

**Implementation Status**: ✅ Complete and Production Ready  
**Testing**: ✅ File validation, size limits, Pi auth flow verified  
**Documentation**: ✅ Complete technical implementation guide  

This system ensures Pi Network users can reliably upload and store custom GIF backgrounds with their DropLink profiles, with proper validation, error handling, and performance optimization.