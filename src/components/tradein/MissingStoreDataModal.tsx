import React from 'react';
import { AlertTriangle, Building2, ArrowRight, Settings, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MissingStoreField {
  key: string;
  label: string;
  description: string;
}

interface MissingStoreDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: MissingStoreField[];
  onOpenStoreSettings: () => void;
  onProceedAnyway: () => void;
}

export const MissingStoreDataModal: React.FC<MissingStoreDataModalProps> = ({
  isOpen,
  onClose,
  missingFields,
  onOpenStoreSettings,
  onProceedAnyway
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 md:backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[92vh] bg-[#0c1322] border border-amber-500/40 rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto overscroll-contain my-auto flex flex-col text-slate-100">
        
        {/* Header Alert */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/50 via-[#161f32] to-[#0c1322] border-b border-amber-500/20 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Atenção ao Termo Legal
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Dados da Loja Incompletos no Recibo
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Para que o Termo de Compra e Declaração de Procedência tenham validade jurídica completa perante a polícia e órgãos fiscais, é importante cadastrar os dados da sua empresa.
            </p>
          </div>
        </div>

        {/* Missing items list */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Informações não cadastradas:
            </span>
            <div className="space-y-2">
              {missingFields.map(f => (
                <div 
                  key={f.key}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-pulse" />
                  <div>
                    <strong className="text-amber-300 font-bold block">{f.label}</strong>
                    <span className="text-slate-400 text-[11px]">{f.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide box: Onde clicar */}
          <div className="p-3.5 rounded-xl bg-[#162035] border border-blue-500/30 space-y-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-400" />
              Onde cadastrar esses dados?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você pode preencher isso clicando em <strong>"Editar Minha Tabela"</strong> (no canto superior) e acessando a aba <strong>"Dados da Loja & Termo Legal"</strong>.
            </p>
            <div className="p-2 rounded-lg bg-[#0a0f1d] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Dica: Seus dados cadastrais do CellHub serão pré-preenchidos automaticamente.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#090e1a] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            variant="ghost"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl order-2 sm:order-1"
          >
            Gerar Termo Mesmo Sem Todos os Dados
          </Button>

          <Button
            onClick={onOpenStoreSettings}
            className="w-full sm:w-auto bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs sm:text-sm rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/20 order-1 sm:order-2"
          >
            <Settings className="w-4 h-4" />
            Completar Dados da Loja Agora
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
