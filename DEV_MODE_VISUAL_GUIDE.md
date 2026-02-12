# Dev Mode - Visual Setup Guide

## 🎯 Three Ways to Enable Dev Mode

### Method 1️⃣: Environment Variable (Recommended)

```
┌─────────────────────────────────────┐
│ .env File                           │
├─────────────────────────────────────┤
│ VITE_DEV_MODE=true                  │ ← Add this line
│                                      │
└─────────────────────────────────────┘
        ↓
    Restart dev server
        ↓
┌──────────────────────────────┐
│ npm run dev                  │
│ or                           │
│ bun run dev                  │
└──────────────────────────────┘
        ↓
  Dashboard loads
 without Pi auth
```

### Method 2️⃣: Visual Toggle Button

```
┌─────────────────────────────┐
│                             │
│   Your Dashboard            │
│                             │
│                             │
│                             │
│                 ┌─────────┐ │
│                 │ Dev Mode│ │ ← Click to toggle
│                 │   ON    │ │   Yellow button
│                 └─────────┘ │
└─────────────────────────────┘
         Bottom-right corner
         
  Click → Page reloads → Mode changes
```

### Method 3️⃣: Browser Console

```javascript
// In browser console:
localStorage.setItem('droplink-dev-mode', 'true');
window.location.reload();

// Result: Dev mode enabled
// Note: Persists until you remove it
```

---

## 📊 What Happens When Dev Mode is ON vs OFF

### Dev Mode: OFF 🔴
```
User visits /
    ↓
Dashboard component loads
    ↓
Check: isDevModeEnabled()? → false
    ↓
Show Pi Auth Modal
    ↓
User must authenticate with Pi
    ↓
Access granted after Pi auth
```

### Dev Mode: ON 🟢
```
User visits /
    ↓
Dashboard component loads
    ↓
Check: isDevModeEnabled()? → true
    ↓
Skip Pi Auth Modal
    ↓
User logged in as "devtest"
    ↓
Dashboard immediately accessible
```

---

## 🎮 Feature Availability Matrix

| Feature | Dev Mode ON | Dev Mode OFF |
|---------|------------|-------------|
| Dashboard Access | ✅ Instant | ⏳ After Pi auth |
| Profile Editing | ✅ Yes | ✅ Yes |
| Link Management | ✅ Yes | ✅ Yes |
| Store Setup | ✅ Yes | ✅ Yes |
| Pi Wallet | ⚠️ Mock | ✅ Real |
| Drop Balance | ⚠️ Mock | ✅ Real |
| Payments | ⚠️ Mock | ✅ Real |
| Ad Network | ⚠️ Mock | ✅ Real |

Legend: ✅ = Full | ⚠️ = Mock/Simulated | ❌ = Not Available

---

## 🔐 Dev Account Details

When Dev Mode is enabled, you're automatically logged in as:

```
┌─────────────────────────────────┐
│ Dev Test User                   │
├─────────────────────────────────┤
│ Username:    devtest            │
│ Email:       dev@droplink.local │
│ Display:     Dev Test User      │
│ Wallet:      GBXYZ123456789... │
│ Profile ID:  dev-profile-12345 │
│ Store:       Dev Store          │
└─────────────────────────────────┘
```

---

## 🚀 Quick Start Workflow

```
Step 1: Verify .env
┌──────────────────────┐
│ VITE_DEV_MODE=true   │
└──────────────────────┘
         ↓
Step 2: Restart Server
┌──────────────────────┐
│ npm run dev          │
└──────────────────────┘
         ↓
Step 3: Open Browser
┌──────────────────────┐
│ localhost:5173/      │
└──────────────────────┘
         ↓
Step 4: Dashboard Loads
┌──────────────────────┐
│ ✅ No auth required  │
│ ✅ Logged in as dev  │
│ ✅ All features work │
└──────────────────────┘
```

---

## 🎛️ Dev Mode Toggle Button

### Visual Appearance

#### When Dev Mode is OFF:
```
┌──────────────────┐
│ ◀ Dev Mode OFF   │ ← Gray button
└──────────────────┘
  Click to enable →
```

#### When Dev Mode is ON:
```
┌──────────────────┐
│ ▶ Dev Mode ON    │ ← Yellow button
└──────────────────┘
  Click to disable →
```

### Location
```
Top-left view of page:

┌─────────────────────────────────┐
│ Your Dashboard                  │
│                                 │
│ ... content ...                 │
│                                 │
│                  ┌──────────────┤
│                  │ 🟨 Dev Mode  │ ← Bottom-right
│                  │    ON        │   (Fixed position)
│                  └──────────────┤
└─────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Scenario A: Access Dashboard Without Pi Browser

```
Situation:
- Not in Pi Browser
- Don't have Pi account
- Want to test dashboard

Solution:
1. Set VITE_DEV_MODE=true
2. npm run dev
3. Visit http://localhost:5173/
4. ✅ Dashboard loads immediately

Result: Can test all UI/UX without Pi
```

### Scenario B: Test Auth Flow

```
Situation:
- Want to test both flows
- Auth-required and bypassed

Solution:
1. Dev Mode ON → Dashboard loads instantly
2. Click toggle → Dev Mode OFF
3. Click refresh → Auth modal appears
4. ✅ See both flows

Result: Test complete authentication system
```

### Scenario C: Switch Between Real and Mock User

```
Situation:
- Need to test with both user types

Solution:
1. Dev Mode ON → Use mock "devtest" user
2. Dev Mode OFF → Authenticate with Pi
3. Toggle as needed

Result: Can compare real vs mock behavior
```

---

## 📚 Documentation Map

```
┌─────────────────────────────────────┐
│      DOCUMENTATION FILES            │
├─────────────────────────────────────┤
│                                     │
│ 📄 QUICK_START_DEV_MODE.md          │
│    └─ 1-minute overview             │
│       Start here!                   │
│                                     │
│ 📄 DEV_MODE_GUIDE.md                │
│    └─ Complete documentation        │
│       Detailed setup & troubleshooting│
│                                     │
│ 📄 DEV_MODE_IMPLEMENTATION_SUMMARY.md│
│    └─ Technical details             │
│       For developers                │
│                                     │
│ 📄 IMPLEMENTATION_CHECKLIST.md       │
│    └─ Verification steps            │
│       Ensure everything works       │
│                                     │
└─────────────────────────────────────┘
```

**Recommended reading order:**
1. This file (overview)
2. QUICK_START_DEV_MODE.md (5 min)
3. DEV_MODE_GUIDE.md (15 min)

---

## 🎓 Code Examples

### Check if Dev Mode is Active
```typescript
import { isDevModeEnabled } from '@/lib/dev-auth';

if (isDevModeEnabled()) {
  console.log('✅ Dev mode is ON');
} else {
  console.log('⚠️ Dev mode is OFF');
}
```

### Get Dev Mode Status
```typescript
import { getDevModeStatus } from '@/lib/dev-auth';

const status = getDevModeStatus();
console.log(status);
// Output:
// {
//   enabled: true,
//   envEnabled: true,
//   localStorageEnabled: false
// }
```

### Get Mock User
```typescript
import { MOCK_DEV_USER } from '@/lib/dev-auth';

console.log(MOCK_DEV_USER.username); // 'devtest'
console.log(MOCK_DEV_USER.wallet_address); // 'GBXYZ...'
```

### Toggle Dev Mode Programmatically
```typescript
import { enableDevMode, disableDevMode } from '@/lib/dev-auth';

// Enable
enableDevMode(); // Page reloads with dev mode ON

// Disable
disableDevMode(); // Page reloads with dev mode OFF
```

---

## ⚡ Keyboard Shortcuts (Optional)

While dev mode doesn't have built-in shortcuts, you can create them:

```javascript
// In browser console:
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D to toggle dev mode
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    localStorage.getItem('droplink-dev-mode') === 'true'
      ? localStorage.removeItem('droplink-dev-mode')
      : localStorage.setItem('droplink-dev-mode', 'true');
    window.location.reload();
  }
});
```

---

## 🔍 Debugging

### Issue: Button Not Visible
```
Checklist:
□ Is .env correct? → grep VITE_DEV_MODE .env
□ Dev server restarted? → npm run dev
□ Browser cache cleared? → Ctrl+Shift+Del
□ Check console → F12 → Console tab
  → Run: import { logDevModeStatus } from '@/lib/dev-auth'; logDevModeStatus();
```

### Issue: Still Showing Auth Modal
```
Checklist:
□ VITE_DEV_MODE=true in .env?
□ Dev server restarted?
□ Try localStorage override:
  → localStorage.setItem('droplink-dev-mode', 'true');
  → window.location.reload();
```

### Issue: Dashboard Blank
```
Checklist:
□ Check console for errors (F12)
□ Verify src/lib/dev-auth.ts exists
□ Verify src/components/DevModeToggle.tsx exists
□ Try: npm run build (check for errors)
□ Clear localStorage: localStorage.clear();
```

---

## ✅ Success Indicators

When everything is working:

- ✅ Dev Mode toggle button visible (yellow, bottom-right)
- ✅ Dashboard loads without auth modal
- ✅ Logged in as "devtest" user
- ✅ Console shows: "🛠️ Dev mode active"
- ✅ All features accessible
- ✅ Mock wallet shows GBXYZ address
- ✅ Profile shows "Dev Test User"

---

## 🎉 You're Ready!

```
If you can see:
1. Yellow toggle button
2. Dashboard without auth
3. "devtest" as logged-in user

Then: ✅ DEV MODE IS WORKING

Next: Start testing dashboard features!
```

---

**Last Updated**: December 10, 2025  
**Status**: ✅ Ready to Use  
**Difficulty**: ⭐ Easy (3 steps)
