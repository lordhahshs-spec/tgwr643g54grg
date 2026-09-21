import React, { useState } from 'react';
import { MarketplaceOffer, MarketplaceReport } from '@/types/marketplace';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Eye, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  ShoppingBag, 
  MessageCircle,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { marketplaceService } from '@/services/marketplaceService';
import { toast } from 'sonner';

interface OfferDetailsModalProps {
  offer: MarketplaceOffer | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (offerId: string, e: React.MouseEvent) => void;
  onInitiateCheckout: (offer: MarketplaceOffer) => void;
  currentUserId?: string;
  currentUserCompany?: string;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  onClose,
  isFavorite,
  onToggleFavorite,
  onInitiateCheckout,
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

  const images = offer.images && offer.images.length > 0
    ? offer.images
    : ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=60'];

  const isOwner = currentUserId && offer.sellerId === currentUserId;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link da oferta copiado para a área de transferência!');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error('Faça login para denunciar esta oferta.');
      return;
    }
    setIsSubmittingReport(true);
    const success = await marketplaceService.reportOffer({
      offerId: offer.id,
      offerTitle: offer.title,
      reportedByUserId: currentUserId,
      reportedByCompany: currentUserCompany || 'Lojista CellHub',
      reason: reportReason,
      details: reportDetails,
    });
    setIsSubmittingReport(false);

    if (success) {
      toast.success('Denúncia enviada com sucesso à equipe de moderação B2B.');
      setShowReportDialog(false);
      setReportDetails('');
    } else {
      toast.error('Erro ao enviar denúncia. Tente novamente.');
    }
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Olá ${offer.sellerOwner} (${offer.sellerCompany}), vi sua oferta no Marketplace B2B CellHub: "${offer.title}" no valor de ${formatBRL(offer.price)}. Gostaria de mais detalhes sobre a disponibilidade e envio!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#070b16] border border-[#00D287]/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080c17]/90">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider">
              B2B Super Oferta
            </span>
            <span className="text-xs text-slate-400">
              Ref: {offer.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Compartilhar oferta"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onToggleFavorite(offer.id, e)}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
              }`}
              title="Favoritar"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
          {/* Left Column: Gallery (5 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Main Featured Photo */}
            <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center group shadow-inner">
              <img
                src={images[activeImageIndex]}
                alt={offer.title}
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-white/10">
                Foto {activeImageIndex + 1} de {images.length}
              </div>
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#00D287] scale-105 shadow-md shadow-[#00D287]/20'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* B2B Safety Notice Box */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#00D287]" />
                Transação 100% Protegida CellHub
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                O valor pago pelo lojista comprador fica retido em custódia na plataforma até a confirmação do código de rastreio e entrega do produto em perfeito estado.
              </p>
            </div>
          </div>

          {/* Right Column: Details & Pricing (7 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              {/* Category & Condition tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-[#00D287] border border-emerald-500/30">
                  {offer.condition}
                </span>
                <span className="px-2.5 py-1 text-xs text-slate-300 font-medium">
                  {offer.salesCount && offer.salesCount > 0 ? `+${offer.salesCount} vendidos` : 'Nenhum vendido ainda'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-1 text-xs text-slate-400">
                  {offer.rating && offer.reviewsCount && offer.reviewsCount > 0 ? `★ ${offer.rating} (${offer.reviewsCount} avaliações)` : 'Sem avaliações ainda'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {offer.title}
              </h1>

              {/* Seller Box Card */}
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center font-black text-lg border border-[#00D287]/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{offer.sellerCompany}</h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
                    </div>
                    <p className="text-xs text-slate-400">Responsável: {offer.sellerOwner}</p>
                    <p className="text-[11px] text-[#00D287] flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Lojista Cadastrado e Verificado
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppContact}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Falar direto no WhatsApp do lojista"
                >
                  <MessageCircle className="w-4 h-4 text-[#00D287]" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>

              {/* Price Block */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0a0f1f] to-[#070b16] border border-[#00D287]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Preço Especial Lojista (B2B)
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                    {formatBRL(offer.price)}
                    <span className="text-xs font-semibold text-[#00D287]">PIX ou Cartão</span>
                  </div>
                </div>

                <div>
                  {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-xl">
                      <Truck className="w-5 h-5 text-[#00D287]" />
                      <div>
                        <span>Frete Grátis</span>
                        <span className="block text-[10px] font-normal text-slate-400">Vendedor assume o envio</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Frete Melhor Envio</span>
                      <span className="text-xs font-bold text-[#00D287]">
                        Calculado no checkout
                      </span>
                      {offer.originCity && (
                        <span className="block text-[10px] text-slate-500">
                          Enviado de: {offer.originCity}/{offer.originState}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#00D287]" /> Descrição do Produto
                </h4>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {offer.description}
                </div>
              </div>

              {/* Technical Details if available */}
              {offer.details && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#00D287]" /> Especificações Técnicas / Lote
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                    {offer.details}
                  </div>
                </div>
              )}

              {/* Meta stats */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {offer.views} visualizações
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Publicado em {new Date(offer.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              {isOwner ? (
                <div className="w-full p-3 text-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  Esta é a sua própria oferta cadastrada. Você pode gerenciá-la na aba "Minhas Ofertas".
                </div>
              ) : offer.status !== 'publicada' ? (
                <div className="w-full p-3 text-center rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
                  Esta oferta não está mais disponível para compra ({offer.status}).
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onInitiateCheckout(offer)}
                    className="flex-1 py-4 px-6 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-extrabold text-base shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <ShoppingBag className="w-5 h-5 text-slate-950" />
                    Comprar Agora (Checkout B2B)
                  </button>

                  <button
                    onClick={() => setShowReportDialog(true)}
                    className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Denunciar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Report Submodal */}
        {showReportDialog && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c1222] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  Denunciar Oferta B2B
                </div>
                <button
                  onClick={() => setShowReportDialog(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Motivo da Denúncia
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e: any) => setReportReason(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:border-red-500 focus:outline-none"
                  >
                    <option value="informacao_falsa">Informações falsas ou enganosas</option>
                    <option value="produto_proibido">Produto proibido / Ilegal</option>
                    <option value="fraude">Suspeita de golpe ou fraude</option>
                    <option value="preco_enganoso">Preço abusivo ou incorreto</option>
                    <option value="conteudo_inadequado">Fotos ou termos inadequados</option>
                    <option value="outro">Outro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Detalhes adicionais (opcional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    placeholder="Descreva o problema encontrado..."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReport ? 'Enviando...' : 'Confirmar Denúncia'}
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
