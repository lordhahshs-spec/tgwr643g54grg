import React, { useState } from 'react';
import { MarketplaceOffer, MarketplaceReport } from '@/types/marketplace';
import {
  X,
  Heart,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Share2,
  ShoppingBag,
  Zap,
  ArrowDown,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface OfferDetailsModalProps {
  offer: MarketplaceOffer | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (offerId: string, e: React.MouseEvent) => void;
  onInitiateCheckout?: (offer: MarketplaceOffer) => void;
  onBuyNow?: (offer: MarketplaceOffer) => void;
  currentUserId?: string;
  currentUserCompany?: string;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  onClose,
  isFavorite,
  onToggleFavorite,
  onInitiateCheckout,
  onBuyNow,
  currentUserId,
  currentUserCompany,
}) => {
  if (!offer) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<MarketplaceReport['reason']>('informacao_falsa');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const hasDiscount = Boolean(
    (offer.originalPrice && offer.originalPrice > offer.price) ||
    (offer.discountPercent && offer.discountPercent > 0)
  );

  const discountPercent = offer.discountPercent || (
    offer.originalPrice && offer.originalPrice > offer.price
      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
      : 0
  );

  const images = (offer.images && offer.images.length > 0) 
    ? offer.images 
    : (offer.image ? [offer.image] : []);

  const isOwner = currentUserId && (
    offer.sellerId === currentUserId || 
    offer.sellerCompany === currentUserCompany
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer.title,
          text: `Confira este produto no CellHub: ${offer.title} por ${formatBRL(offer.price)}`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignorar cancelamento
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error('Você precisa estar logado para reportar uma oferta.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      // Simulação rápida de denúncia
      await new Promise(r => setTimeout(r, 600));
      toast.success('Denúncia enviada aos administradores.');
      setShowReportDialog(false);
    } catch (error) {
      toast.error('Erro ao enviar denúncia.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCheckoutClick = () => {
    if (onInitiateCheckout) {
      onInitiateCheckout(offer);
    } else if (onBuyNow) {
      onBuyNow(offer);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center md:p-5 bg-black/90 md:backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-4xl bg-[#070b14] md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar: Mobile App Header vs Desktop Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#060911]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Botão Voltar Estilo App Mercado Livre no Mobile */}
            <button
              onClick={onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
              <span className="text-xs">Voltar</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#00D287]" /> {offer.isOfficial ? 'Oficial' : 'Oferta B2B'}
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
                #{offer.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onToggleFavorite?.(offer.id, e)}
              className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
              }`}
              title="Favoritar"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 custom-scrollbar pb-28 md:pb-6">
          
          {/* Coluna Esquerda: Foto Limpa & Galeria (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Foto Principal com Aspect Ratio Quadrado */}
            <div className="relative w-full aspect-square bg-[#04060d] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center p-3 group">
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex]}
                  alt={offer.title}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-slate-600 text-xs">Sem foto</div>
              )}

              {/* Selo Promocional no Modal */}
              {hasDiscount && discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-lg shadow-red-600/40 border border-red-400/40 flex items-center gap-1 z-10 animate-pulse">
                  <ArrowDown className="w-3 h-3 stroke-[3]" />
                  <span>{discountPercent}% OFF</span>
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-slate-400 font-mono">
                  {activeImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Miniaturas em Linha */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all p-1 bg-[#04060d] cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#00D287] scale-105 shadow-sm'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Garantia & Segurança Limpa */}
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1 px-2 rounded-xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              <span className="truncate">Garantia técnica de <strong>{offer.warrantyDays || 90} dias</strong> CellHub</span>
            </div>
          </div>

          {/* Coluna Direita: Informações & Compra (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              
              {/* Categoria & Condição Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-[#00D287] font-semibold">{offer.category}</span>
                <span>•</span>
                <span>{offer.condition}</span>
                {offer.salesCount && offer.salesCount > 0 ? (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">+{offer.salesCount} vendidos</span>
                  </>
                ) : null}
              </div>

              {/* Título Principal */}
              <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                {offer.title}
              </h1>

              {/* Preço & Parcelamento Minimalista Estilo Mercado Livre */}
              <div className="pt-2 pb-3 border-y border-white/5 space-y-1">
                {hasDiscount && offer.originalPrice && offer.originalPrice > offer.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 line-through font-normal">
                      {formatBRL(offer.originalPrice)}
                    </span>
                    <span className="text-xs font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 stroke-[3]" />
                      -{discountPercent}% OFF
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {formatBRL(offer.price)}
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-emerald-400 font-medium">
                  em <span className="font-bold">12x de {formatBRL(offer.price / 12)}</span> sem juros
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                  <span>Frete grátis</span>
                  <span className="inline-flex items-center gap-0.5 text-[#00D287] font-black italic tracking-tighter text-[10px] bg-[#00D287]/15 px-1.5 py-0.2 rounded">
                    <Zap className="w-2.5 h-2.5 fill-[#00D287]" /> FULL
                  </span>
                </div>
              </div>

              {/* Descrição do Produto */}
              {offer.description && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Detalhes do Produto
                  </span>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 max-h-36 overflow-y-auto">
                    {offer.description}
                  </div>
                </div>
              )}

              {/* Especificações Técnicas */}
              {offer.details && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Especificações
                  </span>
                  <div className="text-xs text-slate-300 font-mono bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    {offer.details}
                  </div>
                </div>
              )}
            </div>

            {/* Ações de Compra (Fixado na base no Mobile estilo Mercado Livre / Shopee) */}
            <div className="fixed md:static bottom-0 left-0 right-0 bg-[#060911]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-white/10 md:border-t md:border-white/5 p-3.5 md:p-0 md:pt-3 z-30 pb-[max(env(safe-area-inset-bottom,0px),12px)] md:pb-0 space-y-2 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] md:shadow-none">
              {isOwner ? (
                <div className="w-full p-3 text-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  Você é o administrador responsável por este produto no catálogo oficial.
                </div>
              ) : offer.status !== 'publicada' ? (
                <div className="w-full p-3 text-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
                  Este produto está temporariamente pausado.
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCheckoutClick}
                    className="flex-1 py-3.5 px-5 rounded-2xl md:rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Comprar Agora • {formatBRL(offer.price)}</span>
                  </button>

                  <button
                    onClick={() => setShowReportDialog(true)}
                    className="p-3.5 md:p-3 rounded-2xl md:rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/5 transition-colors cursor-pointer"
                    title="Denunciar"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>⚡ Envio imediato em até 24h</span>
                <span>🔒 Pagamento 100% protegido</span>
              </div>
            </div>

          </div>
        </div>

        {/* Submodal de Denúncia */}
        {showReportDialog && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c1222] border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Reportar Produto
                </span>
                <button
                  onClick={() => setShowReportDialog(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motivo
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="informacao_falsa">Informação falsa / divergente</option>
                    <option value="produto_proibido">Produto não permitido</option>
                    <option value="preco_abusivo">Preço incorreto</option>
                    <option value="outro">Outro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Detalhes (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Descreva o problema..."
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReportDialog(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    {isSubmittingReport ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
