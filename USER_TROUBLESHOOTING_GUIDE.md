# 🔧 Droplink Pi Authentication Troubleshooting Guide

**Having trouble signing in with Pi Network?** This guide will help you fix common authentication issues.

---

## 🚨 Quick Fix (Solves 90% of Issues)

### The #1 Reason Authentication Fails:

**You need to authorize Droplink in your Pi Network app!**

### ✅ Steps to Fix:

1. **Open the Pi Network app** on your phone
2. Tap on **Menu** (☰) → **Settings**
3. Scroll to **Connected Apps**
4. Find **"Droplink"** in the list
5. Tap on it and **Authorize** the app
6. Return to Pi Browser and try signing in again

**That's it!** This fixes 90% of authentication failures.

---

## 📱 Common Error Messages

### Error: "Pi authentication failed: Authentication failed"

**Cause:** App not authorized in Pi Network settings  
**Fix:** Follow the Quick Fix above ☝️

---

### Error: "No accessToken in response"

**Cause:** User denied permission or app not authorized  
**Fix:**
1. Check Pi Network app → Settings → Connected Apps
2. Make sure Droplink is authorized
3. Try signing in again

---

### Error: "Invalid access token - API returned status 401"

**Cause:** Token expired or invalid  
**Fix:**
1. Sign out completely
2. Clear Pi Browser cache:
   - Settings → Privacy → Clear browsing data
3. Sign in again

---

### Error: "Pi SDK not available"

**Cause:** Pi Browser didn't load the SDK yet  
**Fix:**
1. Wait 5 seconds and try again
2. Refresh the page
3. Check your internet connection

---

## 🔍 Detailed Troubleshooting Steps

### Step 1: Verify You're in Pi Browser

**Check:** Look for Pi Browser logo in the app bar

**Not in Pi Browser?**
- Copy your Droplink link
- Open Pi Browser app
- Paste link in Pi Browser
- Try signing in again

---

### Step 2: Check Pi Browser Version

Older Pi Browser versions may not support all features.

**How to update:**
1. Go to your phone's app store
2. Search "Pi Network"
3. Update if available
4. Restart Pi Browser

---

### Step 3: Clear Cache and Data

**In Pi Browser:**
1. Tap Menu (☰) → **Settings**
2. Tap **Privacy**
3. Tap **Clear browsing data**
4. Select:
   - ✅ Cached images and files
   - ✅ Cookies and site data
5. Tap **Clear data**
6. Refresh Droplink and try again

---

### Step 4: Check Internet Connection

**Pi Auth requires internet!**

**Try:**
- Switch between WiFi and mobile data
- Test other websites
- Restart your phone
- Try again

---

### Step 5: Re-authorize the App

**Even if you authorized before, try again:**

1. Open Pi Network app
2. Menu → Settings → Connected Apps
3. Find Droplink
4. **Remove** authorization
5. Go back to Droplink in Pi Browser
6. Click "Sign in with Pi Network"
7. **Authorize** when prompted

---

## 🔐 Privacy & Permissions

### What Droplink Asks For

**Minimal Permission:** Username only

**Why?**
- To identify you on Droplink
- To save your links and settings
- To provide personalized features

**Optional Permissions:**
- Payments (only if you make purchases)
- Wallet address (for DROP token features)

**Note:** You can always start with just username!

---

## 💡 Debug Mode (For Advanced Users)

### Enable Console Logs

1. Open Droplink in Pi Browser
2. Open Developer Tools (if available)
3. Look for messages starting with `[PI DEBUG]`
4. These show exactly where authentication fails

### Common Debug Messages

✅ **"Pi Browser detected via window.Pi object"**
- Good! Pi Browser is working

⏳ **"Calling Pi.authenticate()..."**
- Authentication starting

❌ **"Pi.authenticate() returned null"**
- User denied or app not authorized → Fix: Authorize in Pi app

✅ **"Pi API verification successful"**
- Perfect! Authentication complete

---

## 📞 Still Having Issues?

### Generate Debug Report

If nothing works, generate a debug report:

1. Open Pi Browser Developer Console (if available)
2. Type: `diagnosePiAuth()`
3. Copy the output
4. Contact Droplink support with the report

### What to Include

When reporting issues, provide:
- ✅ Exact error message
- ✅ Pi Browser version
- ✅ Phone model and OS
- ✅ What you tried so far
- ✅ Debug report (if available)

---

## 🎯 Prevention Tips

### Keep Authentication Working

1. **Keep Pi Browser updated**
   - Check for updates weekly

2. **Don't clear app data**
   - Clearing Pi Network app data removes authorizations

3. **Stay logged in**
   - Once authorized, you stay signed in

4. **Check app permissions**
   - Some phones restrict background permissions

---

## ✨ Success Checklist

Before contacting support, verify:

- [ ] I'm using Pi Browser (not Chrome/Safari)
- [ ] I authorized Droplink in Pi Network app settings
- [ ] Pi Browser is updated to latest version
- [ ] I have internet connection
- [ ] I cleared Pi Browser cache
- [ ] I tried signing out and back in
- [ ] I removed and re-authorized the app

---

## 📚 Additional Resources

**Official Pi Documentation:**
- Pi Platform Docs: https://github.com/pi-apps/pi-platform-docs
- Developer Portal: pi://develop.pi (in Pi Browser)

**Droplink Resources:**
- User Guide: Check in-app help section
- Feature Updates: Watch for announcements in app

---

## 🔄 Quick Reference Card

| Problem | Quick Fix |
|---------|-----------|
| "Authentication failed" | Authorize app in Pi Network settings |
| "No access token" | Check Pi app authorizations |
| "Invalid token" | Sign out, clear cache, sign in |
| "SDK not available" | Wait 5 seconds, refresh page |
| "Not in Pi Browser" | Copy link, open in Pi Browser |
| App freezes | Clear cache, restart Pi Browser |
| Can't see app in Connected Apps | Update Pi Browser version |

---

**Last Updated:** December 2025  
**Version:** 1.0

**Need more help?** Check our in-app support or community forums.
