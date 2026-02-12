import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  username: string;
}

export const QRCodeDialog = ({ open, onOpenChange, url, username }: QRCodeDialogProps) => {
  const downloadQRCode = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    // Get QR code SVG
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    qrImg.onload = async () => {
      // Draw QR code
      ctx.drawImage(qrImg, 0, 0, size, size);

      // Load and draw logo in center
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      logoImg.onload = () => {
        const logoSize = 80; // Logo size in pixels
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // Draw white background for logo
        ctx.fillStyle = 'white';
        ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);

        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        // Download the final image
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${username}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      logoImg.src = 'https://i.ibb.co/1fdJky1d/Gemini-Generated-Image-ar8t52ar8t52ar8t.png';
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Store</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="bg-white p-4 rounded-lg relative w-[272px] h-[272px] flex items-center justify-center">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={256}
              level="H"
              includeMargin={true}
            />
            <img
              src="https://i.ibb.co/1fdJky1d/Gemini-Generated-Image-ar8t52ar8t52ar8t.png"
              alt="Droplink Logo"
              className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 shadow-lg border-2 border-white rounded-lg"
              style={{ pointerEvents: 'none', background: 'white' }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to visit your store
          </p>
          <Button onClick={downloadQRCode} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
