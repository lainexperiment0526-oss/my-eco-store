# Pi Authentication - Deployment Flowchart & Decision Guide

## Visual Deployment Process

```
┌─────────────────────────────────────────────────────────────────┐
│                   Ready to Deploy Updates?                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Build Your Application                                 │
│  Command: npm run build                                          │
│  Status: ✅ Build must succeed before proceeding                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                  ▼──────────────◄─── Build Failed?
                  │               └──► FIX ERRORS → Rebuild
                  │ Build OK
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Open Supabase Dashboard                                │
│  URL: https://supabase.com/dashboard                            │
│  Action: Select droplink-testnet project                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Go to SQL Editor                                       │
│  Path: Database → SQL Editor (top left)                         │
│  Action: Click "New Query"                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Run Pi Auth Setup Script                               │
│  File: verify-pi-auth-schema.sql (in project root)              │
│  Action:                                                         │
│   1. Copy entire file content                                   │
│   2. Paste into SQL Editor                                      │
│   3. Click RUN button                                           │
│   4. Wait for completion (1-2 minutes)                          │
│  Expected Output:                                                │
│   ✅ All Pi auth columns verified successfully!                 │
│   ✅ authenticate_pi_user_safe function created successfully!   │
│   🔄 Schema cache refresh notification sent to PostgREST        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                  ▼──────────────◄─── Script Failed?
                  │               └──► Check Supabase Status
                  │                  → Try Manual Steps
                  │ Script OK
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Wait for Schema Cache Refresh                          │
│  Action: Wait 30-60 seconds                                     │
│  Why: PostgREST needs time to reload the schema from database   │
│  Warning: ⏳ DO NOT SKIP THIS STEP                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Deploy Application                                     │
│  Option A (Automated): deploy-with-pi-auth-check.bat (Windows)  │
│  Option B (Automated): bash deploy-with-pi-auth-check.sh (Mac)  │
│  Option C (Manual): npm run deploy                              │
│  Target: Production environment                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                  ▼──────────────◄─── Deploy Failed?
                  │               └──► Check Vercel Logs
                  │                  → Retry deploy
                  │ Deploy OK
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 7: Verify Pi Authentication Works                         │
│  Action:                                                         │
│   1. Visit: https://yourdomain.com/auth                         │
│   2. Click "Sign in with Pi Network"                            │
│   3. Complete authentication flow                               │
│  Expected Results:                                              │
│   ✅ Login successful                                           │
│   ✅ No "Could not find column" error                           │
│   ✅ User profile created in Supabase                           │
│   ✅ Wallet address saved                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                  ▼──────────────◄─── Verification Failed?
                  │               └──► See Troubleshooting Below
                  │ All OK
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 🎉 DEPLOYMENT COMPLETE! 🎉                      │
│                 Pi Auth is working perfectly!                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree: Which Deployment Method?

```
                    Ready to Deploy?
                          │
                          ▼
            ┌─────────────────────────┐
            │ Using Windows?          │
            └──────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         │ YES               │ NO
         │                   │
         ▼                   ▼
    ┌────────┐          ┌──────────┐
    │ Use    │          │ Using    │
    │ .bat   │          │ MacOS/   │
    │ script │          │ Linux?   │
    └────┬───┘          └────┬─────┘
         │                   │
         │           ┌───────┴──────┐
         │           │ YES         │ NO
         │           │             │
         │           ▼             ▼
         │      ┌────────┐      ┌──────┐
         │      │ Use    │      │ Use  │
         │      │ .sh    │      │ npm  │
         │      │script  │      │run   │
         │      └────────┘      │deploy│
         │                      └──────┘
         │
         └──────┬────────────────────────┐
                │                        │
                ▼                        ▼
         ┌────────────┐          ┌──────────┐
         │ AUTOMATED  │          │ MANUAL   │
         │ Setup      │          │ Setup    │
         │ + Deploy   │          │ Required │
         └──────┬─────┘          └────┬─────┘
                │                     │
                │             ┌───────┴──────────┐
                │             │                  │
                │             ▼                  ▼
                │        ┌─────────┐      ┌──────────┐
                │        │ Run SQL │      │ Deploy   │
                │        │ Script  │      │ Only     │
                │        │ Manual  │      │ No Setup │
                │        └─────────┘      └──────────┘
                │             │                  │
                ▼             ▼                  ▼
            Easiest!      Manual              Risky! ⚠️
            Recommended   But Safe           (May fail)
            ⭐⭐⭐        ⭐⭐              ⭐
```

---

## Troubleshooting Decision Tree

```
                Does Pi Auth Work?
                      │
         ┌────────────┴────────────┐
         │ YES                     │ NO
         │                         │
         ▼                         ▼
    ┌────────┐          ┌──────────────────┐
    │Success!│          │ Check Console    │
    │✅      │          │ (F12 key)        │
    │        │          │ Error message:?  │
    └────────┘          └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌──────────┐    ┌──────────────┐   ┌────────────────┐
        │ "Could   │    │ "Function    │   │ Other Error    │
        │ not find │    │ not found"   │   │ (see logs)     │
        │ column"  │    │              │   │                │
        └────┬─────┘    └───────┬──────┘   └────────┬───────┘
             │                  │                   │
             ▼                  ▼                   ▼
        ┌──────────┐    ┌──────────────┐   ┌────────────────┐
        │ Schema   │    │ RPC Function │   │ Database Issue │
        │ Cache    │    │ Missing      │   │ or API Error   │
        │ Not      │    │              │   │                │
        │ Refreshed│    │Run SQL setup │   │ Check Supabase │
        │          │    │script again  │   │ Logs & Status  │
        └────┬─────┘    └──────────────┘   └────────┬───────┘
             │                                      │
             ▼                                      │
        ┌──────────┐                               │
        │ SOLUTION │◄──────────────────────────────┘
        │ 1. Run   │
        │ NOTIFY   │
        │ pgrst    │
        │ reload   │
        │ 2. Wait  │
        │ 30 sec   │
        │ 3. Clear │
        │ cache    │
        │ 4. Retry │
        └──────────┘
```

---

## Quick Start Guide by Experience Level

### 🟢 Beginners (First Time)
**Time: 15 minutes**

```
1. Read: PI_AUTH_QUICK_CHECKLIST.md
2. Build: npm run build
3. Run: deploy-with-pi-auth-check.bat (Windows)
       OR bash deploy-with-pi-auth-check.sh (Mac)
4. Follow the prompts
5. Done! Script handles everything
```

### 🟡 Intermediate (Familiar with Process)
**Time: 5-10 minutes**

```
1. npm run build
2. Open Supabase → SQL Editor
3. Run: verify-pi-auth-schema.sql
4. Run: NOTIFY pgrst, 'reload schema';
5. Wait 30 seconds
6. npm run deploy
7. Test at /auth
```

### 🔴 Advanced (Just Deploy)
**Time: 1 minute**

```
1. npm run build
2. deploy-with-pi-auth-check.bat
   (It handles everything else)
```

---

## File Reference Guide

| Situation | Use This File |
|-----------|---------------|
| First deployment | PI_AUTH_QUICK_CHECKLIST.md |
| Need detailed help | PI_AUTH_MAINTENANCE_GUIDE.md |
| Understanding the fix | PI_AUTH_SOLUTION_COMPLETE.md |
| Quick reference before deploying | PI_AUTH_QUICK_CHECKLIST.md |
| Windows automated setup | deploy-with-pi-auth-check.bat |
| Mac/Linux automated setup | deploy-with-pi-auth-check.sh |
| Supabase SQL setup | verify-pi-auth-schema.sql |
| Traditional deploy with reminder | deploy.bat or deploy.sh |

---

## Success Criteria Checklist

After deployment, verify ALL of these:

- [ ] npm build completed without errors
- [ ] SQL setup script ran successfully in Supabase
- [ ] Saw "✅ All Pi auth columns verified" message
- [ ] Saw "✅ authenticate_pi_user_safe function created" message
- [ ] Waited 30+ seconds after NOTIFY command
- [ ] App deployed successfully
- [ ] Pi login test successful at /auth
- [ ] No "Could not find column" errors in console
- [ ] User profile visible in Supabase profiles table
- [ ] Pi fields populated (pi_user_id, pi_username, etc.)
- [ ] Wallet address saved correctly
- [ ] Can create new profiles with Pi login

**All checked?** 🎉 You're done! Pi auth is working perfectly.

---

## Time Estimates

| Method | Build | Supabase | Wait | Deploy | Test | Total |
|--------|-------|----------|------|--------|------|-------|
| Automated (.bat/.sh) | 3 min | 2 min | 0 min* | 2 min | 2 min | ~9 min |
| Manual | 3 min | 2 min | 1 min | 2 min | 2 min | ~10 min |
| Without setup ❌ | 3 min | 0 min | 0 min | 2 min | ERROR! | FAILED |

*Automated script handles Supabase steps

---

## One-Liner Reference

```bash
# Windows (recommended)
deploy-with-pi-auth-check.bat

# Mac/Linux (recommended)
bash deploy-with-pi-auth-check.sh

# Traditional (add manual steps)
npm run deploy
```

---

## Remember

✅ **Always** run `verify-pi-auth-schema.sql` before deploying  
✅ **Always** wait 30 seconds after `NOTIFY pgrst, 'reload schema';`  
✅ **Always** test Pi login immediately after deployment  
✅ **Always** refer to the quick checklist  
✅ **Use** the automated scripts - they prevent mistakes  

❌ **Never** skip Supabase setup  
❌ **Never** rush the schema cache refresh wait time  
❌ **Never** deploy without testing  
❌ **Don't** worry - if something goes wrong, see troubleshooting  

---

## Support Resources

**Quick questions?** → PI_AUTH_QUICK_CHECKLIST.md  
**Detailed help?** → PI_AUTH_MAINTENANCE_GUIDE.md  
**Understanding?** → PI_AUTH_SOLUTION_COMPLETE.md  
**Automated?** → deploy-with-pi-auth-check.bat/.sh  

You've got this! 🚀
