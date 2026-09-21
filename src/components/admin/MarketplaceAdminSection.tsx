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
  Sparkles
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  MarketplaceOrder, 
  MarketplaceReport, 
  MarketplaceFeeSettings 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { toast } from 'sonner';

export const MarketplaceAdminSection: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'offers' | 'reports' | 'orders' | 'settings'>('overview');
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [reports, setReports] = useState<MarketplaceReport[]>([]);
  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>({ defaultFeePercent: 6.5, pixDiscountPercent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fee form state
  const [feeInput, setFeeInput] = useState('6.5');
  const [isSavingFee, setIsSavingFee] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
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
      setFeeInput(String(settings.defaultFeePercent));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados do marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
            Controle de intermediação, custódia de transações entre lojistas e moderação de anúncios.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleGenerateSamples}
              className="px-3 py-1.5 rounded-xl bg-[#00D287]/20 hover:bg-[#00D287]/30 text-[#00D287] border border-[#00D287]/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Ofertas de Exemplo
            </button>
            {offers.length > 0 && (
              <button
                onClick={handleClearAllOffers}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Ofertas
              </button>
            )}
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
            onClick={() => setSubTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'orders' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              subTab === 'settings' ? 'bg-[#00D287] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Taxas
          </button>
        </div>
      </div>

      {/* OVERVIEW SUBTAB */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Ofertas Cadastradas</span>
                <Package className="w-4 h-4 text-[#00D287]" />
              </div>
              <div className="text-2xl font-black text-white">{totalOffersCount}</div>
              <div className="text-[11px] text-emerald-400">{activeOffersCount} ativas na vitrine</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Volume Transacionado</span>
                <DollarSign className="w-4 h-4 text-[#00D287]" />
              </div>
              <div className="text-2xl font-black text-white">{formatBRL(totalVolume)}</div>
              <div className="text-[11px] text-slate-400">{orders.length} pedidos realizados</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Receita da Plataforma</span>
                <TrendingUp className="w-4 h-4 text-[#00D287]" />
              </div>
              <div className="text-2xl font-black text-[#00D287]">{formatBRL(totalFeeCollected)}</div>
              <div className="text-[11px] text-slate-400">Taxa média: {feeSettings.defaultFeePercent}%</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Denúncias Pendentes</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`text-2xl font-black ${pendingReportsCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {pendingReportsCount}
              </div>
              <div className="text-[11px] text-slate-400">{reports.length} denúncias no total</div>
            </div>
          </div>

          {/* Quick Recent Activity */}
          <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white">Últimas Ofertas Cadastradas pelos Lojistas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="pb-3">Título</th>
                    <th className="pb-3">Lojista</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {offers.slice(0, 5).map((off) => (
                    <tr key={off.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white max-w-xs truncate">{off.title}</td>
                      <td className="py-3 text-slate-300">{off.sellerCompany}</td>
                      <td className="py-3 text-slate-400">{off.category}</td>
                      <td className="py-3 font-bold text-white">{formatBRL(off.price)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          off.status === 'publicada' ? 'bg-emerald-500/20 text-[#00D287]' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {off.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleOfferStatus(off)}
                          className="text-xs text-slate-400 hover:text-white mr-2"
                        >
                          {off.status === 'publicada' ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(off.id)}
                          className="text-xs text-red-400 hover:text-red-300"
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
                <th className="pb-3">Total</th>
                <th className="pb-3">Taxa B2B</th>
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
                  className="w-full rounded-xl bg-slate-950 border border-white/10 pl-3 pr-8 py-2.5 text-sm text-white font-bold focus:border-[#00D287] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Exemplo: Para uma venda de R$ 1.000,00 com 6.5%, a taxa retida será de R$ 65,00 e o lojista receberá R$ 935,00.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingFee}
              className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs shadow-lg shadow-[#00D287]/20 transition-all disabled:opacity-50"
            >
              {isSavingFee ? 'Salvando...' : 'Salvar Nova Taxa'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
