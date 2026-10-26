export type PiAdType = 'interstitial' | 'rewarded';

export interface PiAdSdk {
  nativeFeaturesList: () => Promise<string[]>;
  Ads: {
    isAdReady: (type: PiAdType) => Promise<{ ready: boolean }>;
    requestAd: (type: PiAdType) => Promise<{ result: string }>;
    showAd: (type: PiAdType) => Promise<{ result: string; adId?: string }>;
  };
}

// Merely loading the web SDK exposes Pi.Ads in Chrome/Safari too.
export function isPiBrowser(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  return /pibrowser|pi browser|minepi/i.test(userAgent);
}

export function withPiTimeout<T>(operation: Promise<T>, milliseconds = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Pi SDK request timed out')), milliseconds);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

export function createPiAdPlayer(getSdk: () => Promise<PiAdSdk | null>, browserCheck = isPiBrowser) {
  let activeAd: Promise<boolean> | null = null;

  async function play(type: PiAdType): Promise<boolean> {
    try {
      const sdk = await getSdk();
      if (!sdk?.Ads || typeof sdk.nativeFeaturesList !== 'function') return false;
      const features = await withPiTimeout(sdk.nativeFeaturesList());
      if (!features.includes('ad_network')) return false;

      const readiness = await withPiTimeout(sdk.Ads.isAdReady(type));
      if (!readiness.ready) {
        const requested = await withPiTimeout(sdk.Ads.requestAd(type));
        if (requested.result !== 'AD_LOADED') {
          console.info('[Pi Ads] Unavailable:', requested.result);
          return false;
        }
      }

      // Never time out a visible native ad: wait for the user to close it.
      const shown = await sdk.Ads.showAd(type);
      console.info('[Pi Ads] Finished:', shown.result);
      return type === 'interstitial'
        ? shown.result === 'AD_CLOSED'
        : shown.result === 'AD_REWARDED' || shown.result === 'AD_CLOSED';
    } catch {
      console.warn('[Pi Ads] Unavailable; continuing without a Pi ad');
      return false;
    }
  }

  return (type: PiAdType): Promise<boolean> => {
    if (!browserCheck()) return Promise.resolve(false);
    if (activeAd) return activeAd;
    activeAd = play(type).finally(() => { activeAd = null; });
    return activeAd;
  };
}