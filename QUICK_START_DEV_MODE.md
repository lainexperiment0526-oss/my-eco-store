# Quick Start - Dev Mode

## 🚀 Get Dashboard Access in 3 Steps

### Step 1: Ensure Dev Mode is Enabled
Check your `.env` file has:
```
VITE_DEV_MODE=true
```

### Step 2: Restart Dev Server
```bash
npm run dev
# or
bun run dev
```

### Step 3: Access Dashboard
- Open `http://localhost:5173/`
- Dashboard loads **without** requiring Pi auth
- You're logged in as "devtest" user

---

## 🎛️ Toggle Dev Mode On/Off

**Yellow button in bottom-right corner:**
- 🟨 Visible = Dev mode available
- Toggle ON = Skip auth (instant dashboard)
- Toggle OFF = Require Pi auth (normal flow)
- One click to reload with new setting

---

## 📋 What's Included

✅ Full dashboard access
✅ Profile customization  
✅ Link management
✅ Store setup
✅ All UI/UX features

⚠️ Mock wallet (not real Pi Network)
⚠️ Mock user profile (dev@droplink.local)

---

## 🔐 Dev Account

```
Username:  devtest
Name:      Dev Test User
Email:     dev@droplink.local
Wallet:    GBXYZ123456789DEVWALLET...
```

---

## 🆘 Not Working?

### 1. Dev Mode button not visible?
```javascript
// In browser console:
import { logDevModeStatus } from '@/lib/dev-auth';
logDevModeStatus();
```

### 2. Still showing auth modal?
```javascript
// Force enable via localStorage:
localStorage.setItem('droplink-dev-mode', 'true');
window.location.reload();
```

### 3. Check actual env value:
```bash
grep VITE_DEV_MODE .env
```

---

## 📚 Need More Info?

See: `/DEV_MODE_GUIDE.md` for complete documentation

---

**Status**: ✅ Ready to Use | **Updated**: Dec 10, 2025
