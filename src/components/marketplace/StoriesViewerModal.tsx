import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Truck,
  Building2,
  CheckCircle2,
  Pause,
  Play,
  ArrowRight,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface StoriesViewerModalProps {
  offers: MarketplaceOffer[];
  initialOfferId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDetails: (offer: MarketplaceOffer) => void;
  favorites?: string[];
  onToggleFavorite?: (offerId: string, e: React.MouseEvent) => void;
}

const STORY_DURATION_MS = 5000; // 5 segundos por foto

export const StoriesViewerModal: React.FC<StoriesViewerModalProps> = ({
  offers,
  initialOfferId,
  isOpen,
  onClose,
  onOpenDetails,
  favorites = [],
  onToggleFavorite,
}) => {
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch handling for swipe gestures
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Sync initial offer
  useEffect(() => {
    if (isOpen && initialOfferId && offers.length > 0) {
      const idx = offers.findIndex((o) => o.id === initialOfferId);
      if (idx !== -1) {
        setCurrentOfferIndex(idx);
      } else {
        setCurrentOfferIndex(0);
      }
      setCurrentPhotoIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialOfferId, offers]);

  const activeOffer: MarketplaceOffer | undefined = offers[currentOfferIndex];
  const images = activeOffer?.images && activeOffer.images.length > 0
    ? activeOffer.images
    : ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'];

  const isLastPhotoOfOffer = currentPhotoIndex === images.length - 1;
  const isFirstPhotoOfOffer = currentPhotoIndex === 0;

  const nextStory = useCallback(() => {
    if (currentPhotoIndex < images.length - 1) {
      // Avança para a próxima foto da mesma loja/oferta
      setCurrentPhotoIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Chegou na última foto da oferta atual -> vai para a próxima oferta/loja
      if (currentOfferIndex < offers.length - 1) {
        setCurrentOfferIndex((prev) => prev + 1);
        setCurrentPhotoIndex(0);
        setProgress(0);
      } else {
        // Chegou ao fim de todos os stories -> fecha
        onClose();
      }
    }
  }, [currentPhotoIndex, images.length, currentOfferIndex, offers.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentPhotoIndex > 0) {
      // Volta para a foto anterior da mesma oferta
      setCurrentPhotoIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      // Está na primeira foto -> se houver oferta anterior, vai para a última foto dela
      if (currentOfferIndex > 0) {
        const prevOfferIdx = currentOfferIndex - 1;
        const prevImages = offers[prevOfferIdx]?.images || [];
        setCurrentOfferIndex(prevOfferIdx);
        setCurrentPhotoIndex(Math.max(0, prevImages.length - 1));
        setProgress(0);
      }
    }
  }, [currentPhotoIndex, currentOfferIndex, offers]);

  // Timer automático de progressão do Story
  useEffect(() => {
    if (!isOpen || isPaused || !activeOffer) return;

    const intervalTime = 50; // atualiza a cada 50ms
    const step = (intervalTime / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, activeOffer, nextStory]);

  // Teclado: Escape (fechar), Seta Esquerda (voltar), Seta Direita (avançar), Espaço (pausar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        nextStory();
      } else if (e.key === 'ArrowLeft') {
        prevStory();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextStory, prevStory, onClose]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Se arrastou pra baixo, fecha o story (gesto clássico do Instagram)
    if (diffY < -60 && Math.abs(diffX) < 80) {
      onClose();
      return;
    }

    // Se arrastou para a esquerda (próximo) ou direita (anterior)
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextStory();
      } else {
        prevStory();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  if (!isOpen || !activeOffer) return null;

  const currentImage = images[currentPhotoIndex] || images[0];
  const isFavorite = favorites.includes(activeOffer.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Botão de Fechar Geral (topo direito da tela) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md cursor-pointer"
        title="Fechar Stories (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Botões Laterais Desktop para Navegar entre Lojas/Ofertas */}
      {currentOfferIndex > 0 && (
        <button
          onClick={() => {
            setCurrentOfferIndex((prev) => prev - 1);
            setCurrentPhotoIndex(0);
            setProgress(0);
          }}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Loja Anterior"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {currentOfferIndex < offers.length - 1 && (
        <button
          onClick={() => {
            setCurrentOfferIndex((prev) => prev + 1);
            setCurrentPhotoIndex(0);
            setProgress(0);
          }}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Próxima Loja"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Conteiner Central do Story (Proporção 9:16 Instagram Stories) */}
      <div
        className="relative w-full h-full sm:h-[92vh] sm:max-w-[420px] sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border sm:border-white/15 bg-slate-950 flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* IMAGEM PRINCIPAL DO STORY */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <img
            key={currentImage}
            src={currentImage}
            alt={activeOffer.title}
            className="w-full h-full object-cover object-center animate-in fade-in zoom-in-95 duration-300"
          />
          {/* Vinheta gradiente superior e inferior estilo Instagram para leitura limpa */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black/90 pointer-events-none" />
        </div>

        {/* ZONAS DE CLIQUE INVISÍVEIS PARA PASSAR FOTO (Igual Instagram: Esquerda volta, Direita avança) */}
        <div className="absolute inset-0 z-10 flex">
          <div
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
            className="w-[35%] h-full cursor-pointer"
            title="Foto Anterior"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
            className="w-[65%] h-full cursor-pointer"
            title="Próxima Foto"
          />
        </div>

        {/* ========================================================================= */}
        {/* CABEÇALHO DO STORY (Barras de Progresso Segmentadas + Info da Loja) */}
        {/* ========================================================================= */}
        <div className="relative z-20 p-3 sm:p-4 space-y-3 pointer-events-none">
          {/* Barras de Progresso Segmentadas do Instagram (Uma por foto do produto) */}
          <div className="flex items-center gap-1.5 w-full">
            {images.map((_, idx) => {
              let fillPercent = 0;
              if (idx < currentPhotoIndex) fillPercent = 100;
              else if (idx === currentPhotoIndex) fillPercent = progress;

              return (
                <div
                  key={idx}
                  className="flex-1 h-1 rounded-full bg-white/30 backdrop-blur-sm overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Dados da Loja / Oferta no Topo */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2.5">
              {/* Avatar da Loja com anel de Story gradiente */}
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287]">
                <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-black flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden">
                  {activeOffer.sellerCompany.substring(0, 2)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white drop-shadow truncate max-w-[140px] sm:max-w-[170px]">
                    {activeOffer.sellerCompany}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287] fill-[#00D287]/20 flex-shrink-0" />
                </div>
                <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1">
                  <span>Foto {currentPhotoIndex + 1} de {images.length}</span>
                  <span>•</span>
                  <span>{activeOffer.condition}</span>
                </div>
              </div>
            </div>

            {/* Ações do Topo: Pausar e Favoritar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/10 backdrop-blur-md transition-colors"
                title={isPaused ? 'Reproduzir' : 'Pausar'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5 fill-white" />}
              </button>

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(activeOffer.id, e)}
                  className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${
                    isFavorite
                      ? 'bg-rose-500/40 text-rose-400 border-rose-500/50'
                      : 'bg-black/40 text-slate-200 hover:text-white border-white/10'
                  }`}
                  title={isFavorite ? 'Remover dos favoritos' : 'Favoritar oferta'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RODAPÉ DO STORY (Informações do Produto & Botão na Última Foto) */}
        {/* ========================================================================= */}
        <div className="relative z-20 p-4 space-y-3 pointer-events-auto">
          {/* Card com Detalhes do Produto */}
          <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 space-y-2 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-sm text-white leading-tight drop-shadow">
                {activeOffer.title}
              </h3>
              <div className="flex-shrink-0 text-right">
                <span className="text-base font-black text-[#00D287] drop-shadow">
                  {formatBRL(activeOffer.price)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {activeOffer.description}
            </p>

            {/* Badges de Garantia e Frete */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[10px]">
              {activeOffer.freeShipping ? (
                <div className="flex items-center gap-1 font-bold text-emerald-400">
                  <Truck className="w-3 h-3" />
                  <span>Frete Grátis</span>
                </div>
              ) : activeOffer.shippingCost ? (
                <span className="text-slate-400">
                  Frete: {formatBRL(activeOffer.shippingCost)}
                </span>
              ) : null}

              <div className="flex items-center gap-1 text-slate-300 ml-auto">
                <ShieldCheck className="w-3 h-3 text-[#00D287]" />
                <span>Garantia B2B</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTÃO ESPECIAL NA ÚLTIMA FOTO DO PRODUTO DESTA LOJA */}
          {/* ========================================================================= */}
          {isLastPhotoOfOffer ? (
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-center text-[11px] text-orange-200 font-bold flex items-center justify-center gap-1.5 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>Você viu todas as fotos desta oferta! Gostou do produto?</span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenDetails(activeOffer);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer animate-pulse"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Mais Detalhes & Iniciar Compra</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          ) : (
            /* Botão de Acesso Rápido nas fotos intermediárias */
            <button
              onClick={() => {
                onClose();
                onOpenDetails(activeOffer);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>Ver Detalhes Desta Oferta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Indicador de Stories Restantes */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
            <span>Toque à direita para avançar • à esquerda para voltar</span>
            <span className="font-bold text-slate-300">
              Loja {currentOfferIndex + 1} de {offers.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
