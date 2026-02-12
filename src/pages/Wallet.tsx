import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Gift, ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, TrendingUp, History, Settings, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePi } from "@/contexts/PiContext";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { PI_CONFIG } from '@/config/pi-config';
import { realPiPaymentService } from "@/services/realPiPaymentService";

interface Transaction {
  id: string;
  created_at: string;
  sender_profile: { business_name: string };
  receiver_profile: { business_name: string };
  gift: { name: string; icon: string };
  drop_tokens_spent: number;
  pi_amount?: number;
  isSent: boolean;
}

const Wallet = () => {
  const navigate = useNavigate();
  const { piUser, isAuthenticated, getDROPBalance } = usePi();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [dropTokenBalance, setDropTokenBalance] = useState<string>('0');
  const [piNetworkConnected, setPiNetworkConnected] = useState<boolean>(false);
  const [giftEarnings, setGiftEarnings] = useState(0);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [customStickerAmount, setCustomStickerAmount] = useState("");
  const [walletLoading, setWalletLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "sent" | "received">("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  const earnRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);
  const MIN_STICKER_BUY = 1;
  const MAX_STICKER_BUY = 1_000_000;

  // DROP Token configuration
  const DROP_TOKEN = {
    code: 'DROP',
    colors: {
      primary: '#0ea5e9', // Sky blue
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [piUser]);

  const loadWalletData = async () => {
    try {
      setWalletLoading(true);
      setLoadError(null);
      if (!isAuthenticated || !piUser) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();

      if (!profile) {
        toast.error("Profile not found");
        navigate("/");
        return;
      }

      setProfileId(profile.id);

      // Load legacy wallet balance (for gift transactions)
      const { data: wallet, error: walletSelectError } = await supabase
        .from("user_wallets")
        .select("drop_tokens")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (walletSelectError) {
        console.error("Error loading balance:", walletSelectError);
      }

      if (!wallet) {
        // Auto-create wallet row for this profile to satisfy RLS policies
        const { error: walletCreateError } = await supabase
          .from("user_wallets")
          .upsert({
            profile_id: profile.id,
            drop_tokens: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "profile_id" });
        if (walletCreateError) {
          console.error("Failed to initialize wallet:", walletCreateError);
        }
        setBalance(0);
      } else {
        setBalance(wallet.drop_tokens || 0);
      }

      // Load DROP token balance from Pi Network
      if (getDROPBalance) {
        try {
          const dropBalance = await getDROPBalance();
          setDropTokenBalance(dropBalance?.balance || '0');
          setPiNetworkConnected(true);
        } catch (error) {
          console.error('Failed to load DROP balance:', error);
          setPiNetworkConnected(false);
        }
      }

      // Load gift transactions
      await loadTransactions(profile.id);
      await loadGiftEarnings(profile.id);
      await loadWithdrawals(profile.id);
    } catch (error) {
      console.error("Error loading wallet:", error);
      setLoadError("Failed to load wallet data. Please try again.");
      toast.error("Failed to load wallet data");
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTransactions = async (profileId: string) => {
    try {
      // Load transactions (sent and received)
      const { data: sent } = await supabase
        .from("gift_transactions")
        .select(`
          id,
          created_at,
          drop_tokens_spent,
          pi_amount,
          receiver_profile:profiles!gift_transactions_receiver_profile_id_fkey(business_name),
          sender_profile:profiles!gift_transactions_sender_profile_id_fkey(business_name),
          gift:gifts(name, icon)
        `)
        .eq("sender_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: received } = await supabase
        .from("gift_transactions")
        .select(`
          id,
          created_at,
          drop_tokens_spent,
          pi_amount,
          receiver_profile:profiles!gift_transactions_receiver_profile_id_fkey(business_name),
          sender_profile:profiles!gift_transactions_sender_profile_id_fkey(business_name),
          gift:gifts(name, icon)
        `)
        .eq("receiver_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);

      const allTransactions = [
        ...(sent || []).map((t: any) => ({ ...t, isSent: true })),
        ...(received || []).map((t: any) => ({ ...t, isSent: false })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions as any);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadGiftEarnings = async (profileId: string) => {
    try {
      const { data } = await supabase
        .from("gift_transactions")
        .select("pi_amount, drop_tokens_spent")
        .eq("receiver_profile_id", profileId);

      const total = (data || []).reduce((sum, item: any) => {
        const amount = item.pi_amount ?? item.drop_tokens_spent ?? 0;
        return sum + Number(amount || 0);
      }, 0);

      setGiftEarnings(total);
    } catch (error) {
      console.error("Error loading gift earnings:", error);
    }
  };

  const loadWithdrawals = async (profileId: string) => {
    try {
      const { data } = await supabase
        .from("withdrawals")
        .select("amount, status")
        .eq("profile_id", profileId);

      const total = (data || []).reduce((sum, row: any) => {
        if (row.status === "rejected") return sum;
        return sum + Number(row.amount || 0);
      }, 0);

      setWithdrawalsTotal(total);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    }
  };

  const buyTokens = async (amount: number) => {
    if (!profileId) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < MIN_STICKER_BUY || amount > MAX_STICKER_BUY) {
      toast.error(`Amount must be between ${MIN_STICKER_BUY} and ${MAX_STICKER_BUY} Pi`);
      return;
    }

    try {
      const paymentResult = await realPiPaymentService.processPayment({
        id: `sticker-pack-${amount}-${Date.now()}`,
        name: `Sticker Pack (${amount} Pi)`,
        type: "product",
        price: amount,
        description: `Sticker purchase - ${amount} Pi`,
        metadata: {
          product: "stickers",
          profileId,
          stickerAmount: amount,
        },
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment failed");
      }

      const newBalance = balance + amount;
      const { error } = await supabase
        .from("user_wallets")
        .update({ drop_tokens: newBalance })
        .eq("profile_id", profileId);

      if (error) throw error;

      setBalance(newBalance);
      toast.success(`Purchased ${amount} sticker credits!`);
    } catch (error) {
      console.error("Error buying tokens:", error);
      toast.error("Failed to purchase stickers");
    }
  };

  const availableToWithdraw = Math.max(giftEarnings - withdrawalsTotal, 0);

  const filteredTransactions = useMemo(() => {
    const search = transactionSearch.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (transactionFilter === "sent" && !transaction.isSent) return false;
      if (transactionFilter === "received" && transaction.isSent) return false;
      if (!search) return true;
      const name = transaction.isSent
        ? transaction.receiver_profile.business_name
        : transaction.sender_profile.business_name;
      return (name || "").toLowerCase().includes(search);
    });
  }, [transactions, transactionFilter, transactionSearch]);

  const exportTransactions = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const rows = [
      ["Date", "Type", "Counterparty", "Gift", "Amount (Pi)"],
      ...transactions.map((transaction) => {
        const amount = transaction.pi_amount ?? transaction.drop_tokens_spent;
        const counterparty = transaction.isSent
          ? transaction.receiver_profile.business_name
          : transaction.sender_profile.business_name;
        return [
          new Date(transaction.created_at).toISOString(),
          transaction.isSent ? "Sent" : "Received",
          counterparty,
          transaction.gift?.name || "Gift",
          String(amount ?? 0),
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "droplink-wallet-transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > availableToWithdraw) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    setWithdrawalLoading(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        profile_id: profileId,
        amount,
        status: "pending",
        requested_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted");
      setWithdrawalAmount("");
      await loadWithdrawals(profileId);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to submit withdrawal");
    } finally {
      setWithdrawalLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Wallet" 
        description="Manage your sticker credits and gifts"
        icon={<WalletIcon className="w-6 h-6" />}
      />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-4xl pb-24">
        {loadError && (
          <Card className="mb-4 border border-red-200 bg-red-50">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
              <div className="text-sm text-red-700">{loadError}</div>
              <Button variant="outline" onClick={loadWalletData}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Header Card with Gradient Background */}
        <Card className="mb-6 border-0 shadow-lg" style={{ background: DROP_TOKEN.colors.background }}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground text-2xl">
            <span className="text-foreground">DropLink Wallet</span>
          </CardTitle>
          <p className="text-muted-foreground">Manage your sticker credits and gift transactions</p>
        </CardHeader>
        <CardContent className="text-center text-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pi Network DROP Balance */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-foreground font-medium">Pi Network</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {walletLoading ? "…" : `${parseFloat(dropTokenBalance).toLocaleString()} DROP`}
              </div>
              <div className="flex items-center justify-center gap-2">
                {piNetworkConnected ? (
                  <Badge variant="outline" className="border-border text-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </div>

            {/* Sticker Balance */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-foreground font-medium">Stickers</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {walletLoading ? "…" : balance.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">Sticker Credits</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/80 rounded-lg px-3 py-2 text-slate-700 flex items-center justify-between">
              <span>Gift earnings</span>
              <span className="font-semibold">{walletLoading ? "…" : `${giftEarnings.toFixed(2)} Pi`}</span>
            </div>
            <div className="bg-white/80 rounded-lg px-3 py-2 text-slate-700 flex items-center justify-between">
              <span>Available to withdraw</span>
              <span className="font-semibold">{walletLoading ? "…" : `${availableToWithdraw.toFixed(2)} Pi`}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Wallet Tabs */}
      <Card>
        <Tabs defaultValue="earn" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {/* DROP Wallet tab hidden for now */}
            <TabsTrigger value="earn" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Earn</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* DROP Wallet Tab - Hidden for now */}
          {/* Temporarily disabled DROP wallet feature */}

          {/* Earn Tab */}
          <TabsContent value="earn" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: DROP_TOKEN.colors.primary }} />
                  Earn DROP Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Legacy Platform Earning */}
                <div className="border rounded-lg p-4" ref={earnRef}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Sticker Credits
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Purchase stickers for gifting creators
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button onClick={() => buyTokens(1)} className="flex flex-col h-auto py-4">
                      <span className="text-2xl font-bold">1</span>
                      <span className="text-xs">1 Pi</span>
                    </Button>
                    <Button onClick={() => buyTokens(5)} className="flex flex-col h-auto py-4">
                      <span className="text-2xl font-bold">5</span>
                      <span className="text-xs">5 Pi</span>
                    </Button>
                    <Button onClick={() => buyTokens(10)} className="flex flex-col h-auto py-4">
                      <span className="text-2xl font-bold">10</span>
                      <span className="text-xs">10 Pi</span>
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      min={MIN_STICKER_BUY}
                      max={MAX_STICKER_BUY}
                      step="1"
                      value={customStickerAmount}
                      onChange={(e) => setCustomStickerAmount(e.target.value)}
                      placeholder={`Custom amount (${MIN_STICKER_BUY}-${MAX_STICKER_BUY} Pi)`}
                    />
                    <Button
                      onClick={() => {
                        const amount = Number(customStickerAmount);
                        buyTokens(amount);
                      }}
                    >
                      Buy Custom
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4" ref={withdrawRef}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Gift Earnings
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">Available to withdraw</div>
                    <div className="text-lg font-bold">{availableToWithdraw.toFixed(2)} Pi</div>
                  </div>
                  <form onSubmit={handleWithdraw} className="space-y-3">
                    <Input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      max={availableToWithdraw}
                      placeholder="Enter withdrawal amount"
                    />
                    <Button type="submit" className="w-full" disabled={withdrawalLoading || availableToWithdraw === 0}>
                      {withdrawalLoading ? "Processing..." : "Withdraw Pi"}
                    </Button>
                  </form>
                </div>

                {/* Pi Network DROP Earning */}
                <div className="border rounded-lg p-4" style={{ borderColor: DROP_TOKEN.colors.primary + '50' }}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Pi Network DROP Tokens
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Earn real DROP tokens on Pi Network blockchain
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-lg font-bold" style={{ color: DROP_TOKEN.colors.primary }}>+50 DROP</div>
                      <div className="text-xs text-muted-foreground">Complete Profile</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-lg font-bold" style={{ color: DROP_TOKEN.colors.primary }}>+100 DROP</div>
                      <div className="text-xs text-muted-foreground">Share Bio Page</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-lg font-bold" style={{ color: DROP_TOKEN.colors.primary }}>+200 DROP</div>
                      <div className="text-xs text-muted-foreground">Refer Friends</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-lg font-bold" style={{ color: DROP_TOKEN.colors.primary }}>+25 DROP</div>
                      <div className="text-xs text-muted-foreground">Daily Check-in</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={transactionFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={transactionFilter === "sent" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("sent")}
                    >
                      Sent
                    </Button>
                    <Button
                      variant={transactionFilter === "received" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTransactionFilter("received")}
                    >
                      Received
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      placeholder="Search by name"
                    />
                    <Button variant="outline" onClick={exportTransactions}>
                      Export CSV
                    </Button>
                  </div>
                </div>
                {walletLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Start sending gifts to see your transaction history</p>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => earnRef.current?.scrollIntoView({ behavior: "smooth" })}>
                        Buy stickers
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => {
                      const amount = transaction.pi_amount ?? transaction.drop_tokens_spent;
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {transaction.isSent ? (
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5 text-green-500" />
                            )}
                            <span className="text-2xl">{transaction.gift.icon}</span>
                            <div>
                              <p className="font-medium">
                                {transaction.isSent ? "Sent to" : "Received from"}{" "}
                                {transaction.isSent
                                  ? transaction.receiver_profile.business_name
                                  : transaction.sender_profile.business_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${transaction.isSent ? "text-red-500" : "text-green-500"}`}>
                              {transaction.isSent ? "-" : "+"}
                              {amount}
                            </p>
                            <p className="text-xs text-muted-foreground">Pi</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Wallet Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Account Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm">Pi Network</span>
                        {isAuthenticated ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm">DROP Tokens</span>
                        {piNetworkConnected ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Setup Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Useful Links</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a 
                          href="https://droplink.space/.well-known/pi.toml"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          DROP Token Information (TOML)
                        </a>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a 
                            href={`${PI_CONFIG.ENDPOINTS.PI_ASSET_DISCOVERY}?asset_code=DROP&asset_issuer=GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Pi Explorer
                        </a>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a 
                          href="https://pi.network"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pi Network Official
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
      </div>
      <div className="fixed left-0 right-0 bottom-[76px] sm:bottom-20 z-40 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur rounded-2xl shadow-lg p-2 flex flex-col sm:flex-row gap-2">
          <Button className="w-full" onClick={() => earnRef.current?.scrollIntoView({ behavior: "smooth" })}>
            Buy Stickers
          </Button>
          <Button variant="outline" className="w-full" onClick={() => withdrawRef.current?.scrollIntoView({ behavior: "smooth" })}>
            Withdraw
          </Button>
        </div>
      </div>
      <FooterNav />
    </div>
  );
};

export default Wallet;
