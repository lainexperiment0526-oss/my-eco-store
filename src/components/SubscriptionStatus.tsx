import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Pi,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { usePi } from '@/contexts/PiContext';
import { useNavigate } from 'react-router-dom';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { supabase } from '@/integrations/supabase/client';

interface GiftCardInfo {
  code: string;
  redeemed_at: string;
  plan_type: string;
  billing_period: string;
}

const SubscriptionStatus: React.FC = () => {
  const { isAuthenticated, piUser, signIn } = usePi();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { subscription, plan, isLoading, isActive } = useActiveSubscription();
  const [lastGiftCode, setLastGiftCode] = useState<string | null>(null);
  const [isGiftCard, setIsGiftCard] = useState(false);

  useEffect(() => {
    const fetchGiftCard = async () => {
      if (!subscription?.profile_id || !subscription?.plan_type || !subscription?.start_date) return;
      try {
        // Find a gift card redeemed by this user for this plan, recently
        const { data, error } = await (supabase
          .from('gift_cards' as any)
          .select('code, redeemed_at, plan_type, billing_period')
          .eq('redeemed_by_profile_id', subscription.profile_id)
          .eq('plan_type', subscription.plan_type)
          .eq('billing_period', subscription.billing_period)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any);
        
        if (data && (data as GiftCardInfo).code) {
          setLastGiftCode((data as GiftCardInfo).code);
          setIsGiftCard(true);
        } else {
          setLastGiftCode(null);
          setIsGiftCard(false);
        }
      } catch (err) {
        console.error('Error fetching gift card:', err);
        setLastGiftCode(null);
        setIsGiftCard(false);
      }
    };
    if (subscription && subscription.plan_type !== 'free') {
      fetchGiftCard();
    }
  }, [subscription]);

  const handlePiAuth = async () => {
    setIsSigningIn(true);
    try {
      await signIn(['username', 'payments', 'wallet_address']);
    } catch (error) {
      console.error('Pi authentication failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  interface PlanFeatures {
    name: string;
    features: string[];
    color: string;
    limitedFeatures?: string[];
    priceMonthly?: string;
    priceYearly?: string;
  }

  const getPlanFeatures = (planType: string): PlanFeatures => {
    const features: Record<string, PlanFeatures> = {
      free: {
        name: 'Free',
        features: [
          'Social media link only (no custom links)',
          'Basic profile customization',
          'Basic QR code sharing',
          'Public bio page visibility',
          'DropLink watermark displayed',
          'Pi Ad Network banners shown',
          'Limited theme options (basic templates)',
          'Community support',
          'Watch ads to temporarily access premium features'
        ],
        color: 'bg-gray-50 border-gray-200',
        limitedFeatures: ['Ad-supported experience', 'No custom links', 'No custom domain']
      },
      basic: {
        name: 'Basic',
        features: [
          'Up to 5 custom links',
          'Up to 3 social media links',
          'Pi Wallet for tips & donations',
          'DROP token management and earning',
          'Standard QR code sharing',
          'No DropLink watermark',
          'Basic analytics dashboard access',
          'Email support (standard)',
          'Priority for new features',
          'Pi Ad Network still shown'
        ],
        color: 'bg-blue-50 border-blue-200',
        priceMonthly: '10π',
        priceYearly: '96π (save 20%)'
      },
      premium: {
        name: 'Premium',
        features: [
          'Everything in Basic, plus:',
          'Unlimited custom links (up to 25 with management)',
          'Unlimited social media links (up to 99)',
          'YouTube video integration',
          'Advanced theme customization and GIF backgrounds',
          'Background music player',
          'Digital product listings',
          'Virtual card generation and management',
          'Advanced analytics dashboard',
          'Pi Network wallet integration with QR codes',
          'Priority email support',
          'AI features and logo generation'
        ],
        color: 'bg-purple-50 border-purple-200',
        priceMonthly: '20π',
        priceYearly: '192π (save 20%)'
      },
      pro: {
        name: 'Pro', 
        features: [
          'Everything in Premium, plus:',
          'Custom domain support (Pro exclusive)',
          'Advanced virtual card features and customization',
          'Advanced QR access/API for integrations',
          'White‑label solutions (no DropLink branding)',
          '24/7 priority support with dedicated channel',
          'Advanced security and team collaboration',
          'Custom integrations and enterprise features',
          'No watch ads - Ad-free experience',
          'Bulk management and export capabilities',
          'Complete feature unlock across all dashboard tabs'
        ],
        color: 'bg-orange-50 border-orange-200',
        priceMonthly: '30π',
        priceYearly: '288π (save 20%)'
      }
    };
    return features[planType] || features.free;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 pb-20">
        <div className="max-w-2xl mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Shield className="h-5 w-5" />
                Pi Network Authentication Required
              </CardTitle>
              <CardDescription className="text-amber-700">
                Sign in with Pi Network to access subscription management and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Pi className="h-4 w-4" />
                  <AlertDescription>
                    Connect your Pi Network account to:
                    <ul className="mt-2 ml-4 list-disc text-sm">
                      <li>Manage your subscription plans</li>
                      <li>Process payments with Pi cryptocurrency</li>
                      <li>Access premium features</li>
                      <li>Sync your profile data</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handlePiAuth}
                  disabled={isSigningIn}
                  className="w-full"
                  size="lg"
                >
                  <Pi className="h-5 w-5 mr-2" />
                  {isSigningIn ? 'Connecting to Pi Network...' : 'Sign in with Pi Network'}
                </Button>
                
                <p className="text-xs text-center text-amber-600">
                  Secure authentication using Pi Network's official SDK
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 pb-20">
        <div className="max-w-2xl mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Loading subscription status...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const planInfo = getPlanFeatures(plan || 'free');
  const daysLeft = subscription?.end_date ? calculateDaysLeft(subscription.end_date) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className={`bg-white shadow-md border border-gray-200 ${planInfo.color} transition-all duration-200`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-100 text-green-800" : ""}
              >
                {planInfo.name}
              </Badge>
            </div>
            <CardDescription>
              Manage your DropLink subscription and billing
            </CardDescription>
          </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Pi className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-medium">Connected as: {piUser?.username}</p>
            <p className="text-sm text-muted-foreground">Pi Network Account</p>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="space-y-3">
          {isGiftCard && lastGiftCode && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Active via Gift Card:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-green-800">{lastGiftCode}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan:</span>
            <span className="font-semibold">{planInfo.name}</span>
          </div>
          
          {subscription && subscription.plan_type !== 'free' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Billing Period:</span>
                <span className="capitalize">{subscription.billing_period}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount Paid:</span>
                <span className="font-semibold">{subscription.pi_amount} π</span>
              </div>
              
              {daysLeft !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {isExpired ? 'Expired' : 'Expires in'}:
                  </span>
                  <span className={`font-semibold ${
                    isExpired ? 'text-red-600' : 
                    isExpiringSoon ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {isExpired ? 'Expired' : `${daysLeft} days`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan Features */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Plan Features:</h4>
            {planInfo.priceMonthly && (
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-600">{planInfo.priceMonthly}/month</div>
                <div className="text-xs text-muted-foreground">{planInfo.priceYearly}/year</div>
              </div>
            )}
          </div>
          <ul className="text-sm space-y-1">
            {planInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          {planInfo.limitedFeatures && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-muted-foreground mb-1">Free plan limitations:</p>
              <ul className="text-xs space-y-1">
                {planInfo.limitedFeatures.map((limitation, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Alerts */}
        {isExpired && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your subscription has expired. Renew now to continue using premium features.
            </AlertDescription>
          </Alert>
        )}

        {isExpiringSoon && !isExpired && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your subscription expires in {daysLeft} days. Renew soon to avoid service interruption.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => navigate('/subscription')}
            variant={subscription?.plan_type === 'free' ? "default" : "outline"}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {subscription?.plan_type === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </Button>
          
          {(isExpired || isExpiringSoon) && subscription?.plan_type !== 'free' && (
            <Button 
              onClick={() => navigate('/subscription')}
              variant="default"
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Renew Now
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {subscription && subscription.plan_type !== 'free' && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <p>Subscription ID: {subscription.id?.slice(0, 8)}...</p>
            <p>Started: {new Date(subscription.start_date).toLocaleDateString()}</p>
            <p>Auto-renew: {subscription.auto_renew ? 'Enabled' : 'Disabled'}</p>
          </div>
        )}
      </CardContent>
    </Card>
      </div>
    </div>
  );
};

export default SubscriptionStatus;