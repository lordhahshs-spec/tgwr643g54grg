import React from 'react';
import { Lock, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface DemoLockedOverlayProps {
  title: string;
  description?: string;
  onUnlock: () => void;
  variant?: 'fullscreen' | 'compact' | 'inline';
}

export const DemoLockedOverlay: React.FC<DemoLockedOverlayProps> = ({
  title,
  description = 'Você está visualizando a versão de demonstração da plataforma. Desbloqueie sua licença vitalícia para ter acesso irrestrito a esta ferramenta.',
  onUnlock,
  variant = 'fullscreen',
}) => {
  if (variant === 'compact') {
    return (
      <div className="p-4 rounded-2xl bg-[#080c17]/95 border border-[#00D287]/30 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center flex-shrink-0 text-[#00D287]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] font-black uppercase">
                Demonstração
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <button
          onClick={onUnlock}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all transform active:scale-95 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Desbloquear Acesso Vitalício</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-[6px] p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#080c17] border border-[#00D287]/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-[#00D287]/10 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#00D287]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-[#00D287]/30 border border-[#00D287]/40 flex items-center justify-center text-[#00D287] shadow-lg shadow-[#00D287]/20 mb-4">
          <Lock className="w-8 h-8" />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] text-[11px] font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3" />
          Modo Demonstração
        </span>

        {/* Title & Description */}
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
          {description}
        </p>

        {/* Value Pills */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-left text-[11px] font-semibold text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            <span>Sem mensalidades</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            <span>Acesso vitalício</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            <span>Liberação imediata</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            <span>Garantia 7 dias</span>
          </div>
        </div>

        {/* Unlock Button */}
        <button
          onClick={onUnlock}
          className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-sm tracking-tight shadow-xl shadow-[#00D287]/25 hover:shadow-[#00D287]/40 transition-all flex items-center justify-center gap-2 group transform active:scale-95 cursor-pointer"
        >
          <span>DESBLOQUEAR ACESSO VITALÍCIO</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
          <span>Pagamento único com garantia e suporte total</span>
        </div>
      </div>
    </div>
  );
};
