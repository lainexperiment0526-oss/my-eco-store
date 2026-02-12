# Pi Network Mainnet Integration Guide

## 🎯 Overview

This guide provides complete setup instructions for integrating Droplink with Pi Network Mainnet using the official Pi Network APIs.

## 📋 Prerequisites

- Pi Network Developer Account
- API Key from Pi Network Developer Portal
- Validation Key (domain verification)
- Supabase project configured
- Node.js 18+ and npm/pnpm installed

## 🔑 API Credentials

### Mainnet API Key
```
ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw
```

### Validation Key
```
7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
```

## 🚀 Quick Setup

### 1. Environment Configuration

The following environment variables are already configured in `.env`, `.env.production`, and `.env.example`:

```bash
# Pi Network Mainnet Configuration
VITE_PI_API_KEY=ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw
VITE_PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a

# Pi Network Settings
VITE_PI_NETWORK=mainnet
VITE_PI_NETWORK_PASSPHRASE=Pi Mainnet
VITE_API_URL=https://api.minepi.com
VITE_PI_HORIZON_URL=https://api.minepi.com
VITE_PI_SDK_URL=https://sdk.minepi.com/pi-sdk.js

# Feature Flags
VITE_PI_SANDBOX_MODE=false
VITE_PI_MAINNET_MODE=true
VITE_PI_AUTHENTICATION_ENABLED=true
VITE_PI_PAYMENTS_ENABLED=true
VITE_PI_AD_NETWORK_ENABLED=true
```

### 2. Supabase Backend Configuration

Deploy the Pi Network credentials to your Supabase project:

```bash
# Option 1: Use the automated script
.\deploy-mainnet-config.ps1

# Option 2: Manual deployment
supabase secrets set PI_API_KEY="ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"
supabase secrets set PI_VALIDATION_KEY="7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"
supabase secrets set PI_API_BASE_URL="https://api.minepi.com"
supabase secrets set PI_NETWORK="mainnet"
supabase secrets set PI_NETWORK_PASSPHRASE="Pi Mainnet"
```

### 3. Validation Key File

The validation key file is already created at:
- `public/.well-known/validation-key.txt`
- `public/validation-key.txt`
- `validation-key.txt`

This file is required for domain verification by Pi Network.

### 4. Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting platform
# The build output will be in the 'dist' directory
```

## 📚 Pi Network Integration Features

### 1. Authentication

Users can sign in using their Pi Network account:

```typescript
// Authentication is handled automatically by PiContext
// Scopes: ['username', 'payments', 'wallet_address']
```

**Configuration:** `src/config/pi-config.ts`

### 2. Payments

Support for Pi Network payments for subscriptions and premium features:

**Backend Functions:**
- `supabase/functions/pi-payment-approve/index.ts` - Approve payment requests
- `supabase/functions/pi-payment-complete/index.ts` - Complete and verify payments

**Payment Flow:**
1. User initiates payment
2. Pi SDK creates payment request
3. Backend approves payment (`/pi-payment-approve`)
4. User completes payment in Pi Wallet
5. Backend verifies and completes payment (`/pi-payment-complete`)

### 3. Ad Network

Integrate Pi Ad Network for monetization:

**Backend Function:**
- `supabase/functions/pi-ad-verify/index.ts` - Verify ad impressions

**Ad Types:**
- Rewarded ads (users earn rewards)
- Interstitial ads (between content)

### 4. Wallet Detection

Automatically detect Pi wallet addresses and balances for authenticated users.

## 🔧 Configuration Files

### Frontend Configuration
- `src/config/pi-config.ts` - Main Pi Network configuration
- `src/config/piConfig.ts` - Alternative config (legacy)
- `src/config/piSDK.ts` - Pi SDK initialization

### Backend Functions
- `supabase/functions/pi-payment-approve/` - Payment approval
- `supabase/functions/pi-payment-complete/` - Payment completion
- `supabase/functions/pi-ad-verify/` - Ad verification
- `supabase/functions/pi-auth/` - Authentication

### Environment Files
- `.env` - Development environment
- `.env.production` - Production environment
- `.env.example` - Template for new installations

## 📖 Official Documentation

### Pi Network Developer Resources

1. **Pi Developer Guide** (Main Documentation)
   - URL: https://pi-apps.github.io/community-developer-guide/
   - Topics: Authentication, Payments, Best Practices

2. **Pi Platform Docs** (GitHub Repository)
   - URL: https://github.com/pi-apps/pi-platform-docs/tree/master
   - Topics: Ad Network, Technical Specifications, API Reference

3. **Pi SDK Documentation**
   - JavaScript SDK for Pi Network integration
   - Includes: Authentication, Payments, User Data

### Key Documentation Sections

#### Authentication
- **Scopes:** `username`, `payments`, `wallet_address`
- **OAuth Flow:** Standard OAuth 2.0 with Pi SDK
- **User Data:** Access to Pi username and wallet address

#### Payments
- **Currency:** Pi (π)
- **Min Amount:** 0.01 π
- **Max Amount:** 10,000 π
- **Transaction Time:** Typically 5-30 seconds
- **Fees:** Network fees apply (paid by sender)

#### Ad Network
- **Ad Types:** Rewarded, Interstitial
- **Revenue Share:** Varies by ad type
- **Frequency Cap:** 3 ads per user per day (configurable)
- **Cooldown:** 5 minutes between ads (configurable)

## 🧪 Testing

### Local Development
```bash
# Run development server
npm run dev

# The app will be available at http://localhost:5173
# Note: Pi SDK features require Pi Browser for full testing
```

### Pi Browser Testing

1. Open Pi Browser app on mobile device
2. Navigate to your deployed URL
3. Test authentication flow
4. Test payment flow with small amounts
5. Test ad network integration

### Mainnet vs Sandbox

**Current Configuration: MAINNET**
- Real Pi coins are used
- Transactions are permanent
- Users are real Pi Network users

To switch to sandbox for testing:
```bash
# In .env
VITE_PI_SANDBOX_MODE=true
VITE_PI_NETWORK=sandbox
VITE_API_URL=https://sandbox.minepi.com
```

## ⚠️ Important Notes

### Security
- ✅ **NEVER** commit API keys to version control
- ✅ Use environment variables for all secrets
- ✅ Backend functions validate all payment transactions
- ✅ Supabase secrets are encrypted

### Mainnet Considerations
- 🔴 All payments use **REAL Pi coins**
- 🔴 Transactions are **IRREVERSIBLE**
- 🔴 Test thoroughly in sandbox before mainnet deployment
- 🔴 Implement proper error handling and user confirmations

### Payment Best Practices
1. Always show payment amount clearly to users
2. Confirm user intent before initiating payments
3. Handle payment errors gracefully
4. Provide transaction receipts
5. Implement timeout handling (60 seconds default)

### Rate Limits
- Authentication: No specific limit
- Payments: Subject to Pi Network limits
- Ad Network: Configurable frequency caps

## 🐛 Troubleshooting

### Common Issues

**Issue:** "PI_API_KEY not configured"
- **Solution:** Verify Supabase secrets are set correctly
- **Check:** Run `supabase secrets list`

**Issue:** Payment fails silently
- **Solution:** Check browser console for errors
- **Verify:** Pi Browser is up to date
- **Check:** User has sufficient Pi balance

**Issue:** Domain validation fails
- **Solution:** Ensure `validation-key.txt` is accessible at:
  - `https://droplink.space/.well-known/validation-key.txt`
  - `https://droplink.space/validation-key.txt`

**Issue:** Sandbox/Mainnet mismatch
- **Solution:** Ensure all environment variables are consistent
- **Verify:** `VITE_PI_SANDBOX_MODE` matches `VITE_PI_NETWORK`

## 📞 Support

- **Pi Developer Support:** https://developers.pi/
- **Droplink Support:** support@droplink.space
- **GitHub Issues:** Create an issue in your repository

## 🎉 Success Checklist

- [ ] Environment variables configured (`.env`, `.env.production`)
- [ ] Supabase secrets deployed
- [ ] Validation key files in place
- [ ] Application built and deployed
- [ ] Authentication tested in Pi Browser
- [ ] Payment flow tested (sandbox first!)
- [ ] Ad network configured (if using)
- [ ] Error handling implemented
- [ ] User confirmations added for payments
- [ ] Production monitoring set up

## 📝 Next Steps

1. **Deploy to Production**
   - Build: `npm run build`
   - Deploy: Upload `dist/` to your hosting platform

2. **Test in Pi Browser**
   - Install Pi Browser app
   - Navigate to your production URL
   - Test all Pi Network features

3. **Monitor Performance**
   - Watch Supabase logs for errors
   - Monitor payment success rates
   - Track ad network performance

4. **Optimize**
   - Implement caching for API calls
   - Add loading states for better UX
   - Optimize payment confirmation flows

---

**Last Updated:** December 13, 2025
**Configuration Version:** Mainnet v1.0
**Pi Network API Version:** v2.0
