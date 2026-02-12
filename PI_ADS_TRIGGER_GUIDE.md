# 📺 Pi Ad Network Trigger Points

## ✅ YES - Ads ARE Triggered When Clicking "View Profile"

When users click the **"View Profile"** button on the search results, a **rewarded ad is shown** before navigating to the public bio page.

---

## 🎬 Current Ad Trigger Points

### 1. **Search Users Page** → **View Profile Button**
- **Location**: `/search-users`
- **Trigger**: Click "View" button on any user card
- **Action**: Shows rewarded ad → Navigates to public bio (`/@username`)
- **Code**: [src/pages/UserSearchPage.tsx](src/pages/UserSearchPage.tsx#L358-L375)

```typescript
const handleViewProfile = async (profile: ProfileResult) => {
  // Show rewarded ad before navigating to profile
  const adWatched = await showRewardedAd();
  if (!adWatched) {
    toast.error("Ad network not available. Please try again.");
    return;
  }
  navigate(`/@${profile.username}`);
};
```

### 2. **View Public Bio Directly** 
- **Location**: `/@username` (any public bio page)
- **Trigger**: When user views a public bio page (automatically on page load)
- **Action**: Shows rewarded ad after page loads
- **Delay**: 1 second (allows page to render first)
- **Code**: [src/pages/PublicBio.tsx](src/pages/PublicBio.tsx#L119-L131)

```typescript
// Show rewarded ad when viewing public bio directly
useEffect(() => {
  if (isPiAuthenticated && !adShownOnLoad && profile) {
    setAdShownOnLoad(true);
    // Show ad asynchronously without blocking page load
    const showAd = async () => {
      const adWatched = await showRewardedAd();
      if (adWatched) {
        console.log('Ad shown when viewing public bio');
      }
    };
    // Delay ad slightly to let page render
    setTimeout(showAd, 1000);
  }
}, [isPiAuthenticated, profile, adShownOnLoad, showRewardedAd]);
```

---

## 📊 What Happens When Ad is Triggered

1. **Ad Check**: Verifies Pi Ad Network is available
2. **Authentication Check**: Ensures user is logged in with Pi Network
3. **Show Ad**: Displays Pi's rewarded ad video
4. **User Watches**: User watches to completion
5. **Reward**: User gets reward tokens (Pi Network)
6. **Navigation**: App navigates to public bio page

---

## 🎯 Where Ads ARE Currently Triggered

✅ **Search Users Page** → **View Profile Button**
- Shows ad before navigating to bio

✅ **View Public Bio Directly** (`/@username`)
- Shows ad automatically when page loads
- 1 second delay (page renders first)
- Only if user is Pi authenticated

---

## 🎯 Where Ads Are NOT Currently Triggered

❌ **Follow Button**
- Clicking follow does NOT trigger ads
- Direct follow action in database

❌ **Message Sending**
- Sending messages does NOT trigger ads

❌ **View Friends Modal**
- Opening friends list does NOT trigger ads

---

## 🔌 Pi Ad Network Support

The app supports multiple Pi Ad methods:

```typescript
// Method 1: Pi.Ads.showAd (newer API)
if ((window as any).Pi?.Ads?.showAd) {
  response = await (window as any).Pi.Ads.showAd('rewarded');
}

// Method 2: Pi.showRewardedAd (direct API)
else if ((window as any).Pi?.showRewardedAd) {
  response = await (window as any).Pi.showRewardedAd();
}
```

---

## 📱 Device Requirements

- **Pi Browser**: Required (ads won't work on regular browsers)
- **Pi Network App**: Must be running
- **Authentication**: User must be signed in with Pi Network
- **Ad Network Support**: Requires Pi SDK support

---

## 💰 Revenue Model

✅ Users watch rewarded ads
✅ Users earn Pi tokens as rewards
✅ App gets ad revenue from Pi Network
✅ Win-win model

---

## 🔄 How to Add More Ad Triggers

To add ads to other actions (e.g., message sending), use:

```typescript
const { showRewardedAd } = usePi();

// When user clicks a button
const handleAction = async () => {
  const adWatched = await showRewardedAd();
  if (!adWatched) {
    toast.error("Ad network not available");
    return;
  }
  // Proceed with action
};
```

---

## ✨ Summary

| Action | Ad Triggered | Location |
|--------|-------------|----------|
| View Profile (Search) | ✅ YES | View button on user card |
| View Public Bio Directly | ✅ YES | When page loads (`/@username`) |
| Follow User | ❌ NO | Follow button |
| Send Message | ❌ NO | Message form |
| View Friends | ❌ NO | Friends modal |

---

## 📁 Related Files

- [src/pages/UserSearchPage.tsx](src/pages/UserSearchPage.tsx#L358-L375) - View Profile handler
- [src/contexts/PiContext.tsx](src/contexts/PiContext.tsx#L1297-L1330) - showRewardedAd function
- [src/components/PiAdBanner.tsx](src/components/PiAdBanner.tsx) - Pi Ad Banner display
