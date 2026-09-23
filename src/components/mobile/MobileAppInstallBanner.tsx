import React, { useState } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Download, X, Smartphone, Apple, Sparkles, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export const MobileAppInstallBanner: React.FC = () => {
  const {
    isMobile,
    isAndroid,
    isIOS,
    isStandalone,
    hasDismissedInstall,
    canPromptNativeInstall,
    triggerInstall,
    dismissInstallPrompt
  } = useMobileDetection();

  const [showIosTutorial, setShowIosTutorial] = useState(false);

  // Não exibe se não for mobile, se já estiver instalado em PWA ou se já tiver dispensado/instalado
  if (!isMobile || isStandalone || hasDismissedInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isAndroid && canPromptNativeInstall) {
      const installed = await triggerInstall();
      if (installed) {
        toast.success('Aplicativo CellHub instalado com sucesso na sua tela de início!');
      }
    } else if (isIOS) {
      setShowIosTutorial(true);
    } else {
      // Android browser sem prompt nativo disponível no momento
      toast.info('Para instalar, abra o menu de 3 pontos do navegador e toque em "Instalar aplicativo" ou "Adicionar à tela inicial".');
      dismissInstallPrompt();
    }
  };

  return (
    <>
      {/* Banner Flutuante Inferior Estilo Instagram / App Store */}
      <div className="fixed bottom-16 sm:bottom-4 inset-x-3 sm:inset-x-auto sm:right-4 z-[90] animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#090e1c]/95 border border-[#00D287]/40 shadow-2xl shadow-black/80 rounded-2xl p-3.5 backdrop-blur-xl flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {/* Ícone App Logo */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00D287] via-teal-500 to-emerald-600 p-0.5 flex-shrink-0 shadow-md shadow-[#00D287]/20">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-white text-xs">
                CH
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate">App CellHub Oficial</h4>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#00D287]/20 text-[#00D287]">
                  {isIOS ? 'iOS' : 'Android'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Adicione à tela de início para tela cheia e acesso rápido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#00D287]/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" />
              <span>Baixar</span>
            </button>

            <button
              onClick={dismissInstallPrompt}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Passo a Passo para iOS (Safari / Chrome) */}
      {showIosTutorial && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#090e1c] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => {
                  setShowIosTutorial(false);
                  dismissInstallPrompt();
                }}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Toque no botão Compartilhar</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    Procure pelo ícone <Share className="w-3.5 h-3.5 inline text-blue-400" /> na barra do navegador Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#00D287]/20 text-[#00D287] flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Adicionar à Tela de Início</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    Role as opções para baixo e selecione <PlusSquare className="w-3.5 h-3.5 inline text-[#00D287]" /> "Adicionar à Tela de Início".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Pronto!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    O ícone do CellHub aparecerá na tela do seu iPhone como um aplicativo nativo.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosTutorial(false);
                dismissInstallPrompt();
                toast.success('Instruções salvas! Você também pode acessar esta opção pelo seu perfil.');
              }}
              className="w-full py-2.5 rounded-xl bg-[#00D287] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
