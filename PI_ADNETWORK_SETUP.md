# Pi Ad Network Setup Guide

## Overview

The Pi Ad Network integration allows your DropLink platform to serve advertisements and generate revenue through the Pi Network ecosystem. This guide covers the complete setup process for implementing Pi ads in your application.

## Prerequisites

- Pi Network Developer Account
- Valid Pi API Key
- Supabase Database Setup
- React/Vite Frontend Application

## Environment Configuration

### Required Environment Variables

Add the following variables to your `.env` file:

```bash
# Pi Network Configuration
VITE_PI_API_KEY="dmsr7appwuoihusddjwp4koxmps4maxjj453ogj9k701vhs6cv3rzpcrhux2b7ug"
VITE_PI_AUTHENTICATION_ENABLED="true"
VITE_PI_MAINNET_MODE="true"
VITE_PI_NETWORK="mainnet"
VITE_PI_NETWORK_PASSPHRASE="Pi Mainnet"

# Pi Ad Network Settings
VITE_PI_AD_NETWORK_ENABLED="true"
VITE_PI_AD_NETWORK_VERSION="2.0"
VITE_PI_AD_COOLDOWN_MINUTES="5"
VITE_PI_AD_FREQUENCY_CAP="3"
VITE_PI_INTERSTITIAL_ADS_ENABLED="true"
VITE_PI_REWARDED_ADS_ENABLED="true"

# Pi SDK Configuration
VITE_PI_SDK_URL="https://sdk.minepi.com/pi-sdk.js"
VITE_PI_HORIZON_URL="https://api.minepi.com"
VITE_PI_STELLAR_HORIZON_URL="https://horizon.stellar.org"
VITE_PI_STELLAR_NETWORK="mainnet"

# Pi Payment Configuration
VITE_PI_PAYMENTS_ENABLED="true"
VITE_PI_PAYMENT_CURRENCY="PI"
VITE_PI_MIN_PAYMENT_AMOUNT="0.01"
VITE_PI_MAX_PAYMENT_AMOUNT="10000"
VITE_PI_PAYMENT_TIMEOUT="60000"
VITE_PI_PAYMENT_MEMO_ENABLED="true"
VITE_PI_PAYMENT_RECEIVER_WALLET="GDSXE723WPHZ5RGIJCSYXTPKSOIGPTSXE4RF5U3JTNGTCHXON7ZVD4LJ"

# Platform Validation
VITE_PI_VALIDATION_KEY="7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"
VITE_PI_TOKEN_DETECTION_ENABLED="true"
VITE_PI_WALLET_DETECTION_ENABLED="true"

# Sandbox/Testing (Disable for Production)
VITE_PI_SANDBOX_MODE="false"
VITE_PI_SANDBOX_URL="https://sandbox.minepi.com"
VITE_PI_TESTNET_HORIZON_URL="https://api.testnet.minepi.com"
```

## Ad Network Features

### 1. Interstitial Ads
- **Purpose**: Full-screen ads displayed between content
- **Frequency**: Limited by `VITE_PI_AD_FREQUENCY_CAP` (3 ads max)
- **Cooldown**: `VITE_PI_AD_COOLDOWN_MINUTES` (5 minutes between ads)
- **Configuration**: `VITE_PI_INTERSTITIAL_ADS_ENABLED="true"`

### 2. Rewarded Ads
- **Purpose**: Users watch ads to earn rewards/tokens
- **Integration**: Connected to user reward system
- **Configuration**: `VITE_PI_REWARDED_ADS_ENABLED="true"`

### 3. Ad Frequency Management
- **Frequency Cap**: Maximum 3 ads per session
- **Cooldown Period**: 5-minute minimum between ad displays
- **User Experience**: Prevents ad fatigue and improves engagement

## Implementation Steps

### Step 1: Pi SDK Integration

1. **Load Pi SDK in your HTML head:**
```html
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
```

2. **Initialize Pi in your React app:**
```javascript
import { useEffect } from 'react';

const usePiSDK = () => {
  useEffect(() => {
    if (typeof Pi !== 'undefined') {
      Pi.init({
        version: "2.0",
        sandbox: import.meta.env.VITE_PI_SANDBOX_MODE === "true"
      });
    }
  }, []);
};
```

### Step 2: Ad Network Setup

1. **Create Ad Component:**
```javascript
import { useState, useEffect } from 'react';

const PiAdNetwork = () => {
  const [adLoaded, setAdLoaded] = useState(false);
  
  useEffect(() => {
    if (import.meta.env.VITE_PI_AD_NETWORK_ENABLED === "true") {
      loadPiAds();
    }
  }, []);

  const loadPiAds = async () => {
    try {
      if (typeof Pi !== 'undefined' && Pi.Ads) {
        await Pi.Ads.initialize();
        setAdLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load Pi Ads:', error);
    }
  };

  const showInterstitialAd = async () => {
    if (adLoaded && Pi.Ads) {
      try {
        await Pi.Ads.showInterstitial();
      } catch (error) {
        console.error('Failed to show interstitial ad:', error);
      }
    }
  };

  const showRewardedAd = async () => {
    if (adLoaded && Pi.Ads) {
      try {
        const reward = await Pi.Ads.showRewarded();
        // Handle reward logic
        return reward;
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
      }
    }
  };

  return { showInterstitialAd, showRewardedAd, adLoaded };
};

export default PiAdNetwork;
```

### Step 3: Ad Frequency Management

1. **Implement Cooldown Logic:**
```javascript
class AdFrequencyManager {
  constructor() {
    this.lastAdTime = 0;
    this.adCount = 0;
    this.cooldownMinutes = parseInt(import.meta.env.VITE_PI_AD_COOLDOWN_MINUTES) || 5;
    this.frequencyCap = parseInt(import.meta.env.VITE_PI_AD_FREQUENCY_CAP) || 3;
  }

  canShowAd() {
    const now = Date.now();
    const cooldownMs = this.cooldownMinutes * 60 * 1000;
    
    // Check cooldown
    if (now - this.lastAdTime < cooldownMs) {
      return false;
    }
    
    // Check frequency cap
    if (this.adCount >= this.frequencyCap) {
      return false;
    }
    
    return true;
  }

  recordAdShown() {
    this.lastAdTime = Date.now();
    this.adCount++;
  }

  resetFrequencyCounter() {
    this.adCount = 0;
  }
}
```

### Step 4: Database Integration

1. **Ad Analytics Table:**
```sql
CREATE TABLE IF NOT EXISTS ad_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ad_type VARCHAR(50) NOT NULL, -- 'interstitial' or 'rewarded'
  ad_network VARCHAR(50) DEFAULT 'pi_network',
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  reward_amount DECIMAL(10,2),
  session_id VARCHAR(100),
  user_agent TEXT,
  ip_address INET
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ad_analytics_user_id ON ad_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_shown_at ON ad_analytics(shown_at);
```

### Step 5: Reward System Integration

1. **Track Ad Rewards:**
```javascript
const trackAdReward = async (userId, adType, rewardAmount) => {
  try {
    const { data, error } = await supabase
      .from('ad_analytics')
      .insert({
        user_id: userId,
        ad_type: adType,
        completed: true,
        reward_amount: rewardAmount,
        session_id: generateSessionId()
      });
      
    if (error) throw error;
    
    // Update user balance
    await updateUserRewards(userId, rewardAmount);
    
  } catch (error) {
    console.error('Failed to track ad reward:', error);
  }
};
```

## Configuration Options

### Ad Network Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PI_AD_NETWORK_ENABLED` | `"true"` | Enable/disable Pi ad network |
| `VITE_PI_AD_NETWORK_VERSION` | `"2.0"` | Pi Ad Network API version |
| `VITE_PI_AD_COOLDOWN_MINUTES` | `"5"` | Minutes between ad displays |
| `VITE_PI_AD_FREQUENCY_CAP` | `"3"` | Maximum ads per session |
| `VITE_PI_INTERSTITIAL_ADS_ENABLED` | `"true"` | Enable interstitial ads |
| `VITE_PI_REWARDED_ADS_ENABLED` | `"true"` | Enable rewarded ads |

### Network Configuration

| Variable | Description |
|----------|-------------|
| `VITE_PI_MAINNET_MODE` | Use Pi mainnet (production) |
| `VITE_PI_NETWORK` | Pi network type (mainnet/testnet) |
| `VITE_PI_HORIZON_URL` | Pi Horizon API endpoint |
| `VITE_PI_SDK_URL` | Pi SDK JavaScript file URL |

## Testing

### 1. Sandbox Mode
```bash
# Enable sandbox for testing
VITE_PI_SANDBOX_MODE="true"
VITE_PI_SANDBOX_URL="https://sandbox.minepi.com"
```

### 2. Ad Testing Checklist
- [ ] Pi SDK loads correctly
- [ ] Ad network initializes
- [ ] Interstitial ads display
- [ ] Rewarded ads provide rewards
- [ ] Frequency capping works
- [ ] Cooldown period enforced
- [ ] Analytics tracking functions

### 3. Debug Mode
```bash
# Enable debug logging
VITE_DEBUG_MODE="true"
VITE_DEV_MODE="true"
```

## Troubleshooting

### Common Issues

1. **Ads Not Loading**
   - Verify Pi SDK is loaded
   - Check API key validity
   - Ensure network connectivity
   - Verify ad network is enabled

2. **Frequency Cap Not Working**
   - Check localStorage/sessionStorage
   - Verify cooldown calculations
   - Reset frequency counter if needed

3. **Rewards Not Credited**
   - Check database connection
   - Verify user authentication
   - Review reward calculation logic
   - Check Supabase RLS policies

### Debug Commands

```javascript
// Check Pi SDK status
console.log('Pi SDK loaded:', typeof Pi !== 'undefined');

// Check ad network status
console.log('Ad network enabled:', import.meta.env.VITE_PI_AD_NETWORK_ENABLED);

// Test ad loading
Pi.Ads.initialize().then(() => {
  console.log('Ads initialized successfully');
}).catch(error => {
  console.error('Ad initialization failed:', error);
});
```

## Security Considerations

### 1. API Key Protection
- Store Pi API key securely
- Use environment variables
- Never expose in client-side code

### 2. Reward Validation
- Verify ad completion server-side
- Implement anti-fraud measures
- Validate reward amounts

### 3. User Privacy
- Comply with privacy regulations
- Implement consent mechanisms
- Anonymize analytics data

## Performance Optimization

### 1. Lazy Loading
- Load ad SDK only when needed
- Initialize ads on user interaction
- Cache ad configurations

### 2. Error Handling
- Implement fallback mechanisms
- Log errors for monitoring
- Graceful degradation

### 3. Monitoring
- Track ad performance metrics
- Monitor error rates
- Analyze user engagement

## Support

For issues related to Pi Ad Network:
- Pi Network Developer Support
- Platform Support: support@droplink.space
- Documentation: [Pi Developer Portal](https://developers.minepi.com)

---

# Pi Network Payment Edge Functions - Complete Setup Guide

This section explains how to set up Pi Network payment processing using Supabase Edge Functions alongside your ad network integration.

## Table of Contents
1. [Payment Overview](#payment-overview)
2. [Required Secrets](#required-secrets)
3. [Edge Functions](#edge-functions)
4. [Frontend Payment Integration](#frontend-payment-integration)
5. [Payment Troubleshooting](#payment-troubleshooting)

---

## Payment Overview

Pi Network payments require a 3-step server-side flow:
1. **Approve** - Server approves the payment after user initiates it
2. **Complete** - Server completes the payment after blockchain confirmation
3. **Verify** (optional) - Server verifies the transaction on blockchain

### Payment Flow Diagram
```
User clicks "Pay" → Pi SDK creates payment → onReadyForServerApproval
                                                      ↓
                                              approve-payment (Edge Function)
                                                      ↓
                                              User confirms in Pi Browser
                                                      ↓
                                              onReadyForServerCompletion
                                                      ↓
                                              complete-payment (Edge Function)
                                                      ↓
                                              Payment recorded in database
```

---

## Required Secrets

Set these secrets in your Supabase project:

### 1. PI_API_KEY (Required)
Your Pi Network API key from the Pi Developer Portal.

```bash
# Using Supabase CLI
supabase secrets set PI_API_KEY=your_pi_api_key_here
```

### 2. SUPABASE_URL (Auto-configured)
Already available in Edge Functions as `Deno.env.get('SUPABASE_URL')`

### 3. SUPABASE_SERVICE_ROLE_KEY (Auto-configured)
Already available in Edge Functions as `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`

---

## Edge Functions

### supabase/config.toml

```toml
project_id = "your_project_id"

[functions.approve-payment]
verify_jwt = false

[functions.complete-payment]
verify_jwt = false

[functions.verify-payment]
verify_jwt = false

[functions.create-subscription]
verify_jwt = false

[functions.manage-subscription]
verify_jwt = false

[functions.process-recurring-payment]
verify_jwt = false

[functions.cancel-subscription]
verify_jwt = false
```

**Important**: `verify_jwt = false` is required because:
- Pi SDK doesn't provide Supabase JWT tokens
- Payment callbacks come from client-side Pi SDK
- We validate payments through Pi Network API instead
- Subscription webhooks come from external sources

---

### approve-payment/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body with validation
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { paymentId, paymentLinkId, userId, subscriptionId, isRecurring } = body;
    
    // Environment variables validation
    const PI_API_KEY = Deno.env.get('PI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PI_API_KEY) {
      console.error('PI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'paymentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize paymentId to prevent injection
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedPaymentId !== paymentId) {
      return new Response(
        JSON.stringify({ error: 'Invalid paymentId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Approving payment:', sanitizedPaymentId, 'for payment link:', paymentLinkId, 'subscription:', subscriptionId);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Validate subscription if provided
    if (subscriptionId) {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, status, plan_id, user_id, current_period_end')
        .eq('id', subscriptionId)
        .single();

      if (subError || !subscription) {
        return new Response(
          JSON.stringify({ error: 'Invalid subscription' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check subscription status
      if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
        return new Response(
          JSON.stringify({ error: 'Subscription not active' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate user ownership
      if (subscription.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized subscription access' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log approval attempt
    if (paymentLinkId || subscriptionId) {
      try {
        await supabase
          .from('payment_logs')
          .insert({
            payment_id: sanitizedPaymentId,
            payment_link_id: paymentLinkId,
            subscription_id: subscriptionId,
            user_id: userId,
            action: 'approval_attempt',
            is_recurring: isRecurring || false,
            timestamp: new Date().toISOString()
          });
      } catch (logError) {
        console.warn('Failed to log approval attempt:', logError);
        // Continue execution - logging failure shouldn't block payment
      }
    }

    // Call Pi Network API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(
        `https://api.minepi.com/v2/payments/${sanitizedPaymentId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Pi API error';
        
        // Parse specific error messages
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        
        console.error('Pi API error:', response.status, errorMessage);
        
        // Log failure
        if (paymentLinkId) {
          try {
            await supabase
              .from('payment_logs')
              .insert({
                payment_id: sanitizedPaymentId,
                payment_link_id: paymentLinkId,
                user_id: userId,
                action: 'approval_failed',
                error_message: errorMessage,
                timestamp: new Date().toISOString()
              });
          } catch (logError) {
            console.warn('Failed to log approval failure:', logError);
          }
        }
        
        return new Response(
          JSON.stringify({ error: `Payment approval failed: ${errorMessage}` }),
          { status: response.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      console.log('Payment approved successfully:', result);

      // Log success
      if (paymentLinkId) {
        try {
          await supabase
            .from('payment_logs')
            .insert({
              payment_id: sanitizedPaymentId,
              payment_link_id: paymentLinkId,
              user_id: userId,
              action: 'approval_success',
              timestamp: new Date().toISOString()
            });
        } catch (logError) {
          console.warn('Failed to log approval success:', logError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Pi API request timeout');
        return new Response(
          JSON.stringify({ error: 'Payment approval timeout' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Unexpected error in approve-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### complete-payment/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body with validation
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      paymentId, 
      txid, 
      paymentLinkId, 
      payerUsername, 
      buyerEmail, 
      userId,
      amount: clientAmount,
      subscriptionId,
      planId,
      isRecurring
    } = body;
    
    // Environment variables validation
    const PI_API_KEY = Deno.env.get('PI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PI_API_KEY) {
      console.error('PI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!paymentId || !txid) {
      return new Response(
        JSON.stringify({ error: 'paymentId and txid are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedTxid = txid.replace(/[^a-zA-Z0-9]/g, '');
    
    if (sanitizedPaymentId !== paymentId || sanitizedTxid !== txid) {
      return new Response(
        JSON.stringify({ error: 'Invalid paymentId or txid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Completing payment:', sanitizedPaymentId, 'txid:', sanitizedTxid);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if transaction already exists (prevent double completion)
    if (paymentLinkId) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('pi_payment_id', sanitizedPaymentId)
        .eq('txid', sanitizedTxid)
        .single();

      if (existingTx) {
        console.log('Transaction already exists:', existingTx.id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Transaction already completed',
            transactionId: existingTx.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log completion attempt
    try {
      await supabase
        .from('payment_logs')
        .insert({
          payment_id: sanitizedPaymentId,
          payment_link_id: paymentLinkId,
          user_id: userId,
          action: 'completion_attempt',
          txid: sanitizedTxid,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log completion attempt:', logError);
    }

    // Complete with Pi Network API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let result;
    try {
      const response = await fetch(
        `https://api.minepi.com/v2/payments/${sanitizedPaymentId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid: sanitizedTxid }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Pi API error';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        
        console.error('Pi API completion error:', response.status, errorMessage);
        
        // Log failure
        try {
          await supabase
            .from('payment_logs')
            .insert({
              payment_id: sanitizedPaymentId,
              payment_link_id: paymentLinkId,
              user_id: userId,
              action: 'completion_failed',
              error_message: errorMessage,
              txid: sanitizedTxid,
              timestamp: new Date().toISOString()
            });
        } catch (logError) {
          console.warn('Failed to log completion failure:', logError);
        }
        
        return new Response(
          JSON.stringify({ error: `Payment completion failed: ${errorMessage}` }),
          { status: response.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = await response.json();
      console.log('Payment completed successfully:', result);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Pi API completion timeout');
        return new Response(
          JSON.stringify({ error: 'Payment completion timeout' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

    // Record transaction in database with better error handling
    let transactionId = null;
    let subscriptionUpdated = false;
    
    if (paymentLinkId || subscriptionId) {
      try {
        let paymentLink = null;
        let subscriptionPlan = null;
        
        // Get payment link or subscription plan details
        if (paymentLinkId) {
          const { data: linkData, error: linkError } = await supabase
            .from('payment_links')
            .select('merchant_id, amount, title, description, currency')
            .eq('id', paymentLinkId)
            .single();

          if (linkError) {
            console.error('Payment link fetch error:', linkError);
            throw new Error('Payment link not found');
          }
          
          paymentLink = linkData;
        }
        
        if (subscriptionId) {
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select(`
              id, user_id, status, current_period_start, current_period_end,
              subscription_plans (
                id, name, amount, currency, interval, interval_count, trial_period_days
              )
            `)
            .eq('id', subscriptionId)
            .single();

          if (subError) {
            console.error('Subscription fetch error:', subError);
            throw new Error('Subscription not found');
          }
          
          subscriptionPlan = subData;
        }
        
        if (!paymentLink && !subscriptionPlan) {
          throw new Error('No valid payment source found');
        }

        // Determine the final amount and merchant
        const finalAmount = result?.payment?.amount || 
                           result?.amount || 
                           clientAmount || 
                           paymentLink?.amount ||
                           subscriptionPlan?.subscription_plans?.amount;

        const merchantId = paymentLink?.merchant_id || subscriptionPlan?.user_id;
        
        if (!finalAmount || finalAmount <= 0) {
          throw new Error('Invalid payment amount');
        }
        
        if (!merchantId) {
          throw new Error('Invalid merchant');
        }

        // Insert transaction with all relevant data
        const transactionData = {
          merchant_id: merchantId,
          payment_link_id: paymentLinkId || null,
          subscription_id: subscriptionId || null,
          pi_payment_id: sanitizedPaymentId,
          payer_pi_username: payerUsername || null,
          amount: parseFloat(finalAmount),
          status: 'completed',
          completed_at: new Date().toISOString(),
          txid: sanitizedTxid,
          buyer_email: buyerEmail || null,
          payment_title: paymentLink?.title || subscriptionPlan?.subscription_plans?.name || null,
          payment_description: paymentLink?.description || `Subscription payment for ${subscriptionPlan?.subscription_plans?.name}` || null,
          currency: paymentLink?.currency || subscriptionPlan?.subscription_plans?.currency || 'PI',
          is_recurring: isRecurring || false,
          blockchain_verified: false,
          created_at: new Date().toISOString()
        };

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();

        if (txError) {
          console.error('Transaction insert error:', txError);
          
          // Check if it's a duplicate key error
          if (txError.code === '23505') {
            // Try to get existing transaction
            const { data: existingTx } = await supabase
              .from('transactions')
              .select('id')
              .eq('pi_payment_id', sanitizedPaymentId)
              .eq('txid', sanitizedTxid)
              .single();
            
            if (existingTx) {
              transactionId = existingTx.id;
              console.log('Using existing transaction:', transactionId);
            } else {
              throw txError;
            }
          } else {
            throw txError;
          }
        } else {
          transactionId = txData.id;
          console.log('Created new transaction:', transactionId);
        }
        
        // Handle subscription-specific logic
        if (subscriptionId && subscriptionPlan) {
          try {
            const now = new Date();
            const currentPeriodEnd = new Date(subscriptionPlan.current_period_end);
            const intervalCount = subscriptionPlan.subscription_plans.interval_count || 1;
            const interval = subscriptionPlan.subscription_plans.interval || 'month';
            
            // Calculate next period end
            let nextPeriodEnd = new Date(currentPeriodEnd);
            if (interval === 'month') {
              nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + intervalCount);
            } else if (interval === 'year') {
              nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + intervalCount);
            } else if (interval === 'week') {
              nextPeriodEnd.setDate(nextPeriodEnd.getDate() + (7 * intervalCount));
            } else if (interval === 'day') {
              nextPeriodEnd.setDate(nextPeriodEnd.getDate() + intervalCount);
            }
            
            // Update subscription
            const { error: subUpdateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: currentPeriodEnd.toISOString(),
                current_period_end: nextPeriodEnd.toISOString(),
                last_payment_at: now.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('id', subscriptionId);
              
            if (subUpdateError) {
              console.error('Subscription update error:', subUpdateError);
              throw new Error('Failed to update subscription');
            }
            
            subscriptionUpdated = true;
            console.log('Subscription updated successfully:', subscriptionId);
            
          } catch (subError) {
            console.error('Subscription processing error:', subError);
            throw new Error('Failed to process subscription payment');
          }
        }

        // Update merchant balance (optional - depends on your business logic)
        try {
          const { error: balanceError } = await supabase.rpc('update_merchant_balance', {
            merchant_id: paymentLink.merchant_id,
            amount: parseFloat(finalAmount)
          });
          
          if (balanceError) {
            console.warn('Failed to update merchant balance:', balanceError);
            // Don't fail the transaction for balance update errors
          }
        } catch (balanceError) {
          console.warn('Merchant balance update failed:', balanceError);
        }

        // Log success
        try {
          await supabase
            .from('payment_logs')
            .insert({
              payment_id: sanitizedPaymentId,
              payment_link_id: paymentLinkId,
              user_id: userId,
              action: 'completion_success',
              txid: sanitizedTxid,
              transaction_id: transactionId,
              amount: parseFloat(finalAmount),
              timestamp: new Date().toISOString()
            });
        } catch (logError) {
          console.warn('Failed to log completion success:', logError);
        }

      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        
        // Log database failure
        try {
          await supabase
            .from('payment_logs')
            .insert({
              payment_id: sanitizedPaymentId,
              payment_link_id: paymentLinkId,
              user_id: userId,
              action: 'db_operation_failed',
              error_message: dbError.message,
              txid: sanitizedTxid,
              timestamp: new Date().toISOString()
            });
        } catch (logError) {
          console.warn('Failed to log database failure:', logError);
        }
        
        // Payment was completed on Pi Network, but database operation failed
        // This is a critical situation that needs manual intervention
        return new Response(
          JSON.stringify({ 
            success: true, 
            result,
            warning: 'Payment completed but database recording failed',
            requiresManualReview: true,
            paymentId: sanitizedPaymentId,
            txid: sanitizedTxid
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        transactionId,
        paymentId: sanitizedPaymentId,
        txid: sanitizedTxid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in complete-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Frontend Payment Integration

### React Component Example

```tsx
const handlePayment = async () => {
  if (!isPiBrowser || !window.Pi) {
    alert('Please open in Pi Browser');
    return;
  }

  const Pi = window.Pi;

  const paymentData = {
    amount: 10, // Amount in Pi
    memo: 'Payment for Product',
    metadata: {
      payment_link_id: 'your-payment-link-id',
      payer_username: 'username',
    },
  };

  const callbacks = {
    onReadyForServerApproval: async (paymentId: string) => {
      try {
        const response = await supabase.functions.invoke('approve-payment', {
          body: { 
            paymentId, 
            paymentLinkId: paymentData.metadata.payment_link_id 
          },
        });
        
        if (response.error) throw response.error;
        console.log('Payment approved');
      } catch (error) {
        console.error('Approval failed:', error);
      }
    },

    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
      try {
        const response = await supabase.functions.invoke('complete-payment', {
          body: { 
            paymentId, 
            txid,
            paymentLinkId: paymentData.metadata.payment_link_id,
            payerUsername: paymentData.metadata.payer_username,
          },
        });
        
        if (response.error) throw response.error;
        console.log('Payment completed:', response.data);
        
        // Handle success (show confirmation, redirect, etc.)
      } catch (error) {
        console.error('Completion failed:', error);
      }
    },

    onCancel: (paymentId: string) => {
      console.log('Payment cancelled:', paymentId);
    },

    onError: (error: any) => {
      console.error('Payment error:', error);
    },
  };

  await Pi.createPayment(paymentData, callbacks);
};
```

---

## Payment Troubleshooting

### Common Payment Issues

#### 1. "PI_API_KEY not configured"
**Solution**: Set the PI_API_KEY secret:
```bash
supabase secrets set PI_API_KEY=your_key_here
```

#### 2. "Pi API error: 401 Unauthorized"
**Causes**:
- Invalid API key
- API key doesn't have payment permissions
- Using sandbox key on mainnet or vice versa

**Solution**: 
- Verify your API key in Pi Developer Portal
- Ensure the key has `payments` scope
- Check if you're using the correct network (mainnet vs sandbox)

#### 3. CORS Errors
**Solution**: Ensure corsHeaders are returned for OPTIONS and all responses:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

#### 4. "Edge function not found"
**Causes**:
- Function not deployed
- Wrong function name in invoke call
- config.toml not properly configured

**Solution**:
- Check config.toml has the function listed
- Deploy functions: `supabase functions deploy`
- Verify function name matches exactly

#### 5. Payments work in sandbox but not mainnet
**Causes**:
- Using sandbox API key for mainnet
- Pi SDK initialized with wrong settings

**Solution**:
```typescript
// Frontend: Initialize Pi SDK for mainnet
window.Pi.init({ version: '2.0', sandbox: false });

// Ensure mainnet API key is used in secrets
```

### Payment Debugging Tips

1. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → Your Function → Logs

2. **Add Console Logging**:
   ```typescript
   console.log('Request body:', JSON.stringify(body));
   console.log('Pi API response:', responseText);
   ```

3. **Test with cURL**:
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/approve-payment' \
     -H 'Content-Type: application/json' \
     -d '{"paymentId": "test123"}'
   ```

4. **Verify Secrets Are Set**:
   ```bash
   supabase secrets list
   ```

---

## Payment Database Schema

### Required Tables

```sql
-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'PI',
  interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count INTEGER DEFAULT 1 CHECK (interval_count > 0),
  trial_period_days INTEGER DEFAULT 0 CHECK (trial_period_days >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  next_payment_due TIMESTAMPTZ,
  payer_pi_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES auth.users(id),
  payment_link_id UUID REFERENCES payment_links(id),
  subscription_id UUID REFERENCES subscriptions(id),
  pi_payment_id TEXT NOT NULL,
  payer_pi_username TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'PI',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled', 'failed')),
  completed_at TIMESTAMPTZ,
  txid TEXT,
  buyer_email TEXT,
  payment_title TEXT,
  payment_description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  blockchain_verified BOOLEAN DEFAULT false,
  sender_address TEXT,
  receiver_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  payment_link_id UUID REFERENCES payment_links(id),
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES auth.users(id),
  transaction_id UUID REFERENCES transactions(id),
  action TEXT NOT NULL,
  txid TEXT,
  amount NUMERIC,
  is_recurring BOOLEAN DEFAULT false,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_payment_txid ON transactions(pi_payment_id, txid) WHERE txid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_plan_active ON subscriptions(user_id, plan_id) 
  WHERE status IN ('active', 'trialing', 'past_due') AND cancelled_at IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_due);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_link_id ON transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pi_payment_id ON transactions(pi_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurring ON transactions(is_recurring);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_subscription_id ON payment_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_timestamp ON payment_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_payment_logs_is_recurring ON payment_logs(is_recurring);

-- Function to update merchant balance
CREATE OR REPLACE FUNCTION update_merchant_balance(merchant_id UUID, amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO merchant_balances (merchant_id, balance, updated_at)
  VALUES (merchant_id, amount, now())
  ON CONFLICT (merchant_id)
  DO UPDATE SET 
    balance = merchant_balances.balance + amount,
    updated_at = now();
END;
$$;

-- Function to calculate next payment due date
CREATE OR REPLACE FUNCTION calculate_next_payment_due(
  current_period_end TIMESTAMPTZ,
  interval_type TEXT,
  interval_count INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  next_due TIMESTAMPTZ;
BEGIN
  next_due := current_period_end;
  
  CASE interval_type
    WHEN 'day' THEN
      next_due := next_due + (interval_count || ' days')::INTERVAL;
    WHEN 'week' THEN
      next_due := next_due + (interval_count * 7 || ' days')::INTERVAL;
    WHEN 'month' THEN
      next_due := next_due + (interval_count || ' months')::INTERVAL;
    WHEN 'year' THEN
      next_due := next_due + (interval_count || ' years')::INTERVAL;
    ELSE
      RAISE EXCEPTION 'Invalid interval type: %', interval_type;
  END CASE;
  
  RETURN next_due;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE
    ON subscription_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE
    ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE
    ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Allow public read access to active plans" ON subscription_plans
  FOR SELECT USING (active = true);

CREATE POLICY "Allow service role full access to subscription_plans" ON subscription_plans
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for subscriptions
CREATE POLICY "Allow service role full access to subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow users to manage their subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Allow service role full access to transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow merchants to view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Allow users to view their subscription transactions" ON transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for payment logs
CREATE POLICY "Allow service role full access to payment_logs" ON payment_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow users to view their payment logs" ON payment_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Optional: Merchant balances table
CREATE TABLE IF NOT EXISTS merchant_balances (
  merchant_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_balances_updated_at ON merchant_balances(updated_at);

ALTER TABLE merchant_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to merchant_balances" ON merchant_balances
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow merchants to view their balance" ON merchant_balances
  FOR SELECT USING (auth.uid() = merchant_id);
```

---

## Payment Integration Checklist

Before going live, verify:

### Basic Payment Setup
- [ ] PI_API_KEY secret is set with mainnet key
- [ ] SUPABASE_URL is available (auto-configured)
- [ ] SUPABASE_SERVICE_ROLE_KEY is available (auto-configured)
- [ ] config.toml has `verify_jwt = false` for payment functions
- [ ] CORS headers are properly configured
- [ ] Frontend initializes Pi SDK with `sandbox: false` for mainnet
- [ ] Transaction table has proper RLS policies
- [ ] Edge functions are deployed and accessible

### Subscription Features
- [ ] Subscription plans table is created with valid plans
- [ ] Subscriptions table is created with proper constraints
- [ ] Payment logs table includes subscription_id column
- [ ] Transactions table includes subscription_id and is_recurring columns
- [ ] Subscription edge functions are deployed:
  - [ ] create-subscription
  - [ ] manage-subscription 
  - [ ] process-recurring-payment
- [ ] Subscription RLS policies are configured
- [ ] Recurring payment processing is set up (cron job or webhook)
- [ ] Subscription status management is working
- [ ] Plan validation and user authorization is implemented

### Advanced Features
- [ ] Merchant balance tracking is enabled (optional)
- [ ] Payment analytics and reporting are configured
- [ ] Subscription lifecycle webhooks are set up
- [ ] Trial period handling is implemented
- [ ] Proration logic for plan changes is configured
- [ ] Subscription cancellation grace periods are set
- [ ] Failed payment retry logic is implemented
- [ ] Dunning management for past due subscriptions

---

## Changelog

- **v2.0**: Updated to Pi Ad Network v2.0, Added Pi Payment Edge Functions
- **v1.5**: Added rewarded ads support
- **v1.0**: Initial Pi Ad Network integration