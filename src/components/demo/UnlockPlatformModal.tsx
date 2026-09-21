import React, { useState } from 'react';
import { X, Lock, Check, ExternalLink, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserAccount, leadAuthService } from '@/services/leadAuthService';

interface UnlockPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onSuccess: (updatedUser: UserAccount) => void;
  initialReason?: string;
}

export const UnlockPlatformModal: React.FC<UnlockPlatformModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  initialReason,
}) => {
  const [isActivating, setIsActivating] = useState<boolean>(false);

  if (!isOpen) return null;

  // URL do checkout configurável (ex: Kiwify, Hotmart, PerfectPay, Asaas)
  const checkoutUrl = ""; // Quando o lojista configurar a URL externa, abre em nova aba

  const handleOpenCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      toast.info('Abrindo página de checkout seguro...');
    } else {
      // Simulação rápida de aprovação para testes até o webhook ser conectado
      handleSimulatePayment();
    }
  };

  const handleSimulatePayment = async () => {
    if (!currentUser?.id) {
      toast.error('Faça login ou cadastre-se para ativar sua conta.');
      return;
    }

    setIsActivating(true);
    try {
      const success = await leadAuthService.activateLifetimePlan(currentUser.id);
      if (success) {
        toast.success('🎉 Pagamento confirmado! Plataforma 100% liberada com sucesso.');
        const updated: UserAccount = { ...currentUser, planStatus: 'ativo' };
        onSuccess(updated);
        onClose();
      } else {
        toast.error('Erro ao atualizar status da conta.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar ativação.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#080c17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-left">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Desbloquear Acesso à Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Acesso vitalício • Sem mensalidades</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {initialReason && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              {initialReason}
            </p>
          )}

          {/* Pricing Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Taxa Única de Adesão
              </span>
              <span className="text-2xl font-black text-[#00D287]">R$ 97,00</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pagamento único</span>
          </div>

          {/* Minimal Features List */}
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              <span>Venda no Boleto (Crediário Próprio, Parcelamento & Bloqueio)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              <span>Compra e Venda no Marketplace B2B</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              <span>Biblioteca de Esquemas Elétricos em PDF</span>
            </div>
          </div>

          {/* Store Info */}
          {currentUser && (
            <div className="text-[11px] text-slate-400 border-t border-white/5 pt-3">
              Loja: <strong className="text-white">{currentUser.tradeName || currentUser.companyName}</strong> ({currentUser.email})
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={handleOpenCheckout}
            disabled={isActivating}
            className="w-full py-3 px-4 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer disabled:opacity-50 transform active:scale-95"
          >
            {isActivating ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ativando acesso...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Abrir Checkout Seguro</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
            <span>Transação segura • Liberação automática via sistema</span>
          </div>
        </div>
      </div>
    </div>
  );
};
