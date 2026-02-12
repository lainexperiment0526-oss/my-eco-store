import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface VirtualCardProps {
  username: string;
  storeUrl: string;
  frontColor?: string;
  backColor?: string;
  textColor?: string;
  accentColor?: string;
}

export const VirtualCard = ({
  username,
  storeUrl,
  frontColor = "#2bbdee",
  backColor = "#2bbdee",
  textColor = "#000000",
  accentColor = "#fafafa",
}: VirtualCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Inject minimal 3D styles once for flip support
  useEffect(() => {
    const existing = document.getElementById("virtual-card-styles");
    if (existing) return;

    const style = document.createElement("style");
    style.id = "virtual-card-styles";
    style.textContent = `
      .perspective-1000 { perspective: 1000px; -webkit-perspective: 1000px; }
      .transform-style-3d { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
      .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      .rotate-y-180 { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="w-full mx-auto perspective-1000">
      <div
        className={`relative w-full aspect-[1.586/1] transition-transform duration-700 transform-style-3d cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        onClick={() => setIsFlipped((prev) => !prev)}
        style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <Card
          className="absolute inset-0 backface-hidden rounded-2xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: frontColor,
            color: textColor,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-8 h-8" style={{ color: accentColor }} />
              <span className="text-sm font-bold tracking-wider" style={{ color: accentColor }}>
                DROPLINK
              </span>
            </div>
            <div className="text-xs opacity-70" style={{ color: textColor }}>VIRTUAL CARD</div>
          </div>

          {/* QR Code Center */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="bg-white p-3 sm:p-4 rounded-xl shadow-lg relative"
              style={{ backgroundColor: "white" }}
            >
              <QRCodeSVG
                value={storeUrl}
                size={typeof window !== "undefined" && window.innerWidth < 640 ? 100 : 140}
                level="H"
                includeMargin={false}
                fgColor="#000000"
              />
              {/* Logo in center of QR code */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-0.5 sm:p-1">
                <img
                  src="https://i.ibb.co/hJSD8rCj/Gemini-Generated-Image-ar8t52ar8t52ar8t-1.png"
                  alt="Droplink"
                  className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Username Footer */}
          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: textColor }}>MERCHANT</div>
              <div className="text-lg font-bold tracking-wide" style={{ color: textColor }}>@{username}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium mb-1" style={{ color: textColor }}>NETWORK</div>
              <div className="text-sm font-semibold" style={{ color: textColor }}>
                Pi Network
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: accentColor }}
          />
        </Card>

        {/* Back Side */}
        <Card
          className="absolute inset-0 backface-hidden rounded-2xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: backColor,
            color: textColor,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            WebkitTransform: "rotateY(180deg)",
          }}
        >
          {/* Magnetic Strip at top */}
          <div className="absolute top-12 left-0 right-0 h-12 bg-black" />

          {/* Center Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center mt-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: accentColor }}>Droplink</h1>
            <p className="text-sm font-medium mb-4" style={{ color: textColor, opacity: 0.9 }}>droplink.space</p>

            <div className="text-center space-y-1 mb-6">
              <p className="text-lg font-semibold" style={{ color: textColor }}>@{username}</p>
              <p className="text-xs" style={{ color: textColor, opacity: 0.8 }}>Digital Business Card</p>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="relative z-10 text-center space-y-2">
            <p className="text-xs font-medium" style={{ color: textColor, opacity: 0.9 }}>Powered by Pi Network</p>
            <p className="text-[10px] leading-tight px-4" style={{ color: textColor, opacity: 0.75 }}>Scan the QR code on front to visit my digital profile</p>
          </div>

          {/* Signature Strip */}
          <div className="absolute bottom-16 left-6 right-6 h-10 bg-white/20 rounded" />
          {/* Decorative Pattern */}
          <div
            className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-15"
            style={{ backgroundColor: accentColor }}
          />
        </Card>
      </div>

      {/* Flip Instruction */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {isFlipped ? "Tap to view front" : "Tap to view back"}
      </div>
    </div>
  );
};
