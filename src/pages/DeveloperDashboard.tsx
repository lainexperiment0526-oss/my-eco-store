import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, TrendingUp, DollarSign, ArrowDownToLine } from 'lucide-react';

interface EarningsSummary {
  app_id: string;
  app_name: string;
  total_earned: number;
  developer_share: number;
  platform_fee: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export default function DeveloperDashboard() {
  const { user, loading } = useAuth();
  const { createPiPayment, isPiReady, authenticateWithPi, isPiAuthenticated } = usePiNetwork();
  const [earnings, setEarnings] = useState<EarningsSummary[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);

    try {
      // Load earnings grouped by app
      const { data: earningsData } = await supabase
        .from('developer_earnings')
        .select('app_id, total_amount, developer_share, platform_fee')
        .eq('developer_id', user.id);

      // Load app names
      const appIds = [...new Set(earningsData?.map(e => e.app_id) || [])];
      const { data: appsData } = appIds.length > 0
        ? await supabase.from('apps').select('id, name').in('id', appIds)
        : { data: [] };

      const appNameMap = new Map<string, string>(appsData?.map(a => [a.id, a.name] as [string, string]) || []);

      // Group earnings by app
      const grouped: Record<string, EarningsSummary> = {};
      earningsData?.forEach(e => {
        if (!grouped[e.app_id]) {
          grouped[e.app_id] = {
            app_id: e.app_id,
            app_name: appNameMap.get(e.app_id) || 'Unknown App' as string,
            total_earned: 0,
            developer_share: 0,
            platform_fee: 0,
          };
        }
        grouped[e.app_id].total_earned += Number(e.total_amount);
        grouped[e.app_id].developer_share += Number(e.developer_share);
        grouped[e.app_id].platform_fee += Number(e.platform_fee);
      });

      const summaries = Object.values(grouped);
      setEarnings(summaries);
      setTotalEarned(summaries.reduce((sum, e) => sum + e.developer_share, 0));

      // Load withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalData || []);
      setTotalWithdrawn(
        (withdrawalData || [])
          .filter(w => w.status === 'completed')
          .reduce((sum, w) => sum + Number(w.amount), 0)
      );
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const availableBalance = totalEarned - totalWithdrawn;

  const handleWithdraw = async () => {
    if (!user) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          developer_id: user.id,
          amount,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Withdrawal request submitted!');
      setWithdrawAmount('');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in Required</h1>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">Developer Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-card p-4 border border-border text-center">
            <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-xl font-bold text-foreground">{totalEarned.toFixed(2)} π</p>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border text-center">
            <Wallet className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-xl font-bold text-foreground">{availableBalance.toFixed(2)} π</p>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border text-center">
            <ArrowDownToLine className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Withdrawn</p>
            <p className="text-xl font-bold text-foreground">{totalWithdrawn.toFixed(2)} π</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">Revenue split: 70% Developer / 30% Platform Fee</p>

        {/* Withdraw */}
        <div className="rounded-2xl bg-card p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Withdraw Earnings</h2>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label>Amount (Pi)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={availableBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Max: ${availableBalance.toFixed(2)}`}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleWithdraw} disabled={isWithdrawing || availableBalance <= 0}>
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </div>
        </div>

        {/* Earnings by App */}
        <div className="rounded-2xl bg-card p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Earnings by App</h2>
          {loadingData ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : earnings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No earnings yet. Submit an app and start earning!</p>
          ) : (
            <div className="space-y-3">
              {earnings.map((e) => (
                <div key={e.app_id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{e.app_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {e.total_earned.toFixed(2)} π • Fee: {e.platform_fee.toFixed(2)} π
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{e.developer_share.toFixed(2)} π</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="rounded-2xl bg-card p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Withdrawal History</h2>
          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No withdrawals yet.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{Number(w.amount).toFixed(2)} π</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    w.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    w.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
