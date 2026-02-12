# ✅ Deploy Fixed Migration

## Issue Fixed
The migration error about missing `metadata` column has been corrected.

**What was fixed**: Removed references to non-existent `metadata` column

---

## Deploy Now

### Step 1: Apply the Fixed Migration
```bash
npx supabase db push
```

This will apply the corrected migration without errors.

### Step 2: Update Supabase Secrets
```bash
npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
npx supabase secrets set PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

### Step 3: Redeploy Edge Functions
**CRITICAL - Must do this for payment fixes!**
```bash
npx supabase functions deploy pi-payment-approve
npx supabase functions deploy pi-payment-complete
```

### Step 4: Rebuild Frontend
```bash
npm run build
```

---

## Quick Deploy All
```bash
npx supabase db push && ^
npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz && ^
npx supabase secrets set PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a && ^
npx supabase functions deploy pi-payment-approve && ^
npx supabase functions deploy pi-payment-complete && ^
npm run build
```

---

## Verify Migration Applied
```sql
-- Check if constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_name = 'profiles_pi_user_composite_key';

-- Should return: profiles_pi_user_composite_key
```

---

## Test Payment Flow
1. Open app in Pi Browser
2. Sign in with Pi Network
3. Go to Subscription page
4. Try to subscribe to a paid plan
5. Payment should work without timeout!

---

**Status**: ✅ Fixed and Ready to Deploy
