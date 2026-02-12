# Pi Ad Network Fix - Code Changes Reference

## Change 1: Ad Network Detection (PiContext.tsx - Lines 268-289)

### BEFORE:
```tsx
// Check ad network support
try {
  const features = await window.Pi.nativeFeaturesList();
  const adSupported = features.includes('ad_network');
  setAdNetworkSupported(adSupported);
  console.log('[PI DEBUG] 🎯 Ad Network Support:', adSupported);
  console.log('[PI DEBUG] 📋 Available features:', features);
  
  // Fallback: If nativeFeaturesList doesn't show ad_network, check if Pi.Ads exists
  if (!adSupported && (window as any).Pi?.Ads) {
    console.log('[PI DEBUG] ⚠️ Ad Network API exists despite nativeFeaturesList');
    setAdNetworkSupported(true);
  }
} catch (err) {
  console.warn('[PI DEBUG] ⚠️ Failed to check native features:', err);
  // Fallback: Check if Pi.Ads API exists
  if ((window as any).Pi?.Ads || (window as any).Pi?.showRewardedAd) {
    console.log('[PI DEBUG] ✅ Ad Network API detected via fallback');
    setAdNetworkSupported(true);
  }
}
```

### AFTER:
```tsx
// Check ad network support
try {
  const features = await window.Pi.nativeFeaturesList();
  const adSupported = features.includes('ad_network');
  console.log('[PI DEBUG] 🎯 Ad Network Support (via nativeFeaturesList):', adSupported);
  console.log('[PI DEBUG] 📋 Available features:', features);
  
  // Fallback checks for ad network availability
  let hasAdAPI = adSupported;
  if (!hasAdAPI && (window as any).Pi?.Ads) {
    console.log('[PI DEBUG] ✅ Ad Network API (Pi.Ads) exists despite nativeFeaturesList');
    hasAdAPI = true;
  }
  if (!hasAdAPI && (window as any).Pi?.showRewardedAd) {
    console.log('[PI DEBUG] ✅ Ad Network API (Pi.showRewardedAd) exists despite nativeFeaturesList');
    hasAdAPI = true;
  }
  
  setAdNetworkSupported(hasAdAPI);
  console.log('[PI DEBUG] 🎯 Final Ad Network Support:', hasAdAPI);
} catch (err) {
  console.warn('[PI DEBUG] ⚠️ Failed to check native features:', err);
  // Fallback: Check if Pi.Ads API exists
  if ((window as any).Pi?.Ads || (window as any).Pi?.showRewardedAd) {
    console.log('[PI DEBUG] ✅ Ad Network API detected via fallback');
    setAdNetworkSupported(true);
  }
}
```

**Changes:**
- ✅ Added check for `Pi.showRewardedAd` in addition to `Pi.Ads`
- ✅ More explicit logging about which API is available
- ✅ Better variable naming with `hasAdAPI`

---

## Change 2: showRewardedAd() Function (PiContext.tsx - Lines 1305-1348)

### BEFORE:
```tsx
const showRewardedAd = async (): Promise<boolean> => {
  if ((!window.Pi && !(window as any).Pi) || !adNetworkSupported) {
    toast("Ad Network not supported on this Pi Browser version.", {
      description: "Ads Not Supported",
      duration: 5000,
    });
    return false;
  }

  if (!isAuthenticated) {
    toast("You must be authenticated to view rewarded ads.", {
      description: "Authentication Required",
      duration: 5000,
    });
    return false;
  }

  try {
    // Show the ad via Pi SDK (supporting both Ads.showAd and direct showRewardedAd)
    let response: any = null;
    try {
      if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.showAd) {
        response = await (window as any).Pi.Ads.showAd('rewarded');
      } else if ((window as any).Pi && (window as any).Pi.showRewardedAd) {
        response = await (window as any).Pi.showRewardedAd();
      } else {
        throw new Error('Ad API not available');
      }
    } catch (adErr) {
      console.error('Ad show error:', adErr);
      toast("Failed to show rewarded ad.", { description: "Ad Error", duration: 5000 });
      return false;
    }
```

### AFTER:
```tsx
const showRewardedAd = async (): Promise<boolean> => {
  // Check if Pi SDK is available and has ad API (with fallbacks)
  const hasPiSDK = !!(window.Pi || (window as any).Pi);
  const hasAdAPI = hasPiSDK && (
    ((window as any).Pi?.Ads?.showAd) || 
    ((window as any).Pi?.showRewardedAd)
  );

  if (!hasPiSDK || !hasAdAPI) {
    console.warn('[AD] Pi SDK or Ad API not available', { hasPiSDK, hasAdAPI, adNetworkSupported });
    toast("Ad Network not available. Please try again.", {
      description: "Ads Not Supported",
      duration: 5000,
    });
    return false;
  }

  if (!isAuthenticated) {
    toast("You must be authenticated to view rewarded ads.", {
      description: "Authentication Required",
      duration: 5000,
    });
    return false;
  }

  try {
    // Show the ad via Pi SDK (supporting both Ads.showAd and direct showRewardedAd)
    let response: any = null;
    try {
      console.log('[AD] Attempting to show rewarded ad...', { 
        hasAdsAPI: !!(window as any).Pi?.Ads?.showAd,
        hasShowRewardedAd: !!(window as any).Pi?.showRewardedAd
      });

      if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.showAd) {
        console.log('[AD] Using Pi.Ads.showAd()');
        response = await (window as any).Pi.Ads.showAd('rewarded');
      } else if ((window as any).Pi && (window as any).Pi.showRewardedAd) {
        console.log('[AD] Using Pi.showRewardedAd()');
        response = await (window as any).Pi.showRewardedAd();
      } else {
        throw new Error('No ad API available');
      }
      console.log('[AD] Ad response:', response);
    } catch (adErr) {
      console.error('[AD] Error showing ad:', adErr);
      console.error('[AD] Error message:', adErr instanceof Error ? adErr.message : String(adErr));
      toast("Failed to show rewarded ad.", { description: "Ad Error", duration: 5000 });
      return false;
    }
```

**Changes:**
- ✅ Changed from checking `!adNetworkSupported` to checking actual API methods
- ✅ Added console logging with `[AD]` prefix for debugging
- ✅ More defensive checks using optional chaining (`?.`)
- ✅ Better error messages showing which API failed

---

## Change 3: Handle View Profile (UserSearchPage.tsx - Lines 383-400)

### BEFORE:
```tsx
const handleViewProfile = async (profile: ProfileResult) => {
  if (!isPiAuthenticated()) {
    setShowPiAuthModal(true);
    return;
  }

  // Show rewarded ad before navigating to profile
  const adWatched = await showRewardedAd();
  if (!adWatched) {
    toast.error("Ad network not available. Please try again.");
    return;  // ❌ BLOCKS NAVIGATION
  }

  setShowModal(false);
  navigate(`/@${profile.username}`);
};
```

### AFTER:
```tsx
const handleViewProfile = async (profile: ProfileResult) => {
  if (!isPiAuthenticated()) {
    setShowPiAuthModal(true);
    return;
  }

  // Show rewarded ad before navigating to profile
  try {
    const adWatched = await showRewardedAd();
    if (!adWatched) {
      console.warn('Ad not shown, but allowing profile navigation anyway');
      // Allow navigation even if ad fails - don't block UX
    }
  } catch (err) {
    console.error('Error showing ad:', err);
    // Don't block profile navigation if ad fails
  }

  setShowModal(false);
  navigate(`/@${profile.username}`);  // ✅ ALWAYS NAVIGATES
};
```

**Changes:**
- ✅ Wrapped in try-catch for better error handling
- ✅ No longer blocks navigation if ad fails
- ✅ Logs warning instead of showing error toast
- ✅ Better UX - users can still access profiles

---

## Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Ad Detection** | Single check | Multiple fallbacks |
| **Navigation** | Blocked on ad failure | Always allowed |
| **Logging** | Minimal | Detailed with `[AD]` prefix |
| **Error Handling** | Immediate failure | Graceful fallbacks |
| **User Experience** | Frustrating (blocked) | Smooth (attempts ad, continues) |

## Testing the Fix

1. **Open Console** (F12 → Console tab)
2. **Search for a user**
3. **Click View button**
4. **Watch console output**:
   - Should see `[AD] Attempting to show rewarded ad...`
   - Should see which API is being used
   - Should navigate to profile (with or without ad)

## Rollback

If needed, revert just the UserSearchPage change to restore error blocking:
```tsx
const adWatched = await showRewardedAd();
if (!adWatched) {
  toast.error("Ad network not available. Please try again.");
  return;
}
```

But keep the PiContext improvements for better detection.
