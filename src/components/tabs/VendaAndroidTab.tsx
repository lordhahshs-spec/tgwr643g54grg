import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Info,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const VendaAndroidTab: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [iframeErrorNotice, setIframeErrorNotice] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const aurusUrl = "https://aurussmart.com.br/#simulador";

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(aurusUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#070b14]' : ''}`}>
      {/* Top Action Bar */}
      <div className="flex-shrink-0 bg-[#0c1322] border-b border-cyan-500/20 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Venda de Android
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                Simulador Oficial AurusSmart
              </Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Simulador de vendas, parcelamento e análise de crédito para smartphones Android
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Refresh Iframe */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                <span className="hidden sm:inline">Recarregar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-slate-200 border-slate-700">
              Recarregar simulador Aurus
            </TooltipContent>
          </Tooltip>

          {/* Copy URL */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Copiar Link</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-slate-200 border-slate-700">
              Copiar link do simulador para WhatsApp
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Sair Tela Cheia</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Tela Cheia</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-slate-200 border-slate-700">
              {isFullscreen ? 'Restaurar layout' : 'Maximizar simulador'}
            </TooltipContent>
          </Tooltip>

          {/* Direct Open */}
          <a
            href={aurusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
          >
            <span>Abrir no Aurus</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Seller Info Strip */}
      <div className="flex-shrink-0 bg-slate-950/80 border-b border-cyan-900/40 px-4 py-2 flex items-center justify-between text-xs text-slate-300 overflow-x-auto gap-4">
        <div className="flex items-center gap-6 min-w-max">
          <div className="flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Dica de Venda:</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Selecione a marca e modelo do Android</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Defina a entrada do cliente e prazo</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Apresente a parcela calculada pelo Aurus</span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-max pl-4 text-emerald-400 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Conexão Segura SSL</span>
        </div>
      </div>

      {/* Main Frame Container */}
      <div className="relative flex-1 w-full bg-[#070b14] overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070b14]/90 backdrop-blur-md">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-slate-200">
                Carregando Simulador AurusSmart...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Conectando ao servidor oficial aurussmart.com.br/#simulador
              </p>
            </div>
          </div>
        )}

        {/* Fallback Banner shown if iframe might be blocked or slow */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setIframeErrorNotice(!iframeErrorNotice)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] shadow-lg backdrop-blur-sm"
          >
            <Info className="w-3 h-3 text-cyan-400" />
            <span>Precisa de ajuda com o simulador?</span>
          </button>
        </div>

        {iframeErrorNotice && (
          <div className="absolute top-12 right-2 max-w-sm z-30 bg-[#0d1527] border border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-1">Dica de compatibilidade</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Se o simulador não carregar devido a bloqueios de segurança do seu navegador para sites externos em iframes, clique no botão abaixo para abrir diretamente a página de simulação oficial em uma nova guia:
                </p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={aurusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
                  >
                    Abrir Simulador Aurus Oficial
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIframeErrorNotice(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* The Iframe */}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={aurusUrl}
          title="Simulador de Venda de Android AurusSmart"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
};
