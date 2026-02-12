import React, { useEffect } from "react";

// Pi AdNetwork Banner Integration
const PiAdsBanner: React.FC = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && window.Pi.Ads) {
      try {
        // Use the Pi Ads API if available - check for showAd method
        if (window.Pi.Ads.showAd) {
          window.Pi.Ads.showAd("interstitial").catch((err: any) => {
            console.log('Pi Ads show failed:', err);
          });
        }
      } catch (err) {
        console.log('Pi Ads not available:', err);
      }
    }
  }, []);

  return (
    <div id="pi-ad-banner" style={{ width: "100%", minHeight: 60, textAlign: "center" }}>
      {/* Pi AdNetwork banner will be injected here by the Pi SDK */}
    </div>
  );
};

export default PiAdsBanner;
