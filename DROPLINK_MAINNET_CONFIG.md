# Droplink Mainnet Configuration

## API Credentials

### Pi Network API Key (MAINNET)
```
ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw
```

### Validation Key
```
7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## Environment Variables to Set

Add these to your `.env.local` or Supabase environment variables:

```bash
VITE_PI_API_KEY=ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw
PI_API_KEY=ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw
PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## Important Documentation Links

### Pi Network Developer Guide
- **URL**: https://pi-apps.github.io/community-developer-guide/
- **Purpose**: Main reference for Pi Network integration, authentication, and payments

### Pi Platform Docs (GitHub)
- **URL**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **Purpose**: Pi Ad Network documentation and technical specifications

### Pi Network Payments
- API documentation for real mainnet Pi payments
- Transaction verification and completion flows
- Payment status management

### Pi Ad Network
- Ad display and revenue sharing
- User reward mechanisms
- Ad network SDK integration

## Configuration Status

✅ **MAINNET Verified** - These credentials are for production mainnet only
✅ **API Key Configured** - Ready for real Pi Network transactions
✅ **Validation Key Set** - For payment verification and authentication

## Usage Notes

- **DO NOT USE THESE CREDENTIALS FOR TESTING** - These are mainnet only
- Real Pi coins will be deducted from user wallets for all transactions
- All payments are final and irreversible
- Ensure proper error handling and user confirmations before payments
- Monitor transaction logs for any issues

## Related Configuration Files

- `src/config/pi-config.ts` - Pi Network configuration
- `.env.example` - Environment variable template
- `supabase/functions/pi-payment-approve/index.ts` - Payment approval handler
- `supabase/functions/pi-payment-complete/index.ts` - Payment completion handler
