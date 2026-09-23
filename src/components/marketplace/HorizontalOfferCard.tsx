import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Star, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const hasReviews = Boolean(offer.rating && offer.reviewsCount && offer.reviewsCount > 0);

  return (
    <div
      onClick={() => onSelect(offer)}
      className="group relative bg-[#090e1c] hover:bg-[#0d152a] border border-white/10 hover:border-[#00D287]/50 rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-[#00D287]/5 flex flex-col justify-between select-none"
    >
      <div>
        {/* Imagem do Produto com Aspect Ratio 4:3 Compacto */}
        <div className="relative w-full aspect-[4/3] rounded-xl bg-[#040711] overflow-hidden flex items-center justify-center p-1.5 mb-2.5 border border-white/5">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={offer.title}
              className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-600 text-xs">Sem foto</div>
          )}

          {/* Badge de Condição */}
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-md text-slate-300 border border-white/10">
              {offer.condition}
            </span>
          </div>

          {/* Botão de Favorito */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(offer.id, e)}
            className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors z-10 ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/20 border border-rose-500/40'
                : 'text-slate-400 hover:text-white bg-black/50 hover:bg-black/70 border border-white/10'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

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
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="truncate font-medium text-slate-400">{offer.category}</span>
          {salesCount > 0 ? (
            <span className="text-slate-300 font-semibold text-[10px]">
              +{salesCount} vendidos
            </span>
          ) : null}
        </div>

        {/* Linha 2: Título do Produto */}
        <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors min-h-[38px]">
          {offer.title}
        </h3>

        {/* Linha 3: Preço Principal B2B */}
        <div className="mt-2.5">
          <div className="text-base sm:text-lg font-black text-[#00D287] tracking-tight leading-none">
            {formatBRL(offer.price)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            em <span className="text-slate-300 font-medium">12x de {formatBRL(installment12x)}</span> sem juros
          </div>
        </div>

        {/* Linha 4: Frete */}
        <div className="mt-2">
          {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-xs">
              <Truck className="w-3.5 h-3.5" />
              Frete grátis
            </span>
          ) : offer.shippingCost ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#00D287]" />
              Frete: {formatBRL(offer.shippingCost)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#00D287]" />
              Frete Melhor Envio
            </span>
          )}
        </div>
      </div>

      {/* Linha Inferior: Loja Vendedora & Ação */}
      <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0 truncate text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate text-slate-300 font-medium">{offer.sellerCompany}</span>
        </div>

        <span className="text-[10px] text-[#00D287] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
          <span>Ver Oferta</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
