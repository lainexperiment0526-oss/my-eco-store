import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, QrCode, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ShareStoreProps {
  username: string;
  businessName: string;
  followersCount?: number;
}

export const ShareStore = ({ username, businessName, followersCount = 0 }: ShareStoreProps) => {
  const [storeUrl, setStoreUrl] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (username) {
      setStoreUrl(`${window.location.origin}/@${username}`);
    }
  }, [username]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Store URL copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} - Digital Store`,
          text: `Check out ${businessName}'s amazing digital store!`,
          url: storeUrl,
        });
      } catch (error) {
        // User cancelled sharing, fallback to copy
        handleCopyUrl();
      }
    } else {
      // Fallback to copy for browsers without Web Share API
      handleCopyUrl();
    }
  };

  const handleVisitStore = () => {
    window.open(storeUrl, "_blank");
  };

  if (!username) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="w-5 h-5" />
          Share Your Store
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Your Store URL
          </label>
          <div className="flex gap-2">
            <Input
              value={storeUrl}
              readOnly
              className="font-mono text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button size="sm" variant="outline" onClick={handleCopyUrl}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm">
              <span className="font-bold">{followersCount}</span> followers
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Share to grow your community!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={handleShare} variant="default" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <QrCode className="w-4 h-4 mr-1" />
                QR
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Store QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg relative">
                  <QRCodeSVG value={storeUrl} size={200} />
                  <img
                    src="https://i.ibb.co/1fdJky1d/Gemini-Generated-Image-ar8t52ar8t52ar8t.png"
                    alt="Droplink Logo"
                    className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-lg"
                    style={{ pointerEvents: 'none', background: 'white' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan to visit {businessName}
                </p>
                <Button onClick={handleCopyUrl} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleVisitStore} variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-1" />
            Visit
          </Button>
        </div>

        {/* Marketing Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">💡 Marketing Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Add this URL to your social media bios</li>
            <li>Share on Twitter, Instagram, TikTok</li>
            <li>Print the QR code on business cards</li>
            <li>Include in email signatures</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};