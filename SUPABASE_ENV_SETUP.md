# Supabase Environment Variables Setup

## For Local Development

Add these to your `.env.local`:

```bash
# Pi Network API (for Supabase Edge Functions)
PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## For Production (Supabase Console)

1. Go to your Supabase project dashboard
2. Navigate to **Settings → Edge Functions → Secrets**
3. Add the following secrets:

```
PI_API_KEY = b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
PI_VALIDATION_KEY = 7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## How Edge Functions Access These Secrets

In your Supabase Edge Functions (Deno), access them like this:

```typescript
const PI_API_KEY = Deno.env.get('PI_API_KEY');
const PI_VALIDATION_KEY = Deno.env.get('PI_VALIDATION_KEY');
```

## Current Functions Using These Secrets

1. **pi-payment-approve** - Approves Pi payments with Pi API
   - Uses: `PI_API_KEY`
   - Endpoint: `POST /pi-payment-approve`

2. **pi-payment-complete** - Completes Pi payments with Pi API
   - Uses: `PI_API_KEY`
   - Endpoint: `POST /pi-payment-complete`

3. **pi-auth** - Authenticates users with Pi Network
   - Uses: `PI_API_KEY`
   - Endpoint: `POST /pi-auth`

## Verification Steps

After setting up the secrets:

1. Deploy functions:
   ```bash
   supabase functions deploy
   ```

2. Test with a real Pi payment:
   - Go to `/subscription` page
   - Try to upgrade to a paid plan
   - Complete the Pi Network payment flow
   - Check that subscription is created in database

3. Check logs:
   ```bash
   supabase functions list
   supabase functions get-logs pi-payment-complete
   ```

## Troubleshooting

If payments fail:
- Verify PI_API_KEY is set in Supabase secrets
- Check edge function logs for errors
- Ensure user is authenticated with Pi Network
- Confirm payment_idempotency table exists
- Check subscriptions table has all required columns

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit these credentials to version control
- Use `.env.local` for local development only
- Only add to Supabase secrets via console (not in code)
- These are mainnet production credentials - use with care
- All payments are REAL and irreversible
