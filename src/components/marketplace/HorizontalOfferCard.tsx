import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Building2, ArrowRight, Eye, Tag } from 'lucide-react';

interface HorizontalOfferCardProps {
  offer: MarketplaceOffer;
  isFavorite: boolean;
  onToggleFavorite: (offerId: string, e: React.MouseEvent) => void;
  onSelect: (offer: MarketplaceOffer) => void;
  isStepped?: boolean;
}

export const HorizontalOfferCard: React.FC<HorizontalOfferCardProps> = ({
  offer,
  isFavorite,
  onToggleFavorite,
  onSelect,
  isStepped = false,
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
      className={`group relative bg-[#090e1c] hover:bg-[#0c1326] border border-white/5 hover:border-[#00D287]/40 rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer shadow-md hover:shadow-[#00D287]/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5 ${
        isStepped ? 'lg:translate-x-6' : 'lg:translate-x-0'
      }`}
    >
      {/* Photo Side - Preserves 9:16 vertical ratio within a neat rounded frame */}
      <div className="relative w-full sm:w-32 md:w-36 h-48 sm:h-40 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-white/5">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={offer.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            Sem foto
          </div>
        )}

        {/* Favorite Icon */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(offer.id, e)}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors z-10 ${
            isFavorite
              ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40'
              : 'bg-black/50 text-slate-300 hover:text-white border border-white/10'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Sold / Paused badge */}
        {offer.status !== 'publicada' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-400 uppercase bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
              {offer.status === 'vendida' ? 'Vendido' : 'Pausado'}
            </span>
          </div>
        )}
      </div>

      {/* Information Side */}
      <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
        <div className="space-y-1">
          {/* Discrete metadata: Store name & category */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-[#00D287]" />
              <span className="truncate max-w-[180px]">{offer.sellerCompany}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400">{offer.category}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 font-medium">{offer.condition}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-[#00D287] transition-colors">
            {offer.title}
          </h3>

          {/* Subcategory / details preview if exists */}
          {offer.subcategory && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Tag className="w-3 h-3 text-slate-500" />
              <span className="truncate">{offer.subcategory}</span>
            </div>
          )}
        </div>

        {/* Price, Shipping & Action Row */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-black text-white tracking-tight">
              {formatBRL(offer.price)}
            </div>

            {offer.freeShipping ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Truck className="w-3.5 h-3.5" />
                <span>Frete grátis</span>
              </div>
            ) : offer.shippingCost ? (
              <div className="text-xs text-slate-400">
                + {formatBRL(offer.shippingCost)} frete
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Frete a combinar
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {offer.views > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                <Eye className="w-3 h-3" />
                {offer.views}
              </span>
            )}
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 group-hover:bg-[#00D287] text-slate-300 group-hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>Ver Detalhes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
