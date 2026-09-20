import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Zap, ChevronRight, ShieldCheck } from 'lucide-react';

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
  const installment12x = (offer.price / 12);

  return (
    <div
      onClick={() => onSelect(offer)}
      className="group relative w-full bg-[#080c17] hover:bg-[#0c1222] border border-white/5 hover:border-[#00D287]/40 rounded-2xl p-3.5 sm:p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-[#00D287]/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6"
    >
      {/* Product Image Frame - Standardized square/portrait Mercado Livre style */}
      <div className="relative w-full sm:w-40 sm:h-40 h-52 rounded-xl bg-[#040711] flex-shrink-0 overflow-hidden flex items-center justify-center p-2 border border-white/5">
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

        {/* Status overlay if not published */}
        {offer.status !== 'publicada' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/20 px-2.5 py-1 rounded border border-red-500/30">
              {offer.status === 'vendida' ? 'Vendido' : 'Pausado'}
            </span>
          </div>
        )}
      </div>

      {/* Product Details - Clean Mercado Livre Hierarchy */}
      <div className="flex-1 flex flex-col justify-between min-w-0 h-full space-y-2.5">
        {/* Top Meta Line: Condition + Store */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 truncate">
            <span className="font-semibold text-slate-300">{offer.condition}</span>
            <span>•</span>
            <span className="truncate">Vendido por <strong className="text-slate-200 font-medium">{offer.sellerCompany}</strong></span>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(offer.id, e)}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Product Title */}
        <h3 className="text-sm sm:text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors">
          {offer.title}
        </h3>

        {/* Price & Commercial Conditions */}
        <div className="pt-1 space-y-0.5">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
            {formatBRL(offer.price)}
          </div>

          <div className="text-[11px] text-slate-400">
            em <span className="text-slate-300 font-medium">12x de {formatBRL(installment12x)}</span> sem acréscimo de lojista
          </div>
        </div>

        {/* Shipping & Escrow Protection Row */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            {offer.freeShipping ? (
              <span className="flex items-center gap-1 font-bold text-[#00D287] text-xs">
                <Truck className="w-3.5 h-3.5" />
                Frete grátis
              </span>
            ) : offer.shippingCost ? (
              <span className="text-xs text-slate-400">
                + {formatBRL(offer.shippingCost)} frete
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Frete a calcular
              </span>
            )}

            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
              Custódia AurusPay
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#00D287] font-semibold group-hover:translate-x-1 transition-transform">
            <span>Ver oferta</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
