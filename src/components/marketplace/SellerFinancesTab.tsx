import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Sparkles,
  Info,
  HelpCircle,
  ArrowDownRight,
  QrCode
} from 'lucide-react';
import { UserAccount, leadAuthService } from '@/services/leadAuthService';
import { marketplaceService } from '@/services/marketplaceService';
import { MarketplaceWithdrawal, PixKeyType } from '@/types/marketplace';
import { toast } from 'sonner';

interface SellerFinancesTabProps {
  currentUser: UserAccount;
  onRefreshParent?: () => void;
}

export const SellerFinancesTab: React.FC<SellerFinancesTabProps> = ({
  currentUser,
  onRefreshParent,
}) => {
  const [loading, setLoading] = useState(true);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isSavingPixKey, setIsSavingPixKey] = useState(false);

  // Dados financeiros consolidados
  const [financialSummary, setFinancialSummary] = useState<{
    grossSalesTotal: number;
    platformFeesTotal: number;
    netSalesTotal: number;
    releasedAmount: number;
    pendingAmount: number;
    totalWithdrawn: number;
    availableForWithdrawal: number;
    withdrawnPaidAmount: number;
    withdrawnPendingAmount: number;
    salesCount: number;
    salesBreakdown: any[];
    withdrawals: MarketplaceWithdrawal[];
  }>({
    grossSalesTotal: 0,
    platformFeesTotal: 0,
    netSalesTotal: 0,
    releasedAmount: 0,
    pendingAmount: 0,
    totalWithdrawn: 0,
    availableForWithdrawal: 0,
    withdrawnPaidAmount: 0,
    withdrawnPendingAmount: 0,
    salesCount: 0,
    salesBreakdown: [],
    withdrawals: [],
  });

  // Configurações do marketplace (taxas e trava de saque)
  const [payoutsLocked, setPayoutsLocked] = useState(false);
  const [payoutFixedFee, setPayoutFixedFee] = useState(1.99);
  const [salesPercentFee, setSalesPercentFee] = useState(6.0);
  const [salesFixedFee, setSalesFixedFee] = useState(4.99);

  // Form de PIX
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(currentUser.pixKeyType || 'cpf_cnpj');
  const [pixKey, setPixKey] = useState(currentUser.pixKey || '');
  const [pixHolderName, setPixHolderName] = useState(currentUser.pixHolderName || currentUser.tradeName || currentUser.companyName || currentUser.ownerName);

  // Form de Saque
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [isPixKeySaved, setIsPixKeySaved] = useState(Boolean(currentUser.pixKey));

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const loadFinances = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [summary, feeSettings] = await Promise.all([
        marketplaceService.getSellerFinancialSummary(currentUser.id),
        marketplaceService.getFeeSettings(),
      ]);

      setFinancialSummary(summary);
      setPayoutsLocked(Boolean(feeSettings.payoutsLocked));
      setPayoutFixedFee(feeSettings.payoutFixedFee ?? 1.99);
      setSalesPercentFee(feeSettings.salesPercentFee ?? 6.0);
      setSalesFixedFee(feeSettings.salesFixedFee ?? 4.99);
    } catch (e) {
      console.error('[SellerFinancesTab] Erro ao carregar finanças:', e);
      if (!silent) toast.error('Erro ao carregar dados financeiros.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [currentUser.id]);

  // Atualiza os dados locais de chave pix quando o currentUser mudar
  useEffect(() => {
    if (currentUser.pixKey) {
      setPixKey(currentUser.pixKey);
      setIsPixKeySaved(true);
    }
    if (currentUser.pixKeyType) {
      setPixKeyType(currentUser.pixKeyType);
    }
    if (currentUser.pixHolderName) {
      setPixHolderName(currentUser.pixHolderName);
    }
  }, [currentUser]);

  // Salvar Chave PIX
  const handleSavePixKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pixKey.trim()) {
      toast.error('Informe sua chave PIX para receber os saques.');
      return;
    }

    setIsSavingPixKey(true);
    try {
      const res = await leadAuthService.updatePixKey(currentUser.id, {
        pixKeyType,
        pixKey: pixKey.trim(),
        pixHolderName: pixHolderName.trim() || currentUser.companyName,
      });

      if (res.success) {
        setIsPixKeySaved(true);
        toast.success('Chave PIX salva com sucesso! Ela ficará guardada para seus próximos saques.');
      } else {
        toast.error(res.error || 'Erro ao salvar chave PIX.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setIsSavingPixKey(false);
    }
  };

  // Cálculo da simulação de saque
  const parsedWithdrawAmount = parseFloat(withdrawAmountInput.replace(',', '.')) || 0;
  const netWithdrawAmount = Math.max(0, parsedWithdrawAmount - payoutFixedFee);
  const isValidAmount = parsedWithdrawAmount > payoutFixedFee && parsedWithdrawAmount <= financialSummary.availableForWithdrawal;

  // Solicitar Saque
  const handleRequestWithdrawal = async () => {
    // 1. Verificação de Trava de Manutenção
    if (payoutsLocked) {
      toast.error('⚠️ Os saques estão temporariamente em manutenção preventiva pela equipe CellHub. Nenhum valor será perdido. Por favor, tente novamente mais tarde.', {
        duration: 7000,
      });
      return;
    }

    // 2. Validações de Chave Pix
    if (!pixKey.trim()) {
      toast.error('Cadastre e salve sua chave PIX antes de solicitar o saque.');
      return;
    }

    // 3. Validações de Saldo
    if (parsedWithdrawAmount <= payoutFixedFee) {
      toast.error(`O valor mínimo para saque deve ser superior à taxa de saque de ${formatBRL(payoutFixedFee)}.`);
      return;
    }

    if (parsedWithdrawAmount > financialSummary.availableForWithdrawal) {
      toast.error(`Saldo liberado insuficiente. Você possui ${formatBRL(financialSummary.availableForWithdrawal)} disponível para saque.`);
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await marketplaceService.requestWithdrawal({
        sellerId: currentUser.id,
        sellerCompany: currentUser.tradeName || currentUser.companyName,
        sellerOwner: currentUser.ownerName,
        amount: parsedWithdrawAmount,
        pixKeyType,
        pixKey: pixKey.trim(),
        pixHolderName: pixHolderName.trim() || currentUser.companyName,
      });

      if (res.success) {
        toast.success(`🎉 Solicitação de saque de ${formatBRL(parsedWithdrawAmount)} realizada com sucesso! O valor líquido de ${formatBRL(netWithdrawAmount)} será enviado para sua chave PIX.`);
        setWithdrawAmountInput('');
        await loadFinances();
        if (onRefreshParent) onRefreshParent();
      } else {
        if (res.error === 'MAINTENANCE') {
          toast.error(res.message || '⚠️ O sistema de saques está temporariamente em manutenção pela equipe CellHub.', {
            duration: 7000,
          });
        } else {
          toast.error(res.message || res.error || 'Erro ao processar solicitação de saque.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao solicitar saque.');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleSetMaxAmount = () => {
    if (financialSummary.availableForWithdrawal > 0) {
      setWithdrawAmountInput(financialSummary.availableForWithdrawal.toFixed(2));
    } else {
      toast.info('Você não possui saldo liberado disponível para saque no momento.');
    }
  };

  const handleSetQuickAmount = (val: number) => {
    if (val <= financialSummary.availableForWithdrawal) {
      setWithdrawAmountInput(val.toFixed(2));
    } else {
      toast.info(`O valor selecionado (${formatBRL(val)}) excede seu saldo liberado de ${formatBRL(financialSummary.availableForWithdrawal)}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. AVISO DE MANUTENÇÃO (SE ATIVADO PELO ADMIN)                           */}
      {/* ========================================================================= */}
      {payoutsLocked && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 backdrop-blur-md flex items-start gap-3.5 shadow-lg">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              Sistema de Saques em Manutenção Temporária
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              O módulo de processamento de saques via PIX está passando por uma manutenção preventiva de rotina da infraestrutura bancária da CellHub. Seus saldos e vendas continuam 100% seguros e creditados normalmente. Novas solicitações serão liberadas em breve.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARDS DE RESUMO FINANCEIRO                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SALDO LIBERADO PARA SAQUE */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00D287]/20 via-[#07130e] to-slate-950 border-2 border-[#00D287]/40 p-5 shadow-xl">
          <div className="absolute top-3 right-3 p-2 rounded-xl bg-[#00D287]/20 text-[#00D287]">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Saldo Disponível (Liberado)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            {formatBRL(financialSummary.availableForWithdrawal)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-300/80 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287] flex-shrink-0" />
            <span>100% livre para saque imediato via PIX</span>
          </div>
        </div>

        {/* Card 2: SALDO A LIBERAR (EM GARANTIA) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 p-5 shadow-lg">
          <div className="absolute top-3 right-3 p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Saldo a Liberar (Em Garantia)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            {formatBRL(financialSummary.pendingAmount)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-200/80 font-medium">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Libera após entrega ou 7 dias sem chamado</span>
          </div>
        </div>

        {/* Card 3: TOTAL BRUTO VENDIDO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-950 border border-blue-500/20 p-5 shadow-lg">
          <div className="absolute top-3 right-3 p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
            Total Vendido (Faturamento)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            {formatBRL(financialSummary.grossSalesTotal)}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>{financialSummary.salesCount} {financialSummary.salesCount === 1 ? 'venda concluída' : 'vendas concluídas'}</span>
          </div>
        </div>

        {/* Card 4: TAXAS DA CELLHUB */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-950 border border-purple-500/20 p-5 shadow-lg">
          <div className="absolute top-3 right-3 p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Percent className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
            Taxas CellHub
          </span>
          <div className="text-xs space-y-1 mt-2 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Por Venda:</span>
              <span className="font-bold text-white">{salesPercentFee}% + {formatBRL(salesFixedFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Taxa de Saque:</span>
              <span className="font-bold text-white">{formatBRL(payoutFixedFee)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[10px] text-purple-300">
              <span>Descontadas no ato</span>
              <span className="font-semibold">{formatBRL(financialSummary.platformFeesTotal)} pagas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRID: CONFIGURAÇÃO DE CHAVE PIX & SOLICITAÇÃO DE SAQUE               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: SOLICITAÇÃO DE SAQUE (7 Colunas) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00D287]/20 text-[#00D287]">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Solicitar Saque via PIX
                </h3>
                <p className="text-xs text-slate-400">
                  Transferência instantânea para sua conta bancária
                </p>
              </div>
            </div>

            <button
              onClick={() => loadFinances()}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Atualizar saldos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Campo de Valor de Saque */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Quanto você deseja sacar?
              </label>
              <button
                type="button"
                onClick={handleSetMaxAmount}
                className="text-xs font-bold text-[#00D287] hover:underline cursor-pointer"
              >
                Sacar Saldo Total ({formatBRL(financialSummary.availableForWithdrawal)})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={withdrawAmountInput}
                onChange={(e) => setWithdrawAmountInput(e.target.value)}
                placeholder="0,00"
                disabled={financialSummary.availableForWithdrawal <= 0 || payoutsLocked}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/15 rounded-xl text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-[#00D287] focus:ring-1 focus:ring-[#00D287] transition-all disabled:opacity-50"
              />
            </div>

            {/* Botões de atalho rápido */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[50, 100, 200, 500, 1000].map((val) => (
                <button
                  key={`quick-${val}`}
                  type="button"
                  onClick={() => handleSetQuickAmount(val)}
                  disabled={financialSummary.availableForWithdrawal < val || payoutsLocked}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  R$ {val}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo do Cálculo da Taxa de Saque */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Valor Solicitado:</span>
              <span className="font-semibold text-white">
                {parsedWithdrawAmount > 0 ? formatBRL(parsedWithdrawAmount) : 'R$ 0,00'}
              </span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span className="flex items-center gap-1">
                (-) Taxa de Saque CellHub:
              </span>
              <span className="font-semibold">
                - {formatBRL(payoutFixedFee)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-200">Valor Líquido a Receber no PIX:</span>
              <span className="text-[#00D287] text-base">
                {parsedWithdrawAmount > payoutFixedFee ? formatBRL(netWithdrawAmount) : 'R$ 0,00'}
              </span>
            </div>
          </div>

          {/* Botão de Solicitação */}
          <button
            type="button"
            onClick={handleRequestWithdrawal}
            disabled={
              isSubmittingWithdrawal ||
              !isValidAmount ||
              !pixKey.trim() ||
              payoutsLocked ||
              financialSummary.availableForWithdrawal <= 0
            }
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              payoutsLocked
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                : !isValidAmount || !pixKey.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-[#00D287] hover:bg-[#00B974] active:scale-[0.99] text-slate-950 shadow-[#00D287]/20 cursor-pointer'
            }`}
          >
            {isSubmittingWithdrawal ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando Saque...</span>
              </>
            ) : payoutsLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Saques em Manutenção</span>
              </>
            ) : !pixKey.trim() ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cadastre sua Chave PIX ao lado</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>Solicitar Saque via PIX de {formatBRL(parsedWithdrawAmount > 0 ? parsedWithdrawAmount : 0)}</span>
              </>
            )}
          </button>
        </div>

        {/* COLUNA DIREITA: CHAVE PIX & DADOS DO TITULAR (5 Colunas) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Chave PIX de Destino
              </h3>
              <p className="text-xs text-slate-400">
                Conta bancária do titular cadastrado
              </p>
            </div>
          </div>

          {/* Dados do Titular Obrigatório */}
          <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#00D287]" />
              <span>Titular Obrigatório da Conta:</span>
            </div>
            <p className="text-slate-300 font-medium truncate">
              {currentUser.tradeName || currentUser.companyName} ({currentUser.ownerName})
            </p>
            <p className="text-slate-400 font-mono text-[11px]">
              Documento: {currentUser.cnpj || 'Não informado'}
            </p>
          </div>

          <form onSubmit={handleSavePixKey} className="space-y-3">
            {/* Tipo de Chave */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Tipo da Chave PIX:
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D287]"
              >
                <option value="cpf_cnpj">CPF / CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Celular / Telefone com DDD</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            {/* Input da Chave */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Chave PIX:
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => {
                  setPixKey(e.target.value);
                  setIsPixKeySaved(false);
                }}
                placeholder={
                  pixKeyType === 'cpf_cnpj'
                    ? '00.000.000/0000-00'
                    : pixKeyType === 'email'
                    ? 'seu@email.com'
                    : pixKeyType === 'telefone'
                    ? '(11) 99999-9999'
                    : 'Chave aleatória de 32 dígitos'
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#00D287]"
              />
            </div>

            {/* Aviso de Titularidade Bancária */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2 text-[11px] text-blue-200/90 leading-relaxed">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                A chave PIX deve pertencer ao mesmo CPF/CNPJ do titular cadastrado na CellHub.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingPixKey || !pixKey.trim()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingPixKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Chave PIX...</span>
                </>
              ) : isPixKeySaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>Chave Salva (Clique para Atualizar)</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>Salvar Chave PIX</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HISTÓRICO DE SAQUES SOLICITADOS                                       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <DollarSign className="w-5 h-5 text-[#00D287]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Histórico de Saques
              </h3>
              <p className="text-xs text-slate-400">
                Registro de todas as transferências solicitadas para sua conta
              </p>
            </div>
          </div>
        </div>

        {financialSummary.withdrawals.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhum saque solicitado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Chave PIX</th>
                  <th className="py-3 px-3">Valor Solicitado</th>
                  <th className="py-3 px-3">Taxa ({formatBRL(payoutFixedFee)})</th>
                  <th className="py-3 px-3">Valor Líquido</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {financialSummary.withdrawals.map((w) => {
                  const dateFormatted = new Date(w.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={`withdrawal-${w.id}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {w.pixKey}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {formatBRL(w.requestedAmount)}
                      </td>
                      <td className="py-3 px-3 text-rose-400">
                        - {formatBRL(w.feeAmount)}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#00D287]">
                        {formatBRL(w.netAmount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {w.status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </span>
                        ) : w.status === 'processando' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Processando
                          </span>
                        ) : w.status === 'rejeitado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-3 h-3" /> Rejeitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Solicitado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. VENDAS & STATUS DE LIBERAÇÃO DE CADA PRODUTO                          */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Vendas & Liberação de Saldo
              </h3>
              <p className="text-xs text-slate-400">
                Detalhamento de taxas e prazos de liberação de cada venda realizada
              </p>
            </div>
          </div>
        </div>

        {financialSummary.salesBreakdown.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhuma venda registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Produto / Pedido</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Valor Bruto</th>
                  <th className="py-3 px-3">Taxa CellHub (6% + R$ 4,99)</th>
                  <th className="py-3 px-3">Valor Líquido</th>
                  <th className="py-3 px-3 text-right">Status da Liberação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {financialSummary.salesBreakdown.map((item, idx) => {
                  const dateFormatted = new Date(item.order.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr key={`sale-breakdown-${item.order.id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 max-w-[240px]">
                          {item.order.productImage ? (
                            <img
                              src={item.order.productImage}
                              alt={item.order.productTitle}
                              className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/10 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">
                              {item.order.productTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              Comprador: {item.order.buyerCompany || item.order.buyerOwner}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {formatBRL(item.grossAmount)}
                      </td>
                      <td className="py-3 px-3 text-rose-400">
                        - {formatBRL(item.platformFeeAmount)}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#00D287]">
                        {formatBRL(item.netAmount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.isReleased ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Liberado p/ Saque
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {item.releaseReason}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> A Liberar
                            </span>
                            <span className="text-[9px] text-amber-300/80 mt-0.5">
                              {item.daysRemaining > 0 ? `Libera em ${item.daysRemaining} dia${item.daysRemaining > 1 ? 's' : ''}` : 'Aguardando entrega'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
