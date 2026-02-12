# Pi Network Integration - DropLink Mainnet

## 🔐 API Credentials

**API Key:** `b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz`

**Validation Key:** See `validation-key.txt`

## 📚 Official Documentation

### Pi Developer Resources
- **Pi Developer Guide**: https://pi-apps.github.io/community-developer-guide/
- **Pi Payment API Documentation**: https://pi-apps.github.io/community-developer-guide/
- **Pi Ad Network Documentation**: https://github.com/pi-apps/pi-platform-docs/tree/master
- **Pi Platform Docs**: https://github.com/pi-apps/pi-platform-docs

### Quick Links
- [Payment Integration Guide](https://pi-apps.github.io/community-developer-guide/)
- [Ad Network Setup](https://github.com/pi-apps/pi-platform-docs/tree/master)
- [SDK Reference](https://pi-apps.github.io/community-developer-guide/)

## 🌐 Network Configuration

**Network:** Pi Mainnet (Production)  
**Mode:** Sandbox DISABLED  
**SDK Version:** 2.0  
**Pi Storage:** Enabled  

### Base URLs
- **Pi API**: `https://api.minepi.com`
- **Platform**: `https://droplink.space`

## 🔧 Configuration Files

### Main Config: `src/config/pi-config.ts`
```typescript
export const PI_CONFIG = {
  API_KEY: "b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz",
  BASE_URL: "https://api.minepi.com",
  NETWORK: "mainnet",
  SANDBOX_MODE: false,
  SDK: {
    version: "2.0",
    sandbox: false
  },
  scopes: ['username', 'payments', 'wallet_address']
}
```

### Context: `src/contexts/PiContext.tsx`
- Pi SDK initialization with `usePiStorage: true`
- Authentication flow
- Payment processing
- Wallet management

### HTML: `index.html`
- Pi SDK script loader
- Early initialization

## 📋 API Endpoints

| Endpoint | URL |
|----------|-----|
| User Info | `https://api.minepi.com/v2/me` |
| Wallets | `https://api.minepi.com/v2/wallets` |
| Payments | `https://api.minepi.com/v2/payments` |
| Transactions | `https://api.minepi.com/v2/transactions` |
| Account Balances | `https://api.minepi.com/v2/accounts` |

## 🎯 Features Implemented

### ✅ Authentication
- Pi Network OAuth integration
- Token persistence with Pi Storage
- Multi-account support
- Automatic token refresh

### ✅ Payments
- Mainnet payment processing
- Subscription plans (Basic, Premium, Pro)
- Payment metadata tracking
- Incomplete payment recovery

### ✅ Wallet Integration
- Pi wallet address access
- DROP token support
- Token balance display
- Trustline management

### ✅ Ad Network
- Rewarded video ads
- Interstitial ads
- Ad reward claiming
- DROP token distribution

## 🔐 Security

### Validation
- API key validation
- Network verification (mainnet only)
- Sandbox mode checks
- Token signature verification

### Storage
- Pi Storage enabled for session persistence
- Secure token handling
- HTTPS only communications

## 🚀 Usage Examples

### Initialize Pi SDK
```typescript
await window.Pi.init({ 
  version: "2.0", 
  sandbox: false, 
  usePiStorage: true 
});
```

### Authenticate User
```typescript
const result = await window.Pi.authenticate(
  ['username', 'payments', 'wallet_address'],
  onIncompletePaymentFound
);
```

### Create Payment
```typescript
await createPayment(
  amount,
  memo,
  {
    subscriptionPlan: 'premium',
    billingPeriod: 'monthly',
    username: piUser.username
  }
);
```

## 🧪 Testing

### Verify Configuration
```typescript
import { validateMainnetConfig } from '@/config/pi-config';

if (validateMainnetConfig()) {
  console.log('✅ Mainnet configuration valid');
}
```

### Check Pi Browser
```typescript
import { isPiBrowserEnv } from '@/contexts/PiContext';

if (isPiBrowserEnv()) {
  console.log('✅ Running in Pi Browser');
}
```

## 📱 Deployment

### Production Checklist
- ✅ API key configured
- ✅ Validation key present
- ✅ Sandbox mode disabled
- ✅ HTTPS enabled
- ✅ Pi Storage enabled
- ✅ Mainnet endpoints configured

### Environment Variables (if needed)
```env
VITE_PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
VITE_PI_SANDBOX_MODE=false
VITE_PI_NETWORK=mainnet
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Failed**
- Verify Pi Browser is being used
- Check API key is correct
- Ensure mainnet mode is active

**Payment Not Processing**
- Confirm sandbox mode is disabled
- Check payment metadata is valid
- Verify wallet has sufficient Pi balance

**Ad Network Not Available**
- Check `adNetworkSupported` flag
- Verify Pi Browser supports ads
- Review Pi Ad Network documentation

## 📞 Support

- **Pi Developer Community**: https://pi-apps.github.io/community-developer-guide/
- **DropLink Support**: support@droplink.space
- **Pi Network**: https://minepi.com

## 📝 Notes

- All payments are REAL Pi Network mainnet transactions
- Users will be charged actual Pi coins from their wallet
- Sandbox mode is completely disabled for production
- Pi Storage ensures persistent authentication sessions
- Ad rewards are distributed as DROP tokens

---

**Last Updated:** December 9, 2025  
**Network:** Pi Mainnet  
**Mode:** Production  
**Status:** ✅ Active
