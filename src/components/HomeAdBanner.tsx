import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useActiveAds } from '@/hooks/useAds';
import { useActiveCampaigns } from '@/hooks/useAdCampaigns';
import { VideoAdOverlay } from './VideoAdOverlay';
import { AppIcon } from './AppIcon';
import { Play } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function HomeAdBanner() {
  const { data: ads } = useActiveAds();
  const { data: campaigns } = useActiveCampaigns();
  const [activeAd, setActiveAd] = useState<any | null>(null);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleClose = useCallback(() => setActiveAd(null), []);
  const openAdDetails = useCallback((ad: any) => {
    if (ad?.app?.id) {
      navigate(`/app/${ad.app.id}?refresh=${Date.now()}`);
    }
  }, [navigate]);

  const getBadgeSrc = useCallback((app?: { name?: string | null; is_verified?: boolean | null; verified_until?: string | null } | null) => {
    const key = (app?.name || '').toLowerCase();
    const badgeMap: Record<string, { light: string; dark: string }> = {
      'openapp': {
        light: 'https://i.ibb.co/BVQYVbyb/verified.png',
        dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
      },
      'flappy pi': {
        light: 'https://i.ibb.co/BVQYVbyb/verified.png',
        dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
      },
      'dropshare': {
        light: 'https://i.ibb.co/BVQYVbyb/verified.png',
        dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
      },
      'drop share': {
        light: 'https://i.ibb.co/BVQYVbyb/verified.png',
        dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
      },
      'droplink': {
        light: 'https://i.ibb.co/BVQYVbyb/verified.png',
        dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
      },
      'mrwain hub': {
        light: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
        dark: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
      },
    };
    const badge = badgeMap[key];
    const isSubscriptionVerified = !!app?.is_verified && !!app?.verified_until && new Date(app.verified_until).getTime() > Date.now();
    if (!badge && !isSubscriptionVerified) return '';
    if (!badge) return 'https://i.ibb.co/BVQYVbyb/verified.png';
    return theme === 'dark' ? badge.dark : badge.light;
  }, [theme]);

  const bannerCampaigns = (campaigns || []).filter((ad) => ad.ad_type === 'banner');
  const combinedCards = [
    ...(ads || []).map((ad) => ({ kind: 'app' as const, ad })),
    ...bannerCampaigns.map((ad) => ({ kind: 'campaign' as const, ad })),
  ];

  if (combinedCards.length === 0) return null;

  const shuffledCards = [...combinedCards].sort(() => Math.random() - 0.5);

  return (
    <>
      {/* Ad cards in home feed */}
      <section className="mb-6">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {shuffledCards.map((item) => {
            if (item.kind === 'campaign') {
              const ad = item.ad;
              return (
                <div
                  key={ad.id}
                  className="flex-shrink-0 w-[85vw] max-w-md rounded-2xl overflow-hidden bg-card shadow-sm relative group cursor-pointer"
                  onClick={() => {
                    const url = (ad.destination_url || '').trim();
                    if (url) {
                      window.location.assign(/^https?:\/\//i.test(url) ? url : `https://${url}`);
                    }
                  }}
                >
                  <div className="aspect-[16/9] bg-muted relative">
                    {ad.media_type === 'video' ? (
                      <video
                        src={ad.media_url}
                        className="h-full w-full object-cover"
                        muted
                        preload="metadata"
                        playsInline
                      />
                    ) : (
                      <img src={ad.media_url} alt={ad.title || ad.name} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                    <span className="absolute top-3 left-3 rounded bg-yellow-500/90 px-2 py-0.5 text-xs font-bold text-black uppercase">
                      Ad
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-medium text-foreground text-sm truncate">{ad.title || ad.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {ad.description || ad.destination_url || 'Sponsored'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = (ad.destination_url || '').trim();
                        if (url) {
                          window.location.assign(/^https?:\/\//i.test(url) ? url : `https://${url}`);
                        }
                      }}
                      className="flex-shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Get
                    </button>
                  </div>
                </div>
              );
            }

            const ad = item.ad;
            return (
              <div
                key={ad.id}
                className="flex-shrink-0 w-[85vw] max-w-md rounded-2xl overflow-hidden bg-card shadow-sm relative group cursor-pointer"
                onClick={() => openAdDetails(ad)}
              >
                {/* Video thumbnail */}
                <div className="aspect-[16/9] bg-muted relative">
                  {ad.video_url && !videoErrors[ad.id] ? (
                    <video
                      src={ad.video_url}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                      poster={ad.app?.logo_url || undefined}
                      onError={() =>
                        setVideoErrors((prev) => ({ ...prev, [ad.id]: true }))
                      }
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <AppIcon
                        src={ad.app?.logo_url}
                        name={ad.app?.name || 'App'}
                        size="lg"
                        className="shadow-md"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                  <span className="absolute top-3 left-3 rounded bg-yellow-500/90 px-2 py-0.5 text-xs font-bold text-black uppercase">
                    Ad
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveAd(ad);
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    aria-label="Play ad video"
                  >
                    <span className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                      <Play className="h-6 w-6 text-black ml-0.5" fill="black" />
                    </span>
                  </button>
                </div>
                
                {/* App info */}
                <div className="flex items-center gap-3 p-3">
                  <AppIcon src={ad.app?.logo_url} name={ad.app?.name || 'App'} size="sm" />
                <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-medium text-foreground text-sm truncate flex items-center gap-2">
                      {ad.app?.name}
                      {getBadgeSrc(ad.app) && (
                        <img src={getBadgeSrc(ad.app)} alt="Verified" className="h-4 w-4" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {ad.title || ad.app?.tagline || ad.app?.category?.name || 'Sponsored'}
                    </p>
                  </div>
                  {ad.app?.id ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAdDetails(ad);
                      }}
                      className="flex-shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Get
                    </button>
                  ) : (
                    <span className="flex-shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground opacity-70">
                      Get
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fullscreen overlay */}
      {activeAd && (
        <VideoAdOverlay ad={activeAd} onClose={handleClose} />
      )}
    </>
  );
}
