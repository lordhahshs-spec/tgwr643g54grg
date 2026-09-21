import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Check, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  Copy, 
  ShieldCheck, 
  Zap, 
  Building2, 
  User, 
  FileText, 
  Mail, 
  LockKeyhole,
  CheckCircle2
} from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Registration fields if user doesn't have an account yet
  const [companyName, setCompanyName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  if (!isOpen) return null;

  const pixCode = "00020126580014br.gov.bcb.pix013642891203000192520400005303986540597.005802BR5925AURUSPAY TECNOLOGIA B2B6009SAO PAULO62070503***6304E8A2";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setIsCopied(true);
    toast.success('Chave PIX Copia e Cola copiada com sucesso!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleConfirmPaymentAndUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);

    try {
      if (currentUser?.id) {
        // User already has an account registered -> activate it to 'ativo'
        const success = await leadAuthService.activateLifetimePlan(currentUser.id);
        if (success) {
          toast.success('🎉 Pagamento aprovado! Seu acesso vitalício está liberado.');
          const updated = { ...currentUser, planStatus: 'ativo' as const };
          onSuccess(updated);
          onClose();
        } else {
          toast.error('Não foi possível ativar seu plano no momento. Tente novamente.');
        }
      } else {
        // Visitor has no account yet -> create account with plan_status = 'ativo'
        if (!companyName.trim() || !ownerName.trim() || !cnpj.trim() || !email.trim() || !password.trim()) {
          toast.error('Preencha os dados da sua empresa para criar seu acesso vitalício.');
          setIsProcessing(false);
          return;
        }

        const { user: newUser, error } = await leadAuthService.registerAccount({
          companyName: companyName.trim(),
          ownerName: ownerName.trim(),
          cnpj: cnpj.trim(),
          email: email.trim(),
          password: password.trim(),
          initialPlanStatus: 'ativo',
        });

        if (error || !newUser) {
          toast.error(error || 'Erro ao registrar sua conta ativa.');
          setIsProcessing(false);
          return;
        }

        toast.success('🎉 Conta criada e Plano Vitalício ativado com sucesso!');
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar ativação.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-[#080c17] border border-[#00D287]/40 rounded-3xl overflow-hidden shadow-2xl shadow-[#00D287]/15 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-[#080c17] to-slate-900 border-b border-white/10 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00D287] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-[#00D287]/30 flex-shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">
                  Licença Vitalícia
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Sem mensalidades</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                Desbloquear Acesso Completo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-left">
          {/* Reason Alert (if triggered by clicking a specific feature) */}
          {initialReason && (
            <div className="p-3 rounded-xl bg-[#00D287]/10 border border-[#00D287]/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <Lock className="w-4 h-4 flex-shrink-0 text-[#00D287]" />
              <span>{initialReason}</span>
            </div>
          )}

          {/* Pricing Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1020] to-emerald-950/20 border border-[#00D287]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Taxa Única de Adesão Vitalícia
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-slate-500 line-through text-xs font-semibold">R$ 497,00</span>
                <span className="text-2xl sm:text-3xl font-black text-[#00D287]">R$ 97,00</span>
                <span className="text-xs text-slate-400 font-semibold">à vista ou 12x no cartão</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Acesso vitalício sem cobranças recorrentes. Você paga uma única vez.
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1">
              <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-white/10">
                ⚡ Liberação Imediata
              </span>
              <span className="text-[10px] text-slate-500">Garantia total de 7 dias</span>
            </div>
          </div>

          {/* Features Included List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tudo o que você desbloqueia agora:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
                <span>Simulador de Vendas Android</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
                <span>Comprar & Vender no Marketplace B2B</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
                <span>Acervo de Esquemas Elétricos em PDF</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00D287] flex-shrink-0" />
                <span>Simulador de Trade-In & Trocas</span>
              </div>
            </div>
          </div>

          {/* Account Details Form if Visitor */}
          {!currentUser && (
            <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00D287]" />
                Dados para Cadastro da sua Loja Credenciada
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Nome da Loja/Empresa *</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: TechCell Celulares"
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Nome do Responsável *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ex: Rafael Mendonça"
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">CNPJ da Loja *</label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:border-[#00D287] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Seu E-mail *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@sualoja.com"
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Senha de Acesso *</label>
                  <div className="relative">
                    <LockKeyhole className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha segura"
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:border-[#00D287] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If already logged in, show current connected store */}
          {currentUser && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D287]" />
                <span className="text-slate-300">
                  Conta identificada: <strong className="text-white">{currentUser.companyName}</strong> ({currentUser.email})
                </span>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                Plano Atual: Demonstração
              </span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Escolha a forma de pagamento:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-950/30 border-[#00D287] text-[#00D287] shadow-md shadow-[#00D287]/15'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>PIX (Instantâneo)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  paymentMethod === 'cartao'
                    ? 'bg-emerald-950/30 border-[#00D287] text-[#00D287] shadow-md shadow-[#00D287]/15'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>
          </div>

          {/* PIX Details */}
          {paymentMethod === 'pix' ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3 text-center">
              <div className="mx-auto w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCode)}`} 
                  alt="QR Code PIX AurusPay"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Abra o app do seu banco, escolha <strong>Pagar via Pix</strong> e aponte a câmera para o QR Code acima.
              </p>

              {/* Copy Paste Code */}
              <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl p-2">
                <input
                  readOnly
                  value={pixCode}
                  className="bg-transparent border-0 text-[10px] text-slate-300 font-mono w-full truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Cartão de Crédito Simulation */
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5 text-xs text-slate-300">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Número do Cartão</label>
                <input
                  defaultValue="•••• •••• •••• 4242"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00D287] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Validade</label>
                  <input
                    defaultValue="12/29"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00D287] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">CVV</label>
                  <input
                    defaultValue="889"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00D287] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Parcelamento</label>
                <select className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:border-[#00D287] focus:outline-none">
                  <option>1x de R$ 97,00 sem juros</option>
                  <option>2x de R$ 48,50 sem juros</option>
                  <option>3x de R$ 32,33 sem juros</option>
                  <option>12x de R$ 9,70</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00D287]" />
            <span>Transação 100% Criptografada e Segura</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 sm:w-auto px-4 py-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleConfirmPaymentAndUnlock()}
              disabled={isProcessing}
              className="w-2/3 sm:w-auto px-6 py-3 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm tracking-tight shadow-xl shadow-[#00D287]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transform active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{isProcessing ? 'Ativando Licença...' : 'Confirmar Pagamento e Desbloquear'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
