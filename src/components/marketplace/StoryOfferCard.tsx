import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Building2, Eye } from 'lucide-react';

interface StoryOfferCardProps {
  offer: MarketplaceOffer;
  isFavorite: boolean;
  onToggleFavorite: (offerId: string, e: React.MouseEvent) => void;
  onSelect: (offer: MarketplaceOffer) => void;
}

export const StoryOfferCard: React.FC<StoryOfferCardProps> = ({
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

  return (
    <div
      onClick={() => onSelect(offer)}
      className="group relative flex-shrink-0 w-44 sm:w-52 aspect-[9/16] rounded-2xl overflow-hidden bg-[#0a0f1d] border border-white/10 hover:border-[#00D287]/60 shadow-lg hover:shadow-[#00D287]/20 transition-all duration-300 cursor-pointer select-none"
    >
      {/* 9:16 Vertical Image (Main Protagonist) */}
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={offer.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
          Sem foto
        </div>
      )}

      {/* Subtle Ambient Vignette & Bottom Gradient for Clean Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />

      {/* Top Floating Controls - Instagram Story Ring & Favorite Button */}
      <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Instagram Stories Badge with store ring & photos counter */}
        <div className="flex items-center gap-1.5 p-1 pr-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-md">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287]">
            <div className="w-5 h-5 rounded-full bg-slate-900 border border-black flex items-center justify-center text-[9px] font-black text-white uppercase">
              {offer.sellerCompany.substring(0, 1)}
            </div>
          </div>
          <span className="text-[10px] font-bold text-white flex items-center gap-1">
            <span>Story</span>
            {offer.images && offer.images.length > 1 && (
              <span className="text-[9px] px-1 rounded-full bg-white/20 text-slate-200">
                {offer.images.length}
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => onToggleFavorite(offer.id, e)}
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-colors ${
            isFavorite
              ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
              : 'bg-black/50 text-slate-300 hover:text-white border border-white/10'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Non-active overlay */}
      {offer.status !== 'publicada' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center z-20 p-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-2 py-1 rounded-md border border-red-500/30">
            {offer.status === 'vendida' ? 'Vendido' : 'Indisponível'}
          </span>
        </div>
      )}

      {/* Bottom Footer - Concise commercial hierarchy */}
      <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end space-y-1 text-left">
        {/* 1. Nome / Título do Produto (compact, not giant) */}
        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-[#00D287] transition-colors drop-shadow-sm">
          {offer.title}
        </h4>

        {/* 2. Preço */}
        <div className="text-sm font-black text-[#00D287] tracking-tight drop-shadow-sm">
          {formatBRL(offer.price)}
        </div>

        {/* 3. Frete */}
        {offer.freeShipping ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
            <Truck className="w-3 h-3 flex-shrink-0" />
            <span>Frete grátis</span>
          </div>
        ) : offer.shippingCost ? (
          <div className="text-[10px] text-slate-300">
            + {formatBRL(offer.shippingCost)} frete
          </div>
        ) : null}

        {/* 4. Nome da Loja */}
        <div className="pt-0.5 border-t border-white/10 flex items-center gap-1 text-[10px] text-slate-300 truncate">
          <Building2 className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{offer.sellerCompany}</span>
        </div>
      </div>
    </div>
  );
};
