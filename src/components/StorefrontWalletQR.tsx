import React from "react";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface StorefrontWalletQRProps {
  walletAddress: string;
  tipText?: string;
}

const StorefrontWalletQR: React.FC<StorefrontWalletQRProps> = ({ walletAddress, tipText }) => {
  if (!walletAddress) return null;
  return (
    <div className="flex flex-col items-center my-6">
      <div className="relative w-[140px] h-[140px] mb-2">
        <QRCodeDisplay value={walletAddress} size={140} />
        <img
          src="/droplink-logo.png"
          alt="Droplink Logo"
          className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 shadow-lg border-2 border-white bg-white rounded-lg"
          style={{ pointerEvents: 'none' }}
        />
      </div>
      <div className="text-xs text-gray-800 text-center break-all mb-1">{walletAddress}</div>
      <div className="text-xs text-blue-600 text-center">{tipText || 'Tip Pi or DROP'}</div>
    </div>
  );
};

export default StorefrontWalletQR;
