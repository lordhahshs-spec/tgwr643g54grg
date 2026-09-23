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

  // Função Determinística de Avanço (Passa foto por foto da mesma loja)
  const handleNext = () => {
    setDirection('next');
    if (photoIndex < totalPhotos - 1) {
      // Avança para a próxima foto da MESMA loja
      setPhotoIndex((p) => p + 1);
    } else {
      // Chegou na última foto da loja atual -> avança para a próxima loja
      if (storyIndex < totalOffers - 1) {
        setStoryIndex((s) => s + 1);
        setPhotoIndex(0);
      } else {
        onClose();
      }
    }
  };

  // Função Determinística de Retrocesso (Volta foto por foto da mesma loja)
  const handlePrev = () => {
    setDirection('prev');
    if (photoIndex > 0) {
      // Volta para a foto anterior da MESMA loja
      setPhotoIndex((p) => p - 1);
    } else {
      // Está na foto 0 -> volta para a última foto da loja anterior
      if (storyIndex > 0) {
        const prevStoreIdx = storyIndex - 1;
        const prevStore = frozenOffers[prevStoreIdx];
        const prevPhotosCount = prevStore?.images?.length || 1;
        setStoryIndex(prevStoreIdx);
        setPhotoIndex(prevPhotosCount - 1);
      }
    }
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

  // Touch handlers para gestos e pausa
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

    if (Math.abs(diffX) > 50) {
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

  if (!isOpen || !currentOffer) return null;

  const currentImage = images[photoIndex] || images[0];
  const isFavorite = favorites.includes(currentOffer.id);

  // Pode voltar se não estiver na primeira foto da primeira loja
  const canGoPrev = storyIndex > 0 || photoIndex > 0;
  // Pode avançar se não estiver na última foto da última loja
  const canGoNext = storyIndex < totalOffers - 1 || photoIndex < totalPhotos - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      {/* Estilos CSS Injetados para Animação Nativa GPU da Barra e Transição 3D da Tela do Story */}
      <style>{`
        @keyframes storyBarProgressAnimation {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes storyScreen3DFlipNext {
          0% {
            opacity: 0.5;
            transform: perspective(1200px) rotateY(22deg) scale(0.95) translateX(50px);
          }
          100% {
            opacity: 1;
            transform: perspective(1200px) rotateY(0deg) scale(1) translateX(0px);
          }
        }

        @keyframes storyScreen3DFlipPrev {
          0% {
            opacity: 0.5;
            transform: perspective(1200px) rotateY(-22deg) scale(0.95) translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: perspective(1200px) rotateY(0deg) scale(1) translateX(0px);
          }
        }
      `}</style>

      {/* Botão de Fechar Geral */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md cursor-pointer"
        title="Fechar Stories (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Botões Laterais Desktop - Passam FOTO A FOTO sem pular a loja diretamente */}
      {canGoPrev && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Foto / Story Anterior"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {canGoNext && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-[#00D287] text-white hover:text-slate-950 border border-white/15 hover:border-[#00D287] shadow-2xl backdrop-blur-md items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Próxima Foto / Story"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Conteiner Central do Story (Proporção 9:16 Instagram com Perspectiva 3D na Tela Inteira) */}
      <div
        className="relative w-full h-full sm:h-[92vh] sm:max-w-[420px] sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border sm:border-white/15 bg-slate-950"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: '1200px' }}
      >
        {/* TELA INTEIRA DO STORY COM TRANSIÇÃO 3D FLIP / VIRAR DE TELA ESTILO INSTAGRAM */}
        <div
          key={`story-full-screen-${storyIndex}-${photoIndex}`}
          className="relative w-full h-full flex flex-col justify-between"
          style={{
            animation: `${direction === 'next' ? 'storyScreen3DFlipNext' : 'storyScreen3DFlipPrev'} 320ms cubic-bezier(0.2, 0.9, 0.4, 1) forwards`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* IMAGEM DE FUNDO DO STORY */}
          <div className="absolute inset-0 z-0 bg-slate-950">
            <img
              src={currentImage}
              alt={currentOffer.title}
              className="w-full h-full object-cover object-center"
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

          {/* ========================================================================= */}
          {/* CABEÇALHO DO STORY (Barras de Progresso Nativas + Info da Loja) */}
          {/* ========================================================================= */}
          <div className="relative z-20 p-3 sm:p-4 space-y-3 pointer-events-none">
            {/* BARRAS DE TEMPO SEGMENTADAS NATIVAS (Uma por foto da loja atual) */}
            <div className="flex items-center gap-1.5 w-full">
              {images.map((_, idx) => {
                if (idx < photoIndex) {
                  // Foto anterior: 100% preenchida
                  return (
                    <div
                      key={`bar-done-${storyIndex}-${idx}`}
                      className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/30 backdrop-blur-md overflow-hidden"
                    >
                      <div className="h-full bg-white rounded-full w-full" />
                    </div>
                  );
                }

                if (idx === photoIndex) {
                  // Foto atual ativa: Animação CSS nativa contínua de 0 a 100% sem reset
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

                // Foto futura: vazia 0%
                return (
                  <div
                    key={`bar-future-${storyIndex}-${idx}`}
                    className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/30 backdrop-blur-md overflow-hidden"
                  >
                    <div className="h-full bg-white rounded-full w-0" />
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
                    {currentOffer.sellerCompany.substring(0, 2)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white drop-shadow truncate max-w-[140px] sm:max-w-[170px]">
                      {currentOffer.sellerCompany}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287] fill-[#00D287]/20 flex-shrink-0" />
                  </div>
                  <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1">
                    <span>Foto {photoIndex + 1} de {totalPhotos}</span>
                    <span>•</span>
                    <span>{currentOffer.condition}</span>
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
                    onClick={(e) => onToggleFavorite(currentOffer.id, e)}
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

          {/* ========================================================================= */}
          {/* RODAPÉ DO STORY (Design Minimalista com Ação na Última Foto) */}
          {/* ========================================================================= */}
          <div className="relative z-20 p-4 space-y-3 pointer-events-auto">
            {/* Informações Minimalistas do Produto (Sem poluição visual) */}
            <div className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 space-y-1.5 text-left shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-sm text-white leading-snug drop-shadow truncate">
                  {currentOffer.title}
                </h3>
                <span className="text-sm font-black text-[#00D287] drop-shadow flex-shrink-0">
                  {formatBRL(currentOffer.price)}
                </span>
              </div>

              {/* Badges sutis de Frete e Garantia */}
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                {currentOffer.freeShipping ? (
                  <div className="flex items-center gap-1 font-bold text-emerald-400">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Frete Grátis</span>
                  </div>
                ) : currentOffer.shippingCost ? (
                  <span className="text-slate-400">
                    Frete: {formatBRL(currentOffer.shippingCost)}
                  </span>
                ) : null}

                <div className="flex items-center gap-1 text-slate-400 ml-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>Garantia B2B</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BOTÃO EXIBIDO EXCLUSIVAMENTE NA ÚLTIMA FOTO DESTA LOJA */}
            {/* ========================================================================= */}
            {isLastPhotoOfOffer && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => {
                    onClose();
                    onOpenDetails(currentOffer);
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
      </div>
    </div>
  );
};
