import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Gift, AlertTriangle, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePi } from "@/contexts/PiContext";
import { useRealPiPayment } from "@/hooks/useRealPiPayment";
import { useSubscriptionPayment } from "@/hooks/useSubscriptionPayment";
import { validateMainnetConfig } from "@/config/pi-config";
import { GiftCardModal } from "@/components/GiftCardModal";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { createDroppayPaymentViaApi } from "@/lib/droppay";

interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 social media link only (no custom links)",
      "Basic profile customization",
      "Basic QR code sharing", 
      "Public bio page visibility",
      "DropLink watermark displayed",
      "Pi Ad Network banners shown",
      "Limited theme options (3 basic templates)",
      "Community support only",
      "Watch ads to temporarily access premium features",
      "Earn DROP tokens by watching ads",
      "No Pi Wallet for tips (Basic+ required)",
      "No custom links (Premium+ required)"
    ]
  },
  {
    name: "Basic",
    monthlyPrice: 10,
    yearlyPrice: 96,
    features: [
      "Up to 5 custom links (Premium feature partially unlocked)",
      "Up to 3 social media links",
      "Pi Wallet for receiving tips and donations (Basic+ required)",
      "DROP token management and earning",
      "Standard profile customization",
      "Standard QR code sharing",
      "No DropLink watermark",
      "Basic analytics dashboard access",
      "Email support (standard)",
      "Priority for new features",
      "Pi Ad Network still shown (Premium+ for ad-free)"
    ],
    savings: "20% savings on yearly"
  },
  {
    name: "Premium",
    monthlyPrice: 20,
    yearlyPrice: 192,
    features: [
      "Everything in Basic, plus:",
      "Unlimited custom links (up to 25 with advanced management)",
      "Unlimited social media links (up to 99)", 
      "YouTube video integration (Premium+ required)",
      "Advanced theme customization and GIF backgrounds (Premium+ required)",
      "Background music player",
      "Digital products listings (Premium+ required)",
      "Virtual card generation and management",
      "Advanced analytics dashboard",
      "Pi Network wallet integration with QR codes",
      "Priority email support",
      "AI features and logo generation",
      "Full Design tab access with color customization"
    ],
    popular: true,
    savings: "20% savings on yearly"
  },
  {
    name: "Pro",
    monthlyPrice: 30,
    yearlyPrice: 288,
    features: [
      "Everything in Premium, plus:",
      "Analytics dashboard (Pro+ required for advanced features)",
      "Unlimited custom links (999) and social links (999)",
      "Custom domain support (Pro exclusive)",
      "Advanced virtual card features and customization",
      "Advanced API access for integrations",
      "White-label solutions (no DropLink branding)",
      "24/7 priority support with dedicated channel",
      "Advanced security and team collaboration",
      "Custom integrations and enterprise features",
      "Bulk management and export capabilities",
      "No watch ads - Ad-free experience",
      "Complete feature unlock across all dashboard tabs"
    ]
  }
];

const Subscription = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [dropPayLoading, setDropPayLoading] = useState(false);
  const [showPiConfirmModal, setShowPiConfirmModal] = useState(false);
  const [showDropPayConfirmModal, setShowDropPayConfirmModal] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState<{planName: string, price: number} | null>(null);
  const piConfigured = !!import.meta.env.VITE_PI_API_KEY;
  const dropPayConfigured = !!import.meta.env.VITE_DROPPAY_API_KEY;
  const isDropPayComingSoon = true; // Temporarily mark DropPay as coming soon
  const navigate = useNavigate();
  const { piUser, signIn, loading: piLoading } = usePi() as any;
  const { processPayment, isProcessing, paymentProgress } = useRealPiPayment();
  const {
    processSubscriptionPayment,
    isProcessing: isSubscriptionProcessing,
    paymentProgress: subscriptionProgress,
    currentPhase,
    error: subscriptionError,
  } = useSubscriptionPayment();

  useEffect(() => {
    const fetchData = async () => {
      if (!piUser?.username) return;
      // Get profile id for metadata and current subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', piUser.username)
        .maybeSingle();
      if (profile?.id) setProfileId(profile.id);

      const { data } = await supabase
        .from('subscriptions')
        .select('plan_type, end_date, status')
        .eq('profile_id', profile?.id || '')
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSubscription(data);
        const planName = (data.plan_type || 'free').toLowerCase();
        const display = planName === 'pro' ? 'Pro' : planName === 'premium' ? 'Premium' : planName === 'basic' ? 'Basic' : 'Free';
        setCurrentPlan(display);
      } else {
        setCurrentPlan('Free');
      }
    };
    fetchData();
  }, [piUser]);

  // Handle payment - PRODUCTION MAINNET ONLY
  const handleMockPayment = async (planName: string, price: number) => {
    if (!profileId) {
      toast.error('Profile not loaded. Please refresh.');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Processing mock payment...', { id: 'mock-payment' });
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Save subscription to database
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          profile_id: profileId,
          plan_type: planName.toLowerCase(),
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          pi_amount: price,
          billing_period: isYearly ? 'yearly' : 'monthly',
          auto_renew: true,
        }, {
          onConflict: 'profile_id'
        });
      
      if (subError) {
        console.error('[MOCK PAYMENT] Database error:', subError);
        toast.error('Failed to activate subscription', { id: 'mock-payment' });
      } else {
        toast.success(`🎉 Mock payment successful! ${planName} plan activated`, { 
          id: 'mock-payment',
          description: 'This was a test payment - no real Pi was charged'
        });
        
        setCurrentPlan(planName);
        setSubscription({
          plan_type: planName.toLowerCase(),
          status: 'active',
          end_date: endDate.toISOString()
        });

        // Set activation flag for dashboard auto-refresh
        sessionStorage.setItem('subscription_activated', JSON.stringify({
          plan: planName.toLowerCase(),
          billing: isYearly ? 'yearly' : 'monthly'
        }));
        
        // Redirect after delay
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error: any) {
      console.error('[MOCK PAYMENT] Error:', error);
      toast.error('Mock payment failed', { id: 'mock-payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string, price: number) => {
    if (!piUser) {
      toast.error('Please sign in with Pi Network first');
      return;
    }
    
    // Show confirmation for paid plans
    if (planName !== 'Free' && price > 0) {
      setPendingPlanData({ planName, price });
      setShowPiConfirmModal(true);
      return;
    }
    
    // Handle free plan directly
    await processPiPayment(planName, price);
  };

  const processPiPayment = async (planName: string, price: number) => {
    setLoading(true);
    try {
      if (planName === 'Free') {
        toast.success('Free plan activated! 🎉');
        setCurrentPlan('Free');
        setSubscription({ plan_type: 'free' });
        setLoading(false);
        return;
      }
      
      // MAINNET PAYMENT - Real Pi coins will be charged!
      console.log('[SUBSCRIPTION] ⚠️ REAL MAINNET PAYMENT:', price, 'Pi for', planName);
      console.log('[SUBSCRIPTION] Network: MAINNET (Production)');
      console.log('[SUBSCRIPTION] User:', piUser.username);
      console.log('[SUBSCRIPTION] Profile ID:', profileId);
      
      const toastId = toast.loading('Processing payment...', {
        description: paymentProgress || `Waiting for Pi Network approval for ${price} Pi`
      });
      
      // Use new payment service
      const result = await processPayment({
        id: `subscription-${planName.toLowerCase()}-${Date.now()}`,
        name: `DropLink ${planName} ${isYearly ? 'Yearly' : 'Monthly'} Subscription`,
        type: 'subscription',
        price: price,
        description: `${planName} plan subscription`,
        metadata: {
          subscriptionPlan: planName.toLowerCase(),
          billingPeriod: isYearly ? 'yearly' : 'monthly',
          username: piUser.username,
          profileId: profileId || '',
        }
      });
      
      console.log('[SUBSCRIPTION] Payment result:', result);
      
      if (result.success) {
        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (isYearly) {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        
        // Save subscription to database (may already be saved by backend)
        // First try to clean up any existing active subscriptions to ensure clean state
        try {
          await supabase
            .from('subscriptions')
            .delete()
            .eq('profile_id', profileId);
        } catch (err) {
          console.warn('[SUBSCRIPTION] Cleanup failed, proceeding with upsert', err);
        }

        // Try upsert first
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            profile_id: profileId,
            plan_type: planName.toLowerCase(),
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            pi_amount: price,
            billing_period: isYearly ? 'yearly' : 'monthly',
            auto_renew: true,
          }, {
            onConflict: 'profile_id'
          });
        
        if (subError) {
          console.error('[SUBSCRIPTION] Upsert failed, trying fallback insert:', subError);
          
          // Fallback: If upsert failed (e.g. missing constraint), try plain insert since we deleted above
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              profile_id: profileId,
              plan_type: planName.toLowerCase(),
              status: 'active',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              pi_amount: price,
              billing_period: isYearly ? 'yearly' : 'monthly',
              auto_renew: true,
            });

          if (insertError) {
             console.error('[SUBSCRIPTION] Fallback insert failed:', insertError);
             toast.dismiss(toastId);
             toast.success('Payment successful!', {
               description: 'Subscription may take a moment to activate. Please refresh if needed.'
             });
          } else {
             toast.dismiss(toastId);
             toast.success(`Successfully subscribed to ${planName} plan! 🎉`, {
               description: `Your subscription is now active`,
               duration: 5000
             });
          }
        } else {
          toast.dismiss(toastId);
          toast.success(`Successfully subscribed to ${planName} plan! 🎉`, {
            description: `Your subscription is now active`,
            duration: 5000
          });
        }
        
        setCurrentPlan(planName);
        setSubscription({
          plan_type: planName.toLowerCase(),
          status: 'active',
          end_date: endDate.toISOString()
        });
        
        // Set activation flag for dashboard auto-refresh
        sessionStorage.setItem('subscription_activated', JSON.stringify({
          plan: planName.toLowerCase(),
          billing: isYearly ? 'yearly' : 'monthly'
        }));
        
        // Redirect after delay
        setTimeout(() => navigate('/'), 2000);
      } else {
        toast.dismiss(toastId);
        toast.error('Payment failed', {
          description: result.error || 'Please try again',
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('[SUBSCRIPTION] Payment error:', error);
      toast.error(error?.message || 'Failed to process subscription. Please try again.', {
        description: error?.details || 'Check console for details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeWithDropPay = async (planName: string, price: number) => {
    if (!dropPayConfigured) {
      toast.error('DropPay is not configured');
      return;
    }
    
    // Show confirmation for paid plans
    if (planName !== 'Free' && price > 0) {
      setPendingPlanData({ planName, price });
      setShowDropPayConfirmModal(true);
      return;
    }

    // Handle free plan directly
    await processDropPayPayment(planName, price);
  };

  const processDropPayPayment = async (planName: string, price: number) => {
    setDropPayLoading(true);
    try {
      if (planName === 'Free') {
        toast.success('Free plan activated! 🎉');
        setCurrentPlan('Free');
        setSubscription({ plan_type: 'free' });
        setDropPayLoading(false);
        return;
      }

      console.log('[DROPPAY SUBSCRIPTION] Creating payment for:', planName, price, 'Pi');
      
      // Prepare redirect URLs
      const baseUrl = window.location.origin;
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      const successUrl = `${baseUrl}/payment-success?plan=${encodeURIComponent(planName.toLowerCase())}&period=${encodeURIComponent(billingPeriod)}&amount=${encodeURIComponent(price)}`;
      const cancelUrl = `${baseUrl}/payment-cancel?plan=${encodeURIComponent(planName.toLowerCase())}&period=${encodeURIComponent(billingPeriod)}&amount=${encodeURIComponent(price)}`;
      
      // Create DropPay payment
      const result = await createDroppayPaymentViaApi({
        amount: price,
        currency: 'PI',
        description: `DropLink ${planName} ${isYearly ? 'Yearly' : 'Monthly'} Subscription`,
        metadata: {
          type: 'subscription',
          subscriptionPlan: planName.toLowerCase(),
          billingPeriod: isYearly ? 'yearly' : 'monthly',
          username: piUser?.username || '',
          profileId: profileId || '',
          profile_id: profileId || '', // Webhook expects this format
          plan: planName.toLowerCase(), // Webhook expects this format
          period: isYearly ? 'yearly' : 'monthly', // Webhook expects this format
          platform: 'droplink',
          successUrl: successUrl,
          cancelUrl: cancelUrl
        }
      });

      console.log('[DROPPAY SUBSCRIPTION] Payment creation result:', result);

      if (result.success && result.payment?.checkout_url) {
        console.log('[DROPPAY SUBSCRIPTION] Redirecting to:', result.payment.checkout_url);
        toast.success('Redirecting to DropPay...', {
          description: 'You will be redirected to complete your payment'
        });
        
        // Redirect to DropPay checkout
        window.open(result.payment.checkout_url, '_blank', 'noopener,noreferrer');
        
        // Show instructions to user
        setTimeout(() => {
          toast.info('Complete payment in DropPay tab', {
            description: 'Your subscription will activate automatically after payment',
            duration: 10000
          });
        }, 1000);
        
      } else {
        console.error('[DROPPAY SUBSCRIPTION] Payment creation failed:', result.error);
        toast.error('Failed to create DropPay payment', {
          description: result.error || 'Please try again later'
        });
      }
    } catch (error: any) {
      console.error('[DROPPAY SUBSCRIPTION] Error:', error);
      toast.error('DropPay subscription failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setDropPayLoading(false);
    }
  };


  // Enhanced Pi Subscription Payment
  const processEnhancedPiSubscription = async (planName: string, price: number) => {
    if (!piUser || !profileId) {
      toast.error('Please sign in with Pi Network and complete your profile setup');
      return false;
    }

    try {
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      
      const success = await processSubscriptionPayment(
        {
          name: planName,
          price: price,
          billingPeriod: billingPeriod,
          description: `${planName} ${billingPeriod} subscription`
        },
        {
          id: profileId,
          username: piUser.username
        }
      );

      if (success) {
        setCurrentPlan(planName);
        setSubscription({
          plan_type: planName.toLowerCase(),
          status: 'active',
          end_date: new Date(Date.now() + (billingPeriod === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString()
        });
        
        // Set activation flag for dashboard auto-refresh
        sessionStorage.setItem('subscription_activated', JSON.stringify({
          plan: planName.toLowerCase(),
          billing: billingPeriod
        }));
        
        // Redirect after delay
        setTimeout(() => navigate('/'), 3000);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('[ENHANCED PI SUBSCRIPTION] Payment failed:', error);
      toast.error('Subscription payment failed', {
        description: error?.message || 'Please try again'
      });
      return false;
    }
  };

  const handleGiftCardPurchase = async (planType: string, billingPeriod: string, price: number, recipientEmail?: string, message?: string) => {
    if (!piUser) {
      toast.error('🔒 Pi Network Authentication Required', {
        description: 'Please sign in with Pi Network to purchase gift cards'
      });
      return;
    }

    if (!profileId) {
      toast.error('🔒 Profile Required', {
        description: 'Please complete your profile setup first'
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ REAL Pi PAYMENT\n\n` +
      `You are about to pay ${price} Pi for a ${planType} ${billingPeriod} gift card.\n\n` +
      `This is a REAL Pi Network mainnet transaction. Actual Pi coins will be deducted from your wallet.\n\n` +
      `Do you want to proceed?`
    );

    if (!confirmed) {
      toast.info('Purchase cancelled');
      return;
    }

    try {
      const toastId = toast.loading('Processing gift card purchase...');

      // Process payment
      const result = await processPayment({
        id: `giftcard-${planType}-${Date.now()}`,
        name: `DropLink Gift Card - ${planType} (${billingPeriod})`,
        type: 'subscription',
        price: price,
        description: `Gift card for ${planType} ${billingPeriod} subscription`,
        metadata: {
          isGiftCard: 'true',
          giftCardPlan: planType,
          giftCardPeriod: billingPeriod,
          recipientEmail: recipientEmail || '',
          message: message || '',
          username: piUser.username,
          profileId: profileId || '',
        }
      });

      if (result.success) {
        // Generate gift card code
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_gift_card_code');

        if (codeError) {
          console.error('[GIFT CARD] Code generation error:', codeError);
          throw new Error('Failed to generate gift card code');
        }
        
        const code = codeData as string;

        // Insert gift card
        const { error: insertError } = await supabase
          .from('gift_cards')
          .insert({
            code,
            plan_type: planType,
            billing_period: billingPeriod,
            pi_amount: price,
            purchased_by_profile_id: profileId,
            recipient_email: recipientEmail || null,
            message: message || null,
            status: 'active'
          });

        if (insertError) {
          console.error('[GIFT CARD] Insert error:', insertError);
          throw new Error('Failed to save gift card');
        }

        toast.dismiss(toastId);
        toast.success('Gift card purchased successfully', {
          description: 'Share the code with your recipient'
        });
        
        // Send email if recipient provided
        if (recipientEmail) {
          try {
            await supabase.functions.invoke('send-gift-card-email', {
              body: {
                recipientEmail,
                code,
                planType,
                billingPeriod,
                message: message || '',
                senderProfileId: profileId
              }
            });
            toast.success('Gift card email sent to recipient', {
              description: `${recipientEmail} will receive their gift card code.`
            });
          } catch (emailError) {
            console.error('Email send error:', emailError);
            toast.info('Gift card created! Share the code manually.', {
              description: 'Email delivery is pending - code: ' + code
            });
          }
        }
      } else {
        toast.dismiss(toastId);
        const errorMsg = result.error || 'Payment was not completed';
        toast.error('💳 Payment Failed', { 
          description: errorMsg.includes('cancelled') ? 'Payment was cancelled by user' : errorMsg
        });
      }
    } catch (error: any) {
      console.error('[GIFT CARD] Purchase error:', error);
      toast.error('❌ Gift Card Purchase Failed', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  };

  const handleGiftCardRedeem = async (code: string) => {
    if (!profileId) {
      toast.error('🔒 Please sign in to redeem gift cards', {
        description: 'You must be signed in to activate a gift card'
      });
      return;
    }

    if (!code || code.trim().length === 0) {
      toast.error('Invalid gift card code', {
        description: 'Please enter a valid gift card code'
      });
      return;
    }

    try {
      const toastId = toast.loading('Redeeming gift card...');
      
      const { data: giftCard, error: fetchError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (fetchError || !giftCard) {
        toast.dismiss(toastId);
        toast.error('❌ Invalid Gift Card Code', {
          description: 'This code does not exist or has been mistyped'
        });
        return;
      }

      if (giftCard.status !== 'active') {
        toast.dismiss(toastId);
        toast.error(`Gift Card Already ${giftCard.status}`, {
          description: giftCard.status === 'redeemed' 
            ? 'This gift card has already been used' 
            : 'This gift card is no longer valid'
        });
        return;
      }

      if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
        toast.dismiss(toastId);
        toast.error('Gift Card Expired', {
          description: `This gift card expired on ${new Date(giftCard.expires_at).toLocaleDateString()}`
        });
        return;
      }

      // Mark as redeemed
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({
          status: 'redeemed',
          redeemed_by_profile_id: profileId,
          redeemed_at: new Date().toISOString()
        })
        .eq('code', code.toUpperCase());

      if (updateError) {
        console.error('[GIFT CARD] Update error:', updateError);
        toast.dismiss(toastId);
        toast.error('Failed to redeem gift card', {
          description: 'Please try again or contact support'
        });
        return;
      }

      // Create subscription
      const startDate = new Date();
      const endDate = new Date(startDate);

      if (giftCard.billing_period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          profile_id: profileId,
          plan_type: giftCard.plan_type,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          pi_amount: 0, // Gift card - no payment
          billing_period: giftCard.billing_period,
          auto_renew: false,
        });

      if (subError) {
        console.error('[GIFT CARD] Subscription error:', subError);
        toast.dismiss(toastId);
        toast.error('Failed to activate subscription', {
          description: 'Please contact support with your gift code'
        });
        return;
      }

      // Show success and reload
      toast.dismiss(toastId);
      toast.success('🎉 Gift Card Redeemed!', {
        description: `${giftCard.plan_type} plan activated successfully!`
      });
      
      setShowGiftCardModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('[GIFT CARD] Redemption error:', error);
      toast.error('❌ Gift Card Redemption Failed', {
        description: error.message || 'An unexpected error occurred. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Subscriptions" 
        description="Choose your plan"
        icon={<Zap className="w-6 h-6" />}
      />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-8 pb-24">
        <div className="mb-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-pink-500 text-pink-600 hover:bg-pink-50"
            onClick={() => setShowGiftCardModal(true)}
          >
            <Gift className="w-4 h-4" />
            Gift Cards
          </Button>
        </div>
      {/* Pi Auth Sign In Button */}
      {!piUser && (
        <div className="flex justify-center mb-8">
          <Button
            variant="default"
            className="px-8 py-3 text-lg font-semibold bg-sky-500 hover:bg-sky-600 text-white border border-sky-700 shadow-lg"
            onClick={() => signIn()}
            disabled={piLoading}
          >
            {piLoading ? 'Signing in with Pi...' : 'Sign in with Pi Network'}
          </Button>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Choose Your Plan</h1>
          <p className="text-lg mb-2 text-white/90">Unlock more features and remove ads with a paid plan.</p>
          
          <div className="mt-3 flex flex-col gap-2 items-center text-sm">
            <div className="flex gap-3 items-center flex-wrap justify-center">
              <span className={`px-3 py-1 rounded-full border ${piConfigured ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                Pi Payments: {piConfigured ? '✓ Online' : 'Not configured'}
              </span>
              <span className={`px-3 py-1 rounded-full border ${isDropPayComingSoon ? 'bg-gray-100 text-gray-600 border-gray-200' : (dropPayConfigured ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>
                DropPay: {isDropPayComingSoon ? 'Coming soon' : (dropPayConfigured ? '✓ Online' : 'Not configured')}
              </span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white/95 backdrop-blur-sm border-2 border-sky-500 rounded-xl shadow-lg max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-sky-700 mb-1">⚠️ REAL Pi Network Payments</p>
            <p className="text-xs text-slate-700">All prices are in Pi (π) - Real Pi Network cryptocurrency. These are MAINNET transactions, not test payments. You will be charged actual Pi coins from your Pi wallet.</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={`text-white ${!isYearly ? 'font-bold' : ''}`}>Monthly</Label>
          <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
          <Label htmlFor="billing-toggle" className={`text-white ${isYearly ? 'font-bold' : ''}`}>Yearly <span className="text-white">(Save 20%)</span></Label>
        </div>

        {isSubscriptionProcessing && (
          <div className="mb-4 text-center text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {subscriptionProgress?.message || 'Processing Pi payment...'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLANS.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? 'per year' : 'per month';
            const isCurrent = currentPlan === plan.name;
            return (
              <Card key={plan.name} className={`relative bg-white dark:bg-slate-900 ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">π {price}</span>
                    <span className="text-muted-foreground">/{period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Payment Buttons */}
                  {plan.name === 'Free' ? (
                    <Button 
                      className="w-full mb-2" 
                      variant="default" 
                      disabled={isCurrent || loading || isProcessing} 
                      onClick={() => handleSubscribe(plan.name, price)}
                    >
                      {isCurrent ? '✓ Current Plan' : 'Activate Free Plan'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {/* Pi Payment Button */}
                      {piConfigured && (
                        <Button 
                          className="w-full" 
                          variant="default" 
                          disabled={isCurrent || loading || isProcessing || dropPayLoading || isSubscriptionProcessing} 
                          onClick={() => handleSubscribe(plan.name, price)}
                        >
                          {isCurrent
                            ? '✓ Current Plan'
                            : (loading || isProcessing || isSubscriptionProcessing)
                              ? `⏳ ${(subscriptionProgress?.message || paymentProgress || 'Processing...')}`
                              : 'Subscribe with Pi Network'}
                        </Button>
                      )}
                      
                      {/* DropPay Button */}
                      {dropPayConfigured && (
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600" 
                          disabled={true}
                          onClick={() => toast.info('DropPay subscription is coming soon')}
                        >
                          {isCurrent ? '✓ Current Plan' : 'Subscribe with DropPay (Coming Soon)'}
                        </Button>
                      )}
                      
                      {/* Fallback if neither payment method is configured */}
                      {!piConfigured && !dropPayConfigured && (
                        <Button className="w-full" variant="default" disabled>
                          Payment methods not configured
                        </Button>
                      )}
                    </div>
                  )}


                  {subscription && isCurrent && subscription.end_date && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">Renews on {new Date(subscription.end_date).toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-white space-y-2">
          <p>All plans include a 14-day Pi-back guarantee.</p>
          <p>Payments are processed securely through Pi Network blockchain.</p>
          <p>Questions? Contact support@droplink.space</p>
        </div>
      </div>

      <GiftCardModal
        open={showGiftCardModal}
        onOpenChange={setShowGiftCardModal}
        onPurchase={handleGiftCardPurchase}
        onRedeem={handleGiftCardRedeem}
        profileId={profileId || undefined}
      />

      {/* Pi Payment Confirmation Modal */}
      <Dialog open={showPiConfirmModal} onOpenChange={setShowPiConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Pi Payment
            </DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                <p className="font-semibold text-sky-900 mb-2">⚠️ REAL Pi Network Payment</p>
                <div className="text-sm text-sky-800 space-y-1">
                  <p><strong>Plan:</strong> {pendingPlanData?.planName} ({isYearly ? 'Yearly' : 'Monthly'})</p>
                  <p><strong>Amount:</strong> {pendingPlanData?.price} Pi</p>
                  <p><strong>Network:</strong> Mainnet (Production)</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This is a REAL Pi Network mainnet transaction. Actual Pi coins will be deducted from your wallet.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPiConfirmModal(false);
                setPendingPlanData(null);
                toast.info('Payment cancelled');
              }}
              disabled={loading || isProcessing || isSubscriptionProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="bg-sky-600 hover:bg-sky-700"
              disabled={loading || isProcessing || isSubscriptionProcessing}
              onClick={async () => {
                setShowPiConfirmModal(false);
                if (pendingPlanData) {
                  await processEnhancedPiSubscription(pendingPlanData.planName, pendingPlanData.price);
                }
                setPendingPlanData(null);
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isSubscriptionProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DropPay Confirmation Modal */}
      <Dialog open={showDropPayConfirmModal} onOpenChange={setShowDropPayConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <CreditCard className="w-5 h-5" />
              Confirm DropPay Payment
            </DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-semibold text-orange-900 mb-2">💳 DropPay Secure Payment</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Plan:</strong> {pendingPlanData?.planName} ({isYearly ? 'Yearly' : 'Monthly'})</p>
                  <p><strong>Amount:</strong> {pendingPlanData?.price} Pi</p>
                  <p><strong>Payment Method:</strong> DropPay</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                You will be redirected to DropPay for secure payment processing. Your subscription will activate automatically after payment.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDropPayConfirmModal(false);
                setPendingPlanData(null);
                toast.info('Payment cancelled');
              }}
              disabled={dropPayLoading || isSubscriptionProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={dropPayLoading || isSubscriptionProcessing}
              onClick={async () => {
                setShowDropPayConfirmModal(false);
                if (pendingPlanData) {
                  await processDropPayPayment(pendingPlanData.planName, pendingPlanData.price);
                }
                setPendingPlanData(null);
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Continue to DropPay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      <FooterNav />
    </div>
  );
};

// Subscription component for DropLink platform - Pi Network integration
export default Subscription;
