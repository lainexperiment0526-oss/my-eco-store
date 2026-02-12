import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  value, 
  size = 150, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }).catch(err => {
        console.error('QR Code generation failed:', err);
      });
    }
  }, [value, size]);

  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-sm">No wallet</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-sm"
        width={size}
        height={size}
      />
    </div>
  );
};