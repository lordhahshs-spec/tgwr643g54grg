import React from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import { Heart, ShieldCheck, Truck, Eye, ArrowRight, Tag } from 'lucide-react';

interface OfferCardProps {
  offer: MarketplaceOffer;
  isFavorite: boolean;
  onToggleFavorite: (offerId: string, e: React.MouseEvent) => void;
  onSelect: (offer: MarketplaceOffer) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
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

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Novo':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Seminovo':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Usado':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Recondicionado':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Para retirada de peças':
      case 'Com avaria':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  const primaryImage = offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=60';

  return (
    <div 
      onClick={() => onSelect(offer)}
      className="group relative bg-[#0a0f1d] hover:bg-[#0e1529] border border-white/5 hover:border-[#00D287]/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-[#00D287]/10"
    >
      {/* Top Media Area */}
      <div className="relative w-full aspect-[4/3] bg-slate-950/60 overflow-hidden">
        <img
          src={primaryImage}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-black/40 pointer-events-none" />

        {/* Condition Badge & Category */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${getConditionColor(offer.condition)}`}>
            {offer.condition}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-white/10 backdrop-blur-md">
            {offer.category}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(offer.id, e)}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors z-10 ${
            isFavorite 
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40' 
              : 'bg-black/50 text-slate-300 hover:text-white hover:bg-black/80 border border-white/10'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Status Overlay if not active */}
        {offer.status !== 'publicada' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 font-bold uppercase text-xs tracking-wider rounded-lg">
              {offer.status === 'vendida' ? 'Item Vendido' : offer.status === 'pausada' ? 'Pausado' : 'Encerrado'}
            </span>
          </div>
        )}

        {/* Photos count */}
        {offer.images?.length > 1 && (
          <div className="absolute bottom-2.5 left-3 text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
            {offer.images.length} fotos
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller / Store info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D287] flex-shrink-0" />
            <span className="font-medium text-slate-300 truncate" title={offer.sellerCompany}>
              {offer.sellerCompany}
            </span>
          </div>

          {/* Offer Title */}
          <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-[#00D287] transition-colors">
            {offer.title}
          </h3>

          {/* Subcategory / Details pill if present */}
          {offer.subcategory && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="truncate">{offer.subcategory}</span>
            </div>
          )}
        </div>

        {/* Price & Shipping */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Valor Lojista</span>
              <span className="text-lg font-black text-white tracking-tight">
                {formatBRL(offer.price)}
              </span>
            </div>

            {offer.freeShipping || offer.shippingPolicy === 'frete_gratis' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                <Truck className="w-3 h-3" />
                Frete Grátis
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-white/5 px-2 py-0.5 rounded-md">
                <Truck className="w-3 h-3 text-[#00D287]" />
                Frete no Checkout
              </span>
            )}
          </div>

          {/* CTA Bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-[#00D287] font-semibold pt-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
              <Eye className="w-3 h-3" />
              {offer.views || 0} visualizações
            </span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Negociar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
