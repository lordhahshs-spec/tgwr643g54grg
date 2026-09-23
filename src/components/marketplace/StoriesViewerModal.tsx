import React, { useState, useEffect, useRef } from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Truck,
  CheckCircle2,
  Pause,
  Play,
  ArrowRight,
  ShieldCheck,
  Sparkles
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
  // Snapshot estável e congelado dos stories ao abrir
  const [frozenOffers, setFrozenOffers] = useState<MarketplaceOffer[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Touch handling para gestos de swipe
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Inicializa o snapshot apenas no momento da abertura do modal
  useEffect(() => {
    if (isOpen && offers.length > 0) {
      setFrozenOffers([...offers]);
      const initialIdx = initialOfferId ? offers.findIndex((o) => o.id === initialOfferId) : 0;
      setStoryIndex(initialIdx !== -1 ? initialIdx : 0);
      setPhotoIndex(0);
      setIsPaused(false);
      setDirection('next');
    }
  }, [isOpen]);

  const currentOffer: MarketplaceOffer | undefined = frozenOffers[storyIndex] || offers[0];
  const images = currentOffer?.images && currentOffer.images.length > 0
    ? currentOffer.images
    : ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'];

  const totalPhotos = images.length;
  const totalOffers = frozenOffers.length > 0 ? frozenOffers.length : offers.length;
  const isLastPhotoOfOffer = photoIndex === totalPhotos - 1;

  // Função de Avanço (Passa foto por foto da mesma loja ou desliza a esteira para a próxima loja)
  const handleNext = () => {
    setDirection('next');
    if (photoIndex < totalPhotos - 1) {
      // Avança para a próxima foto da MESMA loja
      setPhotoIndex((p) => p + 1);
    } else {
      // Chegou na última foto da loja atual -> avança esteira para a próxima loja
      if (storyIndex < totalOffers - 1) {
        setStoryIndex((s) => s + 1);
        setPhotoIndex(0);
      } else {
        onClose();
      }
    }
  };

  // Função de Retrocesso (Volta foto por foto da mesma loja ou desliza esteira para loja anterior)
  const handlePrev = () => {
    setDirection('prev');
    if (photoIndex > 0) {
      // Volta para a foto anterior da MESMA loja
      setPhotoIndex((p) => p - 1);
    } else {
      // Está na foto 0 -> desliza esteira para a última foto da loja anterior
      if (storyIndex > 0) {
        const prevStoreIdx = storyIndex - 1;
        const prevStore = frozenOffers[prevStoreIdx];
        const prevPhotosCount = prevStore?.images?.length || 1;
        setStoryIndex(prevStoreIdx);
        setPhotoIndex(prevPhotosCount - 1);
      }
    }
  };

  // Pular diretamente para uma loja na esteira
  const handleSelectStoryFromTrack = (idx: number) => {
    if (idx === storyIndex) return;
    setDirection(idx > storyIndex ? 'next' : 'prev');
    setStoryIndex(idx);
    setPhotoIndex(0);
    setIsPaused(false);
  };

  // Controles de Teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, storyIndex, photoIndex, totalPhotos, totalOffers]);

  // Touch handlers para gestos e pausa no mobile
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

    if (diffY < -60 && Math.abs(diffX) < 80) {
      onClose();
      return;
    }

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
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

  if (!isOpen || !currentOffer || frozenOffers.length === 0) return null;

  const currentImage = images[photoIndex] || images[0];
  const isFavorite = favorites.includes(currentOffer.id);

  // Pode voltar se não estiver na primeira foto da primeira loja
  const canGoPrev = storyIndex > 0 || photoIndex > 0;
  // Pode avançar se não estiver na última foto da última loja
  const canGoNext = storyIndex < totalOffers - 1 || photoIndex < totalPhotos - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 select-none overflow-hidden">
      {/* Estilos CSS Injetados para Animação Nativa GPU da Barra e Transições da Esteira */}
      <style>{`
        :root {
          --story-card-w: 390px;
          --story-card-gap: 24px;
        }

        @media (max-width: 640px) {
          :root {
            --story-card-w: 100vw;
            --story-card-gap: 0px;
          }
        }

        @keyframes storyBarProgressAnimation {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes storyPhotoFadeIn {
          0% {
            opacity: 0.4;
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Top Header / Branding do Stories */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 pointer-events-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D287] to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#00D287]/20">
          <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
        </div>
        <div className="hidden sm:block">
          <span className="text-white font-black text-sm tracking-wider uppercase">CellHub Stories</span>
          <span className="text-[10px] text-emerald-400 font-bold block leading-none">Marketplace B2B</span>
        </div>
      </div>

      {/* Botão de Fechar Geral */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md cursor-pointer"
        title="Fechar Stories (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Botões Laterais Flutuantes na Tela Desktop */}
      {canGoPrev && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Foto / Story Anterior"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {canGoNext && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Próxima Foto / Story"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* ========================================================================= */}
      {/* ESTEIRA HORIZONTAL ESTILO INSTAGRAM (CAROUSEL / CONVEYOR TRACK)           */}
      {/* ========================================================================= */}
      <div
        className="relative w-full h-full flex items-center justify-start overflow-visible"
        style={{
          perspective: '1400px',
        }}
      >
        <div
          className="flex items-center transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1) will-change-transform h-full"
          style={{
            /* Centraliza perfeitamente o card ativo no meio exato da tela */
            transform: `translateX(calc(50vw - (var(--story-card-w) / 2) - (${storyIndex} * (var(--story-card-w) + var(--story-card-gap)))))`,
            gap: 'var(--story-card-gap)',
          }}
        >
          {frozenOffers.map((offer, idx) => {
            const isActive = idx === storyIndex;
            const distance = idx - storyIndex;
            const offerImages = offer.images && offer.images.length > 0
              ? offer.images
              : ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'];
            
            const coverImage = isActive ? (offerImages[photoIndex] || offerImages[0]) : offerImages[0];

            return (
              <div
                key={`story-esteira-card-${offer.id}-${idx}`}
                onClick={() => {
                  if (!isActive) handleSelectStoryFromTrack(idx);
                }}
                className={`relative flex-shrink-0 transition-all duration-500 ease-out select-none ${
                  isActive
                    ? 'w-screen sm:w-[390px] h-full sm:h-[88vh] sm:max-h-[820px] rounded-none sm:rounded-3xl z-30 opacity-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] sm:border sm:border-white/20 cursor-default'
                    : 'hidden sm:flex sm:flex-col sm:justify-between w-[270px] h-[64vh] rounded-2xl z-10 opacity-40 hover:opacity-85 scale-[0.88] hover:scale-[0.92] cursor-pointer border border-white/10 hover:border-[#00D287]/50 shadow-xl overflow-hidden'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isActive
                    ? 'scale(1) rotateY(0deg)'
                    : `scale(0.85) rotateY(${distance > 0 ? -12 : 12}deg)`,
                }}
                onMouseDown={() => isActive && setIsPaused(true)}
                onMouseUp={() => isActive && setIsPaused(false)}
                onTouchStart={isActive ? handleTouchStart : undefined}
                onTouchEnd={isActive ? handleTouchEnd : undefined}
              >
                {/* ======================================================= */}
                {/* CASO 1: CARD LATERAL PREVIEW NA ESTEIRA (Não Ativo)     */}
                {/* ======================================================= */}
                {!isActive && (
                  <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
                    {/* Imagem de Fundo Borrada com Overlay */}
                    <img
                      src={coverImage}
                      alt={offer.title}
                      className="absolute inset-0 w-full h-full object-cover object-center filter brightness-50 contrast-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

                    {/* Topo do Card Lateral */}
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 to-[#00D287]">
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] uppercase">
                          {offer.sellerCompany.substring(0, 2)}
                        </div>
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-xs text-white drop-shadow block truncate">
                          {offer.sellerCompany}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          {offer.images?.length || 1} fotos
                        </span>
                      </div>
                    </div>

                    {/* Centro: Ícone de Play / Visualizar */}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-2 my-auto">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                      <span className="text-xs font-semibold text-white/90 drop-shadow">
                        Ver Story
                      </span>
                    </div>

                    {/* Rodapé do Card Lateral */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 space-y-0.5">
                      <h4 className="text-xs font-bold text-white truncate drop-shadow">
                        {offer.title}
                      </h4>
                      <span className="text-xs font-black text-[#00D287] drop-shadow block">
                        {formatBRL(offer.price)}
                      </span>
                    </div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* CASO 2: CARD ATIVO NO CENTRO DA ESTEIRA (Principal)     */}
                {/* ======================================================= */}
                {isActive && (
                  <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between overflow-hidden">
                    {/* FOTO ATIVA COM TRANSIÇÃO SUAVE */}
                    <div className="absolute inset-0 z-0 bg-slate-950">
                      <img
                        key={`story-active-img-${storyIndex}-${photoIndex}`}
                        src={currentImage}
                        alt={offer.title}
                        className="w-full h-full object-cover object-center"
                        style={{
                          animation: 'storyPhotoFadeIn 260ms cubic-bezier(0.2, 0.9, 0.4, 1) forwards',
                        }}
                      />
                      {/* Vinheta gradiente superior e inferior estilo Instagram */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black/90 pointer-events-none" />
                    </div>

                    {/* ZONAS DE CLIQUE INVISÍVEIS (Esquerda volta foto, Direita avança foto) */}
                    <div className="absolute inset-0 z-10 flex">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrev();
                        }}
                        className="w-[35%] h-full cursor-pointer"
                        title="Foto Anterior"
                      />
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext();
                        }}
                        className="w-[65%] h-full cursor-pointer"
                        title="Próxima Foto"
                      />
                    </div>

                    {/* CABEÇALHO DO STORY (Barras de Tempo Nativas + Info da Loja) */}
                    <div className="relative z-20 p-3 sm:p-4 space-y-3 pointer-events-none">
                      {/* BARRAS DE TEMPO SEGMENTADAS NATIVAS */}
                      <div className="flex items-center gap-1.5 w-full">
                        {offerImages.map((_, pIdx) => {
                          if (pIdx < photoIndex) {
                            return (
                              <div
                                key={`bar-done-${storyIndex}-${pIdx}`}
                                className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/30 backdrop-blur-md overflow-hidden"
                              >
                                <div className="h-full bg-white rounded-full w-full" />
                              </div>
                            );
                          }

                          if (pIdx === photoIndex) {
                            return (
                              <div
                                key={`bar-active-${storyIndex}-${photoIndex}`}
                                className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/30 backdrop-blur-md overflow-hidden"
                              >
                                <div
                                  key={`bar-fill-${storyIndex}-${photoIndex}`}
                                  className="h-full bg-white rounded-full"
                                  style={{
                                    animation: `storyBarProgressAnimation ${STORY_DURATION_MS}ms linear forwards`,
                                    animationPlayState: isPaused ? 'paused' : 'running',
                                  }}
                                  onAnimationEnd={handleNext}
                                />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`bar-future-${storyIndex}-${pIdx}`}
                              className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/30 backdrop-blur-md overflow-hidden"
                            >
                              <div className="h-full bg-white rounded-full w-0" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Dados da Loja no Topo */}
                      <div className="flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-2.5">
                          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287]">
                            <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-black flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden">
                              {offer.sellerCompany.substring(0, 2)}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white drop-shadow truncate max-w-[140px] sm:max-w-[170px]">
                                {offer.sellerCompany}
                              </span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287] fill-[#00D287]/20 flex-shrink-0" />
                            </div>
                            <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1">
                              <span>Foto {photoIndex + 1} de {totalPhotos}</span>
                              <span>•</span>
                              <span>{offer.condition}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ações do Topo */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsPaused((p) => !p)}
                            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                            title={isPaused ? 'Reproduzir' : 'Pausar'}
                          >
                            {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5 fill-white" />}
                          </button>

                          {onToggleFavorite && (
                            <button
                              type="button"
                              onClick={(e) => onToggleFavorite(offer.id, e)}
                              className={`p-1.5 rounded-full backdrop-blur-md border transition-colors cursor-pointer ${
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
                            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                            title="Fechar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RODAPÉ DO STORY (Design Minimalista com Ação na Última Foto) */}
                    <div className="relative z-20 p-4 space-y-3 pointer-events-auto">
                      {/* Informações do Produto */}
                      <div className="p-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 space-y-1.5 text-left shadow-lg">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-bold text-sm text-white leading-snug drop-shadow truncate">
                            {offer.title}
                          </h3>
                          <span className="text-sm font-black text-[#00D287] drop-shadow flex-shrink-0">
                            {formatBRL(offer.price)}
                          </span>
                        </div>

                        {/* Frete e Garantia */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-300">
                          {offer.freeShipping ? (
                            <div className="flex items-center gap-1 font-bold text-emerald-400">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Frete Grátis</span>
                            </div>
                          ) : offer.shippingCost ? (
                            <span className="text-slate-400">
                              Frete: {formatBRL(offer.shippingCost)}
                            </span>
                          ) : null}

                          <div className="flex items-center gap-1 text-slate-400 ml-auto">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
                            <span>Garantia B2B</span>
                          </div>
                        </div>
                      </div>

                      {/* BOTÃO EXIBIDO EXCLUSIVAMENTE NA ÚLTIMA FOTO */}
                      {isLastPhotoOfOffer && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenDetails(offer);
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer animate-pulse"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Ver Oferta Completa & Comprar</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </button>
                        </div>
                      )}

                      {/* Indicador Minimalista de Loja / Navegação */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                        <span>Toque nas laterais para navegar</span>
                        <span className="font-semibold text-slate-300">
                          Loja {storyIndex + 1} de {totalOffers}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
