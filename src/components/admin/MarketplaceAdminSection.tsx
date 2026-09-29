import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingUp,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Sparkles,
  Truck,
  Printer,
  ExternalLink,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Key,
  Wallet,
  Settings,
  AlertCircle,
  Box,
  RotateCcw,
  History,
  Lock,
  Search,
  DollarSign,
  Package,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  MarketplaceOrder, 
  MarketplaceReport, 
  MarketplaceFeeSettings,
  CategoryPackageDefault
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService, IntegrationStatusResponse } from '@/services/melhorEnvioService';
import { toast } from 'sonner';

export const MarketplaceAdminSection: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'offers' | 'orders' | 'withdrawals' | 'logistics' | 'reports' | 'settings'>('overview');
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [reports, setReports] = useState<MarketplaceReport[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>({
    defaultFeePercent: 6.0,
    pixDiscountPercent: 0,
    payoutsLocked: false,
    payoutFixedFee: 1.99,
    salesPercentFee: 6.0,
    salesFixedFee: 4.99,
  });
  const [packageDefaults, setPackageDefaults] = useState<CategoryPackageDefault[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatusResponse>({
    success: true,
    connected: true,
    environment: 'production',
    client_id: '30171',
    redirect_uri: 'https://cellhub.shop/api/melhor-envio/callback',
    account_name: 'Leonardo Gomes',
    account_email: 'lordhahshs@gmail.com',
    balance: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);

  // Fee form state
  const [salesPercentInput, setSalesPercentInput] = useState('6.0');
  const [salesFixedInput, setSalesFixedInput] = useState('4.99');
  const [payoutFixedInput, setPayoutFixedInput] = useState('1.99');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  // Settings / Credentials form state
  const [editingSettings, setEditingSettings] = useState(false);
  const [envChoice, setEnvChoice] = useState<'production' | 'sandbox'>('production');
  const [clientIdInput, setClientIdInput] = useState('30171');
  const [clientSecretInput, setClientSecretInput] = useState('ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr');
  const [redirectUriInput, setRedirectUriInput] = useState('https://cellhub.shop/api/melhor-envio/callback');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Package defaults inline editing
  const [editingPackages, setEditingPackages] = useState<Record<string, Partial<CategoryPackageDefault>>>({});
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent && offers.length === 0 && orders.length === 0) {
      setLoading(true);
    }
    try {
      const [allOffers, allOrders, allReports, settings, allWithdrawals, meStatus, defaults] = await Promise.all([
        marketplaceService.getOffers({ status: 'todas' }),
        marketplaceService.getAllOrders(),
        marketplaceService.getReports(),
        marketplaceService.getFeeSettings(),
        marketplaceService.getAllWithdrawals(),
        melhorEnvioService.getStatus(false),
        melhorEnvioService.getPackageDefaults(),
      ]);

      setOffers(allOffers);
      setOrders(allOrders);
      setReports(allReports);
      setFeeSettings(settings);
      setWithdrawals(allWithdrawals);
      if (meStatus) {
        setIntegrationStatus(meStatus);
        if (!editingSettings) {
          setEnvChoice(meStatus.environment || 'production');
          setClientIdInput(meStatus.client_id || '30171');
          setRedirectUriInput(meStatus.redirect_uri || 'https://cellhub.shop/api/melhor-envio/callback');
        }
      }
      if (defaults) {
        setPackageDefaults(defaults);
      }

      if (!silent) {
        setSalesPercentInput(String(settings.salesPercentFee ?? settings.defaultFeePercent ?? 6.0));
        setSalesFixedInput(String(settings.salesFixedFee ?? 4.99));
        setPayoutFixedInput(String(settings.payoutFixedFee ?? 1.99));
      }
      if (!silent) {
        setLoading(false);
      }
    } catch (e) {
      if (!silent) {
        console.error(e);
        toast.error('Erro ao carregar dados do marketplace.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    const tickInterval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(tickInterval);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Metrics
  const totalOffersCount = offers.length;
  const activeOffersCount = offers.filter(o => o.status === 'publicada').length;
  const totalVolume = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalFeeCollected = orders.reduce((acc, curr) => acc + curr.platformFeeAmount, 0);
  const totalActualShipping = orders.reduce((acc, curr) => acc + (curr.actualShippingCost || 0), 0);
  const pendingReportsCount = reports.filter(r => r.status === 'pendente').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'solicitado' || w.status === 'processando').length;

  const handleTogglePayoutsLock = async () => {
    const nextState = !feeSettings.payoutsLocked;
    setIsTogglingLock(true);
    try {
      const success = await marketplaceService.togglePayoutsLock(nextState);
      if (success) {
        setFeeSettings(prev => ({ ...prev, payoutsLocked: nextState }));
        if (nextState) {
          toast.warning('🔒 Trava de saques ATIVADA (Modo Manutenção).');
        } else {
          toast.success('🔓 Trava de saques DESATIVADA (Saques Liberados).');
        }
      } else {
        toast.error('Erro ao alternar status da trava de saques.');
      }
    } catch (e) {
      toast.error('Erro ao comunicar com o servidor.');
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(salesPercentInput.replace(',', '.'));
    const fixed = parseFloat(salesFixedInput.replace(',', '.'));
    const payout = parseFloat(payoutFixedInput.replace(',', '.'));

    if (isNaN(percent) || percent < 0 || percent > 50) {
      toast.error('Informe uma taxa percentual válida entre 0% e 50%.');
      return;
    }
    if (isNaN(fixed) || fixed < 0) {
      toast.error('Informe uma taxa fixa por venda válida.');
      return;
    }
    if (isNaN(payout) || payout < 0) {
      toast.error('Informe uma taxa de saque válida.');
      return;
    }

    setIsSavingFee(true);
    const success = await marketplaceService.updateFeeSettings({
      salesPercentFee: percent,
      salesFixedFee: fixed,
      defaultFeePercent: percent,
      payoutFixedFee: payout,
    });
    setIsSavingFee(false);

    if (success) {
      setFeeSettings(prev => ({
        ...prev,
        salesPercentFee: percent,
        salesFixedFee: fixed,
        defaultFeePercent: percent,
        payoutFixedFee: payout,
      }));
      toast.success(`Taxas atualizadas: ${percent}% + ${formatBRL(fixed)} por venda | ${formatBRL(payout)} por saque.`);
    } else {
      toast.error('Erro ao atualizar taxas da plataforma.');
    }
  };

  const handleUpdateWithdrawalStatus = async (id: string, status: 'solicitado' | 'processando' | 'pago' | 'rejeitado') => {
    let rejectionReason: string | undefined;
    if (status === 'rejeitado') {
      const reason = window.prompt('Informe o motivo da rejeição do saque:');
      if (reason === null) return;
      rejectionReason = reason || 'Chave PIX divergente do titular da conta.';
    }

    const success = await marketplaceService.updateWithdrawalStatus(id, status, rejectionReason);
    if (success) {
      toast.success(`Status do saque atualizado para: ${status.toUpperCase()}`);
      loadData(true);
    } else {
      toast.error('Erro ao atualizar status do saque.');
    }
  };

  const handleSaveIntegrationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const payload: any = {
      environment: envChoice,
      client_id: clientIdInput.trim(),
      redirect_uri: redirectUriInput.trim(),
    };

    if (clientSecretInput.trim() && !clientSecretInput.includes('•')) {
      payload.client_secret = clientSecretInput.trim();
    }

    if (manualTokenInput.trim()) {
      payload.access_token = manualTokenInput.trim();
    }

    const res = await melhorEnvioService.updateSettings(payload);
    setIsSavingSettings(false);

    if (res.success) {
      toast.success(res.message || 'Configurações atualizadas com sucesso!');
      setEditingSettings(false);
      setManualTokenInput('');
      loadData();
    } else {
      toast.error(res.error || 'Erro ao salvar configurações.');
    }
  };

  const handleQuickSaveToken = async () => {
    if (!manualTokenInput.trim()) {
      toast.error('Informe o token de acesso do Melhor Envio.');
      return;
    }
    setIsSavingSettings(true);
    const res = await melhorEnvioService.updateSettings({
      access_token: manualTokenInput.trim(),
      environment: envChoice,
    });
    setIsSavingSettings(false);
    if (res.success) {
      toast.success('Token do Melhor Envio validado e conectado!');
      setManualTokenInput('');
      const liveStatus = await melhorEnvioService.getStatus(true);
      setIntegrationStatus(liveStatus);
      loadData(true);
    } else {
      toast.error(res.error || 'Erro ao validar token.');
    }
  };

  const handleSyncLiveStatus = async () => {
    setIsSavingSettings(true);
    try {
      const liveStatus = await melhorEnvioService.getStatus(true);
      setIntegrationStatus(liveStatus);
      if (liveStatus.connected) {
        toast.success(`Melhor Envio conectado! Conta: ${liveStatus.account_name || 'Leonardo Gomes'}`);
      } else {
        toast.info('Status sincronizado.');
      }
    } catch (e) {
      toast.error('Erro ao sincronizar com Melhor Envio.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDisconnectToken = async () => {
    if (confirm('Deseja desconectar o token do Melhor Envio?')) {
      setIsSavingSettings(true);
      await melhorEnvioService.updateSettings({ access_token: '' });
      setIsSavingSettings(false);
      toast.info('Token desconectado.');
      loadData();
    }
  };

  const handleSavePackageDefault = async (def: CategoryPackageDefault) => {
    const changes = editingPackages[def.id] || {};
    setSavingPackageId(def.id);
    const success = await melhorEnvioService.updatePackageDefault(def.id, changes);
    setSavingPackageId(null);

    if (success) {
      toast.success(`Dimensões de ${def.category} atualizadas!`);
      loadData();
    } else {
      toast.error('Erro ao atualizar dimensões.');
    }
  };

  const handleToggleOfferStatus = async (offer: MarketplaceOffer) => {
    const nextStatus = offer.status === 'publicada' ? 'pausada' : 'publicada';
    const success = await marketplaceService.updateOffer(offer.id, { status: nextStatus });
    if (success) {
      toast.success(`Oferta ${nextStatus === 'publicada' ? 'ativada' : 'pausada'}.`);
      loadData();
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm('Deseja excluir esta oferta?')) {
      const success = await marketplaceService.deleteOffer(offerId);
      if (success) {
        toast.success('Oferta removida.');
        loadData();
      }
    }
  };

  const handleDismissReport = async (reportId: string) => {
    const success = await marketplaceService.updateReportStatus(reportId, 'descartado');
    if (success) {
      toast.info('Denúncia descartada.');
      loadData();
    }
  };

  const handleResolveReportAndRemoveOffer = async (report: MarketplaceReport) => {
    if (window.confirm(`Deseja excluir a oferta denunciada "${report.offerTitle}"?`)) {
      await marketplaceService.deleteOffer(report.offerId);
      await marketplaceService.updateReportStatus(report.id, 'resolvido');
      toast.success('Oferta excluída e denúncia resolvida.');
      loadData();
    }
  };

  const handleGenerateSamples = async () => {
    const success = await marketplaceService.generateSampleOffers();
    if (success) {
      toast.success('Ofertas de exemplo geradas com sucesso!');
      loadData();
    } else {
      toast.error('Erro ao gerar ofertas de exemplo.');
    }
  };

  const handleClearSalesAndHistory = async () => {
    if (window.confirm('Deseja ZERAR todos os dados de vendas, faturamento e histórico de pedidos?')) {
      const res = await marketplaceService.clearSalesAndBillingHistory();
      if (res.success) {
        toast.success('Histórico de vendas e faturamento zerado!');
        loadData();
      } else {
        toast.error(`Erro: ${res.error}`);
      }
    }
  };

  const handleClearEntireMarketplace = async () => {
    if (window.confirm('⚠️ ATENÇÃO: Deseja realizar o RESET COMPLETO do Marketplace? (Ofertas, Vendas e Histórico serão apagados)')) {
      const res = await marketplaceService.clearEntireMarketplace();
      if (res.success) {
        toast.success('Marketplace resetado com sucesso!');
        loadData();
      } else {
        toast.error(`Erro: ${res.error}`);
      }
    }
  };

  const filteredOffers = offers.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.sellerCompany.toLowerCase().includes(search.toLowerCase()) ||
    o.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Sleek Minimalist Header */}
      <div className="bg-[#090e1c] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#00D287] uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Marketplace B2B entre Lojistas</span>
          </div>
          <h2 className="text-xl font-black text-white mt-0.5">
            Super Ofertas & Intermediação
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Custódia financeira, taxas da plataforma e logística integrada via Melhor Envio.
          </p>
        </div>

        {/* Action Tools & Menu */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAdvancedActions(!showAdvancedActions)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showAdvancedActions
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/5'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span>Ações de Manutenção</span>
          </button>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Maintenance Toolbar */}
      {showAdvancedActions && (
        <div className="p-4 rounded-2xl bg-[#060a14] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Settings className="w-4 h-4 text-[#00D287]" />
            <span>Ferramentas de Banco de Dados & Testes:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateSamples}
              className="px-3 py-1.5 rounded-xl bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] border border-[#00D287]/30 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Ofertas Exemplo
            </button>
            <button
              onClick={handleClearSalesAndHistory}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              Zerar Faturamento
            </button>
            <button
              onClick={handleClearEntireMarketplace}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Total
            </button>
          </div>
        </div>
      )}

      {/* Navigation Subtabs (Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5 no-scrollbar">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'overview'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => setSubTab('offers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'offers'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ofertas</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
            subTab === 'offers' ? 'bg-slate-900 text-[#00D287]' : 'bg-slate-800 text-slate-400'
          }`}>
            {offers.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('orders')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'orders'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span>Pedidos</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
            subTab === 'orders' ? 'bg-slate-900 text-[#00D287]' : 'bg-slate-800 text-slate-400'
          }`}>
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('withdrawals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'withdrawals'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Saques PIX</span>
          {pendingWithdrawalsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
              {pendingWithdrawalsCount}
            </span>
          ) : (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              subTab === 'withdrawals' ? 'bg-slate-900 text-[#00D287]' : 'bg-slate-800 text-slate-400'
            }`}>
              {withdrawals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('logistics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'logistics'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Melhor Envio</span>
          {integrationStatus?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          )}
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'reports'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span>Denúncias</span>
          {pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'settings'
              ? 'bg-[#00D287] text-slate-950 shadow-sm shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Taxas & Trava</span>
        </button>
      </div>

      {/* OVERVIEW SUBTAB */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Volume B2B</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white">{formatBRL(totalVolume)}</div>
              <p className="text-[11px] text-slate-500">{orders.length} pedidos realizados</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Comissão CellHub ({feeSettings.defaultFeePercent}%)</span>
                <TrendingUp className="w-4 h-4 text-[#00D287]" />
              </div>
              <div className="text-xl font-black text-[#00D287]">{formatBRL(totalFeeCollected)}</div>
              <p className="text-[11px] text-slate-500">Custódia retida em vendas</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Custo de Etiquetas</span>
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-white">{formatBRL(totalActualShipping)}</div>
              <p className="text-[11px] text-slate-500">Melhor Envio oficial</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Ofertas na Vitrine</span>
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-white">{activeOffersCount} / {totalOffersCount}</div>
              <p className="text-[11px] text-slate-500">Anúncios ativos de lojistas</p>
            </div>
          </div>

          {/* Quick Security & Logistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Trava de Saques Quick Tile */}
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${feeSettings.payoutsLocked ? 'bg-amber-500/15 text-amber-400' : 'bg-[#00D287]/15 text-[#00D287]'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Saques PIX: {feeSettings.payoutsLocked ? 'Travado (Manutenção)' : 'Liberado'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Taxa fixa: {formatBRL(feeSettings.payoutFixedFee ?? 1.99)} por transferência
                  </p>
                </div>
              </div>

              <button
                onClick={handleTogglePayoutsLock}
                disabled={isTogglingLock}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feeSettings.payoutsLocked
                    ? 'bg-[#00D287] text-slate-950 hover:bg-[#00b875]'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                }`}
              >
                {feeSettings.payoutsLocked ? 'Liberar' : 'Travar'}
              </button>
            </div>

            {/* Melhor Envio Quick Tile */}
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Melhor Envio: {integrationStatus?.connected ? 'Conectado' : 'Desconectado'}
                    {integrationStatus?.connected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saldo carteira: <strong className="text-white">{formatBRL(integrationStatus?.balance || 0)}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSubTab('logistics')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Gerenciar
              </button>
            </div>
          </div>

          {/* Quick Recent Activity / Orders Summary */}
          {orders.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Últimos Pedidos B2B</h4>
                <button
                  onClick={() => setSubTab('orders')}
                  className="text-xs text-[#00D287] hover:underline font-semibold"
                >
                  Ver todos ({orders.length})
                </button>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                {orders.slice(0, 4).map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{ord.productTitle}</div>
                      <div className="text-[11px] text-slate-400">
                        {ord.buyerCompany} ➔ {ord.sellerCompany}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-white">{formatBRL(ord.totalAmount)}</div>
                      <span className="text-[10px] text-[#00D287] font-semibold">
                        +{formatBRL(ord.platformFeeAmount)} taxa
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* OFFERS SUBTAB */}
      {subTab === 'offers' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por produto, vendedor ou categoria..."
              className="w-full rounded-xl bg-[#090e1c] border border-white/10 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00D287] outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#090e1c] border border-white/5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="pb-2.5">Produto</th>
                  <th className="pb-2.5">Lojista</th>
                  <th className="pb-2.5">Preço</th>
                  <th className="pb-2.5">Visitas</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhuma oferta encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((off) => (
                    <tr key={off.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={off.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs truncate font-semibold text-white">
                            {off.title}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <span className="truncate block max-w-[140px]">{off.sellerCompany}</span>
                      </td>
                      <td className="py-2.5 font-bold text-white">{formatBRL(off.price)}</td>
                      <td className="py-2.5 text-slate-400">{off.views || 0}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          off.status === 'publicada'
                            ? 'bg-emerald-500/20 text-[#00D287]'
                            : off.status === 'vendida'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {off.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleOfferStatus(off)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] cursor-pointer"
                        >
                          {off.status === 'publicada' ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(off.id)}
                          className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] cursor-pointer"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS SUBTAB */}
      {subTab === 'orders' && (
        <div className="p-3 rounded-2xl bg-[#090e1c] border border-white/5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
              <tr>
                <th className="pb-2.5">ID</th>
                <th className="pb-2.5">Item</th>
                <th className="pb-2.5">Comprador</th>
                <th className="pb-2.5">Vendedor</th>
                <th className="pb-2.5">Total</th>
                <th className="pb-2.5">Taxa CellHub</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Rastreio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum pedido realizado ainda.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-mono text-slate-500 text-[11px]">#{ord.id.slice(0, 6)}</td>
                    <td className="py-2.5 font-semibold text-white max-w-xs truncate">{ord.productTitle}</td>
                    <td className="py-2.5 text-slate-300">{ord.buyerCompany}</td>
                    <td className="py-2.5 text-slate-300">{ord.sellerCompany}</td>
                    <td className="py-2.5 font-bold text-white">{formatBRL(ord.totalAmount)}</td>
                    <td className="py-2.5 text-[#00D287] font-semibold">{formatBRL(ord.platformFeeAmount)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                      {ord.trackingCode || 'Pendente'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* WITHDRAWALS SUBTAB (SAQUES PIX) */}
      {subTab === 'withdrawals' && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum saque solicitado</h3>
              <p className="text-xs text-slate-400">Solicitações de saque via PIX aparecerão aqui para liquidação.</p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#090e1c] border border-white/5 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="pb-2.5">Data</th>
                    <th className="pb-2.5">Lojista</th>
                    <th className="pb-2.5">Chave PIX</th>
                    <th className="pb-2.5">Valor Solicitado</th>
                    <th className="pb-2.5">Taxa</th>
                    <th className="pb-2.5">Valor Líquido</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 font-bold text-white">{w.sellerCompany}</td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-300 max-w-[130px] truncate">{w.pixKey}</td>
                      <td className="py-2.5 font-bold text-white">{formatBRL(w.requestedAmount)}</td>
                      <td className="py-2.5 text-rose-400 font-semibold">- {formatBRL(w.feeAmount)}</td>
                      <td className="py-2.5 font-bold text-[#00D287]">{formatBRL(w.netAmount)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'pago'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : w.status === 'processando'
                            ? 'bg-blue-500/20 text-blue-400'
                            : w.status === 'rejeitado'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {w.status !== 'pago' && (
                            <button
                              onClick={() => handleUpdateWithdrawalStatus(w.id, 'pago')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-[10px]"
                            >
                              Pagar
                            </button>
                          )}
                          {w.status === 'solicitado' && (
                            <button
                              onClick={() => handleUpdateWithdrawalStatus(w.id, 'processando')}
                              className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-[10px]"
                            >
                              Processar
                            </button>
                          )}
                          {w.status !== 'rejeitado' && (
                            <button
                              onClick={() => handleUpdateWithdrawalStatus(w.id, 'rejeitado')}
                              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-[10px]"
                            >
                              Rejeitar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOGISTICS & MELHOR ENVIO SUBTAB */}
      {subTab === 'logistics' && (
        <div className="space-y-4">
          {/* Status Tile */}
          <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Melhor Envio (Logística Oficial)
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    integrationStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {integrationStatus?.connected ? 'Conectado' : 'Pendente'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Saldo na Carteira: <strong className="text-white">{formatBRL(integrationStatus?.balance || 0)}</strong> • Conta: {integrationStatus?.account_name || 'Leonardo Gomes'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncLiveStatus}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer"
                title="Sincronizar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingSettings(!editingSettings)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                {editingSettings ? 'Fechar Configuração' : 'Configurar Token'}
              </button>
            </div>
          </div>

          {/* Quick Token Form */}
          {editingSettings && (
            <div className="p-4 rounded-2xl bg-[#060a14] border border-[#00D287]/20 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Token de Acesso do Melhor Envio</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Cole o Bearer Token do Melhor Envio..."
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none font-mono focus:border-[#00D287]"
                />
                <button
                  onClick={handleQuickSaveToken}
                  disabled={isSavingSettings || !manualTokenInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvar Token
                </button>
              </div>
            </div>
          )}

          {/* Dimension Defaults */}
          <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Medidas Padrão de Embalagem por Categoria
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="pb-2">Categoria</th>
                    <th className="pb-2">Peso (kg)</th>
                    <th className="pb-2">Alt x Larg x Comp (cm)</th>
                    <th className="pb-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {packageDefaults.map((def) => {
                    const localChanges = editingPackages[def.id] || {};
                    const weight = localChanges.default_weight ?? def.default_weight;
                    const height = localChanges.default_height ?? def.default_height;
                    const width = localChanges.default_width ?? def.default_width;
                    const length = localChanges.default_length ?? def.default_length;

                    return (
                      <tr key={def.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-semibold text-white">{def.category}</td>
                        <td className="py-2.5">
                          <input
                            type="number"
                            step="0.05"
                            value={weight}
                            onChange={(e) => setEditingPackages({
                              ...editingPackages,
                              [def.id]: { ...localChanges, default_weight: parseFloat(e.target.value) || 0.1 }
                            })}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={height}
                              onChange={(e) => setEditingPackages({
                                ...editingPackages,
                                [def.id]: { ...localChanges, default_height: parseInt(e.target.value) || 2 }
                              })}
                              className="w-12 bg-slate-950 border border-white/10 rounded-lg px-1.5 py-1 text-white text-xs text-center"
                            />
                            <span className="text-slate-500">x</span>
                            <input
                              type="number"
                              value={width}
                              onChange={(e) => setEditingPackages({
                                ...editingPackages,
                                [def.id]: { ...localChanges, default_width: parseInt(e.target.value) || 10 }
                              })}
                              className="w-12 bg-slate-950 border border-white/10 rounded-lg px-1.5 py-1 text-white text-xs text-center"
                            />
                            <span className="text-slate-500">x</span>
                            <input
                              type="number"
                              value={length}
                              onChange={(e) => setEditingPackages({
                                ...editingPackages,
                                [def.id]: { ...localChanges, default_length: parseInt(e.target.value) || 15 }
                              })}
                              className="w-12 bg-slate-950 border border-white/10 rounded-lg px-1.5 py-1 text-white text-xs text-center"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleSavePackageDefault(def)}
                            disabled={savingPackageId === def.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            {savingPackageId === def.id ? '...' : 'Salvar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS SUBTAB */}
      {subTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-[#00D287] mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma denúncia pendente</h3>
              <p className="text-xs text-slate-400">Todas as ofertas estão em conformidade com as regras.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-400">{rep.reason}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rep.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-white font-semibold">Oferta: {rep.offerTitle}</div>
                    <div className="text-slate-400 text-[11px]">Denunciado por: {rep.reportedByCompany}</div>
                  </div>

                  {rep.status === 'pendente' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDismissReport(rep.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => handleResolveReportAndRemoveOffer(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Excluir Oferta
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS SUBTAB */}
      {subTab === 'settings' && (
        <div className="max-w-xl space-y-4">
          <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Taxas da Plataforma</h3>
              <p className="text-xs text-slate-400">Configure as porcentagens e taxas fixas retidas</p>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Taxa por Venda (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={salesPercentInput}
                    onChange={(e) => setSalesPercentInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-[#00D287] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fixo por Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salesFixedInput}
                    onChange={(e) => setSalesFixedInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-[#00D287] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Taxa por Saque PIX (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutFixedInput}
                    onChange={(e) => setPayoutFixedInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-[#00D287] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingFee}
                  className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingFee ? 'Salvando...' : 'Salvar Taxas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};