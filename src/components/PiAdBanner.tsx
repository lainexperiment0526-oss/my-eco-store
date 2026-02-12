import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { usePi } from "@/contexts/PiContext";

declare const Pi: any;

export const PiAdBanner = () => {
  const { showInterstitialAd } = usePi();
  const [dismissed, setDismissed] = useState(false);
  const [adShown, setAdShown] = useState(false);

  useEffect(() => {
    // Always show interstitial ad periodically
    if (!adShown) {
      const timer = setTimeout(() => {
        showInterstitialAd();
        setAdShown(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [adShown, showInterstitialAd]);

  useEffect(() => {
    if (typeof Pi !== "undefined" && Pi.ad) {
      Pi.ad.showBannerAd({
        position: "bottom", // Position the ad at the bottom of the screen
        onAdDismissed: () => {
          console.log("Ad dismissed");
        },
        onAdError: (error: any) => {
          console.error("Ad error:", error);
        },
      });
    } else {
      console.warn(
        "Pi Ad Network is not available. Ensure you are in the Pi Browser."
      );
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <Card className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">🎉 Enjoying Droplink?</p>
          <p className="text-xs text-muted-foreground">
            This app is supported by Pi Ad Network. All users see this banner (no
            plan restrictions).
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("/subscription", "_self")}
          className="gap-2"
        >
          <ExternalLink className="h-3 w-3" />
          Upgrade Now
        </Button>
      </div>
    </Card>
  );
};
