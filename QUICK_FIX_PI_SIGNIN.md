# 🚀 QUICK START - Fix Pi Sign-In in 3 Steps

## The Problem
❌ Error when signing in: "new row violates row-level security policy for table 'user_wallets'"

## The Solution
✅ We created a SQL fix that allows Pi authentication to work

---

## 3-Step Fix

### Step 1️⃣ Open Supabase Dashboard
1. Go to https://supabase.com and login
2. Select your **Droplink** project

### Step 2️⃣ Run the Fix SQL
1. Click **SQL Editor** (left sidebar)
2. Click **New query** button
3. Copy this entire file content: `FIX_PI_AUTH_RLS_COMPLETE.sql`
4. Paste into the editor
5. Click **Run** button (▶️)
6. You should see: ✅ "Pi Authentication RLS Fix Applied Successfully!"

### Step 3️⃣ Test Sign-In
1. Open your app in **Pi Browser**
2. Click **"Sign in with Pi Network"**
3. Authorize the request
4. ✅ You should be signed in!

---

## That's It! 🎉

If step 2 shows an error, try these troubleshooting steps:

### Troubleshooting
1. **Copy-paste error?** 
   - Make sure you copied the ENTIRE `FIX_PI_AUTH_RLS_COMPLETE.sql` file
   
2. **Still getting RLS errors?**
   - Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cookies/cache
   - Try again
   
3. **Can't find SQL Editor?**
   - Make sure you're in Supabase Dashboard
   - Look for "SQL Editor" in left sidebar menu
   
4. **Still stuck?**
   - Check [PI_AUTH_SIGNIN_FIX_GUIDE.md](PI_AUTH_SIGNIN_FIX_GUIDE.md) for detailed troubleshooting

---

## Files Reference

| File | Purpose |
|------|---------|
| `FIX_PI_AUTH_RLS_COMPLETE.sql` | The actual SQL fix to run |
| `PI_AUTH_SIGNIN_FIX_GUIDE.md` | Detailed guide with all steps |
| `PI_SIGNIN_FIX_COMPLETE.md` | Complete technical explanation |
| `fix-pi-auth-signin.bat` | Windows automated deployment (optional) |
| `fix-pi-auth-signin.sh` | Mac/Linux automated deployment (optional) |

---

## Need Help?
- 📖 See: [PI_AUTH_SIGNIN_FIX_GUIDE.md](PI_AUTH_SIGNIN_FIX_GUIDE.md)
- 🔍 See: [PI_SIGNIN_FIX_COMPLETE.md](PI_SIGNIN_FIX_COMPLETE.md)
- 🆘 Check browser console for detailed errors

**Good luck! The fix should work immediately after deployment.** ✅
