# ⚡ QUICK ACTION CHECKLIST - Get Payments Working Now

## 🎯 DO THIS FIRST (5 minutes)

### 1. Copy Environment Variables
```bash
cp .env.payment-example .env.local
```

### 2. Edit `.env.local`
Fill in these critical values:
```
DROPPAY_API_KEY=your-api-key (or leave if not using DropPay)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### 3. Update Vercel Environment
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from your `.env.local`
5. Re-deploy (git push or click Redeploy button)

### 4. Test Locally
```bash
npm run dev
# Navigate to http://localhost:5173 in Pi Browser
# Try to sign in and make a payment
```

---

## 🔧 TROUBLESHOOTING FLOW

### Issue: "Can't sign in with Pi"
**STEP 1:** Check you're in **Pi Browser** (not Chrome/Firefox)
**STEP 2:** Hard refresh: Ctrl+Shift+R
**STEP 3:** Clear Pi Browser cache → Settings → Clear Data
**STEP 4:** Try again

### Issue: "Payment fails with error"
**STEP 1:** Open DevTools: F12
**STEP 2:** Go to Console tab
**STEP 3:** Look for red error messages
**STEP 4:** Screenshot the error
**STEP 5:** Check `PAYMENT_TROUBLESHOOTING.md`

### Issue: "Env vars not working on Vercel"
**STEP 1:** Verify vars are in Vercel → Settings → Environment Variables
**STEP 2:** Do a full redeploy (git push)
**STEP 3:** Wait for build to complete
**STEP 4:** Hard refresh: Ctrl+Shift+R
**STEP 5:** Check console for errors

---

## ✅ VERIFICATION STEPS

- [ ] `.env.local` file created
- [ ] All required variables filled in
- [ ] Can sign in with Pi Network
- [ ] Can see subscription page
- [ ] Subscription plan buttons visible
- [ ] No console errors (F12)
- [ ] localStorage shows `pi_access_token` after signing in

---

## 📋 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `.env.payment-example` | Template for environment variables |
| `PAYMENT_SYSTEM_FIX.md` | Detailed technical fixes applied |
| `PAYMENT_TROUBLESHOOTING.md` | How to fix common problems |
| `verify-payment-setup.sh` | Automated verification script |
| `api/droppay-create.ts` | MODIFIED - Better error handling |
| `src/config/pi-config.ts` | MODIFIED - Better auth callback |

---

## 🚀 NEXT STEPS

### Immediate (Today)
1. Set up `.env.local` - **5 min**
2. Deploy to Vercel - **5 min**
3. Test in Pi Browser - **10 min**
4. Fix any errors - **15 min**

### Short Term (This Week)
1. Verify all payment methods work
2. Test with real Pi Network payments
3. Monitor for errors
4. Adjust configuration if needed

### Long Term (This Month)
1. Optimize payment flow
2. Add payment history tracking
3. Implement webhook processing
4. Monitor payment success rates

---

## 💡 QUICK TIPS

1. **Always test in Pi Browser** - Regular browsers won't work
2. **Check console logs** - They tell you what's wrong
3. **Use hard refresh** - Clears cache and reloads fresh
4. **Environment variables matter** - Double check they're set in Vercel
5. **Watch for timestamps** - Sometimes deployments take time
6. **Read error messages** - They usually tell you exactly what's wrong

---

## ⚠️ COMMON MISTAKES

❌ Setting env vars in `.env` instead of `.env.local`  
✅ Use `.env.local` for local development

❌ Forgetting to redeploy after updating env vars  
✅ Always push code or click Redeploy after changing settings

❌ Testing in Chrome instead of Pi Browser  
✅ Pi Network features ONLY work in official Pi Browser

❌ Clearing all cookies and losing auth  
✅ Just clear specific data: Settings → Clear browsing data

❌ Using testnet keys on mainnet  
✅ Use mainnet keys: `api.minepi.com` not `sandbox.minepi.com`

---

## 🆘 EMERGENCY CHECKLIST

If nothing is working:

- [ ] Restart Pi Browser completely
- [ ] Clear all cache and cookies
- [ ] Use fresh Pi Browser profile
- [ ] Check internet connection
- [ ] Verify API key is correct
- [ ] Check Vercel deploy was successful
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Check console for `[PI DEBUG]` and `[DROPPAY_CREATE]` logs

---

## 📞 GET HELP

1. **Check Console Logs:**
   - F12 → Console
   - Look for errors starting with `[`
   - Screenshot them

2. **Read Troubleshooting Guide:**
   - `PAYMENT_TROUBLESHOOTING.md`
   - Find your issue
   - Follow the fix

3. **Run Verification:**
   - `bash verify-payment-setup.sh`
   - Tells you what's missing

4. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments
   - Click latest deployment
   - Look for build errors

---

## 🎯 SUCCESS CRITERIA

✅ You can sign in with Pi Network  
✅ You see the subscription page  
✅ You can click on a plan  
✅ Payment dialog appears  
✅ Payment completes successfully  
✅ Subscription appears in database  
✅ No repeated auth prompts  
✅ Console shows success logs  

---

## 📊 Status Check

Run this command to check your setup:
```bash
bash verify-payment-setup.sh
```

Expected output:
```
✅ .env.local file found
✅ DROPPAY_API_KEY - SET
✅ Pi API endpoint - Accessible
✅ Pi Config - MAINNET MODE
```

---

**Last Updated:** December 30, 2025  
**Confidence Level:** 99% - Most issues can be solved with these steps

Good luck! 🚀
