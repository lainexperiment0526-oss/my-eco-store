import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Check } from 'lucide-react';
import { MembershipTier } from '@/types/features';

interface MembershipGateProps {
  requiredTier?: MembershipTier;
  hasAccess: boolean;
  children: React.ReactNode;
  onUnlock?: () => void;
}

export const MembershipGate = ({
  requiredTier,
  hasAccess,
  children,
  onUnlock
}: MembershipGateProps) => {
  if (hasAccess) return <>{children}</>;

  return (
    <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6 text-center">
      <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
      <h3 className="font-semibold text-slate-900 dark:text-white">
        {requiredTier ? `${requiredTier.name} Members Only` : 'Unlock Content'}
      </h3>
      {requiredTier && (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {requiredTier.description}
          </p>
          <p className="text-lg font-bold text-sky-600 mt-3">
            {requiredTier.price} {requiredTier.currency}/{requiredTier.billing_period}
          </p>
          {requiredTier.perks.length > 0 && (
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-3 space-y-1">
              {requiredTier.perks.map((perk, i) => (
                <li key={i} className="flex items-center justify-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  {perk}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {onUnlock && (
        <Button
          onClick={onUnlock}
          className="mt-4 w-full bg-sky-500 hover:bg-sky-600 text-white"
        >
          Unlock Now
        </Button>
      )}
    </Card>
  );
};
