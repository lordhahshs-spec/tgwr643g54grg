import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface DemoLockedOverlayProps {
  title: string;
  description?: string;
  onUnlock: () => void;
  variant?: 'fullscreen' | 'compact' | 'inline';
}

export const DemoLockedOverlay: React.FC<DemoLockedOverlayProps> = ({
  title,
  description = 'Recurso exclusivo para lojistas credenciados com plano vitalício.',
  onUnlock,
  variant = 'fullscreen',
}) => {
  if (variant === 'compact') {
    return (
      <div className="p-3.5 rounded-2xl bg-[#080c17]/95 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{title}</h4>
            <p className="text-[11px] text-slate-400">{description}</p>
          </div>
        </div>

        <button
          onClick={onUnlock}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Desbloquear Acesso</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-[4px] p-4">
      <div className="max-w-sm w-full bg-[#080c17] border border-white/10 rounded-2xl p-6 text-center shadow-2xl space-y-3">
        {/* Lock Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>

        {/* Action */}
        <button
          onClick={onUnlock}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs tracking-tight shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95"
        >
          <span>DESBLOQUEAR ACESSO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
