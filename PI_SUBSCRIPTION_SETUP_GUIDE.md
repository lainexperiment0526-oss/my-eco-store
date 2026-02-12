# Pi Network Subscription Payment Setup - Complete Guide

This guide provides comprehensive setup instructions for implementing subscription payments using Pi Network and Supabase Edge Functions.

## Table of Contents
1. [Subscription Overview](#subscription-overview)
2. [Database Schema Setup](#database-schema-setup)
3. [Edge Functions Implementation](#edge-functions-implementation)
4. [Frontend Integration](#frontend-integration)
5. [Recurring Payment Management](#recurring-payment-management)
6. [Subscription Lifecycle](#subscription-lifecycle)
7. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Subscription Overview

### Subscription Flow
```
User selects plan → Create subscription → Trial period (optional) → Recurring payments
                                              ↓
                                     Subscription management
                                    (pause, resume, cancel, change plan)
```

### Supported Features
- **Multiple Plans**: Monthly, yearly, custom intervals
- **Trial Periods**: Free trial with automatic conversion
- **Plan Changes**: Upgrade/downgrade with proration
- **Lifecycle Management**: Pause, resume, cancel
- **Recurring Payments**: Automated billing cycles
- **Grace Periods**: Handle failed payments

---

## Database Schema Setup

### 1. Create Subscription Tables

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
  features JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  next_payment_due TIMESTAMPTZ,
  failed_payment_attempts INTEGER DEFAULT 0,
  payer_pi_username TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced transactions table for subscriptions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMPTZ;

-- Enhanced payment logs for subscriptions
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Subscription events for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  event_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);
```

### 2. Create Indexes and Constraints

```sql
-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_plan_active ON subscriptions(user_id, plan_id) 
  WHERE status IN ('active', 'trialing', 'past_due') AND cancelled_at IS NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON subscription_plans(interval, interval_count);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_due);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);
```

### 3. Database Functions

```sql
-- Function to calculate next billing period
CREATE OR REPLACE FUNCTION calculate_next_billing_period(
  current_end TIMESTAMPTZ,
  interval_type TEXT,
  interval_count INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
BEGIN
  CASE interval_type
    WHEN 'day' THEN
      RETURN current_end + (interval_count || ' days')::INTERVAL;
    WHEN 'week' THEN
      RETURN current_end + (interval_count * 7 || ' days')::INTERVAL;
    WHEN 'month' THEN
      RETURN current_end + (interval_count || ' months')::INTERVAL;
    WHEN 'year' THEN
      RETURN current_end + (interval_count || ' years')::INTERVAL;
    ELSE
      RAISE EXCEPTION 'Invalid interval type: %', interval_type;
  END CASE;
END;
$$;

-- Function to log subscription events
CREATE OR REPLACE FUNCTION log_subscription_event(
  sub_id UUID,
  event_type TEXT,
  old_vals JSONB DEFAULT NULL,
  new_vals JSONB DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO subscription_events (subscription_id, event_type, old_values, new_values, user_id)
  VALUES (sub_id, event_type, old_vals, new_vals, user_id)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Trigger to log subscription changes
CREATE OR REPLACE FUNCTION subscription_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_subscription_event(
      NEW.id,
      'subscription_updated',
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      NEW.user_id
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_subscription_event(
      NEW.id,
      'subscription_created',
      NULL,
      row_to_json(NEW)::jsonb,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_changes
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION subscription_change_trigger();
```

---

## Edge Functions Implementation

### 1. create-subscription Function

```bash
# Deploy function
supabase functions deploy create-subscription
```

**supabase/functions/create-subscription/index.ts**:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateSubscriptionRequest {
  planId: string;
  userId: string;
  payerUsername?: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: CreateSubscriptionRequest = await req.json();
    const { planId, userId, payerUsername, trialDays, metadata = {} } = body;
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'planId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single();
      
    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .in('status', ['active', 'trialing', 'past_due'])
      .is('cancelled_at', null)
      .single();
      
    if (existingSub) {
      return new Response(
        JSON.stringify({ 
          error: 'User already has an active subscription to this plan',
          existingSubscription: existingSub
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate subscription periods
    const now = new Date();
    const trialPeriodDays = trialDays ?? plan.trial_period_days ?? 0;
    
    let currentPeriodStart = new Date(now);
    let currentPeriodEnd = new Date(now);
    let trialEnd = null;
    let status = 'active';
    
    if (trialPeriodDays > 0) {
      status = 'trialing';
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + trialPeriodDays);
      trialEnd = new Date(currentPeriodEnd);
    } else {
      // Calculate first billing period using the database function
      const { data: nextPeriod } = await supabase
        .rpc('calculate_next_billing_period', {
          current_end: currentPeriodEnd.toISOString(),
          interval_type: plan.interval,
          interval_count: plan.interval_count || 1
        });\n      \n      if (nextPeriod) {\n        currentPeriodEnd = new Date(nextPeriod);\n      }\n    }\n    \n    // Create subscription\n    const subscriptionData = {\n      user_id: userId,\n      plan_id: planId,\n      status: status,\n      current_period_start: currentPeriodStart.toISOString(),\n      current_period_end: currentPeriodEnd.toISOString(),\n      trial_start: trialPeriodDays > 0 ? currentPeriodStart.toISOString() : null,\n      trial_end: trialEnd ? trialEnd.toISOString() : null,\n      next_payment_due: status === 'trialing' ? trialEnd?.toISOString() : currentPeriodEnd.toISOString(),\n      payer_pi_username: payerUsername,\n      metadata,\n      created_at: now.toISOString(),\n      updated_at: now.toISOString()\n    };\n\n    const { data: subscription, error: subError } = await supabase\n      .from('subscriptions')\n      .insert(subscriptionData)\n      .select(`\n        *,\n        subscription_plans (*)\n      `)\n      .single();\n      \n    if (subError) {\n      console.error('Subscription creation error:', subError);\n      return new Response(\n        JSON.stringify({ error: 'Failed to create subscription', details: subError.message }),\n        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n      );\n    }\n    \n    console.log('Subscription created:', subscription.id);\n    \n    return new Response(\n      JSON.stringify({ \n        success: true, \n        subscription,\n        plan,\n        nextPaymentDue: subscription.next_payment_due,\n        isTrialing: status === 'trialing'\n      }),\n      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n    );\n    \n  } catch (error) {\n    console.error('Error creating subscription:', error);\n    return new Response(\n      JSON.stringify({ error: 'Internal server error', details: error.message }),\n      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n    );\n  }\n});\n```\n\n### 2. manage-subscription Function\n\n**supabase/functions/manage-subscription/index.ts**:\n\n```typescript\nimport { serve } from \"https://deno.land/std@0.168.0/http/server.ts\";\nimport { createClient } from \"https://esm.sh/@supabase/supabase-js@2\";\n\nconst corsHeaders = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n  'Access-Control-Allow-Methods': 'POST, OPTIONS',\n};\n\ntype SubscriptionAction = 'cancel' | 'reactivate' | 'pause' | 'resume' | 'change_plan' | 'update_payment';\n\ninterface ManageSubscriptionRequest {\n  subscriptionId: string;\n  action: SubscriptionAction;\n  userId: string;\n  newPlanId?: string;\n  cancelAtPeriodEnd?: boolean;\n  metadata?: Record<string, any>;\n}\n\nserve(async (req: Request) => {\n  if (req.method === 'OPTIONS') {\n    return new Response(null, { headers: corsHeaders });\n  }\n\n  if (req.method !== 'POST') {\n    return new Response(\n      JSON.stringify({ error: 'Method not allowed' }),\n      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n    );\n  }\n\n  try {\n    const body: ManageSubscriptionRequest = await req.json();\n    const { subscriptionId, action, userId, newPlanId, cancelAtPeriodEnd = false, metadata = {} } = body;\n    \n    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');\n    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');\n    \n    if (!subscriptionId || !action || !userId) {\n      return new Response(\n        JSON.stringify({ error: 'subscriptionId, action, and userId are required' }),\n        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n      );\n    }\n\n    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);\n    \n    // Verify subscription ownership\n    const { data: subscription, error: subError } = await supabase\n      .from('subscriptions')\n      .select(`\n        *,\n        subscription_plans (*)\n      `)\n      .eq('id', subscriptionId)\n      .eq('user_id', userId)\n      .single();\n      \n    if (subError || !subscription) {\n      return new Response(\n        JSON.stringify({ error: 'Subscription not found or unauthorized' }),\n        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n      );\n    }\n    \n    const now = new Date();\n    let updateData: any = { \n      updated_at: now.toISOString(),\n      metadata: { ...subscription.metadata, ...metadata }\n    };\n    let result: any = { success: true, action };\n    \n    switch (action) {\n      case 'cancel':\n        if (cancelAtPeriodEnd) {\n          updateData.cancel_at_period_end = true;\n          result.message = 'Subscription will be cancelled at period end';\n        } else {\n          updateData.status = 'cancelled';\n          updateData.cancelled_at = now.toISOString();\n          result.message = 'Subscription cancelled immediately';\n        }\n        break;\n        \n      case 'reactivate':\n        if (subscription.status !== 'cancelled' && !subscription.cancel_at_period_end) {\n          return new Response(\n            JSON.stringify({ error: 'Can only reactivate cancelled subscriptions' }),\n            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n          );\n        }\n        updateData.status = 'active';\n        updateData.cancelled_at = null;\n        updateData.cancel_at_period_end = false;\n        result.message = 'Subscription reactivated successfully';\n        break;\n        \n      case 'pause':\n        if (!['active', 'trialing'].includes(subscription.status)) {\n          return new Response(\n            JSON.stringify({ error: 'Can only pause active subscriptions' }),\n            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n          );\n        }\n        updateData.status = 'paused';\n        updateData.paused_at = now.toISOString();\n        result.message = 'Subscription paused successfully';\n        break;\n        \n      case 'resume':\n        if (subscription.status !== 'paused') {\n          return new Response(\n            JSON.stringify({ error: 'Can only resume paused subscriptions' }),\n            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n          );\n        }\n        updateData.status = 'active';\n        updateData.paused_at = null;\n        result.message = 'Subscription resumed successfully';\n        break;\n        \n      case 'change_plan':\n        if (!newPlanId) {\n          return new Response(\n            JSON.stringify({ error: 'newPlanId is required for plan change' }),\n            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n          );\n        }\n        \n        // Validate new plan\n        const { data: newPlan, error: planError } = await supabase\n          .from('subscription_plans')\n          .select('*')\n          .eq('id', newPlanId)\n          .eq('active', true)\n          .single();\n          \n        if (planError || !newPlan) {\n          return new Response(\n            JSON.stringify({ error: 'Invalid or inactive new plan' }),\n            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n          );\n        }\n        \n        // Calculate proration if needed\n        const currentPeriodEnd = new Date(subscription.current_period_end);\n        const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));\n        const proratedAmount = (newPlan.amount / 30) * daysRemaining; // Simplified proration\n        \n        updateData.plan_id = newPlanId;\n        result.message = 'Subscription plan changed successfully';\n        result.newPlan = newPlan;\n        result.proratedAmount = proratedAmount;\n        result.daysRemaining = daysRemaining;\n        break;\n        \n      default:\n        return new Response(\n          JSON.stringify({ error: 'Invalid action' }),\n          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n        );\n    }\n    \n    // Update subscription\n    const { data: updatedSub, error: updateError } = await supabase\n      .from('subscriptions')\n      .update(updateData)\n      .eq('id', subscriptionId)\n      .select(`\n        *,\n        subscription_plans (*)\n      `)\n      .single();\n      \n    if (updateError) {\n      console.error('Subscription update error:', updateError);\n      return new Response(\n        JSON.stringify({ error: 'Failed to update subscription', details: updateError.message }),\n        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n      );\n    }\n    \n    result.subscription = updatedSub;\n    \n    return new Response(\n      JSON.stringify(result),\n      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n    );\n    \n  } catch (error) {\n    console.error('Error managing subscription:', error);\n    return new Response(\n      JSON.stringify({ error: 'Internal server error', details: error.message }),\n      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n    );\n  }\n});\n```\n\n---\n\n## Frontend Integration\n\n### 1. Subscription Creation\n\n```typescript\nconst createSubscription = async (planId: string, payerUsername?: string) => {\n  try {\n    const { data, error } = await supabase.functions.invoke('create-subscription', {\n      body: {\n        planId,\n        userId: user.id,\n        payerUsername,\n        metadata: {\n          created_from: 'web',\n          user_agent: navigator.userAgent\n        }\n      }\n    });\n\n    if (error) throw error;\n\n    console.log('Subscription created:', data.subscription);\n    \n    // Handle trial period\n    if (data.isTrialing) {\n      showTrialMessage(data.subscription.trial_end);\n    } else {\n      // Initiate first payment\n      await processSubscriptionPayment(data.subscription);\n    }\n    \n    return data.subscription;\n    \n  } catch (error) {\n    console.error('Subscription creation failed:', error);\n    throw error;\n  }\n};\n```\n\n### 2. Subscription Payment Processing\n\n```typescript\nconst processSubscriptionPayment = async (subscription: any) => {\n  if (!isPiBrowser || !window.Pi) {\n    alert('Please open in Pi Browser');\n    return;\n  }\n\n  const Pi = window.Pi;\n\n  const paymentData = {\n    amount: subscription.subscription_plans.amount,\n    memo: `Subscription: ${subscription.subscription_plans.name}`,\n    metadata: {\n      subscription_id: subscription.id,\n      plan_id: subscription.plan_id,\n      user_id: subscription.user_id,\n      is_recurring: true,\n      billing_cycle_start: subscription.current_period_start,\n      billing_cycle_end: subscription.current_period_end\n    },\n  };\n\n  const callbacks = {\n    onReadyForServerApproval: async (paymentId: string) => {\n      try {\n        const response = await supabase.functions.invoke('approve-payment', {\n          body: { \n            paymentId, \n            subscriptionId: subscription.id,\n            userId: subscription.user_id,\n            isRecurring: true\n          },\n        });\n        \n        if (response.error) throw response.error;\n        console.log('Subscription payment approved');\n      } catch (error) {\n        console.error('Approval failed:', error);\n      }\n    },\n\n    onReadyForServerCompletion: async (paymentId: string, txid: string) => {\n      try {\n        const response = await supabase.functions.invoke('complete-payment', {\n          body: { \n            paymentId, \n            txid,\n            subscriptionId: subscription.id,\n            planId: subscription.plan_id,\n            userId: subscription.user_id,\n            isRecurring: true,\n            amount: subscription.subscription_plans.amount\n          },\n        });\n        \n        if (response.error) throw response.error;\n        console.log('Subscription payment completed:', response.data);\n        \n        // Update UI to show active subscription\n        onSubscriptionActivated(subscription);\n        \n      } catch (error) {\n        console.error('Completion failed:', error);\n      }\n    },\n\n    onCancel: (paymentId: string) => {\n      console.log('Subscription payment cancelled:', paymentId);\n    },\n\n    onError: (error: any) => {\n      console.error('Subscription payment error:', error);\n    },\n  };\n\n  await Pi.createPayment(paymentData, callbacks);\n};\n```\n\n### 3. Subscription Management UI\n\n```typescript\nconst manageSubscription = async (subscriptionId: string, action: string, options: any = {}) => {\n  try {\n    const { data, error } = await supabase.functions.invoke('manage-subscription', {\n      body: {\n        subscriptionId,\n        action,\n        userId: user.id,\n        ...options\n      }\n    });\n\n    if (error) throw error;\n\n    console.log(`Subscription ${action}:`, data);\n    \n    // Update UI based on action\n    switch (action) {\n      case 'cancel':\n        showCancellationMessage(data.subscription);\n        break;\n      case 'pause':\n        showPauseMessage(data.subscription);\n        break;\n      case 'change_plan':\n        showPlanChangeMessage(data.subscription, data.newPlan);\n        break;\n    }\n    \n    return data.subscription;\n    \n  } catch (error) {\n    console.error(`Subscription ${action} failed:`, error);\n    throw error;\n  }\n};\n```\n\n---\n\n## Recurring Payment Management\n\n### 1. Automated Billing (Cron Job)\n\n```typescript\n// Run this daily to process recurring payments\nconst processRecurringPayments = async () => {\n  try {\n    const { data, error } = await supabase.functions.invoke('process-recurring-payment');\n    \n    if (error) throw error;\n    \n    console.log(`Processed ${data.processed_count} subscriptions`);\n    return data;\n    \n  } catch (error) {\n    console.error('Recurring payment processing failed:', error);\n    throw error;\n  }\n};\n```\n\n### 2. Webhook Handler for Pi Network\n\n```typescript\n// Handle Pi Network webhooks for subscription events\nconst handlePiWebhook = async (req: Request) => {\n  try {\n    const signature = req.headers.get('pi-signature');\n    const body = await req.text();\n    \n    // Verify webhook signature\n    if (!verifyPiSignature(body, signature)) {\n      return new Response('Unauthorized', { status: 401 });\n    }\n    \n    const event = JSON.parse(body);\n    \n    switch (event.type) {\n      case 'payment.completed':\n        await handleSubscriptionPaymentCompleted(event.data);\n        break;\n      case 'payment.failed':\n        await handleSubscriptionPaymentFailed(event.data);\n        break;\n    }\n    \n    return new Response('OK');\n    \n  } catch (error) {\n    console.error('Webhook processing failed:', error);\n    return new Response('Error', { status: 500 });\n  }\n};\n```\n\n---\n\n## Testing & Troubleshooting\n\n### 1. Test Subscription Flow\n\n```typescript\n// Test subscription creation and payment\nconst testSubscriptionFlow = async () => {\n  try {\n    // 1. Create test plan\n    const plan = await createTestPlan();\n    \n    // 2. Create subscription\n    const subscription = await createSubscription(plan.id);\n    \n    // 3. Process payment\n    await processSubscriptionPayment(subscription);\n    \n    // 4. Test management actions\n    await manageSubscription(subscription.id, 'pause');\n    await manageSubscription(subscription.id, 'resume');\n    \n    console.log('Subscription flow test completed successfully');\n    \n  } catch (error) {\n    console.error('Subscription flow test failed:', error);\n  }\n};\n```\n\n### 2. Common Issues\n\n1. **Subscription Not Creating**:\n   - Check user permissions\n   - Verify plan is active\n   - Check for existing subscriptions\n\n2. **Payments Failing**:\n   - Verify Pi API key\n   - Check payment amount\n   - Validate user Pi wallet\n\n3. **Recurring Payments Not Working**:\n   - Set up cron job\n   - Check subscription status\n   - Verify billing periods\n\n### 3. Monitoring Queries\n\n```sql\n-- Check subscription health\nSELECT \n  s.*,\n  sp.name as plan_name,\n  sp.amount,\n  sp.interval\nFROM subscriptions s\nJOIN subscription_plans sp ON s.plan_id = sp.id\nWHERE s.status IN ('active', 'trialing', 'past_due');\n\n-- Check failed payments\nSELECT *\nFROM payment_logs\nWHERE action = 'completion_failed'\n  AND is_recurring = true\n  AND timestamp > NOW() - INTERVAL '24 hours';\n\n-- Check subscription events\nSELECT *\nFROM subscription_events\nWHERE event_type = 'subscription_updated'\n  AND created_at > NOW() - INTERVAL '7 days'\nORDER BY created_at DESC;\n```\n\n---\n\n## Production Checklist\n\n- [ ] Database schema deployed\n- [ ] All edge functions deployed\n- [ ] RLS policies configured\n- [ ] Subscription plans created\n- [ ] Pi API keys configured\n- [ ] Webhook endpoints set up\n- [ ] Cron job for recurring payments\n- [ ] Error monitoring enabled\n- [ ] Subscription analytics tracking\n- [ ] Customer support workflows\n- [ ] Billing dispute procedures\n- [ ] Subscription cancellation flows\n- [ ] Tax calculation (if required)\n- [ ] Compliance with subscription laws\n\n---\n\n## Support Resources\n\n- **Pi Network Documentation**: https://developers.minepi.com\n- **Supabase Documentation**: https://supabase.com/docs\n- **Subscription Billing Best Practices**: Industry standards for subscription management\n- **PCI Compliance**: Payment security requirements