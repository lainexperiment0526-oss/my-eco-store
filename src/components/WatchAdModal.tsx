import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePi } from "@/contexts/PiContext";
import { Loader2, Play, Sparkles } from "lucide-react";

interface WatchAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdWatched: () => void;
  featureName?: string;
}

export const WatchAdModal = ({ 
  open, 
  onOpenChange, 
  onAdWatched,
  featureName = "this feature" 
}: WatchAdModalProps) => {
  const { showRewardedAd } = usePi();
  const [loading, setLoading] = useState(false);

  const handleWatchAd = async () => {
    setLoading(true);
    try {
      const success = await showRewardedAd();
      if (success) {
        onAdWatched();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error showing ad:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Watch Ad to Continue
          </DialogTitle>
          <DialogDescription>
            To access {featureName}, please watch a short ad. This helps support the platform and keep it free for everyone!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Watch a 15-30 second ad</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Get instant access</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Support free features</span>
            </div>
          </div>

          <Button 
            onClick={handleWatchAd} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Ad...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Watch Ad Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Or upgrade to Premium/Pro to remove all ads
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
