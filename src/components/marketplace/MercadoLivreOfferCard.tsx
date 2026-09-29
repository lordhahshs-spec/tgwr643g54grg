import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, ShieldCheck, Zap, ArrowRight, CheckCircle2, ArrowDown } from 'lucide-react';

interface MercadoLivreOfferCardProps {
  offer: MarketplaceOffer;
  isFavorite: boolean;
  onToggleFavorite?: (offerId: string, e: React.MouseEvent) => void;
  onSelect?: (offer: MarketplaceOffer) => void;
  onClick?: () => void;
  onBuyClick?: () => void;
}

export const MercadoLivreOfferCard: React.FC<MercadoLivreOfferCardProps> = ({
  offer,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onClick,
  onBuyClick,
}) => {
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const primaryImage = offer.images?.[0] || '';
  const installment12x = offer.price / 12;
  const salesCount = offer.salesCount || 0;

  // Cálculo e verificação de desconto ativo
  const hasDiscount = Boolean(
    (offer.originalPrice && offer.originalPrice > offer.price) ||
    (offer.discountPercent && offer.discountPercent > 0)
  );

  const discountPercent = offer.discountPercent || (
    offer.originalPrice && offer.originalPrice > offer.price
      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
      : 0
  );

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(offer);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#090e1c] hover:bg-[#0d152a] active:scale-[0.98] transition-all duration-200 border border-white/10 hover:border-[#00D287]/50 rounded-2xl p-3 sm:p-3.5 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#00D287]/10 flex flex-col justify-between select-none touch-manipulation"
    >
      <div>
        {/* Imagem do Produto (Estilo Catálogo Mercado Livre) */}
        <div className="relative w-full aspect-square rounded-xl bg-[#040711] overflow-hidden flex items-center justify-center p-2 mb-2.5 border border-white/5 group-hover:border-white/10 transition-colors">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={offer.title}
              className="w-full h-full object-contain p-1 group-hover:scale-105 group-active:scale-95 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-600 text-xs">Sem foto</div>
          )}

          {/* Selo FULL / Oficial CellHub (Superior Esquerdo) */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
            <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/30 tracking-tight flex items-center gap-1 uppercase">
              <Zap className="w-2.5 h-2.5 fill-slate-950" /> FULL OFICIAL
            </span>
          </div>

          {/* Canto Superior Direito: Indicador de Desconto com Setinha Vermelha & Urgência */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
            {hasDiscount && discountPercent > 0 && (
              <div 
                className="flex items-center gap-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-lg shadow-red-600/50 border border-red-400/50 animate-pulse tracking-tight"
                title={`Desconto de ${discountPercent}% aplicado nesta oferta!`}
              >
                <div className="bg-white/20 p-0.5 rounded-full">
                  <ArrowDown className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                </div>
                <span>{discountPercent}% OFF</span>
              </div>
            )}

            {/* Botão de Favorito */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(offer.id, e);
              }}
              className={`p-1.5 rounded-xl backdrop-blur-md transition-all active:scale-90 ${
                isFavorite
                  ? 'text-rose-500 bg-rose-500/20 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-black/60 hover:bg-black/80 border border-white/10'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Linha 1: Condição + Vendas */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1">
          <span className="truncate font-medium text-slate-400">{offer.category} • {offer.condition}</span>
          {salesCount > 0 ? (
            <span className="text-[#00D287] font-bold text-[9.5px] sm:text-[10px] bg-[#00D287]/10 px-1.5 py-0.2 rounded">
              +{salesCount} vendidos
            </span>
          ) : null}
        </div>

        {/* Linha 2: Título do Produto */}
        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors min-h-[34px] sm:min-h-[38px]">
          {offer.title}
        </h3>

        {/* Linha 3: Preço Principal com De / Por e Desconto */}
        <div className="mt-2.5">
          {hasDiscount && offer.originalPrice && offer.originalPrice > offer.price && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] sm:text-xs text-slate-400 line-through font-semibold">
                {formatBRL(offer.originalPrice)}
              </span>
              <span className="text-[9.5px] sm:text-[10px] font-black text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30 flex items-center gap-0.5">
                <ArrowDown className="w-2.5 h-2.5 stroke-[3] text-rose-400" />
                -{discountPercent}%
              </span>
            </div>
          )}

          <div className="text-base sm:text-xl font-black text-[#00D287] tracking-tight leading-none">
            {formatBRL(offer.price)}
          </div>
          <div className="text-[10.5px] sm:text-xs text-slate-300 font-semibold mt-1 truncate">
            em <span className="text-[#00D287]">12x de {formatBRL(installment12x)}</span> sem juros
          </div>
        </div>

        {/* Linha 4: Frete Grátis & Envio Direto */}
        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
          {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
            <div className="flex items-center gap-1 font-bold text-emerald-400 text-[11px] sm:text-xs">
              <Truck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Frete grátis</span>
              <span className="text-[9px] font-normal text-slate-400 ml-1">Enviado pela CellHub</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#00D287] flex-shrink-0" />
              <span>Envio Expresso Rastreado</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-[#00D287] flex-shrink-0" />
            <span>Garantia CellHub: <strong>{offer.warrantyDays || 90} dias</strong></span>
          </div>
        </div>
      </div>

      {/* Linha 5: Botão Comprar / Detalhes */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-[#00D287]" />
          Estoque Oficial
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onBuyClick) {
              onBuyClick();
            } else if (onSelect) {
              onSelect(offer);
            } else if (onClick) {
              onClick();
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-[#00D287]/15 hover:bg-[#00D287] text-[#00D287] hover:text-slate-950 text-[10.5px] font-black flex items-center gap-1 transition-all border border-[#00D287]/30 cursor-pointer"
        >
          <span>Ver Produto</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
