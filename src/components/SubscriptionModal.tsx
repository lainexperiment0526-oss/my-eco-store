import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Crown, Sparkles, Zap, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  icon: typeof Crown;
  gradient: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    gradient: 'from-gray-400 to-gray-600',
    features: [
      '1 social media link only (no custom links)',
      'Basic profile customization',
      'Basic QR code sharing',
      'Public bio page visibility',
      'DropLink watermark displayed',
      'Pi Ad Network banners shown',
      'Limited theme options (3 basic templates)',
      'Community support only',
      'Watch ads to temporarily access premium features',
      'Earn DROP tokens by watching ads',
      'No Pi Wallet for tips (Basic+ required)',
      'No custom links (Premium+ required)'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 10,
    yearlyPrice: 96,
    icon: Zap,
    gradient: 'from-blue-400 to-blue-600',
    features: [
      'Up to 5 custom links (Premium feature partially unlocked)',
      'Up to 3 social media links',
      'Pi Wallet for receiving tips and donations (Basic+ required)',
      'DROP token management and earning',
      'Standard profile customization', 
      'No DropLink watermark',
      'Basic analytics dashboard access',
      'Email support (standard)',
      'Priority for new features',
      'Pi Ad Network still shown (Premium+ for ad-free)'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 20,
    yearlyPrice: 192,
    icon: Crown,
    gradient: 'from-purple-500 to-pink-600',
    popular: true,
    features: [
      'Everything in Basic, plus:',
      'Unlimited custom links (up to 25 with advanced management)',
      'Unlimited social media links (up to 99)',
      'YouTube video integration (Premium+ required)',
      'Advanced theme customization and GIF backgrounds (Premium+ required)',
      'Background music player',
      'Digital products listings (Premium+ required)',
      'Virtual card generation and management',
      'Advanced analytics dashboard',
      'Pi Network wallet integration with QR codes',
      'Priority email support',
      'AI features and logo generation'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 30,
    yearlyPrice: 288,
    icon: TrendingUp,
    gradient: 'from-orange-500 to-red-600',
    features: [
      'Everything in Premium, plus:',
      'Advanced virtual card features and customization',
      'AI-powered analytics insights',
      'Advanced visitor & location-based tracking',
      'A/B testing for links',
      'API access for integrations',
      'White-label solutions',
      '24/7 priority support',
      'Bulk link management',
      'Export analytics data',
      'Pi Network payments integration',
      'Transaction history & management',
      'AI chat widget',
      'Multi-profile management',
      'Ad-free experience'
    ]
  }
];

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  onSubscribe: (planName: string, price: number, isYearly: boolean) => Promise<void>;
  loading?: boolean;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  currentPlan = 'free',
  onSubscribe,
  loading = false
}: SubscriptionModalProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    setSelectedPlan(plan.id);
    try {
      await onSubscribe(plan.name, price, isYearly);
    } finally {
      setSelectedPlan(null);
    }
  };

  const savings = (price: number) => {
    const monthly = price;
    const yearly = price * 12 * 0.8;
    const saved = (price * 12) - yearly;
    return Math.round(saved);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold flex items-center gap-2">
                <Crown className="w-8 h-8" />
                Choose Your Plan
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-2">
                Unlock powerful features and grow your digital presence
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Billing Toggle */}
          <div className="mt-6 flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <Label 
              htmlFor="billing-toggle" 
              className={cn(
                "text-lg cursor-pointer transition-all",
                !isYearly ? "text-white font-bold scale-110" : "text-white/70"
              )}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-yellow-400"
            />
            <Label 
              htmlFor="billing-toggle" 
              className={cn(
                "text-lg cursor-pointer transition-all",
                isYearly ? "text-white font-bold scale-110" : "text-white/70"
              )}
            >
              Yearly
              <Badge className="ml-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                Save 20%
              </Badge>
            </Label>
          </div>

          {/* Mainnet Warning */}
          <div className="mt-4 bg-yellow-400/20 border border-yellow-400 rounded-lg p-3">
            <p className="text-sm font-semibold text-yellow-100">
              ⚠️ Real Pi Network Mainnet Payments
            </p>
            <p className="text-xs text-yellow-200 mt-1">
              All prices are in Pi (π). These are REAL transactions on Pi Network mainnet.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {plans.map((plan, index) => {
                const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                const isCurrent = currentPlan.toLowerCase() === plan.id;
                const isProcessing = selectedPlan === plan.id;
                const Icon = plan.icon;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        "relative h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                        plan.popular && "ring-2 ring-purple-500 shadow-xl",
                        isCurrent && "ring-2 ring-green-500"
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 text-sm font-bold shadow-lg">
                            ⭐ MOST POPULAR
                          </Badge>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute -top-4 right-4 z-10">
                          <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-bold">
                            CURRENT
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-6 flex flex-col h-full">
                        {/* Plan Header */}
                        <div className="text-center mb-6">
                          <div className={cn(
                            "w-16 h-16 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                            plan.gradient
                          )}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                          <div className="space-y-1">
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {price} π
                            </div>
                            <p className="text-sm text-muted-foreground">
                              per {isYearly ? 'year' : 'month'}
                            </p>
                            {isYearly && price > 0 && (
                              <p className="text-xs text-green-600 font-semibold">
                                Save {savings(plan.monthlyPrice)} π/year
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 mb-6 flex-grow">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button */}
                        <Button
                          className={cn(
                            "w-full font-semibold transition-all duration-300",
                            plan.popular && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg",
                            isCurrent && "bg-green-600 hover:bg-green-700",
                            !plan.popular && !isCurrent && "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          )}
                          disabled={isCurrent || loading || isProcessing}
                          onClick={() => handleSubscribe(plan)}
                        >
                          {isProcessing ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Processing...
                            </>
                          ) : isCurrent ? (
                            'Current Plan ✓'
                          ) : price === 0 ? (
                            'Select Free Plan'
                          ) : (
                            `Subscribe with ${price} π`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center space-y-2 text-sm text-muted-foreground">
            <p>✅ All plans include a 14-day Pi-back guarantee</p>
            <p>🔒 Payments are processed securely through Pi Network blockchain</p>
            <p>💬 Questions? Contact <span className="text-purple-600 font-semibold">support@droplink.space</span></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
