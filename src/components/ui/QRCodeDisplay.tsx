import React, { useState } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  value, 
  size = 180,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value)}`;

  return (
    <div 
      className={`relative flex items-center justify-center bg-white rounded-xl overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
          <QrCode className="w-8 h-8 mb-1 text-slate-400" />
          <span className="text-[10px]">QR Code Indisponível</span>
        </div>
      ) : (
        <img
          src={qrUrl}
          alt="QR Code"
          width={size}
          height={size}
          className={`w-full h-full object-contain transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};
