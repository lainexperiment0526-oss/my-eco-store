import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOpenPayConnect, OPENPAY_PARTNER_PORTAL_URL } from '@/lib/openpay';
import { OpenPayAuthButton } from '@/components/OpenPayAuthButton';

export function OpenPayConnectCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: connection } = useQuery({
    queryKey: ['openpay-connection', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openpay_connections')
        .select('username, full_name, account_number, avatar_url, created_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const disconnect = async () => {
    setBusy(true);
    const { error } = await supabase.from('openpay_connections').delete().eq('user_id', user!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('OpenPay account disconnected');
    qc.invalidateQueries({ queryKey: ['openpay-connection', user?.id] });
  };

  return (
    <div className="rounded-2xl bg-card p-6 border border-border mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">OpenPay account</h2>
          <p className="text-sm text-muted-foreground">
            Connect your OpenPay wallet to receive payouts and verify purchases.
          </p>
        </div>
        {connection ? <Badge variant="secondary">Connected</Badge> : <Badge variant="outline">Not connected</Badge>}
      </div>

      {connection ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {connection.avatar_url && (
            <img src={connection.avatar_url} alt="OpenPay avatar" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {connection.full_name || connection.username || 'OpenPay user'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {connection.username ? `@${connection.username}` : ''} {connection.account_number || ''}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => startOpenPayConnect()}>Reconnect</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={disconnect}>Disconnect</Button>
          </div>
        </div>
      ) : (
        <Button className="mt-4" onClick={() => startOpenPayConnect()}>Connect with OpenPay</Button>
      )}
    </div>
  );
}
