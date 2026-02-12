import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface PaymentRow {
  id?: string;
  transaction_id: string;
  payment_id: string | null;
  amount: number;
  status: string;
  memo: string | null;
  pi_metadata: any;
  confirmed_at: string | null;
  created_at: string | null;
}

const Purchases: React.FC = () => {
  const { piUser } = usePi();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileId = async () => {
      if (!piUser?.username) return;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();
      if (error) {
        setError(error.message);
        return;
      }
      setProfileId(profile?.id || null);
    };
    fetchProfileId();
  }, [piUser]);

  useEffect(() => {
    if (profileId) loadPurchases();
  }, [profileId]);

  const loadPurchases = async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("payment_transactions" as any)
      .select("id, transaction_id, payment_id, amount, status, memo, pi_metadata, confirmed_at, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      toast.error("Failed to load purchases");
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  const renderStatus = (status: string) => (
    <Badge variant={status === "completed" ? "default" : "secondary"}>{status}</Badge>
  );

  const renderDownload = (meta: any) => {
    const url = meta?.download_url || meta?.downloadUrl;
    if (!url) return null;
    return (
      <Button asChild variant="outline" size="sm">
        <a href={url} target="_blank" rel="noreferrer">Download</a>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Purchases" 
        description="View your purchase history"
        icon={<ShoppingCart />}
      />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Your Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {!piUser?.username && (
            <p className="text-sm text-muted-foreground">Sign in to view your purchases.</p>
          )}
          {piUser?.username && loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {piUser?.username && !loading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Amount (PI)</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Purchased</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const meta = row.pi_metadata || {};
                    const productTitle = meta.product_title || meta.productTitle || meta.description || "Product";
                    const purchasedAt = row.confirmed_at || row.created_at;
                    return (
                      <tr key={row.transaction_id} className="border-b last:border-none">
                        <td className="py-2 pr-4">{productTitle}</td>
                        <td className="py-2 pr-4">{row.amount ?? "-"}</td>
                        <td className="py-2 pr-4">{renderStatus(row.status)}</td>
                        <td className="py-2 pr-4">{purchasedAt ? new Date(purchasedAt).toLocaleString() : ""}</td>
                        <td className="py-2 pr-4 flex items-center gap-2">
                          {renderDownload(meta)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      <FooterNav />
    </div>
  );
};

export default Purchases;
