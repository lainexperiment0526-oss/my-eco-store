import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Gift, Loader } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { FooterNav } from "@/components/FooterNav";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isActivating, setIsActivating] = useState(false);
  const [subscriptionActivated, setSubscriptionActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { piUser } = usePi() as any;

  // Check if this is a subscription payment (DropPay or other)
  const paymentId = searchParams.get('payment_id');
  const planType = searchParams.get('plan') || searchParams.get('subscriptionPlan');
  const billingPeriod = searchParams.get('period') || searchParams.get('billingPeriod') || 'monthly';
  const amount = searchParams.get('amount');
  const txId = searchParams.get('txid') || searchParams.get('transaction_id');
  const isSubscription = !!planType;

  // Optionally, get product link from state (for regular payments)
  const productLink = location.state?.productLink || "";
  const [fetchedProductLink, setFetchedProductLink] = useState<string | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTransactionDetails() {
      if (productLink || !paymentId) return;

      try {
        console.log('Fetching transaction details for:', paymentId);
        // Try to fetch from payment_transactions table first
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('pi_metadata')
          .eq('payment_id', paymentId)
          .maybeSingle();

        if (data?.pi_metadata) {
          const meta = data.pi_metadata as any;
          if (meta.download_url) {
            setFetchedProductLink(meta.download_url);
          }
          if (meta.items && Array.isArray(meta.items)) {
            setPurchasedItems(meta.items);
          }
          return;
        }
        
        // If not found, try pi_transactions if it exists and has metadata
        // Note: The schema might differ, checking generic approach
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      }
    }

    if (!isSubscription && paymentId) {
      fetchTransactionDetails();
    }
  }, [paymentId, productLink, isSubscription]);

  const finalProductLink = productLink || fetchedProductLink;

  useEffect(() => {
    const activateSubscription = async () => {
      if (!isSubscription || !planType) {
        return; // Not a subscription payment
      }

      let username = piUser?.username || null;
      let supabaseUserId: string | null = null;
      if (!username) {
        const { data } = await supabase.auth.getSession();
        supabaseUserId = data?.session?.user?.id || null;
      }
      if (!username && !supabaseUserId) {
        setError('User authentication required. Please sign in and try again.');
        setIsActivating(false);
        return;
      }

      setIsActivating(true);

      try {
        const activationRef = paymentId || txId || `manual-${planType}-${billingPeriod}`;
        const activationKey = `subscription_activation_${activationRef}`;
        if (sessionStorage.getItem(activationKey)) {
          setSubscriptionActivated(true);
          setIsActivating(false);
          return;
        }

        console.log('[PAYMENT SUCCESS] Activating subscription:', {
          paymentId,
          planType,
          billingPeriod,
          amount,
          txId,
          username: username || undefined,
          url: window.location.href,
          searchParams: Object.fromEntries(searchParams.entries())
        });

        // Get user profile
        let profileQuery = supabase
          .from('profiles')
          .select('id');
        if (username) {
          profileQuery = profileQuery.eq('username', username);
        } else if (supabaseUserId) {
          profileQuery = profileQuery.eq('user_id', supabaseUserId);
        }
        const { data: profile, error: profileError } = await profileQuery.maybeSingle();

        if (profileError || !profile) {
          setError('User profile not found. Please contact support.');
          setIsActivating(false);
          return;
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (billingPeriod === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Create or update subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            profile_id: profile.id,
            plan_type: planType.toLowerCase(),
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            pi_amount: amount ? parseFloat(amount) : 0,
            billing_period: billingPeriod,
            auto_renew: true,
            payment_method: 'droppay',
            payment_id: paymentId || null,
            transaction_id: txId || null
          }, {
            onConflict: 'profile_id'
          });

        if (subscriptionError) {
          console.error('[PAYMENT SUCCESS] Subscription error:', subscriptionError);
          setError('Failed to activate subscription. Please contact support with payment ID: ' + paymentId);
          setIsActivating(false);
          return;
        }

        console.log('[PAYMENT SUCCESS] Subscription activated successfully:', subscription);
        setSubscriptionActivated(true);
        setIsActivating(false);
        sessionStorage.setItem(activationKey, 'true');
        sessionStorage.setItem('subscription_activated', JSON.stringify({
          plan: planType.toLowerCase(),
          billing: billingPeriod
        }));

        // Show success message
        toast.success(`🎉 ${planType.charAt(0).toUpperCase() + planType.slice(1)} subscription activated!`, {
          description: `Your subscription is now active until ${endDate.toLocaleDateString()}`,
          duration: 6000
        });

      } catch (error: any) {
        console.error('[PAYMENT SUCCESS] Error activating subscription:', error);
        setError('Unexpected error occurred. Please contact support.');
        setIsActivating(false);
      }
    };

    if (isSubscription) {
      activateSubscription();
    }
  }, [paymentId, planType, billingPeriod, amount, txId, piUser, isSubscription]);

  // Handle subscription activation UI
  if (isSubscription && isActivating) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
            <CardTitle className="text-2xl text-blue-900">Activating Subscription</CardTitle>
            <CardDescription>
              Please wait while we activate your {planType} plan...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-600">
            <p>Payment ID: {paymentId}</p>
            <p>This may take a few moments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubscription && error) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">Activation Error</CardTitle>
            <CardDescription className="text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentId && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-700">Payment Details:</p>
                <p className="text-gray-600">Payment ID: {paymentId}</p>
                {txId && <p className="text-gray-600">Transaction ID: {txId}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => navigate('/subscription')}
              >
                View Plans
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700" 
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubscription && subscriptionActivated) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200/20">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-2xl text-green-900">Payment Successful! 🎉</CardTitle>
            <CardDescription>
              Your {planType} subscription has been activated successfully.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Subscription Details</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Plan:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                <p><strong>Billing:</strong> {billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}</p>
                {amount && <p><strong>Amount:</strong> {amount} Pi</p>}
                <p><strong>Status:</strong> Active ✓</p>
              </div>
            </div>

            {paymentId && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-700">Payment Reference:</p>
                <p className="text-gray-600 break-all">{paymentId}</p>
                {txId && (
                  <p className="text-gray-600 break-all">Transaction: {txId}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => navigate('/')}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/subscription')}
              >
                View Subscription Details
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Thank you for subscribing to DropLink!</p>
              <p>Your premium features are now unlocked.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default success page for regular payments (non-subscription)
  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-sky-700 mb-4">Thank you for your purchase!</h1>
        <p className="mb-4">Your payment was successful.</p>
        
        {purchasedItems.length > 0 ? (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-left border-b pb-2">Purchased Items</h3>
            {purchasedItems.map((item: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg text-left">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{item.title || item.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    x{item.quantity || 1}
                  </span>
                </div>
                {item.file_url ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full h-8 text-xs gap-2"
                    onClick={() => window.open(item.file_url, '_blank')}
                  >
                    Download Content
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 italic">No download available</div>
                )}
              </div>
            ))}
          </div>
        ) : finalProductLink ? (
          <>
            <Button className="w-full mb-2" onClick={() => window.open(finalProductLink, '_blank')}>
              Download Product
            </Button>
            <Button variant="secondary" className="w-full mb-2" onClick={() => navigator.clipboard.writeText(finalProductLink)}>
              Copy Download Link
            </Button>
            <div className="text-xs text-gray-500 mb-4">Or check your email for the download link.</div>
          </>
        ) : null}
        
        <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
}
