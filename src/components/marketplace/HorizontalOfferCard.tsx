import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, Truck, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

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

          {/* Badge de Condição / Oficial */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start">
            {offer.isOfficial ? (
              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/30 tracking-tight">
                OFICIAL
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-slate-300 border border-white/10">
                {offer.condition}
              </span>
            )}
          </div>

          {/* Botão de Favorito */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(offer.id, e)}
            className={`absolute top-1.5 right-1.5 p-1.5 rounded-xl backdrop-blur-md transition-all active:scale-90 z-10 ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/20 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-black/60 hover:bg-black/80 border border-white/10'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
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

        {/* Linha 3: Preço Principal B2B */}
        <div className="mt-2">
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
          ) : offer.shippingCost ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-medium truncate">
              <Truck className="w-3 h-3 text-[#00D287] flex-shrink-0" />
              {formatBRL(offer.shippingCost)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-medium truncate">
              <Truck className="w-3 h-3 text-[#00D287] flex-shrink-0" />
              Envio Rastreado
            </span>
          )}

          {offer.warrantyDays ? (
            <span className="text-[9px] font-semibold text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 text-[#00D287]" />
              {offer.warrantyDays}d
            </span>
          ) : null}
        </div>
      </div>

      {/* Linha 5: Vendedor Oficial / Lojista Parceiro */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1 min-w-0">
          <Building2 className="w-3 h-3 text-[#00D287] flex-shrink-0" />
          <span className="truncate text-slate-300 font-medium">
            {offer.isOfficial ? 'CellHub Oficial' : offer.sellerCompany}
          </span>
        </div>
        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-[#00D287] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </div>
  );
};
