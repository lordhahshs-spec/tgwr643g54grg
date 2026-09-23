import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Package,
  Plus,
  Sparkles,
  RefreshCw,
  Trash2,
  ShoppingBag,
  Search,
  X,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { MarketplaceOffer } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { StoryOfferCard } from '@/components/marketplace/StoryOfferCard';
import { HorizontalOfferCard } from '@/components/marketplace/HorizontalOfferCard';
import { OfferDetailsModal } from '@/components/marketplace/OfferDetailsModal';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { CreateOfferModal } from '@/components/marketplace/CreateOfferModal';
import { MyMarketplacePanel } from '@/components/marketplace/MyMarketplacePanel';
import { StoriesViewerModal } from '@/components/marketplace/StoriesViewerModal';
import { toast } from 'sonner';

interface SuperOfertasTabProps {
  isDemo?: boolean;
  onUnlock?: (reason?: string) => void;
}

const CATEGORIES = [
  { id: 'todos', label: 'Todas as Ofertas' },
  { id: 'Smartphones', label: 'Smartphones' },
  { id: 'Apple', label: 'iPhones / Apple' },
  { id: 'Samsung', label: 'Samsung' },
  { id: 'Xiaomi', label: 'Xiaomi' },
  { id: 'Smartwatches', label: 'Smartwatches' },
  { id: 'Acessórios', label: 'Acessórios' },
  { id: 'Peças', label: 'Peças & Telas' },
  { id: 'Tablets', label: 'Tablets & iPads' },
];

export const SuperOfertasTab: React.FC<SuperOfertasTabProps> = ({
  isDemo = false,
  onUnlock,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => leadAuthService.getCurrentUser());
  const [activeView, setActiveView] = useState<'explorar' | 'painel'>('explorar');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Cache instantâneo do localStorage para renderização com ZERO delay
  const [hotOffers, setHotOffers] = useState<MarketplaceOffer[]>(() => {
    try {
      const cached = localStorage.getItem('cellhub_cached_hot_offers');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [regularOffers, setRegularOffers] = useState<MarketplaceOffer[]>(() => {
    try {
      const cached = localStorage.getItem('cellhub_cached_regular_offers');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(regularOffers.length === 0);

  // Modals
  const [selectedOfferForDetails, setSelectedOfferForDetails] = useState<MarketplaceOffer | null>(null);
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<MarketplaceOffer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);

  // Instagram Stories Modal state
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryOfferId, setSelectedStoryOfferId] = useState<string | null>(null);

  // Carousel ref for smooth horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleGenerateSamples = async () => {
    setIsGeneratingSamples(true);
    try {
      const success = await marketplaceService.generateSampleOffers(currentUser?.id);
      if (success) {
        toast.success('Ofertas de exemplo geradas no banco com sucesso!');
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
    if (window.confirm('Deseja excluir todas as ofertas cadastradas na vitrine?')) {
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

    const handleUserUpdated = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('cellhub_user_updated', handleUserUpdated);

    const tickInterval = setInterval(() => {
      loadData(true);
    }, 4000);

    return () => {
      window.removeEventListener('cellhub_user_updated', handleUserUpdated);
      clearInterval(tickInterval);
    };
  }, []);

  const loadFavorites = async (userId: string) => {
    const favs = await marketplaceService.getFavorites(userId);
    setFavorites(favs);
  };

  const loadData = async (silent = false) => {
    if (!silent && regularOffers.length === 0) {
      setLoading(true);
    }
    try {
      const regular = await marketplaceService.getOffers({
        status: 'publicada',
      });

      setRegularOffers(regular);
      setHotOffers(regular);

      try {
        localStorage.setItem('cellhub_cached_regular_offers', JSON.stringify(regular));
        localStorage.setItem('cellhub_cached_hot_offers', JSON.stringify(regular));
      } catch {}
    } catch (e) {
      console.error('[SuperOfertasTab] Erro ao carregar ofertas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) {
      toast.info('Faça login ou ative sua conta para salvar favoritos.');
      return;
    }
    const isFav = favorites.includes(offerId);
    if (isFav) {
      setFavorites(favorites.filter((id) => id !== offerId));
    } else {
      setFavorites([...favorites, offerId]);
    }
    await marketplaceService.toggleFavorite(currentUser.id, offerId);
  };

  const handleOpenCheckout = (offer: MarketplaceOffer) => {
    if (isDemo) {
      onUnlock?.('O Checkout e Compra no Marketplace B2B é exclusivo para membros com licença vitalícia ativa.');
      return;
    }
    setSelectedOfferForDetails(null);
    setSelectedOfferForCheckout(offer);
  };

  // Filtragem de ofertas por busca e categoria
  const filteredRegularOffers = regularOffers.filter((offer) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      offer.title.toLowerCase().includes(term) ||
      offer.sellerCompany.toLowerCase().includes(term) ||
      offer.category.toLowerCase().includes(term) ||
      (offer.subcategory && offer.subcategory.toLowerCase().includes(term));

    const cat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory === 'todos' ||
      offer.category.toLowerCase() === cat ||
      (offer.subcategory && offer.subcategory.toLowerCase() === cat);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-full flex-1 bg-[#040711] text-slate-100 flex flex-col pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#060a16]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D287] shadow-sm shadow-[#00D287]/50 animate-pulse" />
            <span className="text-base font-black text-white tracking-tight">
              Super <span className="text-[#00D287]">Ofertas</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider">
              B2B
            </span>
          </div>

          {/* Segmented View Switcher */}
          <div className="hidden sm:flex items-center bg-[#090e1c] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('explorar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'explorar'
                  ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Vitrine</span>
            </button>
            <button
              onClick={() => {
                if (isDemo) {
                  onUnlock?.('O Painel de Lojista Vendedor requer uma licença vitalícia ativa.');
                  return;
                }
                setActiveView('painel');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'painel'
                  ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
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
          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={handleGenerateSamples}
                disabled={isGeneratingSamples}
                className="hidden md:flex px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 text-xs font-bold items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Gerar ofertas de exemplo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingSamples ? 'Gerando...' : 'Gerar Exemplos'}</span>
              </button>

              {regularOffers.length > 0 && (
                <button
                  onClick={handleClearAllOffers}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                  title="Limpar todas as ofertas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => {
              if (isDemo) {
                onUnlock?.('O anúncio e publicação de produtos no Marketplace B2B é exclusivo para lojas com plano vitalício ativo.');
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#00D287]/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Oferta</span>
          </button>

          {/* Mobile view toggle */}
          <button
            onClick={() => {
              if (activeView === 'explorar' && isDemo) {
                onUnlock?.('O Painel de Lojista Vendedor requer uma licença vitalícia ativa.');
                return;
              }
              setActiveView(activeView === 'explorar' ? 'painel' : 'explorar');
            }}
            className="sm:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-white/10"
            title="Alternar Painel / Vitrine"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full px-4 sm:px-6 py-3.5 space-y-5 flex-1">
        {/* VIEW: PAINEL DO LOJISTA */}
        <div className={activeView === 'painel' ? 'block' : 'hidden'}>
          {currentUser && (
            <MyMarketplacePanel
              currentUser={currentUser}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectOffer={(offer) => setSelectedOfferForDetails(offer)}
            />
          )}
        </div>

        {/* VIEW: VITRINE PÚBLICA */}
        <div className={activeView === 'explorar' ? 'block space-y-5' : 'hidden'}>
          {/* ========================================================================= */}
          {/* 1. SEÇÃO STORIES 9:16 (OFERTAS EM ALTA)                                   */}
          {/* ========================================================================= */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-tight leading-tight flex items-center gap-2">
                    Ofertas em Alta
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Stories 9:16
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Toque em qualquer card para assistir em tela cheia no formato Story
                  </p>
                </div>
              </div>
            </div>

            {/* Stories Carousel */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-[#00D287]" />
              </div>
            ) : hotOffers.length > 0 ? (
              <div className="relative">
                <div
                  ref={carouselRef}
                  className="flex items-center gap-3 sm:gap-4 overflow-x-auto px-1 py-1.5 snap-x snap-mandatory scroll-smooth no-scrollbar"
                >
                  {hotOffers.map((offer) => (
                    <div key={`story-${offer.id}`} className="snap-start flex-shrink-0">
                      <StoryOfferCard
                        offer={offer}
                        isFavorite={favorites.includes(offer.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={(off) => {
                          setSelectedStoryOfferId(off.id);
                          setIsStoryViewerOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* ========================================================================= */}
          {/* 2. BARRA DE BUSCA E CHIPS DE CATEGORIAS                                   */}
          {/* ========================================================================= */}
          <section className="space-y-3 pt-2">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Campo de Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por marca, modelo, categoria ou loja..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#090e1c] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#00D287] transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Contagem de Resultados */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Layers className="w-4 h-4 text-[#00D287]" />
                <span>Exibindo <strong>{filteredRegularOffers.length}</strong> ofertas</span>
              </div>
            </div>

            {/* Chips de Categorias */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20 scale-105'
                        : 'bg-[#090e1c] text-slate-400 hover:text-white border border-white/5 hover:border-white/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. GRADE DE PRODUTOS B2B (FEED PRINCIPAL)                                */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            {loading ? (
              <div className="py-16 text-center flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#00D287] animate-spin" />
              </div>
            ) : filteredRegularOffers.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nenhuma oferta encontrada</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {searchTerm || selectedCategory !== 'todos'
                      ? 'Nenhum item corresponde aos filtros selecionados. Tente limpar a busca.'
                      : 'Seja o primeiro lojista a publicar uma oferta no Marketplace B2B!'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {(searchTerm || selectedCategory !== 'todos') ? (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('todos');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleGenerateSamples}
                        disabled={isGeneratingSamples}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-[#00D287] border border-[#00D287]/40 text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#00D287]" />
                        <span>{isGeneratingSamples ? 'Gerando...' : 'Gerar Ofertas de Exemplo'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isDemo) {
                            onUnlock?.('O anúncio e publicação de ofertas no Marketplace B2B é exclusivo para membros com licença vitalícia ativa.');
                            return;
                          }
                          setIsCreateModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Publicar Primeira Oferta
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
                {filteredRegularOffers.map((offer) => (
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
        </div>
      </main>

      {/* Modais do Marketplace */}
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

      {/* Instagram Stories Viewer */}
      {isStoryViewerOpen && (
        <StoriesViewerModal
          offers={hotOffers}
          initialOfferId={selectedStoryOfferId}
          isOpen={isStoryViewerOpen}
          onClose={() => {
            setIsStoryViewerOpen(false);
            setSelectedStoryOfferId(null);
          }}
          onOpenDetails={(offer) => setSelectedOfferForDetails(offer)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
};
