# Store URL Display Fix

## Problem
The dashboard was not showing at the store URL default `@username` because:

1. **Empty storeUrl field**: The `storeUrl` in PublicBio was hardcoded to an empty string instead of being populated from the database `store_url` field
2. **Missing redirect logic**: When logged-in users visited their own profile URL (`/@username`), they were shown the PublicBio page instead of being redirected to their Dashboard

## Solution

### Fix 1: Populate storeUrl from Database (Line 364 in PublicBio.tsx)

**Before:**
```typescript
storeUrl: "",
```

**After:**
```typescript
storeUrl: profileData.store_url || `@${profileData.username || username || 'user'}`,
```

Now the store URL is properly populated from the database. If `store_url` field is empty, it defaults to `@username` format.

### Fix 2: Redirect Own Profile Visits to Dashboard (Lines 95-102 in PublicBio.tsx)

Added a new useEffect hook that detects when the current logged-in user is viewing their own profile and redirects them to the Dashboard:

```typescript
// Redirect to Dashboard if current user is viewing their own profile
useEffect(() => {
  if (profile && currentUserProfileId && profileId && currentUserProfileId === profileId) {
    console.log("User is viewing their own profile, redirecting to Dashboard");
    navigate("/");
  }
}, [profile, currentUserProfileId, profileId, navigate]);
```

## Result

✅ **Now when users visit `/@username`:**
1. If they're logged in as that user → Redirected to Dashboard `/`
2. If they're a different user → See the public bio with proper store URL displayed
3. Store URL is always populated from database or defaults to `@username`

## Files Modified
- `src/pages/PublicBio.tsx` (2 changes)

## Testing
1. Visit `/@yourUsername` while logged in → Should redirect to Dashboard
2. Visit `/@otherUsername` while logged in → Should show public bio with store URL displayed
3. Share button should now show proper store URL in QR code
