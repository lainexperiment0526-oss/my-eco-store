import { useState, useEffect, useCallback } from 'react';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { useActiveAds } from '@/hooks/useAds';
import { useActiveCampaigns } from '@/hooks/useAdCampaigns';
import { VideoAdOverlay } from './VideoAdOverlay';
import { CampaignAdOverlay } from './CampaignAdOverlay';

const isPiBrowser = () => /pibrowser|pi browser/i.test(navigator.userAgent);

interface AdInterstitialProps {
  onComplete: () => void;
  trigger: 'auth' | 'app-open';
}

export function AdInterstitial({ onComplete, trigger }: AdInterstitialProps) {
  const { showPiAd, isPiReady, piLoading } = usePiNetwork();
  const { data: appAds, isLoading: appAdsLoading } = useActiveAds();
  const { data: campaignAds, isLoading: campaignAdsLoading } = useActiveCampaigns();
  const [showingAppAd, setShowingAppAd] = useState<any>(null);
  const [showingCampaignAd, setShowingCampaignAd] = useState<any>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) return;
    if (appAdsLoading || campaignAdsLoading || piLoading) return;
    setAttempted(true);

    const eligibleCampaigns = (campaignAds || []).filter(
      (ad) => ad.ad_type === 'interstitial' || ad.ad_type === 'rewarded'
    );
    const combinedAds = [
      ...(appAds || []).map((ad) => ({ kind: 'app' as const, ad })),
      ...eligibleCampaigns.map((ad) => ({ kind: 'campaign' as const, ad })),
    ];
    const hasInventory = combinedAds.length > 0;

    // Only call Pi Ad Network if user is in Pi Browser
    const canUsePiAds = isPiReady && isPiBrowser();

    const showRandomAd = () => {
      if (!hasInventory) { onComplete(); return; }
      const randomAd = combinedAds[Math.floor(Math.random() * combinedAds.length)];
      if (randomAd.kind === 'app') setShowingAppAd(randomAd.ad);
      else setShowingCampaignAd(randomAd.ad);
    };

    // Helper to play a Pi Ad Network ad (only valid in Pi Browser)
    const playPiAd = (adType: 'interstitial' | 'rewarded' = 'interstitial') =>
      showPiAd(adType).then((success) => {
        if (success) onComplete();
        else if (hasInventory) showRandomAd();
        else onComplete();
      });

    if (trigger === 'app-open') {
      // In Pi Browser: randomly alternate between OpenApp ads and Pi Ad Network
      if (canUsePiAds && hasInventory) {
        if (Math.random() < 0.5) playPiAd('interstitial');
        else showRandomAd();
        return;
      }
      // Only Pi ads available
      if (canUsePiAds) { playPiAd('interstitial'); return; }
      // Only OpenApp inventory (or nothing) — outside Pi Browser, never call Pi ads
      showRandomAd();
      return;
    }

    // Auth flow — same alternation logic
    if (canUsePiAds && hasInventory) {
      if (Math.random() < 0.5) {
        playPiAd(Math.random() > 0.5 ? 'interstitial' : 'rewarded');
      } else {
        showRandomAd();
      }
    } else if (hasInventory) {
      showRandomAd();
    } else if (canUsePiAds) {
      playPiAd(Math.random() > 0.5 ? 'interstitial' : 'rewarded');
    } else {
      onComplete();
    }
  }, [attempted, appAdsLoading, campaignAdsLoading, piLoading, isPiReady, appAds, campaignAds, showPiAd, trigger, onComplete]);

  const handleClose = useCallback(() => {
    setShowingAppAd(null);
    setShowingCampaignAd(null);
    onComplete();
  }, [onComplete]);

  const handleNavigate = useCallback(() => {
    setShowingAppAd(null);
    setShowingCampaignAd(null);
  }, []);

  if (showingAppAd) return <VideoAdOverlay ad={showingAppAd} onClose={handleClose} onNavigate={handleNavigate} />;
  if (showingCampaignAd) return <CampaignAdOverlay ad={showingCampaignAd} onClose={handleClose} />;
  return null;
}
