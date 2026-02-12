# Pi SDK Integration - Quick Reference Guide

## Official Pi SDK API Pattern

### Step 1: Load SDK in HTML
```html
<!-- Add to <head> -->
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
```

### Step 2: Initialize Pi
```javascript
// Call once during app startup (ideally in React context/useEffect)
Pi.init({ 
  version: "2.0",           // Required
  sandbox: true             // Optional: true for sandbox/testnet, false for mainnet
});
```

### Step 3: Authenticate User
```javascript
const scopes = ['username', 'payments'];  // Scopes to request

function onIncompletePaymentFound(payment) {
  // Handle incomplete payments from previous sessions
  console.log('Incomplete payment:', payment);
}

Pi.authenticate(scopes, onIncompletePaymentFound)
  .then((auth) => {
    // Returns: { accessToken: string, user: { uid: string, username: string } }
    console.log('Authenticated:', auth.user.username);
    // Use accessToken for backend verification
  })
  .catch((error) => {
    console.error('Authentication failed:', error);
  });
```

### Step 4: Create Payment (After Authentication)
```javascript
const paymentData = {
  amount: 1.5,                  // Amount in Pi
  memo: "Premium subscription",  // User-visible memo
  metadata: { 
    orderId: "12345",           // Your custom data
    planId: "pro"
  }
};

const paymentCallbacks = {
  // Phase I: Payment is ready for server approval
  onReadyForServerApproval: async (paymentId) => {
    console.log('Payment ready for approval:', paymentId);
    // POST to your server: /api/payments/approve?paymentId=xxx
    // Your server calls Pi API: POST /v2/payments/{paymentId}/approve
  },
  
  // Phase III: Blockchain transaction confirmed, ready to complete
  onReadyForServerCompletion: async (paymentId, txid) => {
    console.log('Payment ready for completion:', paymentId, txid);
    // POST to your server: /api/payments/complete with { paymentId, txid }
    // Your server calls Pi API: POST /v2/payments/{paymentId}/complete
  },
  
  // User cancelled payment
  onCancel: (paymentId) => {
    console.log('Payment cancelled:', paymentId);
  },
  
  // Error occurred
  onError: (error, payment) => {
    console.error('Payment error:', error);
  }
};

Pi.createPayment(paymentData, paymentCallbacks)
  .then((payment) => {
    console.log('Payment created:', payment);
  })
  .catch((error) => {
    console.error('Payment creation failed:', error);
  });
```

## DropLink Implementation

### Configuration (`src/config/pi-config.ts`)
```typescript
export const PI_CONFIG = {
  SDK: {
    version: "2.0",
    sandbox: process.env.VITE_PI_SANDBOX_MODE === 'true'
  },
  scopes: ['username', 'payments', 'wallet_address'],
  onIncompletePaymentFound: (payment) => {
    console.log('Incomplete payment:', payment);
  }
};
```

### In React Context (`src/contexts/PiContext.tsx`)
```typescript
// ✅ Correct Pattern
useEffect(() => {
  if (typeof window.Pi !== 'undefined') {
    // Initialize with ONLY official parameters
    window.Pi.init(PI_CONFIG.SDK);
  }
}, []);

// Authenticate when needed
const auth = await window.Pi.authenticate(
  PI_CONFIG.scopes,
  PI_CONFIG.onIncompletePaymentFound
);
```

### Payment Service (`src/services/piPaymentService.ts`)
Already correctly implements:
- ✅ Phase I: `onReadyForServerApproval` callback
- ✅ Phase III: `onReadyForServerCompletion` callback
- ✅ Error handling: `onCancel` and `onError` callbacks
- ✅ Server communication for approval and completion

## Common Mistakes to Avoid

### ❌ WRONG
```javascript
// Don't add invalid parameters
Pi.init({ version: "2.0", sandbox: true, usePiStorage: true });

// Don't spread/merge invalid props
Pi.init({ ...config, someRandomProp: true });

// Don't initialize multiple times
// (it causes race conditions)
```

### ✅ CORRECT
```javascript
// Use ONLY official parameters
Pi.init({ version: "2.0", sandbox: true });

// Direct call with config object
Pi.init(PI_CONFIG.SDK);

// Single initialization point
```

## Scopes Guide

| Scope | Returns | Use Case |
|-------|---------|----------|
| `'username'` | User's username | Display personalization, leaderboards |
| `'payments'` | No object, enables payments | Required for Pi.createPayment() |
| `'wallet_address'` | User's wallet address | For tip/donation features |

## Server-Side Verification

After getting `accessToken` from `Pi.authenticate()`:

```bash
# Verify user identity
GET /v2/me
Authorization: Bearer {accessToken}

# Response includes verified uid and user info
```

## Environment Variables

```env
# Sandbox/Testing
VITE_PI_SANDBOX_MODE=true
VITE_PI_NETWORK=sandbox
VITE_PI_SANDBOX_URL=https://sandbox.minepi.com

# Mainnet
VITE_PI_SANDBOX_MODE=false
VITE_PI_NETWORK=mainnet
VITE_API_URL=https://api.minepi.com
```

## Testing Checklist

- [ ] Pi SDK script loads: Check browser console for Pi object
- [ ] Initialization succeeds: Check `Pi.init()` logs
- [ ] Authentication works: User can approve/deny permissions
- [ ] Payment flow works: All 4 callbacks fire in order
- [ ] No console errors about unknown parameters
- [ ] Build succeeds: `npm run build` completes without errors

## Resources

- 📖 [Official Pi Developer Guide](https://pi-apps.github.io/community-developer-guide/)
- 📖 [Pi SDK Documentation](https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformSDK/)
- 📖 [Payment Flow](https://pi-apps.github.io/community-developer-guide/docs/importantTopics/paymentFlow)
- 📖 [Pi App Platform APIs](https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformAPIs/)

---

**Last Updated:** December 10, 2025  
**Build Status:** ✅ Passing (9.76s)
