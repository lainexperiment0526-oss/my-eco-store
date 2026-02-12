import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, CreditCard, Check, Copy, Sparkles, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface GiftCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase?: (planType: string, billingPeriod: string, price: number, recipientEmail?: string, message?: string) => Promise<void>;
  onRedeem?: (code: string) => Promise<void>;
  profileId?: string;
  onPlanRedeemed?: (plan: string, period: string, code: string) => void;
}

interface GiftCard {
  id: string;
  code: string;
  plan_type: string;
  billing_period: string;
  pi_amount: number;
  purchased_by_profile_id?: string;
  redeemed_by_profile_id?: string;
  recipient_email?: string;
  message?: string;
  status: string;
  expires_at?: string;
  redeemed_at?: string;
  created_at: string;
  updated_at: string;
}

const plans = [
  { id: 'basic', name: 'Basic', monthlyPrice: 10, yearlyPrice: 96, color: 'from-blue-400 to-blue-600' },
  { id: 'premium', name: 'Premium', monthlyPrice: 20, yearlyPrice: 192, color: 'from-purple-500 to-pink-600', popular: true },
  { id: 'pro', name: 'Pro', monthlyPrice: 30, yearlyPrice: 288, color: 'from-orange-500 to-red-600' }
];

// Helper function to generate gift card code client-side
const generateGiftCardCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GIFT-${part1}-${part2}`;
};

export function GiftCardModal({ open, onOpenChange, onPurchase, onRedeem, profileId, onPlanRedeemed }: GiftCardModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'redeem'>('buy');
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState<{plan: string, period: string, code: string} | null>(null);
  const navigate = useNavigate();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const price = selectedPlanData ? (billingPeriod === 'yearly' ? selectedPlanData.yearlyPrice : selectedPlanData.monthlyPrice) : 0;

  const handlePurchase = async () => {
    if (!profileId) {
      toast.error('🔒 Please sign in with Pi Network', {
        description: 'You must be signed in to purchase gift cards'
      });
      return;
    }

    setLoading(true);
    try {
      if (onPurchase) {
        await onPurchase(selectedPlan, billingPeriod, price, recipientEmail, message);
      } else {
        // Default purchase logic - generate code client-side
        const code = generateGiftCardCode();

        // Insert gift card using type assertion
        const { error: insertError } = await (supabase
          .from('gift_cards' as any)
          .insert({
            code,
            plan_type: selectedPlan,
            billing_period: billingPeriod,
            pi_amount: price,
            purchased_by_profile_id: profileId,
            recipient_email: recipientEmail || null,
            message: message || null,
            status: 'active'
          }) as any);

        if (insertError) throw insertError;

        setPurchasedCode(code);
        
        // Send email if recipient email provided
        if (recipientEmail) {
          try {
            await supabase.functions.invoke('send-gift-card-email', {
              body: {
                recipientEmail,
                code,
                planType: selectedPlan,
                billingPeriod,
                message: message || '',
                senderProfileId: profileId
              }
            });
            toast.success('Gift card purchased and email sent!');
          } catch (emailError) {
            console.error('Email send error:', emailError);
            toast.success('Gift card purchased! (Email delivery pending)');
          }
        } else {
          toast.success('Gift card purchased successfully!');
        }
        
        // Reset form
        setRecipientEmail('');
        setMessage('');
      }
    } catch (error: any) {
      console.error('Gift card purchase error:', error);
      toast.error(error.message || 'Failed to purchase gift card');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    if (!profileId) {
      toast.error('🔒 Please sign in to redeem gift cards', {
        description: 'You must be signed in to redeem gift cards'
      });
      return;
    }

    setLoading(true);
    try {
      if (onRedeem) {
        await onRedeem(redeemCode.toUpperCase());
      } else {
        // Default redeem logic using type assertion
        const { data: giftCardData, error: fetchError } = await (supabase
          .from('gift_cards' as any)
          .select('*')
          .eq('code', redeemCode.toUpperCase())
          .single() as any);

        if (fetchError) throw new Error('Invalid gift card code');
        
        const giftCard = giftCardData as GiftCard;
        
        if (giftCard.status !== 'active') {
          throw new Error(`This gift card has been ${giftCard.status}`);
        }

        if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
          throw new Error('This gift card has expired');
        }

        // Mark as redeemed
        const { error: updateError } = await (supabase
          .from('gift_cards' as any)
          .update({
            status: 'redeemed',
            redeemed_by_profile_id: profileId,
            redeemed_at: new Date().toISOString()
          })
          .eq('code', redeemCode.toUpperCase()) as any);

        if (updateError) throw updateError;

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

        if (subError) throw subError;

        setShowRedeemSuccess({
          plan: giftCard.plan_type,
          period: giftCard.billing_period,
          code: giftCard.code
        });
        
        // Call onPlanRedeemed if provided
        if (onPlanRedeemed) {
          onPlanRedeemed(giftCard.plan_type, giftCard.billing_period, giftCard.code);
        }
        setRedeemCode('');
        setPurchasedCode(null);
      }
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast.error(error.message || 'Failed to redeem gift card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Redeem Success Modal */}
      {showRedeemSuccess && (
        <Dialog open={true} onOpenChange={() => setShowRedeemSuccess(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">🎉 Gift Card Redeemed! 🎉</DialogTitle>
              <DialogDescription>
                <div className="space-y-4 mt-4">
                  <div className="bg-gradient-to-r from-green-100 to-red-100 p-4 rounded-lg border-2 border-green-300">
                    <div className="text-lg font-semibold mb-3 text-center text-green-800">Your plan has been upgraded!</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Plan:</span>
                        <span className="font-bold capitalize text-green-700">{showRedeemSuccess.plan}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Period:</span>
                        <span className="font-bold capitalize text-green-700">{showRedeemSuccess.period}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Gift Code:</span>
                        <span className="font-mono bg-white px-2 py-1 rounded text-sm">{showRedeemSuccess.code}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-red-500" onClick={() => {
                    setShowRedeemSuccess(null);
                    onOpenChange(false);
                  }}>Done</Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={open && !showRedeemSuccess} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 mx-4">
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-2xl text-slate-900">
            <Gift className="w-6 h-6 text-sky-500" />
            DropLink Gift Cards
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 font-medium">
            Send DropLink access or upgrades with a one-time gift card.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'redeem')} className="relative z-10">
          <TabsList className="grid w-full grid-cols-2 bg-slate-50 border border-slate-200">
            <TabsTrigger value="buy" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white">
              Buy Gift Card
            </TabsTrigger>
            <TabsTrigger value="redeem" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              Redeem Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            {purchasedCode ? (
              <Card className="bg-gradient-to-br from-sky-600 via-sky-500 to-indigo-600 text-white border border-sky-200 shadow-xl relative overflow-hidden">
                <CardContent className="p-6 space-y-4 relative z-10">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Gift className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Gift Card Created
                    </h3>
                    <p className="text-white/80 mb-4 text-base">Share this code with your recipient.</p>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/30 shadow-lg">
                      <p className="text-sm text-white/90 mb-2 font-semibold">Gift Card Code</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="text-2xl font-mono font-bold tracking-wider bg-white/20 px-4 py-2 rounded">{purchasedCode}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20 border border-white/30"
                          onClick={() => copyCode(purchasedCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-white/90 space-y-2 bg-white/10 rounded-lg p-4 border border-white/20">
                      <p className="flex items-center justify-center gap-2">
                        <strong>Plan:</strong> {selectedPlanData?.name} ({billingPeriod})
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <strong>Value:</strong> {price} Pi
                      </p>
                      {recipientEmail && (
                        <p className="flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4" />
                          <strong>Email sent to:</strong> {recipientEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full bg-white text-sky-700 hover:bg-sky-50 font-semibold text-lg"
                    onClick={() => {
                      setPurchasedCode(null);
                      onOpenChange(false);
                    }}
                  >
                    Done
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div>
                  <Label className="mb-3 block text-slate-800 font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4 text-sky-500" />
                    Select Plan
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {plans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-lg border-2',
                          selectedPlan === plan.id ? 'ring-4 ring-sky-400 border-sky-500 shadow-xl' : 'border-slate-200 hover:border-sky-200'
                        )}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <CardContent className="p-4 text-center bg-gradient-to-br from-slate-50 to-sky-50">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <p className="font-semibold text-slate-800">{plan.name}</p>
                          {plan.popular && (
                            <span className="text-xs text-sky-700 font-bold flex items-center justify-center gap-1">
                              <Sparkles className="w-3 h-3" /> Popular
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block text-slate-800 font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4 text-sky-500" />
                    Billing Period
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-lg border-2',
                        billingPeriod === 'monthly' ? 'ring-4 ring-sky-400 border-sky-500 shadow-xl' : 'border-slate-200 hover:border-sky-200'
                      )}
                      onClick={() => setBillingPeriod('monthly')}
                    >
                      <CardContent className="p-4 text-center bg-gradient-to-br from-slate-50 to-sky-50">
                        <p className="font-semibold text-slate-800">Monthly</p>
                        <p className="text-sm text-slate-600">{selectedPlanData?.monthlyPrice} Pi/month</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-lg border-2',
                        billingPeriod === 'yearly' ? 'ring-4 ring-sky-400 border-sky-500 shadow-xl' : 'border-slate-200 hover:border-sky-200'
                      )}
                      onClick={() => setBillingPeriod('yearly')}
                    >
                      <CardContent className="p-4 text-center bg-gradient-to-br from-slate-50 to-sky-50">
                        <p className="font-semibold text-slate-800">Yearly</p>
                        <p className="text-sm text-slate-600">{selectedPlanData?.yearlyPrice} Pi/year</p>
                        <span className="text-xs text-sky-700 font-bold">Save 20%</span>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipientEmail" className="text-slate-800 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Recipient Email (Optional)
                    </Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="friend@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="border-slate-300 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-slate-800 flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Personal Message (Optional)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Add a personal note for the recipient"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border-slate-300 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 via-white to-sky-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-slate-900">{price} Pi</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedPlanData?.name} ({billingPeriod}) subscription gift card
                  </p>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={loading || !profileId}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg shadow"
                >
                  {loading ? 'Processing...' : 'Purchase with Pi'}
                </Button>
                {!profileId && (
                  <p className="text-sm text-center text-red-600 mt-2">
                    Please sign in with Pi Network to purchase gift cards
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="redeem" className="space-y-4 mt-4">
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-12 h-12 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Redeem Your Gift Card</h3>
                  <p className="text-sm text-slate-600">Enter your gift code below</p>
                </div>

                <div>
                  <Label htmlFor="redeemCode" className="text-slate-800 font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4 text-sky-500" />
                    Gift Card Code
                  </Label>
                  <Input
                    id="redeemCode"
                    placeholder="GIFT-XXXX-XXXX"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider border border-slate-300 focus:border-sky-500"
                  />
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={loading || !redeemCode.trim()}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg shadow"
                >
                  {loading ? 'Redeeming...' : 'Redeem Gift Card'}
                </Button>

                <div className="text-center text-sm text-gray-500 bg-white/50 p-3 rounded-lg border border-gray-200">
                  <p className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Your subscription will be activated immediately
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}