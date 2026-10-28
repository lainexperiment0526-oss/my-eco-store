import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createPiAdPlayer, isPiBrowser, withPiTimeout } from '@/lib/piAds';

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => void | Promise<void>;
      nativeFeaturesList: () => Promise<string[]>;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{
        user: { uid: string; username: string };
        accessToken: string;
      }>;
      createPayment: (
        paymentData: { amount: number; memo: string; metadata: Record<string, any> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: any, payment?: any) => void;
        }
      ) => void;
      Ads: {
        showAd: (adType: 'interstitial' | 'rewarded') => Promise<{ result: string; adId?: string }>;
        requestAd: (adType: 'interstitial' | 'rewarded') => Promise<{ result: string }>;
        isAdReady: (adType: 'interstitial' | 'rewarded') => Promise<{ ready: boolean }>;
      };
    };
  }
}

interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
}

interface PiContextType {
  piUser: PiUser | null;
  isPiReady: boolean;
  isPiAuthenticated: boolean;
  piLoading: boolean;
  authenticateWithPi: () => Promise<PiUser | null>;
  createPiPayment: (amount: number, memo: string, metadata?: Record<string, any>, callbacks?: {
    onPaymentApproved?: () => void;
    onPaymentCompleted?: () => void;
    onPaymentCancelled?: () => void;
    onPaymentError?: (error: any) => void;
  }) => Promise<void>;
  showPiAd: (adType: 'interstitial' | 'rewarded') => Promise<boolean>;
  signOutPi: () => void;
}

const PiContext = createContext<PiContextType | undefined>(undefined);

const PI_SDK_URL = 'https://sdk.minepi.com/pi-sdk.js';
let initializedSdk: Window['Pi'] | null = null;
const initPi = async () => {
  if (!window.Pi) return false;
  if (initializedSdk === window.Pi) return true;
  try {
    await withPiTimeout(Promise.resolve(window.Pi.init({ version: '2.0' })));
    initializedSdk = window.Pi;
    return true;
  } catch {
    console.warn('Pi SDK initialization failed');
    return false;
  }
};

let sdkLoadPromise: Promise<boolean> | null = null;

const loadPiSdk = (): Promise<boolean> => {
  if (initializedSdk && initializedSdk === window.Pi) return Promise.resolve(true);
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<boolean>((resolve) => {
    if (window.Pi) { void initPi().then(resolve); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PI_SDK_URL}"]`);
    const script = existing ?? document.createElement('script');
    const finish = (loaded: boolean) => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      if (!loaded) { script.remove(); resolve(false); return; }
      void initPi().then(resolve);
    };
    const timeout = window.setTimeout(() => finish(false), 10000);
    const poll = window.setInterval(() => { if (window.Pi) finish(true); }, 200);
    if (existing) return;
    script.src = PI_SDK_URL;
    script.async = true;
    script.onload = () => { if (window.Pi) finish(true); };
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  }).then((ok) => {
    if (!ok) sdkLoadPromise = null;
    return ok;
  });

  return sdkLoadPromise;
};

const playPiAd = createPiAdPlayer(async () => {
  const loaded = await loadPiSdk();
  return loaded ? window.Pi : null;
});

export function PiProvider({ children }: { children: ReactNode }) {
  const [piUser, setPiUser] = useState<PiUser | null>(null);
  const [isPiReady, setIsPiReady] = useState(false);
  const [piLoading, setPiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Initialize the native bridge only inside Pi Browser, on every host.
    if (!isPiBrowser()) {
      setPiLoading(false);
      return;
    }

    loadPiSdk().then((ok) => {
      if (cancelled) return;
      setIsPiReady(ok);
      setPiLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const onIncompletePaymentFound = useCallback(async (payment: any) => {
    console.log('Incomplete payment found:', payment);
    // Try to complete it via backend
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(`${baseUrl}/functions/v1/pi-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', paymentId: payment.identifier, txid: payment.transaction?.txid }),
      });
    } catch (err) {
      console.error('Failed to complete payment:', err);
    }
  }, []);

  const authenticateWithPi = useCallback(async (): Promise<PiUser | null> => {
    try {
      setPiLoading(true);
      if (!window.Pi) {
        const ok = await loadPiSdk();
        setIsPiReady(ok);
        if (!ok || !window.Pi) {
          console.warn('Pi SDK not available');
          return null;
        }
      }
      const auth = await window.Pi.authenticate(
        ['payments', 'username'],
        onIncompletePaymentFound
      );
      const user: PiUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken,
      };
      setPiUser(user);
      return user;
    } catch (err) {
      console.error('Pi authentication failed:', err);
      return null;
    } finally {
      setPiLoading(false);
    }
  }, [onIncompletePaymentFound]);

  const createPiPayment = useCallback(async (
    amount: number,
    memo: string,
    metadata?: Record<string, any>,
    callbacks?: {
      onPaymentApproved?: () => void;
      onPaymentCompleted?: () => void;
      onPaymentCancelled?: () => void;
      onPaymentError?: (error: any) => void;
    }
  ): Promise<void> => {
    if (!window.Pi) throw new Error('Pi SDK not available');

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? null;
    const enrichedMetadata = {
      ...(metadata || {}),
      buyer_pi_username: piUser?.username || null,
      buyer_pi_uid: piUser?.uid || null,
    };

    return new Promise<void>((resolve, reject) => {
      window.Pi.createPayment(
        { amount, memo, metadata: enrichedMetadata },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              await fetch(`${baseUrl}/functions/v1/pi-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', paymentId, userId, amount, memo, metadata: enrichedMetadata }),
              });
              callbacks?.onPaymentApproved?.();
            } catch (err) {
              console.error('Approval failed:', err);
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              await fetch(`${baseUrl}/functions/v1/pi-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete', paymentId, txid, userId, amount, memo, metadata: enrichedMetadata }),
              });
              callbacks?.onPaymentCompleted?.();
              resolve();
            } catch (err) {
              console.error('Completion failed:', err);
              reject(err);
            }
          },
          onCancel: (paymentId: string) => {
            console.log('Payment cancelled:', paymentId);
            fetch(`${baseUrl}/functions/v1/pi-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'cancel', paymentId, userId }),
            }).catch(console.error);
            callbacks?.onPaymentCancelled?.();
            reject(new Error('Payment cancelled'));
          },
          onError: (error: any) => {
            console.error('Payment error:', error);
            callbacks?.onPaymentError?.(error);
            reject(error);
          },
        }
      );
    });
  }, [piUser]);

  const showPiAd = useCallback(playPiAd, []);

  const signOutPi = useCallback(() => {
    setPiUser(null);
  }, []);

  return (
    <PiContext.Provider value={{
      piUser,
      isPiReady,
      isPiAuthenticated: !!piUser,
      piLoading,
      authenticateWithPi,
      createPiPayment,
      showPiAd,
      signOutPi,
    }}>
      {children}
    </PiContext.Provider>
  );
}

export function usePiNetwork() {
  const context = useContext(PiContext);
  if (!context) throw new Error('usePiNetwork must be used within PiProvider');
  return context;
}
