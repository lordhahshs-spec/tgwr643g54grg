import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Zap, ArrowRight, CheckCircle2, ArrowDown } from 'lucide-react';

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

  // Verificação de desconto promocional real
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
      className="group relative bg-[#090e1c] hover:bg-[#0c1428] active:scale-[0.99] transition-all duration-200 border border-white/10 hover:border-white/20 rounded-2xl p-3 sm:p-3.5 cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between select-none touch-manipulation"
    >
      <div>
        {/* Imagem do Produto */}
        <div className="relative w-full aspect-square rounded-xl bg-[#040711] overflow-hidden flex items-center justify-center p-2 mb-2.5 border border-white/5 group-hover:border-white/10 transition-colors">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={offer.title}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-600 text-xs">Sem foto</div>
          )}

          {/* Selo Promocional Vermelho no Canto Superior Esquerdo da Foto */}
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-2 py-0.5 rounded-full shadow-lg shadow-red-600/40 border border-red-400/40 flex items-center gap-1 z-10 animate-pulse">
              <ArrowDown className="w-3 h-3 stroke-[3]" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}

          {/* Botão de Favorito no Canto Superior Direito */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(offer.id, e);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 z-10 ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/20 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-black/50 hover:bg-black/80 border border-white/10'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Linha 1: Categoria & Condição */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1 truncate font-medium">
          <span className="truncate">{offer.category} • {offer.condition}</span>
          {offer.compatibleBrand && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded shrink-0">
              {offer.compatibleBrand}
            </span>
          )}
        </div>
        </div>

        {/* Linha 2: Título do Produto */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors min-h-[34px] sm:min-h-[38px]">
          {offer.title}
        </h3>

        {/* Linha 3: Bloco de Preço Padrão Mercado Livre com Destaque de Desconto */}
        <div className="mt-2 space-y-0.5">
          {/* Preço Original Riscado + Tag Vermelha */}
          {hasDiscount && offer.originalPrice && offer.originalPrice > offer.price ? (
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[11px] text-slate-400 line-through font-normal">
                {formatBRL(offer.originalPrice)}
              </span>
              <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 px-1 py-0.2 rounded border border-rose-500/30 flex items-center gap-0.5">
                <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                -{discountPercent}%
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-transparent select-none block leading-none">
              -
            </span>
          )}

          {/* Preço Principal + Desconto % na Mesma Linha */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
              {formatBRL(offer.price)}
            </span>
            {hasDiscount && discountPercent > 0 && (
              <span className="text-xs font-bold text-emerald-400 tracking-tight leading-none">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Parcelamento em 12x Sem Juros */}
          <div className="text-[11px] text-emerald-400 font-medium truncate pt-0.5">
            em <span className="font-bold">12x {formatBRL(installment12x)}</span> sem juros
          </div>
        </div>

        {/* Linha 4: Frete Grátis & Selo FULL Mercado Livre */}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
          <span>Frete grátis</span>
          <span className="inline-flex items-center gap-0.5 text-[#00D287] font-black italic tracking-tighter text-[10px] bg-[#00D287]/15 px-1.5 py-0.2 rounded">
            <Zap className="w-2.5 h-2.5 fill-[#00D287]" /> FULL
          </span>
        </div>

        {/* Garantia */}
        <div className="text-[10px] text-slate-400 mt-1 truncate">
          Garantia CellHub: <strong>{offer.warrantyDays || 90} dias</strong>
        </div>
      </div>

      {/* Linha 5: Rodapé com Estoque Oficial e Botão Ver Produto */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate">
          <CheckCircle2 className="w-3 h-3 text-[#00D287] flex-shrink-0" />
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
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00D287] text-slate-200 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-all border border-white/10 hover:border-[#00D287] cursor-pointer flex-shrink-0"
        >
          <span>Ver produto</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
