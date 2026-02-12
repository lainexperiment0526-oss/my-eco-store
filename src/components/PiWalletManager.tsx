import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wallet, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PiWalletManagerProps {
  piWalletAddress?: string;
  donationMessage?: string;
  onSave: (address: string, message: string) => Promise<void>;
}

export const PiWalletManager = ({
  piWalletAddress = "",
  donationMessage = "Send me a coffee ☕",
  onSave,
}: PiWalletManagerProps) => {
  const [address, setAddress] = useState(piWalletAddress);
  const [message, setMessage] = useState(donationMessage);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleSave = async () => {
    if (!address.trim()) {
      toast.error("Please enter your Pi wallet address");
      return;
    }

    setLoading(true);
    try {
      await onSave(address.trim(), message.trim());
      toast.success("Pi wallet saved successfully");
    } catch (error) {
      console.error("Error saving Pi wallet:", error);
      toast.error("Failed to save Pi wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("pi-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "pi-wallet-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <CardTitle>Pi Network Wallet</CardTitle>
          </div>
          <CardDescription>
            Accept Pi cryptocurrency donations from your visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pi-address">Pi Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="pi-address"
                placeholder="Enter your Pi wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {address && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="donation-message">Custom Donation Message</Label>
            <Textarea
              id="donation-message"
              placeholder="Send me a coffee ☕"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This message will be displayed to visitors on your public profile
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            Save Pi Wallet
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pi Wallet QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to send Pi to this address
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                id="pi-qr-code"
                value={address}
                size={256}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm text-center break-all font-mono bg-muted p-2 rounded">
              {address}
            </p>
            <Button onClick={downloadQRCode} variant="outline" className="w-full">
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
