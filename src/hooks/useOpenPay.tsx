import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OpenPayMetadata {
  type: 'app_purchase' | 'app_subscription_renewal' | 'app_listing';
  app_id?: string;
  developer_id?: string;
  purchase_type?: 'onetime' | 'monthly';
  draft_id?: string;
  service_id?: string;
}

export function useOpenPay() {
  const [isProcessing, setIsProcessing] = useState(false);

  const createOpenPayPayment = useCallback(
    async (amount: number, memo: string, metadata: OpenPayMetadata) => {
      setIsProcessing(true);
      try {
        // 1. Create a charge on the OpenPay Partner API
        const { data: res, error: err } = await supabase.functions.invoke('openpay-payment', {
          body: {
            action: 'create-charge',
            amount,
            memo,
            metadata,
            successUrl: `${window.location.origin}/purchases`,
            cancelUrl: window.location.href,
          },
        });
        if (err || !res?.success) throw new Error(res?.error || err?.message || 'Charge creation failed');

        const charge = res.charge;
        const chargeId = charge?.id;
        const checkoutUrl = res.checkout_url || charge?.checkout_url || res.paybutton_url;
        if (!chargeId) throw new Error('No charge ID returned by OpenPay');

        // 2. Open the OpenPay checkout in a popup
        if (checkoutUrl) {
          window.open(checkoutUrl, 'openpay_checkout', 'width=480,height=760');
        }

        // 3. Poll for completion (up to ~5 min)
        const start = Date.now();
        while (Date.now() - start < 300_000) {
          await new Promise((r) => setTimeout(r, 4000));
          const { data: vRes } = await supabase.functions.invoke('openpay-payment', {
            body: { action: 'verify', chargeId },
          });
          if (vRes?.status === 'paid') return { success: true, chargeId };
          if (vRes?.status === 'canceled' || vRes?.status === 'cancelled') throw new Error('Payment cancelled');
          if (vRes?.status === 'expired') throw new Error('Payment expired');
        }
        throw new Error('Payment timeout — check History later');
      } catch (e: any) {
        if (e?.message !== 'Payment cancelled') toast.error(e?.message || 'OpenPay payment failed');
        throw e;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { createOpenPayPayment, isProcessing };
}
