import { ReactNode, useState } from "react";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { WatchAdModal } from "./WatchAdModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface AdGatedFeatureProps {
  children: ReactNode;
  featureName: string;
  trigger?: ReactNode;
}

export const AdGatedFeature = ({ 
  children, 
  featureName,
  trigger 
}: AdGatedFeatureProps) => {
  // UNLOCKED: All features now accessible without watching ads
  // Ad gating temporarily disabled
  return <>{children}</>;
  
  /* ORIGINAL AD GATE - DISABLED
  const { plan, loading } = useActiveSubscription();
  const [showAdModal, setShowAdModal] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  // Premium and Pro users get full access
  if (plan === "premium" || plan === "pro") {
    return <>{children}</>;
  }

  // Free users need to watch ad
  if (plan === "free" && !adWatched) {
    return (
      <>
        {trigger ? (
          <div onClick={() => setShowAdModal(true)}>
            {trigger}
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAdModal(true)}
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            Watch Ad to Access {featureName}
          </Button>
        )}
        
        <WatchAdModal
          open={showAdModal}
          onOpenChange={setShowAdModal}
          onAdWatched={() => setAdWatched(true)}
          featureName={featureName}
        />
      </>
    );
  }

  return <>{children}</>;
  */
};
