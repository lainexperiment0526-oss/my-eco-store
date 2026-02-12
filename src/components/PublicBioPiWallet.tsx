/**
 * Public Bio Pi Wallet Component
 * Clean Pi Network wallet integration for tips/donations
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Copy, Check, Share2, Info, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublicBioPiWalletProps {
  walletAddress?: string;
  donationMessage?: string;
  theme: {
    primaryColor: string;
    iconStyle: string;
  };
  isPlanExpired?: boolean;
  onPayWithPi: () => void;
}

export const PublicBioPiWallet = ({ 
  walletAddress, 
  donationMessage, 
  theme, 
  isPlanExpired,
  onPayWithPi 
}: PublicBioPiWalletProps) => {
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/pay/${walletAddress}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable wallet link copied!");
  };

  const getIconStyle = (style: string) => {
    switch (style) {
      case "rounded": return "rounded-2xl";
      case "square": return "rounded-lg";
      case "circle": return "rounded-3xl";
      default: return "rounded-2xl";
    }
  };

  if (isPlanExpired) {
    return (
      <div className={cn(
        "w-full p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-400/20",
        getIconStyle(theme.iconStyle)
      )}>
        <div className="text-center space-y-3">
          <Wallet className="w-8 h-8 text-blue-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Pi Tips Locked</h3>
          <p className="text-blue-200/80 text-sm">
            Renew your plan to unlock Pi Network tips and donations
          </p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className={cn(
        "w-full p-6 bg-white/5 border border-white/10",
        getIconStyle(theme.iconStyle)
      )}>
        <div className="text-center space-y-3">
          <Wallet className="w-8 h-8 text-blue-400/50 mx-auto" />
          <h3 className="text-lg font-semibold text-white/70">No Pi Wallet Set</h3>
          <p className="text-white/50 text-sm">
            The profile owner hasn't configured a Pi wallet yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-center gap-2">
        <Wallet className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Receive Pi Tips</h2>
        <button
          onClick={() => setShowInfo(true)}
          className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
        >
          <Info className="w-3 h-3 text-blue-400" />
        </button>
      </div>

      {/* Wallet Card */}
      <div className={cn(
        "w-full p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-400/30 backdrop-blur-sm",
        getIconStyle(theme.iconStyle)
      )}>
        {/* Message */}
        <p className="text-white text-center mb-6 text-lg font-medium">
          {donationMessage || "Send me Pi tips! ☕"}
        </p>

        {/* QR Code and Address */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {/* QR Code */}
          <div className="relative p-3 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG 
              value={walletAddress} 
              size={120} 
              bgColor="#ffffff" 
              fgColor="#1e40af"
              level="M"
            />
            <img
              src="https://i.ibb.co/1fdJky1d/Gemini-Generated-Image-ar8t52ar8t52ar8t.png"
              alt="DropLink"
              className="absolute left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white shadow-lg bg-white"
            />
          </div>

          {/* Address and Buttons */}
          <div className="flex-1 space-y-4 w-full md:w-auto">
            {/* Address Display */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/10">
              <p className="text-white/60 text-xs mb-1">Pi Wallet Address</p>
              <p className="text-white font-mono text-xs break-all">
                {walletAddress}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 border-blue-400/30 text-blue-300 hover:bg-blue-500/20"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 border-blue-400/30 text-blue-300 hover:bg-blue-500/20"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Pay with Pi Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onPayWithPi}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Coins className="w-5 h-5 mr-2" />
            Pay with Pi
          </Button>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              About Pi Tips
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Send Pi cryptocurrency directly to this creator's wallet as a tip or donation.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How to send Pi:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Open your Pi Wallet app</li>
                <li>Scan the QR code or copy the address</li>
                <li>Enter the amount you want to send</li>
                <li>Confirm the transaction</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
