import React, { useState, useEffect, useRef } from 'react';
import { MarketplaceOffer } from '@/types/marketplace';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Truck,
  Pause,
  Play,
  ArrowRight,
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

const STORY_DURATION_MS = 5000; // 5 segundos por story

// Dimensões da esteira no Desktop
const PREVIEW_WIDTH = 200;
const ACTIVE_WIDTH = 420;
const CARD_GAP = 18;

export const StoriesViewerModal: React.FC<StoriesViewerModalProps> = ({
  offers,
  initialOfferId,
  isOpen,
  onClose,
  onOpenDetails,
  favorites = [],
  onToggleFavorite,
}) => {
  const [frozenOffers, setFrozenOffers] = useState<MarketplaceOffer[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch handling para mobile swipe
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && offers.length > 0) {
      setFrozenOffers([...offers]);
      const initialIdx = initialOfferId ? offers.findIndex((o) => o.id === initialOfferId) : 0;
      setStoryIndex(initialIdx !== -1 ? initialIdx : 0);
      setIsPaused(false);
    }
  }, [isOpen]);

  const currentOffer: MarketplaceOffer | undefined = frozenOffers[storyIndex] || offers[0];
  const totalOffers = frozenOffers.length > 0 ? frozenOffers.length : offers.length;

  // Próximo Story na esteira
  const handleNext = () => {
    if (storyIndex < totalOffers - 1) {
      setStoryIndex((s) => s + 1);
    } else {
      onClose();
    }
  };

  // Story anterior na esteira
  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
    }
  };

  // Seleciona um card vizinho diretamente na esteira
  const handleSelectStoryFromTrack = (idx: number) => {
    if (idx === storyIndex) return;
    setStoryIndex(idx);
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
  }, [isOpen, storyIndex, totalOffers]);

  // Touch handlers para gestos no mobile
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

  const currentImage = currentOffer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80';
  const isFavorite = favorites.includes(currentOffer.id);

  const canGoPrev = storyIndex > 0;
  const canGoNext = storyIndex < totalOffers - 1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Estilos CSS Injetados para Barra de Progresso e Transições Suaves */}
      <style>{`
        @keyframes storyBarProgressAnimation {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes storyFadePhoto {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Botão Fechar Minimalista Topo Direito */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-5 sm:right-6 z-50 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        title="Fechar (ESC)"
      >
        <X className="w-6 h-6 stroke-[2]" />
      </button>

      {/* ========================================================================= */}
      {/* ESTEIRA HORIZONTAL DE STORIES (ESTILO INSTAGRAM ORIGINAL)                  */}
      {/* ========================================================================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full flex items-center justify-start overflow-visible"
      >
        <div
          className="flex items-center transition-transform duration-450 cubic-bezier(0.2, 0.9, 0.3, 1) will-change-transform h-full"
          style={{
            /* Cálculo Matemático para manter o story ativo no centro exato da tela */
            transform: `translateX(calc(50vw - (${storyIndex} * (${PREVIEW_WIDTH}px + ${CARD_GAP}px) + ${ACTIVE_WIDTH / 2}px)))`,
            gap: `${CARD_GAP}px`,
          }}
        >
          {frozenOffers.map((offer, idx) => {
            const isActive = idx === storyIndex;
            const coverImage = offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80';

            return (
              <div
                key={`story-esteira-item-${offer.id}-${idx}`}
                onClick={() => {
                  if (!isActive) handleSelectStoryFromTrack(idx);
                }}
                className={`relative flex-shrink-0 transition-all duration-450 ease-out select-none ${
                  isActive
                    ? 'w-screen sm:w-[420px] h-full sm:h-[90vh] sm:max-h-[820px] rounded-none sm:rounded-2xl z-30 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.85)] cursor-default'
                    : 'hidden sm:flex sm:flex-col items-center justify-center w-[200px] h-[370px] rounded-xl z-10 opacity-40 hover:opacity-75 cursor-pointer shadow-lg overflow-hidden'
                }`}
              >
                {/* ======================================================= */}
                {/* 1. CARD LATERAL PREVIEW (Instagram Original)             */}
                {/* ======================================================= */}
                {!isActive && (
                  <div className="relative w-full h-full bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col items-center justify-center p-3">
                    {/* Imagem de Fundo Escurecida */}
                    <img
                      src={coverImage}
                      alt={offer.title}
                      className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.4] contrast-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Conteúdo Centralizado do Card Preview */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      {/* Avatar Circular com anel gradiente Instagram */}
                      <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md">
                        <div className="w-14 h-14 rounded-full bg-[#1e1e1e] border-2 border-black flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden">
                          {offer.sellerCompany.substring(0, 2)}
                        </div>
                      </div>

                      {/* Nome do Vendedor / Loja */}
                      <span className="text-white font-semibold text-xs mt-2.5 truncate max-w-[160px] drop-shadow">
                        {offer.sellerCompany}
                      </span>

                      {/* Status */}
                      <span className="text-white/60 text-[11px] mt-0.5 font-normal">
                        {offer.condition}
                      </span>
                    </div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* 2. CARD ATIVO CENTRALIZADO COM 1 FOTO E BOTAO MINIMALISTA */}
                {/* ======================================================= */}
                {isActive && (
                  <div
                    className="relative w-full h-full bg-black rounded-none sm:rounded-2xl overflow-hidden flex flex-col justify-between"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* FOTO DO STORY (1 Foto Principal) */}
                    <div className="absolute inset-0 z-0 bg-black">
                      <img
                        key={`active-story-img-${storyIndex}`}
                        src={currentImage}
                        alt={offer.title}
                        className="w-full h-full object-cover object-center"
                        style={{
                          animation: 'storyFadePhoto 200ms ease-out forwards',
                        }}
                      />
                      {/* Gradiente superior e inferior sutil */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />
                    </div>

                    {/* ZONAS DE TOQUE/CLIQUE LATERAIS */}
                    <div className="absolute inset-0 z-10 flex">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrev();
                        }}
                        className="w-[30%] h-full cursor-pointer"
                        title="Story Anterior"
                      />
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext();
                        }}
                        className="w-[70%] h-full cursor-pointer"
                        title="Próximo Story"
                      />
                    </div>

                    {/* CABEÇALHO DO STORY (1 Barra de Tempo Contínua) */}
                    <div className="relative z-20 p-3 sm:p-3.5 space-y-2.5 pointer-events-none">
                      {/* BARRA DE TEMPO DO STORY */}
                      <div className="w-full h-0.5 sm:h-1 rounded-full bg-white/35 overflow-hidden">
                        <div
                          key={`bar-active-${storyIndex}`}
                          className="h-full bg-white rounded-full"
                          style={{
                            animation: `storyBarProgressAnimation ${STORY_DURATION_MS}ms linear forwards`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                          }}
                          onAnimationEnd={handleNext}
                        />
                      </div>

                      {/* Header com Loja, Avatar e Ações */}
                      <div className="flex items-center justify-between pointer-events-auto pt-0.5">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar da Loja com anel sutil */}
                          <div className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-white/40 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shadow-sm">
                            {offer.sellerCompany.substring(0, 2)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white drop-shadow truncate max-w-[150px] sm:max-w-[180px]">
                              {offer.sellerCompany}
                            </span>
                            <span className="text-[11px] text-white/60">•</span>
                            <span className="text-[11px] text-white/70">
                              {offer.condition}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação do Topo */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPaused((p) => !p)}
                            className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                            title={isPaused ? 'Reproduzir' : 'Pausar'}
                          >
                            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                          </button>

                          {onToggleFavorite && (
                            <button
                              type="button"
                              onClick={(e) => onToggleFavorite(offer.id, e)}
                              className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                            >
                              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ======================================================= */}
                    {/* RODAPÉ DO STORY COM BOTÃO MINIMALISTA DE MAIS DETALHES  */}
                    {/* ======================================================= */}
                    <div className="relative z-20 p-3.5 sm:p-4 space-y-2.5 pointer-events-auto">
                      {/* Cartão Minimalista com Preço e Ação Direta */}
                      <div className="p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 shadow-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate pr-1">
                            <h3 className="font-semibold text-xs text-white truncate drop-shadow">
                              {offer.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                              {offer.freeShipping ? (
                                <span className="text-[#00D287] font-semibold flex items-center gap-0.5">
                                  <Truck className="w-3 h-3" /> Frete Grátis
                                </span>
                              ) : offer.shippingCost ? (
                                <span>Frete: {formatBRL(offer.shippingCost)}</span>
                              ) : null}
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <ShieldCheck className="w-3 h-3 text-[#00D287]" /> B2B
                              </span>
                            </div>
                          </div>

                          <span className="text-sm font-black text-[#00D287] drop-shadow flex-shrink-0">
                            {formatBRL(offer.price)}
                          </span>
                        </div>

                        {/* Botão Minimalista e Elegante de Mais Detalhes */}
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDetails(offer);
                          }}
                          className="w-full py-2.5 px-3 rounded-lg bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00D287]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Mais Detalhes & Comprar</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Botões Laterais Flutuantes Próximos ao Story Central em Destaque (Instagram Web Style) */}
      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] justify-between pointer-events-none z-50">
        {canGoPrev ? (
          <button
            onClick={handlePrev}
            className="pointer-events-auto -translate-x-12 w-8 h-8 rounded-full bg-[#262626]/90 hover:bg-[#383838] text-white border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div />
        )}

        {canGoNext ? (
          <button
            onClick={handleNext}
            className="pointer-events-auto translate-x-12 w-8 h-8 rounded-full bg-[#262626]/90 hover:bg-[#383838] text-white border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
