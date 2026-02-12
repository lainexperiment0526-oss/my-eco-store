# 🎯 Payment System Troubleshooting Guide

## Quick Diagnostics

### Issue: "Calling Pi.authenticate()..." keeps appearing

**What's happening:**
- The app detects you're not authenticated
- It automatically tries to sign you in
- But something blocks the sign-in, so it keeps retrying

**Quick fixes:**
1. **Clear browser data:**
   - Pi Browser → Settings → Clear browsing data
   - Select: Cookies, Cached images and files
   - Click Clear

2. **Check token in storage:**
   - Pi Browser DevTools (F12) → Application → Local Storage
   - Look for `pi_access_token`
   - If missing or expired, you need to sign in again

3. **Force refresh:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - This clears cache and reloads fresh

4. **Check console for errors:**
   - F12 → Console tab
   - Look for red error messages
   - Screenshot any errors for debugging

---

## DropPay Payment Issues

### Issue: "DropPay API error (500)"

**This means:** The DropPay backend is not responding correctly

**Checklist:**
- [ ] Is `DROPPAY_BASE_URL` correct? (Check it's accessible)
- [ ] Is `DROPPAY_API_KEY` set in Vercel environment?
- [ ] Does your DropPay app have the `/api/v1/payments` endpoint?
- [ ] Does DropPay app validate the API key correctly?
- [ ] Is DropPay app deployed and running?

**Test DropPay manually:**
```bash
curl -X POST https://droppay.space/api/v1/payments \
  -H "Authorization: Key dp_live_F3Zh6pNPJLAMUCpIstA9HjBmPckjImBV" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "currency": "PI",
    "description": "Test"
  }'
```

Expected success response:
```json
{
  "checkout_url": "https://...",
  "payment_id": "pay_xxx"
}
```

---

### Issue: "No checkout URL found in response"

**This means:** DropPay returned data but not in the format we expected

**Solutions:**
1. Check exact DropPay response in browser console:
   - F12 → Network tab
   - Find request to `/api/droppay-create`
   - Look at Response tab
   - Copy the JSON response

2. Verify response includes ONE of these fields:
   - `checkout_url` ← Preferred
   - `url`
   - `payment_url`
   - `payment.checkout_url`
   - `links.checkout`
   - `redirect_url`

3. If your DropPay backend returns different format:
   - Update DropPay response to include `checkout_url` field
   - OR add new field name to the URL extraction in `/api/droppay-create.ts`

---

### Issue: DropPay button is disabled/grayed out

**Possible causes:**
1. DROPPAY_API_KEY not configured
   - Check: `.env.local` or Vercel settings
   - Should have value like `dp_live_...`

2. You're looking at "Free" plan
   - DropPay button only shows for paid plans

3. You already have that plan
   - "✓ Current Plan" button shows instead

**Fix:**
- Verify env vars: `VITE_DROPPAY_API_KEY` (frontend) and `DROPPAY_API_KEY` (backend)

---

## Pi Network Payment Issues

### Issue: "Pi Network authentication required" in Pi Browser

**This means:** The Pi.authenticate() call is failing

**Debug steps:**
1. Check console logs:
   ```
   [PI DEBUG] ✅ Pi.authenticate() returned successfully  ← Should see this
   ```

2. If you see errors, they'll start with `[PI DEBUG] ❌`
   - Screenshot the exact error
   - Check if permissions dialog appeared

3. Verify Pi Browser version:
   - Settings → About
   - Should be recent version

4. Try these fixes:
   - Update Pi Browser to latest version
   - Clear app cache
   - Restart Pi Browser completely
   - Try a different profile if available

---

### Issue: "No access token received from Pi Network"

**This means:** User clicked cancel or connection dropped during auth

**Solutions:**
1. User needs to try again
2. Give permission to all scopes (username, payments, wallet_address)
3. Check internet connection
4. Try on stable Wi-Fi instead of cellular

---

### Issue: Payment shows "Failed to process subscription"

**Check these:**
1. Do you have Pi coins in wallet?
   - Pi Browser → Wallet → Check balance
   - Need more than payment amount + fees

2. Check payment result in console:
   - F12 → Console
   - Look for `[SUBSCRIPTION] Payment result:`
   - Check what error it contains

3. Verify database was updated:
   - Payment succeeded but database write failed
   - Check Supabase → subscriptions table

---

## Vercel Deployment Issues

### Issue: Everything works locally but fails on Vercel

**Common causes:**

1. **Missing environment variables**
   - Go to Vercel → Project → Settings → Environment Variables
   - Add ALL variables from `.env.payment-example`
   - Redeploy (git push)

2. **Wrong environment variable names**
   - Frontend code uses `VITE_*` prefix
   - Backend code uses regular names like `DROPPAY_API_KEY`
   - Check carefully!

3. **API endpoint issues**
   - Make sure `/api/droppay-create` is accessible
   - Check API route in `api/` folder exists
   - Verify route name matches

**Deployment checklist:**
- [ ] All VITE_* vars set in Vercel
- [ ] All non-VITE vars set in Vercel
- [ ] Vercel deployment completed (wait for blue checkmark)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for errors

---

## Console Log Guide

### What to look for:

**Good signs:**
```
[PI DEBUG] ✅ Pi.authenticate() returned successfully
[PI DEBUG] ✅ Access token received: xxxxx...
[Pi Auth Service] ✅ Pi Mainnet authentication complete!
[SUBSCRIPTION] ⚠️ REAL MAINNET PAYMENT: 10 Pi for Basic
[DROPPAY_CREATE] Response status: 200
```

**Bad signs:**
```
[PI DEBUG] ❌ window.Pi is undefined
[PI DEBUG] ❌ No access token in authResult
[DROPPAY_CREATE] Response status: 500
[DROPPAY_CREATE] No checkout URL found in response
```

---

## Step-by-Step Payment Test

### Test Pi Payments (Complete Flow)

1. **Open Pi Browser** (not regular browser!)
2. **Navigate** to https://droplink.space
3. **Check console:**
   - F12 → Console tab
   - Should see `[PI DEBUG]` messages
4. **Click "Sign in with Pi Network"**
   - Watch console for messages
   - Permission dialog should appear
5. **Grant permissions** when asked
   - Click allow/confirm buttons
6. **Check storage:**
   - F12 → Application → Local Storage
   - Should see `pi_access_token` and `pi_user`
7. **Go to Subscription** page
8. **Pick a paid plan** (not Free)
9. **Click "Subscribe with Pi"**
   - Payment dialog appears
10. **Confirm payment**
11. **Check console** for success message
12. **Check Supabase** → subscriptions table → Should have new row

---

### Test DropPay (Complete Flow)

1. **Open Pi Browser**
2. **Navigate** to https://droplink.space
3. **Sign in with Pi Network** (same as above)
4. **Go to Subscription** page
5. **Check warning message:**
   - If it says "DropPay Service Currently Unavailable"
   - Use Pi payments instead
6. **Pick a paid plan**
7. **Click "Subscribe with DropPay"**
   - Should redirect to DropPay checkout
8. **Complete payment** in DropPay
9. **Check browser** for success redirect

---

## Getting Help

**When reporting issues, include:**

1. **Screenshot of error** (or console log)
2. **Exact steps** to reproduce
3. **Console logs** (F12 → Console tab)
4. **Environment:**
   - Pi Browser version
   - Device (iPhone/Android)
   - Network (Wi-Fi/cellular)
5. **Environment variables set?**
   - Yes/No
   - If yes, which ones

**Share logs like:**
```
[PI DEBUG] ✅ Pi.authenticate() returned successfully
[DROPPAY_CREATE] Response status: 500
[DROPPAY_CREATE] Response text: {"error": "Invalid API key"}
```

---

## Quick Reference

| Issue | First Try | Second Try | Third Try |
|-------|-----------|-----------|-----------|
| Won't sign in | Clear cache | Update Pi Browser | Restart device |
| DropPay error 500 | Check API key | Check endpoint URL | Check DropPay app |
| No checkout URL | Check DropPay response format | Add field to parsing | Ask DropPay maintainer |
| Payment fails | Check balance | Try different network | Check logs |

---

## More Resources

- [Pi Network Docs](https://pi-apps.github.io/community-developer-guide/)
- [Pi Browser Download](https://minepi.com/download)
- [DropLink Support](https://droplink.space)
- [Supabase Docs](https://supabase.com/docs)

