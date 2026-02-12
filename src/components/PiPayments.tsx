
// Utility functions must be inside the component after state/hooks
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Pi, 
  Wallet, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  QrCode,
  History,
  DollarSign,
  ShoppingCart,
  Gift,
  Users,
  Link,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Check,
  ExternalLink
} from 'lucide-react';
import { usePi } from '@/contexts/PiContext';
import { toast } from 'sonner';
import { PI_CONFIG } from '@/config/pi-config';
import { SUBSCRIPTION_PLANS, getPlanPrice } from '@/config/subscription-plans';
import { supabase } from '@/integrations/supabase/client';
import { syncPaymentLinksToDatabase, loadPaymentLinksFromDatabase } from '@/lib/database-sync';
import { MerchantConfigModal } from '@/components/MerchantConfigModal';

interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  type: 'product' | 'donation' | 'tip' | 'subscription' | 'group';
  url: string;
  created: Date | string;
  active: boolean;
  totalReceived: number;
  transactionCount: number;
  memo?: string;
  productInfo?: {
    name: string;
    description: string;
    downloadUrl?: string;
    accessUrl?: string;
  };
}

interface Transaction {
  id: string;
  hash: string;
  amount: number;
  from: string;
  to: string;
  memo: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  fee: number;
}

interface Balance {
  available: number;
  pending: number;
  total: number;
  lastUpdated: Date;
}

const PiPayments: React.FC = () => {
    // Utility: Get icon for payment type
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'product': return <ShoppingCart className="w-4 h-4" />;
        case 'donation': return <Gift className="w-4 h-4" />;
        case 'tip': return <DollarSign className="w-4 h-4" />;
        case 'subscription': return <CreditCard className="w-4 h-4" />;
        case 'group': return <Users className="w-4 h-4" />;
        default: return <Pi className="w-4 h-4" />;
      }
    };

    // Utility: Format Pi amount
    const formatPiAmount = (amount: number) => `π ${amount.toFixed(2)}`;

    // Utility: Copy payment link to clipboard
    const copyPaymentLink = (link: PaymentLink) => {
      const correctUrl = `${window.location.origin}/pay/${link.id}`;
      navigator.clipboard.writeText(correctUrl);
      toast.success('Payment link copied to clipboard!', {
        description: `Link: /pay/${link.id}`
      });
    };

    // Utility: Toggle payment link status (active/inactive)
    const toggleLinkStatus = (linkId: string) => {
      const updatedLinks = paymentLinks.map(link =>
        link.id === linkId ? { ...link, active: !link.active } : link
      );
      savePaymentLinks(updatedLinks);
    };

    // Utility: Load wallet data (stub)
    const loadWalletData = () => {
      // TODO: Implement wallet data loading logic
      toast.info('Wallet data refresh not implemented.');
    };

    // Utility: Fetch transaction history (stub)
    const fetchTransactionHistory = (address: string) => {
      // TODO: Implement transaction history fetch logic
      toast.info('Transaction history fetch not implemented.');
    };
  const { isAuthenticated, createPayment, piUser, getCurrentWalletAddress, signIn } = usePi();
  const [showPiAuthModal, setShowPiAuthModal] = useState(false);
  const [isPiAuthLoading, setIsPiAuthLoading] = useState(false);
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);

  // On mount, get Supabase user email if available
  useEffect(() => {
    (async () => {
      try {
        // Supabase v2: getUser returns { data: { user } }
        const { data } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
        setSupabaseEmail(data?.user?.email ?? null);
      } catch {
        setSupabaseEmail(null);
      }
    })();
  }, []);
  
  // Payment Creation State
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [paymentType, setPaymentType] = useState<'product' | 'donation' | 'tip' | 'subscription' | 'group'>('product');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'pro'>('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment Links State
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  
  // Wallet State
  const [balance, setBalance] = useState<Balance>({ available: 0, pending: 0, total: 0, lastUpdated: new Date() });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  // Loading States
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pi Network payment scope creation

  const loadPaymentLinks = () => {
    // Load from localStorage for now (could be from backend)
    const stored = localStorage.getItem(`paymentLinks_${piUser?.uid}`);
    if (stored) {
      setPaymentLinks(JSON.parse(stored));
    }
  };

  const savePaymentLinks = (links: PaymentLink[]) => {
    // Save with user-specific key
    localStorage.setItem(`paymentLinks_${piUser?.uid}`, JSON.stringify(links));
    
    // Also save globally for public access
    const globalLinks = JSON.parse(localStorage.getItem('all_payment_links') || '{}');
    if (piUser?.uid) {
      globalLinks[piUser.uid] = links;
      localStorage.setItem('all_payment_links', JSON.stringify(globalLinks));
    }
    
    setPaymentLinks(links);
  };

  const createPaymentLink = async () => {
    // For subscription, use plan pricing
    let finalAmount: number;
    let finalMemo: string;
    
    if (paymentType === 'subscription') {
      finalAmount = getPlanPrice(selectedPlan, billingPeriod);
      finalMemo = `${SUBSCRIPTION_PLANS[selectedPlan].name} Plan - ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}`;
    } else {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      if (!memo.trim()) {
        toast.error('Please enter a description');
        return;
      }
      finalAmount = parseFloat(amount);
      finalMemo = memo;
    }
    
    // Gmail detection: if user is signed in with Supabase (Gmail) but not Pi, block subscription payment
    const isGmailUser = supabaseEmail && supabaseEmail.endsWith('@gmail.com') && !piUser;
    if (paymentType === 'subscription' && isGmailUser) {
      setShowPiAuthModal(true);
      return;
    }
    
    // For subscription payments, require Pi authentication
    if (paymentType === 'subscription' && !isAuthenticated) {
      toast.error('Pi authentication required for subscription payments');
      return;
    }
    
    setIsProcessing(true);
    try {
      const linkId = `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/pay/${linkId}`;
      
      // Prepare metadata for subscription payments
      const metadata: Record<string, unknown> = {
        linkId,
        type: paymentType,
        timestamp: new Date().toISOString(),
      };
      
      // Add subscription-specific metadata
      if (paymentType === 'subscription' && piUser?.uid) {
        metadata.subscriptionPlan = selectedPlan;
        metadata.billingPeriod = billingPeriod;
        metadata.profileId = piUser.uid;
      }
      
      // Create payment via Pi SDK (this will trigger Pi auth flow if needed)
      const paymentId = await createPayment(finalAmount, finalMemo, metadata);
      
      if (!paymentId) {
        toast.error('Payment creation cancelled or failed');
        setIsProcessing(false);
        return;
      }
      
      // Create the payment link record
      const newLink: PaymentLink = {
        id: linkId,
        amount: finalAmount,
        description: finalMemo,
        type: paymentType,
        url: paymentUrl,
        created: new Date(),
        active: true,
        totalReceived: 0,
        transactionCount: 0,
        memo: finalMemo,
      };
      
      // Save the payment link
      const updatedLinks = [...paymentLinks, newLink];
      savePaymentLinks(updatedLinks);
      
      // For subscription payments, redirect to checkout page
      if (paymentType === 'subscription') {
        window.location.href = `/pay/${linkId}?mode=checkout&paymentId=${paymentId}`;
      } else {
        // Reset form for other payment types
        setAmount('');
        setMemo('');
        setSelectedLink(newLink);
        toast.success('Payment link created successfully!', {
          description: `Link: /pay/${linkId}`
        });
      }
    } catch (error: unknown) {
      console.error('Failed to create payment link:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('not authenticated')) {
        toast.error('Please authenticate with Pi Network first');
      } else if (errorMessage?.includes('Sandbox mode')) {
        toast.error('Sandbox mode is not allowed for real payments');
      } else {
        toast.error(errorMessage || 'Failed to create payment link');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Pi Auth Modal for Gmail users
  const handlePiAuth = async () => {
    setIsPiAuthLoading(true);
    try {
      await signIn(['username', 'payments', 'wallet_address']);
      setShowPiAuthModal(false);
      toast.success('Pi authentication complete! You can now continue payment.');
    } catch (error) {
      toast.error('Pi authentication failed.');
    } finally {
      setIsPiAuthLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pi Auth Modal for Gmail users */}
      {showPiAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2 text-center">Pi Authentication Required</h2>
            <p className="mb-4 text-center text-gray-700">To purchase a subscription, you must authenticate with Pi Network. Please continue with Pi authentication to proceed with payment.</p>
            <Button onClick={handlePiAuth} disabled={isPiAuthLoading} className="w-full mb-2">
              {isPiAuthLoading ? 'Connecting to Pi Network...' : 'Continue with Pi Auth'}
            </Button>
            <Button variant="outline" onClick={() => setShowPiAuthModal(false)} className="w-full">Cancel</Button>
          </div>
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-sky-500" />
              Pi Payments - DropPay
              <Badge className="bg-sky-500">{PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'}</Badge>
            </CardTitle>
            <CardDescription>
              Complete payment solution for Pi Network {PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'} - Create checkout links, track payments, and manage your Pi wallet
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <MerchantConfigModal />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Payment</TabsTrigger>
          <TabsTrigger value="links">Payment Links</TabsTrigger>
          <TabsTrigger value="wallet">Wallet & Balance</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-sky-500" />
                Create Payment Checkout Link
              </CardTitle>
              <CardDescription>
                Generate shareable payment links for your digital products, donations, or services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-lg border border-sky-200">
                <Pi className="h-8 w-8 text-sky-600" />
                <div>
                  <p className="font-medium text-sky-900">Connected to Pi Network {PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'}</p>
                  <p className="text-sm text-sky-600">
                    User: {piUser?.username || 'Anonymous'} | Wallet: {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentType} onValueChange={(value: string) => setPaymentType(value as 'product' | 'donation' | 'tip' | 'subscription' | 'group')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Digital Product</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="tip">Tip/Gratuity</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="group">Paid Group Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === 'subscription' ? (
                    <>
                      <div>
                        <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                        <Select value={selectedPlan} onValueChange={(value: string) => setSelectedPlan(value as 'basic' | 'premium' | 'pro')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic - {formatPiAmount(SUBSCRIPTION_PLANS.basic.price)}/month</SelectItem>
                            <SelectItem value="premium">Premium - {formatPiAmount(SUBSCRIPTION_PLANS.premium.price)}/month</SelectItem>
                            <SelectItem value="pro">Pro - {formatPiAmount(SUBSCRIPTION_PLANS.pro.price)}/month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="billingPeriod">Billing Period</Label>
                        <Select value={billingPeriod} onValueChange={(value: string) => setBillingPeriod(value as 'monthly' | 'yearly')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="amount">Amount (π)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <Label htmlFor="memo">Description *</Label>
                        <Textarea
                          id="memo"
                          placeholder="Enter payment description (e.g., Premium Course Access, Monthly Subscription, etc.)"
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          rows={3}
                          maxLength={200}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be shown to customers during checkout
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Link Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(paymentType)}
                          {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">
                          {paymentType === 'subscription' 
                            ? formatPiAmount(getPlanPrice(selectedPlan, billingPeriod))
                            : formatPiAmount(parseFloat(amount) || 0)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Description:</span>
                        <span className="text-right max-w-xs">
                          {paymentType === 'subscription'
                            ? `${SUBSCRIPTION_PLANS[selectedPlan].name} Plan - ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}`
                            : memo || 'No description'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={createPaymentLink}
                    disabled={isProcessing || (paymentType !== 'subscription' && (!amount || !memo))}
                    className="w-full bg-sky-500 hover:bg-sky-600"
                    size="lg"
                  >
                    <Link className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Creating Link...' : 'Create Payment Link'}
                  </Button>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-3">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { amount: '1.00', memo: 'Premium subscription - 1 month', type: 'subscription' as const },
                    { amount: '5.00', memo: 'Support my content', type: 'tip' as const },
                    { amount: '10.00', memo: 'Digital course access', type: 'product' as const },
                    { amount: '25.00', memo: 'VIP group membership', type: 'group' as const }
                  ].map((template, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-3 px-2"
                      onClick={() => {
                        setAmount(template.amount);
                        setMemo(template.memo);
                        setPaymentType(template.type);
                      }}
                    >
                      <div className="text-center">
                        <div className="font-medium">{formatPiAmount(parseFloat(template.amount))}</div>
                        <div className="text-xs opacity-70">{template.memo}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedLink && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">Payment Link Created Successfully!</p>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border">
                        <code className="flex-1 text-xs">{selectedLink.url}</code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPaymentLink(selectedLink)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-500" />
                Your Payment Links
              </CardTitle>
              <CardDescription>
                Manage and share your payment checkout links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentLinks.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment links created yet</p>
                  <p className="text-sm text-gray-400">Create your first payment link in the "Create Payment" tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(link.type)}
                            <span className="font-medium">{link.description}</span>
                            <Badge variant={link.active ? "default" : "secondary"}>
                              {link.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Created {new Date(link.created).toLocaleDateString()} • {formatPiAmount(link.amount)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <span>Link ID: {link.id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(link.id);
                                toast.success('Link ID copied!');
                              }}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPiAmount(link.totalReceived)}</p>
                          <p className="text-xs text-gray-500">{link.transactionCount} payments</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <code className="flex-1 text-xs">{link.url}</code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPaymentLink(link)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/pay/${link.id}`;
                            window.open(url, '_blank');
                          }}
                          title="Test payment link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleLinkStatus(link.id)}
                        >
                          {link.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-sky-500" />
                  Pi Wallet Balance
                </CardTitle>
                <CardDescription>
                  Your Pi Network {PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'} wallet overview
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadWalletData}
                disabled={loadingBalance}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-6 bg-sky-50 rounded-lg border border-sky-200">
                    <Pi className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-sky-900">{formatPiAmount(balance.available)}</p>
                    <p className="text-sm text-sky-600">Available Balance</p>
                  </div>
                  
                  {balance.pending > 0 && (
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="font-medium text-orange-900">{formatPiAmount(balance.pending)}</p>
                      <p className="text-sm text-orange-600">Pending</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <code className="flex-1 text-sm break-all">{walletAddress || 'Loading...'}</code>
                      {walletAddress && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(walletAddress);
                            toast.success('Wallet address copied!');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Details</Label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Network:</span>
                        <span className="font-medium">{PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Last Updated:</span>
                        <span className="font-medium">{balance.lastUpdated.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-sky-200 bg-sky-50">
                    <TrendingUp className="h-4 w-4 text-sky-600" />
                      <AlertDescription className="text-sky-800">
                      <strong>Pro Tip:</strong> Share your payment links to start receiving Pi payments directly to this wallet. 
                      All transactions are processed on Pi Network {PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'} for maximum security.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-500" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Recent transactions on Pi Network {PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'mainnet'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransactionHistory(walletAddress)}
                disabled={loadingHistory}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading transaction history...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                  <p className="text-sm text-gray-400">Your payment history will appear here once you start transacting</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              tx.status === 'completed' ? 'bg-green-500' : 
                              tx.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">{tx.memo || 'No memo'}</span>
                            <Badge variant="outline" className="text-xs">
                              {tx.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPiAmount(tx.amount)}</p>
                          <p className="text-xs text-gray-500">Fee: {formatPiAmount(tx.fee)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="grid grid-cols-1 gap-1">
                          <div><strong>Hash:</strong> {tx.hash}</div>
                          <div><strong>From:</strong> {tx.from}</div>
                          <div><strong>To:</strong> {tx.to}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PiPayments;