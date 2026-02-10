import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Info } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { App, Category } from '@/types/app';
import { Link, useNavigate } from 'react-router-dom';

interface AdData {
  id: string;
  video_url: string;
  title: string | null;
  description: string | null;
  skip_after_seconds: number;
  duration_seconds: number | null;
  app: App & { category?: Category };
}

interface VideoAdOverlayProps {
  ad: AdData;
  onClose: () => void;
}

export function VideoAdOverlay({ ad, onClose }: VideoAdOverlayProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(ad.skip_after_seconds || 5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const hasSeen = localStorage.getItem('openapp_ad_disclaimer_seen');
    if (!hasSeen) {
      setShowDisclaimer(true);
      localStorage.setItem('openapp_ad_disclaimer_seen', 'true');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Video */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          src={ad.video_url}
          autoPlay
          playsInline
          muted={isMuted}
          loop
          className="h-full w-full object-contain"
          onEnded={onClose}
        />

        {/* Skip / Countdown button */}
        <div className="absolute top-4 right-4">
          {canSkip ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-4 py-2 text-white text-sm font-medium hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
              Skip Ad
            </button>
          ) : (
            <div className="rounded-full bg-black/60 backdrop-blur px-4 py-2 text-white text-sm font-medium">
              Skip in {countdown}s
            </div>
          )}
        </div>

        {/* Ad label */}
        <div className="absolute top-4 left-4">
          <span className="rounded bg-yellow-500/90 px-2 py-0.5 text-xs font-bold text-black uppercase">
            Ad
          </span>
        </div>

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="absolute bottom-28 left-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 py-2 text-white text-xs font-medium hover:bg-black/80 transition-colors"
          aria-label={isMuted ? 'Unmute ad' : 'Mute ad'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {isMuted ? 'Muted' : 'Sound On'}
        </button>
      </div>

      {/* Floating app card */}
      <div className="absolute bottom-4 left-4 right-4 z-[110]">
        <div
          className="rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 px-4 py-3 flex items-center gap-3"
          role="button"
          tabIndex={0}
          onClick={() => {
            onClose();
            navigate(`/app/${ad.app.id}`);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
              navigate(`/app/${ad.app.id}`);
            }
          }}
        >
          <span className="flex-shrink-0">
            <AppIcon src={ad.app.logo_url} name={ad.app.name} size="sm" />
          </span>
          <span className="flex-1 min-w-0">
            <p className="text-xs text-white/60">OpenApp &middot; Sponsored</p>
            <h4 className="text-white font-medium text-sm truncate">{ad.app.name}</h4>
            <p className="text-xs text-white/60 truncate">{ad.app.category?.name || 'App'}</p>
          </span>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
          >
            <Info className="h-3.5 w-3.5" />
            About
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate(`/app/${ad.app.id}`);
            }}
            className="flex-shrink-0 rounded-full bg-blue-500 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            View
          </button>
          {ad.app.has_in_app_purchases && (
            <span className="text-[10px] text-white/40 absolute -bottom-5 right-4">In-App Purchases</span>
          )}
        </div>
      </div>

      {showDisclaimer && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 text-left shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">OpenApp Ad Disclaimer</h3>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close disclaimer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                This advertisement is provided by a third-party developer. OpenApp does not
                endorse, sponsor, or warrant any external application, offer, or content.
              </p>
              <p>
                Selecting the ad will open the app details page so you can review information
                before choosing to install, access, or transact with the service.
              </p>
              <p>
                You may dismiss the ad at any time using the Skip button when it becomes available.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
