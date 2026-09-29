import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react';

interface HorizontalOfferCardProps {
  offer: MarketplaceOffer;
  isFavorite: boolean;
  onToggleFavorite: (offerId: string, e: React.MouseEvent) => void;
  onSelect: (offer: MarketplaceOffer) => void;
}

export const HorizontalOfferCard: React.FC<HorizontalOfferCardProps> = ({
  offer,
  isFavorite,
  onToggleFavorite,
  onSelect,
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

  const hasDiscount = Boolean(
    (offer.originalPrice && offer.originalPrice > offer.price) ||
    (offer.discountPercent && offer.discountPercent > 0)
  );

  const discountPercent = offer.discountPercent || (
    offer.originalPrice && offer.originalPrice > offer.price
      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
      : 0
  );

  return (
    <div
      onClick={() => onSelect(offer)}
      className="group relative bg-[#090e1c] hover:bg-[#0d152a] active:scale-[0.98] transition-all duration-200 border border-white/10 hover:border-[#00D287]/40 rounded-2xl p-2.5 sm:p-3.5 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[#00D287]/5 flex flex-col justify-between select-none touch-manipulation"
    >
      <div>
        {/* Imagem do Produto com Aspect Ratio Quadrado/Moderno */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl bg-[#040711] overflow-hidden flex items-center justify-center p-2 mb-2 border border-white/5 group-hover:border-white/10 transition-colors">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={offer.title}
              className="w-full h-full object-contain p-0.5 group-hover:scale-105 group-active:scale-95 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-600 text-xs">Sem foto</div>
          )}

          {/* Badge de Condição / Oficial / Super Oferta */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start">
            {offer.isOfficial ? (
              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/30 tracking-tight">
                OFICIAL
              </span>
            ) : offer.isSuperOffer ? (
              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/30 tracking-tight flex items-center gap-0.5">
                SUPER OFERTA 🔥
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-slate-300 border border-white/10">
                {offer.condition}
              </span>
            )}
          </div>

          {/* Canto Superior Direito: Indicador de Desconto com Setinha Vermelha & Favorito */}
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
            {hasDiscount && discountPercent > 0 && (
              <div 
                className="flex items-center gap-0.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-lg shadow-red-600/40 border border-red-400/40 animate-pulse tracking-tight"
                title={`Desconto de ${discountPercent}% aplicado!`}
              >
                <ArrowDown className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                <span>{discountPercent}% OFF</span>
              </div>
            )}

            {/* Botão de Favorito */}
            <button
              type="button"
              onClick={(e) => onToggleFavorite(offer.id, e)}
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

          {/* Badge de indisponibilidade se não estiver publicada */}
          {offer.status !== 'publicada' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                {offer.status === 'vendida' ? 'Vendido' : 'Pausado'}
              </span>
            </div>
          )}
        </div>

        {/* Linha 1: Categoria + Vendas */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1">
          <span className="truncate font-medium text-slate-400">{offer.category}</span>
          {salesCount > 0 ? (
            <span className="text-[#00D287] font-bold text-[9.5px] sm:text-[10px] bg-[#00D287]/10 px-1 py-0.2 rounded">
              +{salesCount} vendidos
            </span>
          ) : null}
        </div>

        {/* Linha 2: Título do Produto */}
        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors min-h-[34px] sm:min-h-[38px]">
          {offer.title}
        </h3>

        {/* Linha 3: Preço Principal B2B com De/Por */}
        <div className="mt-2">
          {hasDiscount && offer.originalPrice && offer.originalPrice > offer.price && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 line-through font-medium">
                {formatBRL(offer.originalPrice)}
              </span>
              <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 px-1 py-0.2 rounded border border-rose-500/20 flex items-center gap-0.5">
                <ArrowDown className="w-2 h-2 stroke-[3] text-rose-400" />
                -{discountPercent}%
              </span>
            </div>
          )}

          <div className="text-sm sm:text-lg font-black text-[#00D287] tracking-tight leading-none">
            {formatBRL(offer.price)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            em <span className="text-slate-300 font-semibold">12x de {formatBRL(installment12x)}</span>
          </div>
        </div>

        {/* Linha 4: Frete & Garantia */}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-1">
          {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-[10px] sm:text-xs truncate">
              <Truck className="w-3 h-3 flex-shrink-0" />
              Frete grátis
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 truncate">
              Envio Rápido
            </span>
          )}

          <span className="text-[9.5px] sm:text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
            <ShieldCheck className="w-2.5 h-2.5 text-[#00D287]" />
            Garantia {offer.warrantyDays || 90}d
          </span>
        </div>
      </div>

      {/* Linha 5: Botão Comprar */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end">
        <div className="w-full text-center py-1.5 rounded-xl bg-[#00D287]/15 hover:bg-[#00D287] text-[#00D287] hover:text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-[#00D287]/20">
          <span>Ver Detalhes</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
