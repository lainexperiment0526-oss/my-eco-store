# 📱 Pi Sign-In Fix - Visual Step-by-Step Guide

## Your Current Issue
From the screenshot you shared:
```
ERROR: "new row violates row-level security policy for table 'user_wallets'"
```

This happens when the database's security policies prevent user profile creation during Pi authentication.

---

## ✅ Complete Fix (Takes ~5 minutes)

### STEP 1: Open Supabase Dashboard
```
1. Go to: https://supabase.com
2. Log in with your account
3. Click on your "Droplink" project
4. Wait for dashboard to load
```

**Expected**: You should see the Supabase dashboard with your project

---

### STEP 2: Navigate to SQL Editor
```
1. Look at the LEFT SIDEBAR
2. Find and click: "SQL Editor"
3. You should see a code editor panel
4. Click the blue "+ New query" button
```

**Expected**: You see a blank SQL query editor

---

### STEP 3: Paste the Fix
```
1. Copy the ENTIRE contents of this file:
   👉 FIX_PI_AUTH_RLS_COMPLETE.sql
   
2. Go back to the SQL Editor
3. PASTE (Ctrl+V or Cmd+V) into the editor
4. You should see lots of SQL code in the editor
```

**Expected**: The editor fills with SQL code starting with:
```sql
-- Fix: profiles table RLS for Pi Auth
DROP POLICY IF EXISTS "Users can insert their own profile"...
```

---

### STEP 4: Run the SQL
```
1. In the SQL Editor, click the BLUE "Run" button (▶️)
   (Usually in the top-right corner)
   
2. Wait a few seconds for it to process
```

**Expected**: You see a green success message:
```
✅ Pi Authentication RLS Fix Applied Successfully!
```

If you see an error instead, scroll down to "Troubleshooting" section below.

---

### STEP 5: Test the Fix in Pi Browser
```
1. Open the Pi Browser app on your phone
2. Go to your app URL (usually https://droplink.space or local dev URL)
3. Click "Sign in with Pi Network" button
4. Authorize the request when prompted
5. Should see: Dashboard or success page (NOT an error)
```

**Expected**: ✅ You're successfully signed in!

---

## ✅ Verification (Optional but Recommended)

### Check 1: Verify in Supabase
```
1. Go to Supabase Dashboard
2. Click "Table Editor" (left sidebar)
3. Click "profiles" table
4. Look for your new profile with your Pi username
5. Click "user_wallets" table
6. Look for new wallet entry (auto-created)
```

**Expected**: Both tables have new rows for your account

### Check 2: Check Browser Console
```
1. In Pi Browser, press F12 (or long-press, select Inspect)
2. Go to "Console" tab
3. Look for these success logs:
   ✅ "[Pi Auth Service] ✅ Token validated. Pi user: @yourname"
   ✅ "[Pi Auth Service] ✅ New profile created for Pi user"
   ✅ "[Pi DEBUG] ✅ Authentication complete!"
```

**Expected**: Green checkmarks ✅, no red errors ❌

---

## 🆘 Troubleshooting

### Issue 1: SQL Paste Didn't Work
**Symptom**: "No such file or directory" or parsing error  
**Solution**:
1. Clear the editor (Ctrl+A, Delete)
2. Open `FIX_PI_AUTH_RLS_COMPLETE.sql` in a text editor
3. Copy the ENTIRE file (select all with Ctrl+A)
4. Paste again into SQL Editor
5. Click Run

### Issue 2: Still Getting RLS Error
**Symptom**: Still see "row-level security policy" error  
**Solution**:
1. Refresh browser completely (Ctrl+F5)
2. Clear browser cookies:
   - Pi Browser → Settings → Privacy → Clear browsing data
3. Try signing in again

### Issue 3: Green Success But Still Getting Error
**Symptom**: Fix ran successfully but sign-in still fails  
**Solution**:
1. Check browser console for specific error (F12 → Console)
2. Go to Supabase → Logs tab
3. Look for the exact error message
4. Share that error with support

### Issue 4: Can't Find SQL Editor
**Symptom**: Don't see "SQL Editor" option  
**Solution**:
1. Scroll down in left sidebar
2. Look for "Database" section
3. Under it, find "SQL Editor"
4. If still not visible, try refreshing the page

### Issue 5: "Cannot run query" Error
**Symptom**: SQL Editor shows "Cannot run query"  
**Solution**:
1. Make sure you're logged in to Supabase
2. Make sure you selected the correct project
3. Try copying just the first few lines and running
4. If still fails, use the CLI method (see below)

---

## 🔧 Alternative: Using Supabase CLI

If the SQL Editor method doesn't work:

### Windows (PowerShell)
```powershell
# 1. Open PowerShell in your project folder
# 2. Run:
supabase db push FIX_PI_AUTH_RLS_COMPLETE.sql
```

### Mac/Linux (Terminal)
```bash
# 1. Open Terminal in your project folder
# 2. Run:
supabase db push FIX_PI_AUTH_RLS_COMPLETE.sql
```

---

## 📚 Documentation Files

If you need more help:
- **Quickest**: `QUICK_FIX_PI_SIGNIN.md` - 3 step summary
- **Detailed**: `PI_AUTH_SIGNIN_FIX_GUIDE.md` - Full guide with all options
- **Technical**: `PI_SIGNIN_FIX_COMPLETE.md` - For developers
- **Summary**: `DEPLOYMENT_SUMMARY.txt` - Overview of changes

---

## ✅ You're Done!

Once you see the green success message in Supabase and can sign in with Pi Network, the fix is complete!

**The error should be gone and you can now:**
- ✅ Sign in with Pi Network
- ✅ Create new accounts
- ✅ Use all Pi features
- ✅ Make payments
- ✅ Manage your profile

---

## 🎯 Quick Summary

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Supabase Dashboard | See project dashboard |
| 2 | Click SQL Editor | See code editor |
| 3 | Paste `FIX_PI_AUTH_RLS_COMPLETE.sql` | See SQL code in editor |
| 4 | Click Run | See "✅ Fix Applied Successfully!" |
| 5 | Test in Pi Browser | Sign in works! ✅ |

---

**Questions?** Check the `PI_AUTH_SIGNIN_FIX_GUIDE.md` file for detailed troubleshooting!
