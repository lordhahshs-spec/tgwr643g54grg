import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Heart, 
  Plus, 
  ExternalLink, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  Trash2,
  Building2,
  Printer,
  Download,
  Eye,
  RefreshCw,
  Box,
  MapPin,
  FileText
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  MarketplaceOrder, 
  OrderStatus,
  ShippingStatus 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService } from '@/services/melhorEnvioService';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface MyMarketplacePanelProps {
  currentUser: UserAccount;
  onOpenCreateModal: () => void;
  onSelectOffer: (offer: MarketplaceOffer) => void;
}

export const MyMarketplacePanel: React.FC<MyMarketplacePanelProps> = ({
  currentUser,
  onOpenCreateModal,
  onSelectOffer,
}) => {
  const [subTab, setSubTab] = useState<'ofertas' | 'vendas' | 'compras' | 'favoritos'>('ofertas');
  const [myOffers, setMyOffers] = useState<MarketplaceOffer[]>([]);
  const [mySales, setMySales] = useState<MarketplaceOrder[]>([]);
  const [myPurchases, setMyPurchases] = useState<MarketplaceOrder[]>([]);
  const [favoriteOffers, setFavoriteOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Tracking Code Input state per order
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [offers, sales, purchases, allOffers, favIds] = await Promise.all([
        marketplaceService.getOffers({ sellerId: currentUser.id, status: 'todas' }),
        marketplaceService.getSellerOrders(currentUser.id),
        marketplaceService.getBuyerOrders(currentUser.id),
        marketplaceService.getOffers({ status: 'todas' }),
        marketplaceService.getFavorites(currentUser.id),
      ]);

      setMyOffers(offers);
      setMySales(sales);
      setMyPurchases(purchases);
      setFavoriteOffers(allOffers.filter((o) => favIds.includes(o.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleToggleOfferStatus = async (offer: MarketplaceOffer) => {
    const nextStatus = offer.status === 'publicada' ? 'pausada' : 'publicada';
    const success = await marketplaceService.updateOffer(offer.id, { status: nextStatus });
    if (success) {
      toast.success(`Oferta ${nextStatus === 'publicada' ? 'reativada' : 'pausada'} com sucesso!`);
      loadData();
    } else {
      toast.error('Erro ao atualizar status da oferta.');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta oferta permanentemente?')) {
      const success = await marketplaceService.deleteOffer(id);
      if (success) {
        toast.success('Oferta excluída com sucesso.');
        loadData();
      } else {
        toast.error('Erro ao excluir oferta.');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const trackingCode = trackingInputs[orderId];
    const success = await marketplaceService.updateOrderStatus(orderId, status, trackingCode);
    if (success) {
      toast.success('Status do pedido atualizado com sucesso!');
      loadData();
    } else {
      toast.error('Erro ao atualizar pedido.');
    }
  };

  // Gerar / Comprar Etiqueta via Melhor Envio
  const handlePurchaseLabel = async (orderId: string) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await melhorEnvioService.createAndPurchaseLabel(orderId);
      if (res.success) {
        toast.success('Etiqueta gerada com sucesso via Melhor Envio!');
        loadData();
      } else {
        toast.error(res.error || 'Erro ao gerar etiqueta no Melhor Envio.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro de comunicação ao gerar etiqueta.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Consultar Rastreamento Atualizado
  const handleSyncTracking = async (orderId: string, shipmentId?: string) => {
    setActionLoading((prev) => ({ ...prev, [`track_${orderId}`]: true }));
    try {
      const res = await melhorEnvioService.trackShipment({ orderId, shipmentId });
      if (res.success) {
        toast.success('Rastreamento sincronizado com o Melhor Envio!');
        loadData();
      } else {
        toast.info(res.error || 'Aguardando primeiros eventos de rastreio.');
      }
    } catch (err) {
      toast.error('Erro ao sincronizar rastreamento.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`track_${orderId}`]: false }));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(id);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const getOrderStatusBadge = (st: OrderStatus, shippingSt?: ShippingStatus) => {
    if (shippingSt === 'etiqueta_disponivel') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">Etiqueta Pronta p/ Imprimir</span>;
    }
    if (shippingSt === 'postado' || st === 'enviado') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Postado / Despachado</span>;
    }
    if (shippingSt === 'em_transito' || st === 'em_transito') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">Em Trânsito</span>;
    }
    if (shippingSt === 'entregue' || st === 'entregue' || st === 'finalizado') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Entregue & Concluído</span>;
    }
    if (shippingSt === 'erro_envio') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">Erro no Envio</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">Aguardando Envio</span>;
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 bg-[#080c17] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setSubTab('ofertas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'ofertas'
                ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Minhas Ofertas ({myOffers.length})
          </button>

          <button
            onClick={() => setSubTab('vendas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'vendas'
                ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Minhas Vendas ({mySales.length})
          </button>

          <button
            onClick={() => setSubTab('compras')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'compras'
                ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Minhas Compras ({myPurchases.length})
          </button>

          <button
            onClick={() => setSubTab('favoritos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'favoritos'
                ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            Favoritos ({favoriteOffers.length})
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Super Oferta
        </button>
      </div>

      {/* TAB CONTENT: MINHAS OFERTAS */}
      {subTab === 'ofertas' && (
        <div className="space-y-4">
          {myOffers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0a0f1e] border border-white/5 space-y-4">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">Você ainda não tem ofertas cadastradas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre peças, placas, telas ou equipamentos e venda com rapidez para outros lojistas com frete Melhor Envio.
                </p>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="px-6 py-2.5 rounded-xl bg-[#00D287] text-slate-950 text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeira Oferta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex gap-3">
                    <img
                      src={offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                      alt=""
                      className="w-16 h-22 rounded-xl object-cover object-center bg-slate-950 flex-shrink-0 border border-white/5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          offer.status === 'publicada'
                            ? 'bg-emerald-500/20 text-[#00D287]'
                            : offer.status === 'vendida'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {offer.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">{offer.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-1">{offer.title}</h4>
                      <p className="text-sm font-black text-white mt-1">{formatBRL(offer.price)}</p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#00D287]" />
                        {offer.shippingPolicy === 'frete_gratis' || offer.freeShipping ? 'Frete Grátis' : 'Cliente paga frete'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectOffer(offer)}
                      className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Detalhes
                    </button>

                    <div className="flex items-center gap-1">
                      {offer.status !== 'vendida' && (
                        <button
                          onClick={() => handleToggleOfferStatus(offer)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                          title={offer.status === 'publicada' ? 'Pausar oferta' : 'Reativar oferta'}
                        >
                          {offer.status === 'publicada' ? (
                            <PauseCircle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-[#00D287]" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Excluir oferta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MINHAS VENDAS */}
      {subTab === 'vendas' && (
        <div className="space-y-4">
          {mySales.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0a0f1e] border border-white/5">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhuma venda registrada ainda</h3>
              <p className="text-xs text-slate-400 mt-1">
                Suas vendas com retenção segura em custódia e etiquetas do Melhor Envio aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySales.map((order) => {
                const quote = order.shippingQuoteSnapshot;
                const origin = order.shippingOriginSnapshot;
                const dest = order.shippingDestinationSnapshot || order.shippingAddress;
                const printUrl = order.melhorEnvioPrintUrl || order.melhorEnvioLabelUrl;

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">Pedido #{order.id.slice(0, 8)}</span>
                          {getOrderStatusBadge(order.orderStatus, order.shippingStatus)}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{order.productTitle}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Líquido a Receber</span>
                        <span className="text-base font-black text-[#00D287]">
                          {formatBRL(order.sellerNetAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Buyer & Logistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Buyer */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#00D287]" /> Lojista Comprador
                        </span>
                        <p className="text-white font-medium">{order.buyerCompany} ({order.buyerOwner})</p>
                        <p className="text-slate-400">CNPJ: {order.buyerCnpj || 'Não informado'}</p>
                        <p className="text-slate-400">Email: {order.buyerEmail}</p>
                      </div>

                      {/* Delivery Destination */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" /> Destino da Mercadoria
                        </span>
                        {dest ? (
                          <p className="text-slate-300">
                            {dest.street}, {dest.number} {dest.complement ? `(${dest.complement})` : ''}
                            <br />
                            {dest.neighborhood} • {dest.city}/{dest.state} • CEP {dest.zipCode}
                          </p>
                        ) : (
                          <p className="text-slate-500">Endereço de destino não informado</p>
                        )}
                      </div>

                      {/* Shipping & Carrier */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-400" /> Transportadora & Custo
                        </span>
                        <p className="text-white font-semibold">
                          {quote ? `${quote.company.name} (${quote.name})` : 'Melhor Envio'}
                        </p>
                        <p className="text-slate-400">
                          Frete cobrado: {order.shippingAmountCharged === 0 ? 'Grátis (R$ 0,00)' : formatBRL(order.shippingAmountCharged || 0)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Custo real etiqueta: <strong className="text-slate-200">{formatBRL(order.actualShippingCost || 0)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Shipping Action Area: Labels & Instructions */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/20 to-slate-950/50 border border-[#00D287]/20 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#00D287] uppercase tracking-wider block">
                            Área de Envio • Melhor Envio
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {order.trackingCode ? (
                              <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-white/10 flex items-center gap-1.5">
                                Rastreio: {order.trackingCode}
                                <button onClick={() => handleCopy(order.trackingCode!, order.id)} title="Copiar código">
                                  {copiedTracking === order.id ? <Check className="w-3 h-3 text-[#00D287]" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                </button>
                              </span>
                            ) : (
                              <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Etiqueta aguardando postagem
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Buttons for Label */}
                        <div className="flex flex-wrap items-center gap-2">
                          {printUrl ? (
                            <>
                              <a
                                href={printUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all"
                              >
                                <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta
                              </a>

                              <a
                                href={printUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`etiqueta-${order.id.slice(0, 8)}.pdf`}
                                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                              >
                                <Download className="w-3.5 h-3.5" /> Baixar
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePurchaseLabel(order.id)}
                              disabled={actionLoading[order.id]}
                              className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading[order.id] ? 'animate-spin' : ''}`} />
                              Gerar Etiqueta Agora
                            </button>
                          )}

                          {order.melhorEnvioShipmentId && (
                            <button
                              onClick={() => handleSyncTracking(order.id, order.melhorEnvioShipmentId)}
                              disabled={actionLoading[`track_${order.id}`]}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                              title="Atualizar rastreamento"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading[`track_${order.id}`] ? 'animate-spin' : ''}`} />
                              Rastrear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Instructions for Seller */}
                      <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#00D287]/20 text-[#00D287] font-bold flex items-center justify-center text-[9px]">1</span>
                          <span>Imprima a etiqueta oficial</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#00D287]/20 text-[#00D287] font-bold flex items-center justify-center text-[9px]">2</span>
                          <span>Embale e fixe a etiqueta</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#00D287]/20 text-[#00D287] font-bold flex items-center justify-center text-[9px]">3</span>
                          <span>Poste nos Correios/Jadlog</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#00D287]/20 text-[#00D287] font-bold flex items-center justify-center text-[9px]">4</span>
                          <span>Rastreio atualiza automático</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MINHAS COMPRAS */}
      {subTab === 'compras' && (
        <div className="space-y-4">
          {myPurchases.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0a0f1e] border border-white/5">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Você não realizou compras ainda</h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore a vitrine de Super Ofertas e compre com garantia de pagamento em custódia e frete rastreado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPurchases.map((order) => {
                const quote = order.shippingQuoteSnapshot;
                const isDelivered = order.orderStatus === 'entregue' || order.shippingStatus === 'entregue';
                const isPosted = order.shippingStatus === 'postado' || order.shippingStatus === 'em_transito' || order.orderStatus === 'enviado';

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex-shrink-0">
                          <img
                            src={order.productImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">Pedido #{order.id.slice(0, 8)}</span>
                            {getOrderStatusBadge(order.orderStatus, order.shippingStatus)}
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{order.productTitle}</h4>
                          <p className="text-xs text-slate-400">Vendedor: {order.sellerCompany}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total Pago</span>
                        <span className="text-base font-black text-white">
                          {formatBRL(order.totalAmount)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Frete: {order.shippingAmountCharged === 0 ? 'Grátis' : formatBRL(order.shippingAmountCharged || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Tracking & Delivery Progression */}
                    <div className="pt-2 border-t border-white/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#00D287]" />
                          <span className="text-slate-400">Transportadora:</span>
                          <span className="text-white font-semibold">
                            {quote ? `${quote.company.name} (${quote.name})` : 'Melhor Envio'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Código de Rastreio:</span>
                          {order.trackingCode ? (
                            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10">
                              <span className="font-mono font-bold text-white">{order.trackingCode}</span>
                              <button
                                onClick={() => handleCopy(order.trackingCode!, order.id)}
                                className="text-slate-400 hover:text-white"
                                title="Copiar rastreio"
                              >
                                {copiedTracking === order.id ? <Check className="w-3.5 h-3.5 text-[#00D287]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-400 font-medium">Aguardando postagem</span>
                          )}

                          {order.melhorEnvioShipmentId && (
                            <button
                              onClick={() => handleSyncTracking(order.id, order.melhorEnvioShipmentId)}
                              disabled={actionLoading[`track_${order.id}`]}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                              title="Consultar rastreio"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading[`track_${order.id}`] ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold pt-1">
                        <div className={`p-1.5 rounded-lg border ${order.paymentStatus === 'pago' ? 'bg-[#00D287]/15 border-[#00D287]/30 text-[#00D287]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          ✓ 1. Pagamento Confirmado
                        </div>
                        <div className={`p-1.5 rounded-lg border ${isPosted ? 'bg-[#00D287]/15 border-[#00D287]/30 text-[#00D287]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          {isPosted ? '✓ 2. Postado em Trânsito' : '2. Aguardando Postagem'}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${isDelivered ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          {isDelivered ? '✓ 3. Mercadoria Entregue' : '3. Entrega'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FAVORITOS */}
      {subTab === 'favoritos' && (
        <div className="space-y-4">
          {favoriteOffers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0a0f1e] border border-white/5">
              <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhuma oferta favoritada</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ao navegar pelas Super Ofertas, clique no ícone de coração para salvar itens de seu interesse.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-4 cursor-pointer"
                  onClick={() => onSelectOffer(offer)}
                >
                  <div className="flex gap-3">
                    <img
                      src={offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                      alt=""
                      className="w-16 h-22 rounded-xl object-cover object-center bg-slate-950 flex-shrink-0 border border-white/5"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400">{offer.category}</span>
                      <h4 className="text-xs font-bold text-white truncate mt-1">{offer.title}</h4>
                      <p className="text-sm font-black text-[#00D287] mt-1">{formatBRL(offer.price)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
                    <span>{offer.sellerCompany}</span>
                    <span className="text-[#00D287] font-semibold flex items-center gap-1">
                      Ver Oferta <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
