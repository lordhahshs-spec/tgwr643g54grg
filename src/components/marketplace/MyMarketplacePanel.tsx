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
  Building2
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  MarketplaceOrder, 
  OrderStatus 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(id);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const getOrderStatusBadge = (st: OrderStatus) => {
    switch (st) {
      case 'aguardando_envio':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">Aguardando Envio</span>;
      case 'enviado':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Despachado / Enviado</span>;
      case 'em_transito':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">Em Trânsito</span>;
      case 'entregue':
      case 'finalizado':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Concluído & Entregue</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-700 text-slate-300">Cancelado</span>;
    }
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
                  Cadastre peças, placas, telas ou equipamentos e venda com rapidez para outros lojistas.
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
                Suas vendas com retenção segura em custódia e dados de envio aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySales.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">Pedido #{order.id.slice(0, 8)}</span>
                        {getOrderStatusBadge(order.orderStatus)}
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

                  {/* Buyer & Delivery Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                      <span className="font-bold text-slate-300 block">Dados do Lojista Comprador:</span>
                      <p className="text-slate-200 font-medium">{order.buyerCompany} ({order.buyerOwner})</p>
                      <p className="text-slate-400">CNPJ: {order.buyerCnpj || 'Não informado'}</p>
                      <p className="text-slate-400">Email: {order.buyerEmail}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                      <span className="font-bold text-slate-300 block">Endereço de Envio:</span>
                      {order.shippingAddress ? (
                        <p className="text-slate-300">
                          {order.shippingAddress.street}, {order.shippingAddress.number} {order.shippingAddress.complement}
                          <br />
                          {order.shippingAddress.neighborhood} • {order.shippingAddress.city} - {order.shippingAddress.state} • CEP {order.shippingAddress.zipCode}
                        </p>
                      ) : (
                        <p className="text-slate-500">Endereço a combinar com o comprador</p>
                      )}
                    </div>
                  </div>

                  {/* Tracking Dispatch Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Insira o Código de Rastreio (Correios / Jadlog)"
                        defaultValue={order.trackingCode || ''}
                        onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                        className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'enviado')}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" /> Despachar
                      </button>
                    </div>

                    {order.orderStatus === 'enviado' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'entregue')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                Explore a vitrine de Super Ofertas e compre com garantia de pagamento em custódia.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPurchases.map((order) => (
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
                          {getOrderStatusBadge(order.orderStatus)}
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
                    </div>
                  </div>

                  {/* Tracking Code Display */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#00D287]" />
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
                        <span className="text-amber-400 font-medium">Aguardando postagem pelo vendedor</span>
                      )}
                    </div>

                    <span className="text-slate-500 text-[11px]">
                      Comprado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
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
                Clique no ícone de coração em qualquer oferta para salvá-la nesta lista.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteOffers.map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => onSelectOffer(offer)}
                  className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 hover:border-[#00D287]/30 transition-all cursor-pointer flex gap-3"
                >
                  <img
                    src={offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover bg-slate-950 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#00D287] uppercase">{offer.condition}</span>
                    <h4 className="text-xs font-bold text-white truncate">{offer.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{offer.sellerCompany}</p>
                    <p className="text-sm font-black text-white mt-1">{formatBRL(offer.price)}</p>
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
