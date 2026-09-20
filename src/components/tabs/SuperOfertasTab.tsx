import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2
} from 'lucide-react';
import { MarketplaceOffer } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { StoryOfferCard } from '@/components/marketplace/StoryOfferCard';
import { HorizontalOfferCard } from '@/components/marketplace/HorizontalOfferCard';
import { OfferDetailsModal } from '@/components/marketplace/OfferDetailsModal';
import { CreateOfferModal } from '@/components/marketplace/CreateOfferModal';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { MyMarketplacePanel } from '@/components/marketplace/MyMarketplacePanel';
import { toast } from 'sonner';

export const SuperOfertasTab: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeView, setActiveView] = useState<'explorar' | 'painel'>('explorar');

  // Real database states (STRICTLY real data, zero mocks)
  const [hotOffers, setHotOffers] = useState<MarketplaceOffer[]>([]);
  const [regularOffers, setRegularOffers] = useState<MarketplaceOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedOfferForDetails, setSelectedOfferForDetails] = useState<MarketplaceOffer | null>(null);
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<MarketplaceOffer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);

  // Carousel ref for smooth horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleGenerateSamples = async () => {
    setIsGeneratingSamples(true);
    try {
      const success = await marketplaceService.generateSampleOffers(currentUser?.id);
      if (success) {
        toast.success('8 ofertas de exemplo geradas com sucesso! (Stories 9:16 e Feed Horizontal)');
        await loadData();
      } else {
        toast.error('Erro ao gerar ofertas de exemplo.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar ao banco de dados.');
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  const handleClearAllOffers = async () => {
    if (window.confirm('Deseja excluir todas as ofertas para testar o estado vazio?')) {
      await marketplaceService.clearAllOffers();
      toast.info('Todas as ofertas foram removidas.');
      await loadData();
    }
  };

  useEffect(() => {
    const user = leadAuthService.getCurrentUser();
    setCurrentUser(user);
    if (user?.id) {
      loadFavorites(user.id);
    }
    leadAuthService.syncCurrentUserWithDatabase().then((synced) => {
      if (synced) {
        setCurrentUser(synced);
        loadFavorites(synced.id);
      }
    });
    loadData();
  }, []);

  const loadFavorites = async (userId: string) => {
    const favs = await marketplaceService.getFavorites(userId);
    setFavorites(favs);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carrega ofertas quentes baseadas estritamente em interações reais do banco
      const hot = await marketplaceService.getHotOffers();
      setHotOffers(hot);

      // 2. Carrega lista geral de ofertas
      const regular = await marketplaceService.getOffers({
        status: 'publicada',
      });
      setRegularOffers(regular);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados do marketplace.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Faça login para salvar favoritos.');
      return;
    }
    const added = await marketplaceService.toggleFavorite(currentUser.id, offerId);
    if (added) {
      setFavorites((prev) => [...prev, offerId]);
      toast.success('Oferta favoritada!');
    } else {
      setFavorites((prev) => prev.filter((id) => id !== offerId));
      toast.info('Oferta removida dos favoritos.');
    }
  };

  const handleOpenCheckout = (offer: MarketplaceOffer) => {
    setSelectedOfferForDetails(null);
    setSelectedOfferForCheckout(offer);
  };

  // Carousel navigation handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#050811] text-slate-100 custom-scrollbar">
      {/* Sleek Top Header Bar (Compact, No Double Headers) */}
      <header className="sticky top-0 z-30 h-14 bg-[#080c17]/95 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D287]" />
            <span className="text-sm font-extrabold text-white tracking-tight">
              Super <span className="text-[#00D287]">Ofertas</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase">
              B2B
            </span>
          </div>

          {/* Segmented View Switcher */}
          <div className="hidden sm:flex items-center bg-[#050811] p-1 rounded-xl border border-white/5 ml-2">
            <button
              onClick={() => setActiveView('explorar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'explorar'
                  ? 'bg-[#00D287] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Vitrine</span>
            </button>
            <button
              onClick={() => setActiveView('painel')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'painel'
                  ? 'bg-[#00D287] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Meu Painel</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSamples}
            disabled={isGeneratingSamples}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Criar exemplos nos formatos Stories 9:16 e Feed Horizontal"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden md:inline">{isGeneratingSamples ? 'Gerando...' : 'Gerar Exemplos'}</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#00D287]/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Oferta</span>
            </button>
          )}

          {(hotOffers.length > 0 || regularOffers.length > 0) && (
            <button
              onClick={handleClearAllOffers}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors"
              title="Limpar todas as ofertas (testar tela vazia)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile view toggle */}
          <button
            onClick={() => setActiveView(activeView === 'explorar' ? 'painel' : 'explorar')}
            className="sm:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-white/10"
            title="Alternar Painel / Vitrine"
          >
            <Package className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">
        {activeView === 'painel' && currentUser ? (
          <MyMarketplacePanel
            currentUser={currentUser}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectOffer={(offer) => setSelectedOfferForDetails(offer)}
          />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. SEÇÃO TOPO: OFERTAS QUENTES (Instagram Stories 9:16 Format) */}
            {/* ========================================================================= */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-sm">
                    <Flame className="w-4 h-4 fill-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-none flex items-center gap-2">
                      Ofertas Quentes
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        Stories 9:16
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Itens com maior procura e interações reais entre lojistas
                    </p>
                  </div>
                </div>

                {/* Desktop Carousel Scroll Arrows */}
                {hotOffers.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => scrollCarousel('left')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('right')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="Próximo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stories Carousel Content */}
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#00D287]" />
                  Consultando ofertas do banco de dados...
                </div>
              ) : hotOffers.length > 0 ? (
                <div
                  ref={carouselRef}
                  className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
                >
                  {hotOffers.map((offer) => (
                    <div key={offer.id} className="snap-start">
                      <StoryOfferCard
                        offer={offer}
                        isFavorite={favorites.includes(offer.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={(off) => setSelectedOfferForDetails(off)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Estado Vazio Apropriado para Ofertas Quentes (Sem dados fictícios) */
                <div className="p-6 rounded-2xl bg-[#090e1c] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Nenhuma oferta em alta no momento</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        As ofertas que receberem visualizações, favoritos e pedidos reais na rede aparecerão automaticamente em destaque neste carrossel.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 flex-shrink-0">
                    <button
                      onClick={handleGenerateSamples}
                      disabled={isGeneratingSamples}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-[#00D287] border border-[#00D287]/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#00D287]" />
                      Gerar Exemplos (Stories & Feed)
                    </button>

                    {currentUser && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-bold transition-all"
                      >
                        Cadastrar Oferta
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Linha Minimalista de Divisão nas Cores da Plataforma */}
            <div className="relative py-1 w-full">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D287]/40 to-transparent" />
            </div>

            {/* Feed de Ofertas */}
            <section className="space-y-4">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-[#00D287] animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Buscando ofertas reais no Supabase...</p>
                </div>
              ) : regularOffers.length === 0 ? (
                /* Estado Vazio Apropriado para Demais Ofertas */
                <div className="py-16 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Nenhuma oferta cadastrada no momento</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Seja o primeiro lojista a publicar uma oferta no Marketplace B2B!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleGenerateSamples}
                      disabled={isGeneratingSamples}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-[#00D287] border border-[#00D287]/40 text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-[#00D287]" />
                      <span>{isGeneratingSamples ? 'Gerando...' : 'Gerar Ofertas de Exemplo'}</span>
                    </button>

                    {currentUser && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-[#00D287] text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-[#00D287]/20"
                      >
                        <Plus className="w-4 h-4" />
                        Publicar Primeira Oferta
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {regularOffers.map((offer) => (
                    <HorizontalOfferCard
                      key={offer.id}
                      offer={offer}
                      isFavorite={favorites.includes(offer.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={(off) => setSelectedOfferForDetails(off)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedOfferForDetails && (
        <OfferDetailsModal
          offer={selectedOfferForDetails}
          onClose={() => setSelectedOfferForDetails(null)}
          isFavorite={favorites.includes(selectedOfferForDetails.id)}
          onToggleFavorite={handleToggleFavorite}
          onInitiateCheckout={handleOpenCheckout}
          currentUserId={currentUser?.id}
          currentUserCompany={currentUser?.companyName}
        />
      )}

      {selectedOfferForCheckout && currentUser && (
        <CheckoutModal
          offer={selectedOfferForCheckout}
          currentUser={currentUser}
          onClose={() => setSelectedOfferForCheckout(null)}
          onSuccess={(orderId) => {
            setSelectedOfferForCheckout(null);
            setActiveView('painel');
            loadData();
          }}
        />
      )}

      {isCreateModalOpen && currentUser && (
        <CreateOfferModal
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            loadData();
            setActiveView('painel');
          }}
        />
      )}
    </div>
  );
};
