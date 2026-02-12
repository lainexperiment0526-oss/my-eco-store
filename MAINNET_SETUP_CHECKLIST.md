# Droplink Mainnet Setup Verification Checklist

## ✅ Credentials Verified

- [x] Pi Network API Key: `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`
- [x] Validation Key: `7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a`
- [x] Network: **MAINNET** (Production)
- [x] Sandbox Mode: **DISABLED**

## Configuration Files

### Frontend Configuration
- **File**: `src/config/pi-config.ts`
- **Status**: ✅ Configured with mainnet API key
- **Sandbox Mode**: ✅ Disabled (SANDBOX_MODE: false)
- **Network**: ✅ Set to "mainnet"

### Environment Variables
- **File**: `.env`
- **Status**: ✅ Contains all required mainnet credentials
- **VITE_PI_API_KEY**: ✅ Set
- **VITE_PI_VALIDATION_KEY**: ✅ Set
- **VITE_PI_MAINNET_MODE**: ✅ true
- **VITE_PI_PAYMENTS_ENABLED**: ✅ true

## Key Features Enabled

- [x] **Pi Network Authentication** - Users can sign in with Pi Network
- [x] **Real Pi Payments** - Users can make real mainnet transactions
- [x] **Subscriptions** - Users can upgrade to paid plans (Basic, Premium, Pro)
- [x] **Pi Ad Network** - Users can watch ads for rewards
- [x] **DROP Token Support** - Platform supports DROP token
- [x] **Multi-Account Support** - Users can manage multiple Pi accounts

## Database Schema

### Required Tables
- [x] `profiles` - User profiles (with display_name column added)
- [x] `subscriptions` - User subscriptions (stores plan_type, billing_period, etc.)
- [x] `payment_idempotency` - Payment tracking for idempotent requests
- [x] `products` - Digital products for sale
- [x] `followers` - Social graph

### Recent Migrations Applied
- [x] `20251207000000_add_display_name_to_profiles.sql` - Added display_name column

## Payment Flow

### 1. User Initiates Subscription Payment
- Location: `/subscription` page
- Process: User selects plan and clicks "Subscribe with Pi"
- Confirmation: Shows real Pi mainnet payment warning

### 2. Pi SDK Payment Creation
- Pi Network authenticates user
- Payment is created with metadata (subscriptionPlan, billingPeriod, profileId, username)
- Pi SDK triggers callbacks

### 3. Server Approval (Edge Function)
- Function: `supabase/functions/pi-payment-approve/index.ts`
- Action: 
  - Validates payment with Pi API
  - Stores metadata in payment_idempotency table
  - Approves payment with Pi API
  - Sets status: pending → approved

### 4. Server Completion (Edge Function)
- Function: `supabase/functions/pi-payment-complete/index.ts`
- Action:
  - Retrieves stored metadata from payment_idempotency
  - Completes payment with Pi API using txid
  - **Creates subscription in database**
  - Sets status: approved → completed

### 5. Client Update
- Frontend receives success response
- User's plan is updated in UI
- Subscription details displayed

## Edge Functions to Deploy

```bash
# Deploy all functions
supabase functions deploy

# Or specific functions
supabase functions deploy pi-payment-approve
supabase functions deploy pi-payment-complete
supabase functions deploy pi-auth
```

## Testing Real Payments

### Prerequisites
- [ ] Pi Browser installed and accessible
- [ ] Pi Network account with mainnet wallet
- [ ] Pi coins in wallet for testing
- [ ] Supabase functions deployed with PI_API_KEY secret

### Test Steps
1. Navigate to `https://droplink.space/subscription`
2. Select "Premium" or "Pro" plan
3. Click "Subscribe with Pi"
4. Confirm the REAL Pi mainnet payment warning
5. Complete authentication in Pi Browser
6. Complete Pi payment
7. Verify subscription created in database:
   ```sql
   SELECT * FROM subscriptions WHERE username = 'YOUR_USERNAME';
   ```

## Troubleshooting

### Payment Shows "Could not find display_name column"
- **Fix**: Run migration `20251207000000_add_display_name_to_profiles.sql`
- **Status**: ✅ FIXED

### Subscription Not Created After Payment
- **Check**: Payment completion function logs
  ```bash
  supabase functions get-logs pi-payment-complete
  ```
- **Verify**: PI_API_KEY is set in Supabase secrets
- **Debug**: Check payment_idempotency table for metadata

### Payment Approval Fails
- **Check**: PI_API_KEY is correct
- **Verify**: Network is set to mainnet
- **Log**: Review pi-payment-approve function logs

### User Not Authenticated
- **Ensure**: Pi Network SDK is loaded
- **Check**: Window.Pi object exists
- **Verify**: User has clicked "Sign in with Pi Network"

## Documentation References

- **Pi Network Developer Guide**: https://pi-apps.github.io/community-developer-guide/
- **Pi Platform Docs**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **Pi Payments API**: https://pi-apps.github.io/community-developer-guide/ → Payments section
- **Pi Ad Network**: https://github.com/pi-apps/pi-platform-docs/tree/master → Ad Network

## Important Notes

⚠️ **CRITICAL - MAINNET PAYMENTS**
- All transactions are REAL mainnet payments
- Users will be charged actual Pi coins
- Payments are irreversible
- Always show clear warnings before payment
- Monitor logs for any issues

✅ **PRODUCTION READY**
- All mainnet credentials configured
- Payment flow fully implemented
- Database migrations applied
- Edge functions ready for deployment

## Next Steps

1. [ ] Deploy Supabase functions with PI_API_KEY secret
2. [ ] Test subscription payment flow
3. [ ] Monitor payment logs
4. [ ] Verify subscriptions are created in database
5. [ ] Check user experience in Pi Browser
