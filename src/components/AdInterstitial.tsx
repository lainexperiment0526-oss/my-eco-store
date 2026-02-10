import { useState, useEffect, useCallback } from 'react';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { useActiveAds } from '@/hooks/useAds';
import { VideoAdOverlay } from './VideoAdOverlay';

interface AdInterstitialProps {
  onComplete: () => void;
  trigger: 'auth' | 'app-open';
}

export function AdInterstitial({ onComplete, trigger }: AdInterstitialProps) {
  const { showPiAd, isPiReady } = usePiNetwork();
  const { data: appAds } = useActiveAds();
  const [showingAppAd, setShowingAppAd] = useState<any>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) return;
    setAttempted(true);

    // Randomly choose between Pi AdNetwork and app video ads
    const usePiAd = Math.random() > 0.5 && isPiReady;

    if (usePiAd) {
      // Try Pi AdNetwork interstitial
      const adType = Math.random() > 0.5 ? 'interstitial' : 'rewarded';
      showPiAd(adType as 'interstitial' | 'rewarded').then((success) => {
        if (!success && appAds && appAds.length > 0) {
          // Fallback to app video ad
          const randomAd = appAds[Math.floor(Math.random() * appAds.length)];
          setShowingAppAd(randomAd);
        } else {
          onComplete();
        }
      });
    } else if (appAds && appAds.length > 0) {
      // Show random app video ad
      const randomAd = appAds[Math.floor(Math.random() * appAds.length)];
      setShowingAppAd(randomAd);
    } else if (isPiReady) {
      // Try Pi AdNetwork as fallback
      showPiAd('interstitial').then(() => onComplete());
    } else {
      onComplete();
    }
  }, [attempted, isPiReady, appAds]);

  const handleClose = useCallback(() => {
    setShowingAppAd(null);
    onComplete();
  }, [onComplete]);

  if (showingAppAd) {
    return <VideoAdOverlay ad={showingAppAd} onClose={handleClose} />;
  }

  return null;
}
