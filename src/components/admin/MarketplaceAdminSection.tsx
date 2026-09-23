import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ShieldAlert,
  Settings,
  Trash2,
  Check,
  Eye,
  PauseCircle,
  PlayCircle,
  Package,
  DollarSign,
  Search,
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
  Globe,
  Sliders,
  AlertCircle,
  Box,
  RotateCcw,
  History
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
  const [subTab, setSubTab] = useState<'overview' | 'offers' | 'reports' | 'orders' | 'logistics' | 'settings'>('overview');
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [reports, setReports] = useState<MarketplaceReport[]>([]);
  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>({ defaultFeePercent: 6.5, pixDiscountPercent: 0 });
  const [packageDefaults, setPackageDefaults] = useState<CategoryPackageDefault[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatusResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fee form state
  const [feeInput, setFeeInput] = useState('6.5');
  const [isSavingFee, setIsSavingFee] = useState(false);

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
      // 1. Carregamento prioritário instantâneo: Vendas, Produtos Cadastrados e Métricas Financeiras
      const [allOffers, allOrders, allReports, settings] = await Promise.all([
        marketplaceService.getOffers({ status: 'todas' }),
        marketplaceService.getAllOrders(),
        marketplaceService.getReports(),
        marketplaceService.getFeeSettings(),
      ]);

      setOffers(allOffers);
      setOrders(allOrders);
      setReports(allReports);
      setFeeSettings(settings);
      if (!silent) {
        setFeeInput(String(settings.defaultFeePercent));
      }
      if (!silent) {
        setLoading(false); // Libera a exibição das tabelas imediatamente
      }

      // 2. Carregamento secundário de configurações do Melhor Envio (leitura direta e instantânea do banco)
      Promise.all([
        melhorEnvioService.getPackageDefaults(),
        melhorEnvioService.getStatus(false),
      ]).then(([defaults, meStatus]) => {
        setPackageDefaults(defaults);
        setIntegrationStatus(meStatus);

        if (meStatus && !editingSettings) {
          setEnvChoice(meStatus.environment || 'production');
          setClientIdInput(meStatus.client_id || '30171');
          setRedirectUriInput(meStatus.redirect_uri || 'https://cellhub.shop/api/melhor-envio/callback');
        }
      });
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

    // Sistema de Tick a cada 3 segundos: atualiza ofertas e pedidos do marketplace em tempo real
    const tickInterval = setInterval(() => {
      loadData(true);
    }, 3000);

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

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(feeInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0 || parsed > 50) {
      toast.error('Informe uma taxa percentual válida entre 0% e 50%.');
      return;
    }

    setIsSavingFee(true);
    const success = await marketplaceService.updateFeeSettings({
      defaultFeePercent: parsed,
      pixDiscountPercent: feeSettings.pixDiscountPercent,
    });
    setIsSavingFee(false);

    if (success) {
      setFeeSettings({ ...feeSettings, defaultFeePercent: parsed });
      toast.success(`Taxa da plataforma atualizada para ${parsed}%!`);
    } else {
      toast.error('Erro ao atualizar taxa da plataforma.');
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
      toast.success(res.message || 'Configurações do Melhor Envio atualizadas com sucesso!');
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
      toast.success(res.message || 'Token do Melhor Envio validado e salvo com sucesso!');
      setManualTokenInput('');
      loadData();
    } else {
      toast.error(res.error || 'Erro ao validar token com o Melhor Envio.');
    }
  };

  const handleDisconnectToken = async () => {
    if (confirm('Deseja realmente desconectar o token do Melhor Envio? As novas etiquetas oficiais ficarão pausadas até um novo token ser conectado.')) {
      setIsSavingSettings(true);
      await melhorEnvioService.updateSettings({
        access_token: '',
      });
      setIsSavingSettings(false);
      toast.info('Token do Melhor Envio desconectado.');
      loadData();
    }
  };

  const handleSavePackageDefault = async (def: CategoryPackageDefault) => {
    const changes = editingPackages[def.id] || {};
    setSavingPackageId(def.id);
    const success = await melhorEnvioService.updatePackageDefault(def.id, changes);
    setSavingPackageId(null);

    if (success) {
      toast.success(`Dimensões padrão de ${def.category} atualizadas!`);
      loadData();
    } else {
      toast.error('Erro ao atualizar dimensões.');
    }
  };

  const handleToggleOfferStatus = async (offer: MarketplaceOffer) => {
    const nextStatus = offer.status === 'publicada' ? 'pausada' : 'publicada';
    const success = await marketplaceService.updateOffer(offer.id, { status: nextStatus });
    if (success) {
      toast.success(`Oferta ${nextStatus === 'publicada' ? 'ativada' : 'pausada'} com sucesso.`);
      loadData();
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta oferta da plataforma?')) {
      const success = await marketplaceService.deleteOffer(offerId);
      if (success) {
        toast.success('Oferta removida com sucesso.');
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
    if (window.confirm(`Deseja resolver a denúncia e EXCLUIR a oferta "${report.offerTitle}"?`)) {
      await marketplaceService.deleteOffer(report.offerId);
      await marketplaceService.updateReportStatus(report.id, 'resolvido');
      toast.success('Oferta excluída e denúncia marcada como resolvida.');
      loadData();
    }
  };

  const handleGenerateSamples = async () => {
    const success = await marketplaceService.generateSampleOffers();
    if (success) {
      toast.success('Ofertas de exemplo geradas no banco com sucesso!');
      loadData();
    } else {
      toast.error('Erro ao gerar ofertas de exemplo.');
    }
  };

  const handleClearAllOffers = async () => {
    if (window.confirm('Deseja excluir todas as ofertas cadastradas?')) {
      await marketplaceService.clearAllOffers();
      toast.info('Todas as ofertas foram removidas.');
      loadData();
    }
  };

  const handleClearSalesAndHistory = async () => {
    if (window.confirm('Deseja ZERAR todos os dados de faturamento, pedidos, vendas e histórico do marketplace?\n\n• Todos os pedidos serão excluídos.\n• O faturamento e taxas acumuladas serão zerados (R$ 0,00).\n• Ofertas marcadas como vendidas voltarão a ficar disponíveis.\n• Logs de envio e rastreio serão limpos.')) {
      const res = await marketplaceService.clearSalesAndBillingHistory();
      if (res.success) {
        toast.success('Histórico de vendas e faturamento zerado com sucesso!');
        loadData();
      } else {
        toast.error(`Erro ao zerar histórico de vendas: ${res.error}`);
      }
    }
  };

  const handleClearEntireMarketplace = async () => {
    if (window.confirm('⚠️ ATENÇÃO: Deseja realizar o RESET COMPLETO do Marketplace?\n\nIsso irá apagar:\n1. Todas as ofertas cadastradas\n2. Todas as vendas e faturamento\n3. Todos os pedidos e histórico\n4. Todas as denúncias e logs de rastreamento\n\nEssa ação é irreversível. Deseja continuar?')) {
      const res = await marketplaceService.clearEntireMarketplace();
      if (res.success) {
        toast.success('Marketplace resetado completamente!');
        loadData();
      } else {
        toast.error(`Erro ao resetar marketplace: ${res.error}`);
      }
    }
  };

  const filteredOffers = offers.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.sellerCompany.toLowerCase().includes(search.toLowerCase()) ||
    o.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#090e1c] via-[#0d162d] to-[#090e1c] border border-[#00D287]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#00D287] tracking-wider mb-1">
            <Flame className="w-4 h-4" /> Moderação & Controle B2B
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Marketplace Super Ofertas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Intermediação, logística integrada via Melhor Envio e custódia financeira entre lojistas.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={handleGenerateSamples}
              className="px-3 py-1.5 rounded-xl bg-[#00D287]/20 hover:bg-[#00D287]/30 text-[#00D287] border border-[#00D287]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Ofertas de Exemplo
            </button>

            <button
              onClick={handleClearSalesAndHistory}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Zera todas as vendas, histórico de faturamento, pedidos e logs"
            >
              <History className="w-3.5 h-3.5" />
              Zerar Vendas & Faturamento
            </button>

            {offers.length > 0 && (
              <button
                onClick={handleClearAllOffers}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Exclui todas as ofertas da vitrine"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Ofertas
              </button>
            )}

            <button
              onClick={handleClearEntireMarketplace}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset total do Marketplace (Ofertas + Vendas + Histórico)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Geral (Tudo)
            </button>
          </div>
        </div>

        {/* Subtabs Menu */}
        <div className="flex flex-wrap gap-2 bg-[#060a14] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'overview' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setSubTab('offers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'offers' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ofertas ({offers.length})
          </button>
          <button
            onClick={() => setSubTab('logistics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'logistics' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Logística & Melhor Envio
          </button>
          <button
            onClick={() => setSubTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'orders' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setSubTab('reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
              subTab === 'reports' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Denúncias
            {pendingReportsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-red-500 text-white rounded-full font-black">
                {pendingReportsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'settings' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Configurações
          </button>
        </div>
      </div>

      {/* OVERVIEW SUBTAB */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Transacionado B2B</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{formatBRL(totalVolume)}</h3>
              <p className="text-[11px] text-slate-500">{orders.length} pedidos realizados</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Comissão CellHub ({feeSettings.defaultFeePercent}%)</span>
                <div className="w-8 h-8 rounded-xl bg-[#00D287]/10 text-[#00D287] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#00D287]">{formatBRL(totalFeeCollected)}</h3>
              <p className="text-[11px] text-slate-500">Retido em custódia operacional</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Custo Total de Etiquetas</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{formatBRL(totalActualShipping)}</h3>
              <p className="text-[11px] text-slate-500">Comprado via carteira Melhor Envio</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Ofertas Ativas na Vitrine</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{activeOffersCount} / {totalOffersCount}</h3>
              <p className="text-[11px] text-slate-500">Anúncios de lojistas ativos</p>
            </div>
          </div>

          {/* Card de Gestão de Banco & Limpeza de Faturamento */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Gerenciamento de Faturamento & Banco de Dados
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Zere os dados de faturamento/vendas de teste ou resete o marketplace quando desejar reiniciar as operações.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleClearSalesAndHistory}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                Zerar Vendas & Faturamento
              </button>
              <button
                onClick={handleClearEntireMarketplace}
                className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Geral (Tudo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGISTICS & MELHOR ENVIO SUBTAB */}
      {subTab === 'logistics' && (
        <div className="space-y-6">
          {/* Status da Integração Oficial */}
          <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Integração Oficial Melhor Envio
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${integrationStatus?.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {integrationStatus?.connected ? '● CONECTADO' : '○ PENDENTE AUTORIZAÇÃO'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ambiente: <strong className="text-white uppercase">{integrationStatus?.environment || 'production'}</strong> • Domínio Oficial: <span className="text-[#00D287]">https://cellhub.shop</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {integrationStatus?.connected ? (
                  <button
                    onClick={handleDisconnectToken}
                    disabled={isSavingSettings}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
                  >
                    Desconectar Token
                  </button>
                ) : (
                  integrationStatus?.authorize_url && (
                    <a
                      href={integrationStatus.authorize_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Conectar Conta (OAuth)
                    </a>
                  )
                )}
                <button
                  onClick={() => setEditingSettings(!editingSettings)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10"
                >
                  {editingSettings ? 'Fechar' : 'Configurações Avançadas'}
                </button>
              </div>
            </div>

            {/* Aviso se a integração não estiver conectada */}
            {!integrationStatus?.connected && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Atenção: Token do Melhor Envio não conectado</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para que os lojistas consigam gerar etiquetas reais dos Correios e Jadlog diretamente pela plataforma, a conta oficial do Melhor Envio precisa estar conectada. Você pode conectar via OAuth (botão acima) ou inserir o <strong>Token de Acesso Pessoal</strong> abaixo:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="password"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="Cole o Bearer Token do Melhor Envio (ex: eyJ0eXAi...)"
                    className="flex-1 bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none font-mono focus:border-[#00D287]"
                  />
                  <button
                    onClick={handleQuickSaveToken}
                    disabled={isSavingSettings || !manualTokenInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00D287]/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isSavingSettings ? 'Validando...' : 'Validar e Conectar Token'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  💡 Como gerar: Acesse seu painel no Melhor Envio → <strong>Gerenciar</strong> → <strong>Tokens</strong> → <strong>Novo Token</strong> com permissões de envios/carrinho/impressão e cole aqui.
                </div>
              </div>
            )}

            {/* Balanço e Detalhes da Carteira */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Wallet className="w-3.5 h-3.5 text-[#00D287]" /> Saldo na Carteira CellHub (Melhor Envio)
                </span>
                <div className="text-xl font-black text-white">
                  {formatBRL(integrationStatus?.balance || 0)}
                </div>
                <p className="text-[10px] text-slate-500">Utilizado para compra de etiquetas pós-checkout</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Conta Conectada
                </span>
                <div className="text-sm font-bold text-white truncate">
                  {integrationStatus?.account_name || (integrationStatus?.connected ? 'Conta CellHub Oficial' : 'Nenhuma conta vinculada')}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{integrationStatus?.account_email || 'Aguardando conexão'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Key className="w-3.5 h-3.5 text-purple-400" /> Client ID & Callback
                </span>
                <div className="text-xs font-mono text-slate-200">
                  ID: {integrationStatus?.client_id || '30171'}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{integrationStatus?.redirect_uri}</p>
              </div>
            </div>

            {/* Credenciais Form (Aberto sob demanda) */}
            {editingSettings && (
              <form onSubmit={handleSaveIntegrationSettings} className="p-5 rounded-2xl bg-black/60 border border-[#00D287]/20 space-y-4 pt-4">
                <h4 className="text-xs font-bold uppercase text-[#00D287] tracking-wider">
                  Editar Parâmetros da API Oficial do Melhor Envio
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Ambiente</label>
                    <select
                      value={envChoice}
                      onChange={(e) => setEnvChoice(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-[#00D287]"
                    >
                      <option value="production">Produção (melhorenvio.com.br)</option>
                      <option value="sandbox">Sandbox (sandbox.melhorenvio.com.br)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Client Secret (Protegido)</label>
                    <input
                      type="password"
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">URL Oficial de Redirecionamento (Callback)</label>
                    <input
                      type="text"
                      value={redirectUriInput}
                      onChange={(e) => setRedirectUriInput(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Inserir Token Manualmente (Opcional se usar OAuth)</label>
                    <input
                      type="password"
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      placeholder="Cole aqui caso gere token pessoal no painel do Melhor Envio"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSettings(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Salvando...' : 'Salvar Credenciais com Segurança'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Padrões Conservadores de Embalagem por Categoria */}
          <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-[#00D287]" />
                  Padrões de Embalagem por Categoria (Medidas Conservadoras)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estes valores são aplicados automaticamente ao lojista para evitar subestimar custos de envio.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Peso (kg)</th>
                    <th className="pb-3">Altura (cm)</th>
                    <th className="pb-3">Largura (cm)</th>
                    <th className="pb-3">Comprimento (cm)</th>
                    <th className="pb-3">Descrição Típica</th>
                    <th className="pb-3 text-right">Ação</th>
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
                        <td className="py-3 font-bold text-white">{def.category}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="0.05"
                            value={weight}
                            onChange={(e) => setEditingPackages({
                              ...editingPackages,
                              [def.id]: { ...localChanges, default_weight: parseFloat(e.target.value) || 0.1 }
                            })}
                            className="w-20 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="1"
                            value={height}
                            onChange={(e) => setEditingPackages({
                              ...editingPackages,
                              [def.id]: { ...localChanges, default_height: parseInt(e.target.value) || 2 }
                            })}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="1"
                            value={width}
                            onChange={(e) => setEditingPackages({
                              ...editingPackages,
                              [def.id]: { ...localChanges, default_width: parseInt(e.target.value) || 10 }
                            })}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="1"
                            value={length}
                            onChange={(e) => setEditingPackages({
                              ...editingPackages,
                              [def.id]: { ...localChanges, default_length: parseInt(e.target.value) || 15 }
                            })}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                          />
                        </td>
                        <td className="py-3 text-slate-400 text-[11px] max-w-xs truncate">
                          {def.description || '-'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleSavePackageDefault(def)}
                            disabled={savingPackageId === def.id}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px]"
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

          {/* Pedidos & Rastreamento com Separação Financeira */}
          <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#00D287]" />
              Auditoria de Envios & Etiquetas Geradas
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="pb-3">ID Pedido</th>
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Vendedor</th>
                    <th className="pb-3">Frete Cobrado</th>
                    <th className="pb-3">Custo Real Etiqueta</th>
                    <th className="pb-3">Diferença Contábil</th>
                    <th className="pb-3">Status Envio</th>
                    <th className="pb-3">Rastreio</th>
                    <th className="pb-3 text-right">Etiqueta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((ord) => {
                    const printUrl = ord.melhorEnvioPrintUrl || ord.melhorEnvioLabelUrl;
                    const diff = (ord.shippingAmountCharged || 0) - (ord.actualShippingCost || 0);

                    return (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-mono text-slate-400">#{ord.id.slice(0, 8)}</td>
                        <td className="py-3 font-semibold text-white max-w-xs truncate">{ord.productTitle}</td>
                        <td className="py-3 text-slate-300">{ord.sellerCompany}</td>
                        <td className="py-3 font-semibold text-white">
                          {ord.shippingAmountCharged === 0 ? 'Grátis' : formatBRL(ord.shippingAmountCharged || 0)}
                        </td>
                        <td className="py-3 font-bold text-[#00D287]">
                          {formatBRL(ord.actualShippingCost || 0)}
                        </td>
                        <td className="py-3 text-slate-400">
                          {formatBRL(diff)}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {ord.shippingStatus || ord.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-300">
                          {ord.trackingCode || 'Pendente'}
                        </td>
                        <td className="py-3 text-right">
                          {printUrl ? (
                            <a
                              href={printUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-[#00D287]/20 text-[#00D287] hover:bg-[#00D287]/30 font-bold inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Ver Etiqueta
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Aguardando compra</span>
                          )}
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

      {/* OFFERS SUBTAB */}
      {subTab === 'offers' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ofertas por título, loja ou categoria..."
              className="w-full rounded-2xl bg-[#090e1c] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="pb-3">Foto</th>
                  <th className="pb-3">Título da Oferta</th>
                  <th className="pb-3">Lojista Responsável</th>
                  <th className="pb-3">Preço B2B</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOffers.map((off) => (
                  <tr key={off.id} className="hover:bg-white/[0.02]">
                    <td className="py-3">
                      <img
                        src={off.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-slate-950"
                      />
                    </td>
                    <td className="py-3 font-semibold text-white max-w-sm truncate">{off.title}</td>
                    <td className="py-3 text-slate-300">
                      <div>{off.sellerCompany}</div>
                      <span className="text-[10px] text-slate-500">{off.sellerOwner}</span>
                    </td>
                    <td className="py-3 font-bold text-white">{formatBRL(off.price)}</td>
                    <td className="py-3 text-slate-400">{off.views}</td>
                    <td className="py-3">
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
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleOfferStatus(off)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px]"
                      >
                        {off.status === 'publicada' ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(off.id)}
                        className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px]"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS SUBTAB */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#00D287] mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma denúncia registrada</h3>
              <p className="text-xs text-slate-400">O marketplace está operando em total conformidade.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-[#090e1c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'pendente' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rep.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-red-400">Motivo: {rep.reason}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">Oferta: {rep.offerTitle}</h4>
                    <p className="text-xs text-slate-400">
                      Denunciado por: <strong>{rep.reportedByCompany}</strong> em {new Date(rep.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {rep.details && (
                      <p className="text-xs text-slate-300 italic bg-black/40 p-2 rounded-lg border border-white/5">
                        "{rep.details}"
                      </p>
                    )}
                  </div>

                  {rep.status === 'pendente' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismissReport(rep.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => handleResolveReportAndRemoveOffer(rep)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
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

      {/* ORDERS SUBTAB */}
      {subTab === 'orders' && (
        <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
              <tr>
                <th className="pb-3">ID Pedido</th>
                <th className="pb-3">Item</th>
                <th className="pb-3">Comprador</th>
                <th className="pb-3">Vendedor</th>
                <th className="pb-3">Total Pago</th>
                <th className="pb-3">Taxa Intermediação</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Rastreio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-mono text-slate-400">#{ord.id.slice(0, 8)}</td>
                  <td className="py-3 font-semibold text-white max-w-xs truncate">{ord.productTitle}</td>
                  <td className="py-3 text-slate-300">{ord.buyerCompany}</td>
                  <td className="py-3 text-slate-300">{ord.sellerCompany}</td>
                  <td className="py-3 font-bold text-white">{formatBRL(ord.totalAmount)}</td>
                  <td className="py-3 text-[#00D287] font-semibold">{formatBRL(ord.platformFeeAmount)}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {ord.trackingCode || 'Pendente'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SETTINGS SUBTAB */}
      {subTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-[#090e1c] border border-white/5 max-w-lg space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Settings className="w-5 h-5 text-[#00D287]" />
            Taxa de Intermediação CellHub
          </div>
          <p className="text-xs text-slate-400">
            Defina o percentual de retenção operacional cobrado sobre o valor bruto de cada venda realizada entre lojistas.
          </p>

          <form onSubmit={handleSaveFee} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Comissão Padrão da Plataforma (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  placeholder="6.5"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-sm text-white font-bold focus:border-[#00D287] outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingFee}
              className="px-6 py-2.5 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs shadow-lg shadow-[#00D287]/20 transition-all disabled:opacity-50"
            >
              {isSavingFee ? 'Salvando...' : 'Salvar Taxa da Plataforma'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
