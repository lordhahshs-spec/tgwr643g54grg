import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

export const VendaAndroidTab: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const aurusUrl = "https://aurussmart.com.br/#simulador";

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full bg-[#050811] overflow-hidden">
      {/* Discreet floating reload button on top right */}
      <button
        onClick={handleReload}
        title="Recarregar tela"
        className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-lg bg-black/50 hover:bg-black/80 text-slate-400 hover:text-[#00D287] border border-white/10 backdrop-blur-md transition-all shadow-md"
      >
        <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00D287]' : ''}`} />
      </button>

      {/* Subtle loader while iframe is loading */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050811]">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-3 border-[#00D287]/20 border-t-[#00D287] animate-spin" />
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3 tracking-wide">
            Carregando...
          </p>
        </div>
      )}

      {/* Direct Clean Iframe */}
      <iframe
        key={iframeKey}
        src={aurusUrl}
        title="Venda de Android"
        onLoad={() => setIsLoading(false)}
        className="w-full h-full border-0 bg-white"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-top-navigation-by-user-activation"
      />
    </div>
  );
};
