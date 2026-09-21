import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const VSLPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoDuration] = useState<number>(384); // ~6:24 min
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // Checkout Modal State (Onde você pode colocar o link da sua Kiwify, Hotmart, PerfectPay, etc.)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>(''); // Insira seu link de checkout aqui

  // WhatsApp number & message
  const whatsappNumber = "5511999999999"; // Substitua pelo seu WhatsApp
  const whatsappMessage = encodeURIComponent("Olá! Assisti ao vídeo da VSL da AurusPay e quero liberar meu acesso à plataforma.");

  // Playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= videoDuration) {
            setIsPlaying(false);
            return videoDuration;
          }
          const next = prev + 1;
          setProgress((next / videoDuration) * 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoDuration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const handleCheckoutClick = () => {
    // Redireciona imediatamente para a aba de cadastro/login pós-VSL
    navigate('/login');
  };

  const handleWhatsAppClick = () => {
    window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between selection:bg-[#00D287]/30 selection:text-white px-4 py-8 sm:py-12">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Simple & Direct Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-[40px] font-black text-white tracking-tight leading-snug sm:leading-tight">
          Como Destravar <span className="text-[#00D287]">Vendas de Android Diárias</span> e Multiplicar o Lucro da Sua Loja
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xl">
          Assista ao vídeo abaixo para ver o passo a passo completo do sistema em funcionamento.
        </p>

        {/* VSL Video Container */}
        <div className="w-full mt-6 relative rounded-2xl overflow-hidden bg-[#090f1e] border-2 border-[#00D287]/40 shadow-2xl shadow-[#00D287]/15">
          <div 
            onClick={togglePlay}
            className="relative aspect-video w-full bg-slate-950 cursor-pointer group flex flex-col items-center justify-center select-none"
          >
            {/* Grid Pattern background */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle, #00D287 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-emerald-950/30" />

            {/* Play Button & Overlay */}
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00D287] text-slate-950 flex items-center justify-center shadow-2xl shadow-[#00D287]/50 transition-all duration-300 ${isPlaying ? 'scale-90 opacity-0 group-hover:opacity-100' : 'scale-100 group-hover:scale-110'}`}>
                {isPlaying ? (
                  <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                ) : (
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                )}
              </div>

              {!isPlaying && (
                <div className="mt-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#00D287] bg-black/70 px-3 py-1 rounded-full border border-[#00D287]/30 backdrop-blur-md">
                    Clique para Assistir
                  </span>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    🔊 Duração: 6 minutos • Ligue o som
                  </p>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="absolute top-3 left-3 z-20">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] text-white backdrop-blur-md font-mono">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                {isPlaying ? 'ASSISTINDO' : 'PAUSADO'}
              </span>
            </div>

            {/* Audio Toggle */}
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-lg bg-black/70 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md"
                title={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00D287]" />}
              </button>
            </div>

            {/* Progress Bar at bottom */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 sm:p-4 flex flex-col gap-1.5 z-20">
              <div 
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newPercent = (clickX / rect.width) * 100;
                  setProgress(newPercent);
                  setCurrentTime((newPercent / 100) * videoDuration);
                }}
              >
                <div 
                  className="h-full bg-[#00D287] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-300 font-mono">
                <span>{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
                <span>Full HD 1080p</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Section (Checkout & WhatsApp) */}
        <div className="w-full mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Direct Access CTA Button */}
          <button
            onClick={handleCheckoutClick}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-sm sm:text-base tracking-tight shadow-xl shadow-[#00D287]/25 hover:shadow-[#00D287]/40 transition-all flex items-center justify-center gap-2 group transform active:scale-95"
          >
            <Lock className="w-5 h-5 flex-shrink-0 text-slate-950" />
            <span>LIBERAR MEU ACESSO AGORA</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-emerald-500/30 hover:border-[#00D287] font-bold text-sm sm:text-base tracking-tight transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 fill-current" />
            <span>Chamar no WhatsApp</span>
          </button>
        </div>

        {/* Security & Access Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mt-4">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00D287]" /> Pagamento 100% Seguro
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" /> Liberação Imediata
          </span>
        </div>

        {/* Secondary Direct Access to Platform Preview */}
        <div className="mt-8 pt-4 border-t border-white/5 w-full flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span className="text-xs text-slate-500">Quer conhecer o sistema por dentro antes?</span>
          <button
            onClick={() => navigate('/demo')}
            className="text-xs text-[#00D287] hover:text-[#00B875] font-bold transition-colors underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <span>Acessar Demonstração do Sistema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Checkout Integration Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="max-w-md bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#00D287]" />
              Configurar / Ir para o Checkout
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-1">
              Você pode inserir aqui o link do seu checkout de pagamento (Kiwify, Hotmart, PerfectPay, etc.) para redirecionar o lead diretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                URL do seu Checkout de Pagamento:
              </label>
              <Input
                value={checkoutUrl}
                onChange={(e) => setCheckoutUrl(e.target.value)}
                placeholder="https://pay.kiwify.com.br/exemplo..."
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-9 rounded-xl focus:border-[#00D287]"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={() => {
                  if (checkoutUrl && checkoutUrl.trim() !== '') {
                    window.open(checkoutUrl, '_blank');
                  } else {
                    // Sem link configurado ainda, leva o usuário a testar a plataforma
                    navigate('/app');
                  }
                }}
                className="w-full bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs h-10 rounded-xl"
              >
                {checkoutUrl && checkoutUrl.trim() !== '' ? 'Ir para o Checkout Externo' : 'Acessar Plataforma Agora'}
              </Button>

              <Button
                variant="outline"
                onClick={handleWhatsAppClick}
                className="w-full bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs h-9 rounded-xl"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Fechar Venda pelo WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VSLPage;
