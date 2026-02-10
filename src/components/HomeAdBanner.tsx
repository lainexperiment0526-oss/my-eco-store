import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useActiveAds } from '@/hooks/useAds';
import { VideoAdOverlay } from './VideoAdOverlay';
import { AppIcon } from './AppIcon';
import { Play } from 'lucide-react';

export function HomeAdBanner() {
  const { data: ads } = useActiveAds();
  const [activeAd, setActiveAd] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleClose = useCallback(() => setActiveAd(null), []);

  if (!ads || ads.length === 0) return null;

  return (
    <>
      {/* Ad cards in home feed */}
      <section className="mb-6">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {ads.map((ad: any) => (
            <div
              key={ad.id}
              className="flex-shrink-0 w-[85vw] max-w-md rounded-2xl overflow-hidden bg-card shadow-sm relative group cursor-pointer"
              onClick={() => navigate(ad.app?.id ? `/app/${ad.app.id}?refresh=${Date.now()}` : '#')}
            >
              {/* Video thumbnail */}
              <div className="aspect-[16/9] bg-muted relative">
                <video
                  src={ad.video_url}
                  className="h-full w-full object-cover"
                  muted
                  preload="metadata"
                />
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
                  <h4 className="font-medium text-foreground text-sm truncate">{ad.app?.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {ad.title || ad.app?.tagline || ad.app?.category?.name || 'Sponsored'}
                  </p>
                </div>
                {ad.app?.id ? (
                  <Link
                    to={`/app/${ad.app.id}?refresh=${Date.now()}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Get
                  </Link>
                ) : (
                  <span className="flex-shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground opacity-70">
                    Get
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen overlay */}
      {activeAd && (
        <VideoAdOverlay ad={activeAd} onClose={handleClose} />
      )}
    </>
  );
}
