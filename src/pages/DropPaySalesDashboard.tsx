import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePi } from "@/contexts/PiContext";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Sale {
  id: string;
  product_id: string;
  amount: string;
  buyer_id: string;
  created_at: string;
}

export default function DropPaySalesDashboard() {
  const { piUser } = usePi();
  const [sales, setSales] = useState<Sale[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!piUser?.username) {
      setLoading(false);
      return;
    }
    
    loadSalesData();
  }, [piUser]);

  const loadSalesData = async () => {
    try {
      // Get current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', piUser?.username)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get products for this profile
      const { data: products } = await supabase
        .from('products')
        .select('id, title, price')
        .eq('profile_id', profile.id);

      // For now, sales are tracked via products - this is a placeholder
      // Real sales would require a dedicated sales table
      const mockSales: Sale[] = [];
      const totalBalance = products?.reduce((sum, p) => sum + parseFloat(p.price || "0"), 0) || 0;
      
      setSales(mockSales);
      setBalance(totalBalance);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            Loading sales data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Sales & Balance" 
        description="View your DropPay sales"
        icon={<TrendingUp />}
      />
      <div className="max-w-2xl mx-auto py-8 px-3 sm:px-4 md:px-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>DropPay Sales & Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-lg font-bold text-primary">Total Value: {balance} Pi</div>
          <div className="mb-2 font-medium">Sales History</div>
          <div className="space-y-2">
            {sales.length === 0 ? (
              <p className="text-muted-foreground">No sales yet. Create products to start selling!</p>
            ) : (
              sales.map(sale => (
                <div key={sale.id} className="flex justify-between border-b pb-1 text-sm">
                  <span>{sale.product_id}</span>
                  <span>{sale.amount} Pi</span>
                  <span>{sale.buyer_id}</span>
                  <span>{sale.created_at?.slice(0, 10)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
