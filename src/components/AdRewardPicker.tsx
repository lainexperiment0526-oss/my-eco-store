import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePi } from '@/contexts/PiContext';
import { toast } from '@/hooks/use-toast';

const PACKAGES = [
  { id: 'pkg-2-1', ads: 2, drops: 1 },
  { id: 'pkg-3-2', ads: 3, drops: 2 },
  { id: 'pkg-4-5', ads: 4, drops: 5 }
];

export default function AdRewardPicker() {
  const pi = usePi();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

  const handleChoose = async (ads: number, drops: number, id: string) => {
    if (!pi) return;
    setLoadingPkg(id);

    try {
      const remaining = (pi as any).getRemainingAdsToday ? (pi as any).getRemainingAdsToday() : 20; // fallback
      if (ads > remaining) {
        toast({ title: 'Daily Limit', description: `You can only watch ${remaining} more ads today.` });
        setLoadingPkg(null);
        return;
      }

      const ok = await pi.watchAdsAndClaim(ads, drops);
      if (ok) {
        toast({ title: 'Success', description: `You earned ${drops} DROP (x10 tokens per drop unit)` });
      } else {
        toast({ title: 'Not Completed', description: 'Package flow did not complete.' });
      }
    } catch (err) {
      console.error('Package error', err);
      toast({ title: 'Error', description: 'Failed to complete package. Try again.' });
    } finally {
      setLoadingPkg(null);
    }
  };

  const resetLocalAdState = () => {
    try {
      localStorage.removeItem('ad_rewards_granted');
      // clear today's ad counter keys
      const todayPrefix = 'ad_watch_count_';
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(todayPrefix)) localStorage.removeItem(k);
      });
      toast({ title: 'Reset', description: 'Local ad state cleared' });
    } catch (e) {
      console.warn('Reset failed', e);
      toast({ title: 'Error', description: 'Failed to clear local state' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watch Ads → Earn DROP</CardTitle>
        <CardDescription>Choose a package and watch the exact number of ads to claim the reward.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {PACKAGES.map(p => (
            <div key={p.id} className="p-3 border rounded-md text-center">
              <div className="text-lg font-semibold">{p.ads} Ads</div>
              <div className="text-sm text-muted">→</div>
              <div className="text-2xl font-bold">{p.drops} Drop</div>
              <div className="mt-2">
                <Button
                  onClick={() => handleChoose(p.ads, p.drops, p.id)}
                  disabled={!!loadingPkg && loadingPkg !== p.id}
                >
                  {loadingPkg === p.id ? 'Playing...' : 'Watch'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline">10 DROP tokens = 1 Drop unit</Badge>
          <Button variant="ghost" onClick={resetLocalAdState}>Reset Local Ad State</Button>
        </div>
      </CardContent>
    </Card>
  );
}
