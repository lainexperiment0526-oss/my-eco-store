import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Download, Wallet, Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface Sale {
  id: string;
  product_id: string;
  product_title: string;
  buyer_name: string;
  amount: string;
  currency: string;
  created_at: string;
  payment_method: "pi" | "droppay";
}

interface Product {
  id: string;
  title: string;
  total_sales: number;
  sale_count: number;
  revenue: number;
}

const SalesEarnings: React.FC = () => {
  const { piUser, isAuthenticated, signIn, loading: piLoading } = usePi();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const handlePiAuth = async () => {
    try {
      await signIn(["username", "payments", "wallet_address"]);
    } catch (error) {
      console.error("Pi authentication failed:", error);
      toast.error("Failed to authenticate with Pi Network");
    }
  };

  useEffect(() => {
    const fetchProfileId = async () => {
      if (!piUser?.username) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();
        
      if (profile) setProfileId(profile.id);
    };
    fetchProfileId();
  }, [piUser]);

  useEffect(() => {
    if (profileId) {
      fetchSalesData();
    }
  }, [profileId]);

  const fetchSalesData = async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch payment transactions (product sales)
      const { data: transactions, error: txError } = await supabase
        .from("payment_transactions" as any)
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      
      if (txError) throw txError;

      // Fetch subscription transactions (subscription sales)
      const { data: subscriptions, error: subError } = await supabase
        .from("subscription_transactions" as any)
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
      
      if (subError) throw subError;

      // Fetch referral code for affiliate earnings
      const { data: referralCode, error: refError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (refError && refError.code !== 'PGRST116') {
        console.warn("Error fetching referral code:", refError);
      }

      // Process sales data
      const allSales: Sale[] = [];
      let totalRevenue = 0;
      const productStats: { [key: string]: Product } = {};

      // Process affiliate earnings
      if (referralCode && referralCode.uses_count > 0 && referralCode.reward_type === 'pi_coins') {
        const affiliateRevenue = referralCode.uses_count * referralCode.reward_value;
        totalRevenue += affiliateRevenue;

        productStats["affiliate"] = {
          id: "affiliate",
          title: "Affiliate Program",
          total_sales: referralCode.uses_count,
          sale_count: referralCode.uses_count,
          revenue: affiliateRevenue,
        };
      }

      // Process product sales
      if (transactions) {
        for (const tx of transactions as any[]) {
          const amount = parseFloat(tx.amount || "0");
          totalRevenue += amount;

          const productId = tx.pi_metadata?.product_id || "unknown";
          const productTitle = tx.pi_metadata?.product_title || "Unknown Product";

          allSales.push({
            id: tx.id,
            product_id: productId,
            product_title: productTitle,
            buyer_name: tx.buyer_name || "Anonymous",
            amount: tx.amount,
            currency: tx.currency || "Pi",
            created_at: tx.created_at,
            payment_method: "droppay",
          });

          // Aggregate product stats
          if (!productStats[productId]) {
            productStats[productId] = {
              id: productId,
              title: productTitle,
              total_sales: 0,
              sale_count: 0,
              revenue: 0,
            };
          }
          productStats[productId].total_sales += 1;
          productStats[productId].sale_count += 1;
          productStats[productId].revenue += amount;
        }
      }

      // Process subscription sales
      if (subscriptions) {
        for (const sub of subscriptions as any[]) {
          const amount = parseFloat(sub.amount || "0");
          totalRevenue += amount;

          allSales.push({
            id: sub.id,
            product_id: "subscription",
            product_title: sub.plan_type || "Subscription",
            buyer_name: sub.buyer_username || "Anonymous",
            amount: sub.amount,
            currency: sub.currency || "Pi",
            created_at: sub.created_at,
            payment_method: "pi",
          });

          // Aggregate subscription stats
          if (!productStats["subscription"]) {
            productStats["subscription"] = {
              id: "subscription",
              title: "Subscription Plans",
              total_sales: 0,
              sale_count: 0,
              revenue: 0,
            };
          }
          productStats["subscription"].sale_count += 1;
          productStats["subscription"].revenue += amount;
        }
      }

      setSales(allSales);
      setProducts(Object.values(productStats));
      setTotalEarnings(totalRevenue);
      setTotalSales(allSales.length);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > totalEarnings) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    setLoading(true);
    try {
      // Create withdrawal record
      const { error } = await supabase.from("withdrawals" as any).insert({
        profile_id: profileId,
        amount: withdrawalAmount,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted! Admin will process it soon.");
      setWithdrawalAmount("");
      // Refresh sales data
      fetchSalesData();
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error("Failed to process withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  // Show authentication required if not authenticated
  if (!isAuthenticated || !piUser) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-center text-slate-900">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600">
              Please sign in with Pi Network to access your sales and earnings dashboard.
            </p>
            <Button 
              onClick={handlePiAuth} 
              disabled={piLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {piLoading ? "Connecting..." : "Sign in with Pi Network"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Sales & Earnings" 
        description="Track your revenue and manage withdrawals"
        icon={<DollarSign />}
      />
      <div className="min-h-screen bg-sky-400 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-24">
        <div className="w-full mx-auto">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Earnings */}
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600">{totalEarnings.toFixed(2)} π</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <DollarSign className="text-green-400" size={28} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <TrendingUp className="text-blue-400" size={28} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Sale */}
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Average Sale</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {totalSales > 0 ? (totalEarnings / totalSales).toFixed(2) : "0"} π
                  </p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Wallet className="text-purple-400" size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card className="mb-8 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Download size={20} />
              Request Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <p className="text-slate-600 text-sm mb-2">Available Balance: {totalEarnings.toFixed(2)} π</p>
                <Input
                  type="number"
                  placeholder="Enter withdrawal amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  max={totalEarnings}
                  className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || totalEarnings === 0}
              >
                {loading ? "Processing..." : "Request Withdrawal"}
              </Button>
            </form>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Products Performance */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Products Performance</h2>
            <div className="h-1 w-16 bg-blue-600 rounded"></div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading performance data...</div>
          ) : products.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No sales data yet. Create products and start selling!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="bg-white border-slate-200 hover:border-blue-400 transition-colors">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 truncate">{product.title}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">Sales</span>
                        <span className="text-slate-900 font-semibold">{product.sale_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">Revenue</span>
                        <span className="text-green-600 font-semibold">{product.revenue.toFixed(2)} π</span>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${totalEarnings > 0 ? Math.min((product.revenue / totalEarnings) * 100, 100) : 0}%` }}
                          ></div>
                        </div>
                        <p className="text-slate-600 text-xs mt-2">
                          {totalEarnings > 0 ? ((product.revenue / totalEarnings) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sales History */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sales History</h2>
            <div className="h-1 w-16 bg-blue-600 rounded"></div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading sales history...</div>
          ) : sales.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No sales yet. Start selling to see transactions here!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="text-left p-4 text-slate-700 font-semibold">Product</th>
                      <th className="text-left p-4 text-slate-700 font-semibold">Buyer</th>
                      <th className="text-left p-4 text-slate-700 font-semibold">Amount</th>
                      <th className="text-left p-4 text-slate-700 font-semibold">Method</th>
                      <th className="text-left p-4 text-slate-700 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, idx) => (
                      <tr key={sale.id} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                        <td className="p-4 text-slate-800">{sale.product_title}</td>
                        <td className="p-4 text-slate-800">{sale.buyer_name}</td>
                        <td className="p-4 text-green-600 font-semibold">{sale.amount} {sale.currency}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sale.payment_method === "pi" 
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {sale.payment_method === "pi" ? "Pi Network" : "DropPay"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 text-xs">
                          {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
      </div>
      <FooterNav />
    </>
  );
};

export default SalesEarnings;
