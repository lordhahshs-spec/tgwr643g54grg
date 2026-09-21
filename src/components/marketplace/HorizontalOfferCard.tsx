import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Star, Building2, ShieldCheck } from 'lucide-react';

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

  // Vendas reais do banco de dados (zero dados fictícios)
  const salesCount = offer.salesCount || 0;

  // Avaliações reais do banco de dados (zero dados fictícios)
  const hasReviews = Boolean(offer.rating && offer.reviewsCount && offer.reviewsCount > 0);

  return (
    <div
      onClick={() => onSelect(offer)}
      className="group relative bg-[#080c17] hover:bg-[#0c1224] border border-white/5 hover:border-[#00D287]/40 rounded-2xl p-3 sm:p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-[#00D287]/5 flex flex-col justify-between h-full"
    >
      <div>
        {/* Imagem do Produto - Formato Padronizado Mercado Livre */}
        <div className="relative w-full aspect-square rounded-xl bg-[#040711] overflow-hidden flex items-center justify-center p-2 mb-3 border border-white/5">
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

          {/* Botão de Favorito */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(offer.id, e)}
            className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors z-10 ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10'
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

        {/* Linha 1: Condição + Quantidade Vendida Real */}
        <div className="text-[11px] text-slate-400 font-medium truncate mb-1">
          <span>{offer.condition}</span>
          <span className="mx-1">•</span>
          {salesCount > 0 ? (
            <span className="text-slate-300 font-semibold">
              +{salesCount} {salesCount === 1 ? 'vendido' : 'vendidos'}
            </span>
          ) : (
            <span className="text-slate-400">Nenhum vendido ainda</span>
          )}
        </div>

        {/* Linha 2: Título do Produto */}
        <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#00D287] transition-colors min-h-[36px]">
          {offer.title}
        </h3>

        {/* Linha 3: Avaliação Real (Sem inventar estrelas) */}
        <div className="mt-1.5 flex items-center gap-1.5">
          {hasReviews ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {offer.rating}
              </span>
              <span className="text-slate-400 text-[11px]">({offer.reviewsCount})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Star className="w-3 h-3 text-slate-500" />
              <span>Sem avaliação</span>
            </div>
          )}
        </div>

        {/* Linha 4: Preço Principal */}
        <div className="mt-2.5">
          <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
            {formatBRL(offer.price)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            em <span className="text-slate-300 font-medium">12x de {formatBRL(installment12x)}</span> sem juros
          </div>
        </div>

        {/* Linha 5: Frete */}
        <div className="mt-2">
          {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
            <span className="inline-flex items-center gap-1 font-bold text-[#00D287] text-xs">
              <Truck className="w-3.5 h-3.5" />
              Frete grátis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#00D287]" />
              Frete Melhor Envio
            </span>
          )}
        </div>
      </div>

      {/* Linha Inferior: Loja Vendedora */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1 min-w-0 truncate">
          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">por <strong className="text-slate-300 font-medium">{offer.sellerCompany}</strong></span>
        </div>

        <span className="text-[10px] text-[#00D287] font-semibold flex-shrink-0 flex items-center gap-0.5">
          <ShieldCheck className="w-3 h-3" />
          B2B
        </span>
      </div>
    </div>
  );
};
