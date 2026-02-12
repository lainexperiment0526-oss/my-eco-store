import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract details from URL parameters
  const paymentId = searchParams.get('payment_id');
  const planType = searchParams.get('plan') || searchParams.get('subscriptionPlan');
  const billingPeriod = searchParams.get('period') || searchParams.get('billingPeriod') || 'monthly';
  const amount = searchParams.get('amount');
  const reason = searchParams.get('reason') || 'cancelled';

  useEffect(() => {
    // Show notification about cancelled payment
    toast.info('Payment cancelled', {
      description: 'You can retry your subscription purchase at any time.',
      duration: 5000
    });
  }, []);

  const handleRetry = () => {
    navigate('/subscription');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 mx-auto text-orange-600 mb-4" />
          <CardTitle className="text-2xl text-orange-900">Payment Cancelled</CardTitle>
          <CardDescription>
            {planType ? (
              `Your ${planType} subscription payment was ${reason === 'failed' ? 'unsuccessful' : 'cancelled'}.`
            ) : (
              `Your payment was ${reason === 'failed' ? 'unsuccessful' : 'cancelled'}.`
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {planType && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">Payment Details</h3>
              <div className="text-sm text-orange-800 space-y-1">
                <p><strong>Plan:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                <p><strong>Billing:</strong> {billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}</p>
                {amount && <p><strong>Amount:</strong> {amount} Pi</p>}
                <p><strong>Status:</strong> {reason === 'failed' ? 'Failed' : 'Cancelled'}</p>
              </div>
            </div>
          )}

          {paymentId && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-700">Payment Reference:</p>
              <p className="text-gray-600 break-all">{paymentId}</p>
            </div>
          )}

          <div className="space-y-2">
            {planType ? (
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                onClick={handleRetry}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            ) : (
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                onClick={handleGoHome}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoHome}
            >
              Return to Dashboard
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 space-y-2">
            {reason === 'failed' ? (
              <>
                <p>Payment processing failed.</p>
                <p>Please check your payment method and try again.</p>
              </>
            ) : (
              <>
                <p>No charges were made to your account.</p>
                <p>You can start a new subscription at any time.</p>
              </>
            )}
            
            <div className="pt-2 border-t border-gray-200">
              <p className="font-medium">Need help?</p>
              <p>Contact support@droplink.space</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
