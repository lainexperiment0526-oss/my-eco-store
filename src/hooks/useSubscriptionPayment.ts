/**
 * Enhanced Pi Subscription Payment Hook
 * Uses the new Pi SDK subscription service
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { piSubscriptionPaymentService, PaymentMetadata, PaymentCallbacks } from '@/services/piSubscriptionPaymentService';

export interface SubscriptionPlan {
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  description: string;
}

export interface PaymentProgress {
  phase: string;
  data: any;
  message: string;
}

export interface UseSubscriptionPaymentResult {
  processSubscriptionPayment: (plan: SubscriptionPlan, userProfile: { id: string; username: string }) => Promise<boolean>;
  isProcessing: boolean;
  paymentProgress: PaymentProgress | null;
  currentPhase: string;
  error: string | null;
}

export function useSubscriptionPayment(): UseSubscriptionPaymentResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState<PaymentProgress | null>(null);
  const [currentPhase, setCurrentPhase] = useState('idle');
  const [error, setError] = useState<string | null>(null);

  const processSubscriptionPayment = useCallback(async (
    plan: SubscriptionPlan,
    userProfile: { id: string; username: string }
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    setCurrentPhase('initializing');
    setPaymentProgress({ phase: 'initializing', data: {}, message: 'Starting payment process...' });

    let toastId: string | number;

    try {
      // Initialize Pi SDK
      toastId = toast.loading('Initializing Pi payment system...', { duration: Infinity });
      await piSubscriptionPaymentService.initializePiSDK();

      // Authenticate user
      if (toastId) toast.loading('Authenticating with Pi Network...', { id: toastId });
      const authResult = await piSubscriptionPaymentService.authenticatePiUser();
      
      if (!authResult.user.username || authResult.user.username !== userProfile.username) {
        throw new Error('Pi authentication username mismatch. Please ensure you are signed in with the correct Pi account.');
      }

      // Prepare payment metadata
      const metadata: PaymentMetadata = {
        planName: plan.name,
        billingPeriod: plan.billingPeriod,
        userId: authResult.user.uid,
        username: authResult.user.username,
        profileId: userProfile.id,
        itemId: `subscription_${plan.name.toLowerCase()}_${plan.billingPeriod}`,
        itemType: 'subscription',
        timestamp: Date.now(),
        description: `${plan.name} subscription (${plan.billingPeriod})`
      };

      if (toastId) toast.loading('Creating Pi payment...', { id: toastId });

      // Set up payment callbacks
      const callbacks: PaymentCallbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log(`[SUBSCRIPTION] Payment ${paymentId} ready for server approval`);
          // Save pending payment ID for failsafe recovery
          try {
            localStorage.setItem('pending_pi_payment_id', paymentId);
            localStorage.setItem('pending_pi_plan_type', plan.name.toLowerCase());
          } catch (e) {
            console.error('Failed to save payment ID', e);
          }
          setCurrentPhase('server_approval');
        },
        
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log(`[SUBSCRIPTION] Payment ${paymentId} ready for completion, txid: ${txid}`);
          setCurrentPhase('server_completion');
          
          try {
            // Store the successful payment in database (client-side redundancy)
            await updateSubscriptionInDatabase(plan, userProfile.id, paymentId, txid, plan.price);
            
            // Force refresh user session and profile to reflect new subscription
            await supabase.auth.refreshSession();
            // Invalidate/refetch profile data if using React Query or similar
            // For now, we rely on the realtime subscription in useActiveSubscription hook
            
            toast.success(`${plan.name} subscription activated! 🎉`, { 
              id: toastId,
              description: `Your ${plan.billingPeriod} subscription is now active`,
              duration: 5000
            });
            
            // Clear pending payment from storage
            localStorage.removeItem('pending_pi_payment_id');
            localStorage.removeItem('pending_pi_plan_type');
            
            setCurrentPhase('completed');
            setPaymentProgress({ 
              phase: 'completed', 
              data: { paymentId, txid }, 
              message: 'Subscription successfully activated!' 
            });
            
          } catch (dbError) {
            console.error('[SUBSCRIPTION] Database update failed:', dbError);
            // Payment succeeded but database update failed
            toast.success('Payment successful!', {
              id: toastId,
              description: 'Subscription may take a moment to activate. Please refresh if needed.'
            });
            
            setCurrentPhase('completed');
          }
        },
        
        onCancel: (paymentId: string) => {
          console.log(`[SUBSCRIPTION] Payment ${paymentId} was cancelled`);
          toast.error('Payment was cancelled', { id: toastId });
          setCurrentPhase('cancelled');
          setError('Payment was cancelled');
        },
        
        onError: (error: Error, paymentId?: string) => {
          console.error('[SUBSCRIPTION] Payment error:', error, paymentId);
          toast.error('Payment failed', { 
            id: toastId,
            description: error.message,
            duration: 5000
          });
          setCurrentPhase('error');
          setError(error.message);
        }
      };

      // Create and process the payment
      await piSubscriptionPaymentService.createSubscriptionPayment(
        {
          amount: plan.price,
          memo: `${plan.name} Subscription - ${plan.billingPeriod}`,
          metadata
        },
        callbacks,
        (phase: string, data: any) => {
          setCurrentPhase(phase);
          setPaymentProgress({ phase, data, message: String(data?.message ?? '') });
          
          // Update toast based on phase
          if (toastId) {
            switch (phase) {
              case 'approval':
                toast.loading('Waiting for your approval...', { id: toastId });
                break;
              case 'approved':
                toast.loading('Payment approved! Processing...', { id: toastId });
                break;
              case 'completion':
                toast.loading('Finalizing subscription...', { id: toastId });
                break;
            }
          }
        }
      );

      console.log('[SUBSCRIPTION] Payment flow completed');
      return true;

    } catch (error: any) {
      console.error('[SUBSCRIPTION] Payment process failed:', error);
      
      const errorMessage = error?.message || 'An unexpected error occurred during payment';
      setError(errorMessage);
      setCurrentPhase('error');
      
      toast.error('Subscription payment failed', { 
        id: toastId,
        description: errorMessage,
        duration: 5000
      });
      
      return false;
      
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processSubscriptionPayment,
    isProcessing,
    paymentProgress,
    currentPhase,
    error
  };
}

/**
 * Update subscription in database after successful payment
 */
async function updateSubscriptionInDatabase(
  plan: SubscriptionPlan,
  profileId: string,
  paymentId: string,
  txid: string,
  amount: number
): Promise<void> {
  const startDate = new Date();
  const endDate = new Date();
  
  if (plan.billingPeriod === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  console.log('[SUBSCRIPTION] Updating database with:', {
    profileId,
    planName: plan.name,
    billingPeriod: plan.billingPeriod,
    paymentId,
    txid,
    amount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const planType = plan.name.toLowerCase();

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      profile_id: profileId,
      plan_type: planType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      pi_amount: amount,
      billing_period: plan.billingPeriod,
      auto_renew: true,
      payment_id: paymentId,
      transaction_id: txid,
      payment_method: 'pi_network',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id'
    });

  if (error) {
    console.error('[SUBSCRIPTION] Database upsert error, trying fallback insert:', error);
    
    // Fallback: Try to delete duplicates and insert fresh
    // This handles cases where unique constraint might be missing
    await supabase.from('subscriptions').delete().eq('profile_id', profileId);
    
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: profileId,
        plan_type: planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        pi_amount: amount,
        billing_period: plan.billingPeriod,
        auto_renew: true,
        payment_id: paymentId,
        transaction_id: txid,
        payment_method: 'pi_network',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      throw new Error(`Failed to update subscription: ${insertError.message}`);
    }
  }

  console.log('[SUBSCRIPTION] Database updated successfully');
}