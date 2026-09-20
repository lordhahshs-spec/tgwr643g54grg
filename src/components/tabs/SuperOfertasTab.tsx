import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Search, 
  Plus, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  OfferCategory, 
  OfferCondition 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { StoryOfferCard } from '@/components/marketplace/StoryOfferCard';
import { HorizontalOfferCard } from '@/components/marketplace/HorizontalOfferCard';
import { OfferDetailsModal } from '@/components/marketplace/OfferDetailsModal';
import { CreateOfferModal } from '@/components/marketplace/CreateOfferModal';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { MyMarketplacePanel } from '@/components/marketplace/MyMarketplacePanel';
import { toast } from 'sonner';

const CATEGORIES: (OfferCategory | 'Todas')[] = [
  'Todas',
  'Celulares',
  'Peças',
  'Telas',
  'Baterias',
  'Conectores',
  'Acessórios',
  'Ferramentas',
  'Máquinas',
  'Eletrônicos',
  'Componentes',
  'Lotes',
  'Outros'
];

const CONDITIONS: (OfferCondition | 'Todas')[] = [
  'Todas',
  'Novo',
  'Seminovo',
  'Usado',
  'Recondicionado',
  'Com avaria',
  'Para retirada de peças'
];

export const SuperOfertasTab: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeView, setActiveView] = useState<'explorar' | 'painel'>('explorar');

  // Real database states (STRICTLY real data, zero mocks)
  const [hotOffers, setHotOffers] = useState<MarketplaceOffer[]>([]);
  const [regularOffers, setRegularOffers] = useState<MarketplaceOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OfferCategory | 'Todas'>('Todas');
  const [selectedCondition, setSelectedCondition] = useState<OfferCondition | 'Todas'>('Todas');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'views'>('recent');

  // Modals
  const [selectedOfferForDetails, setSelectedOfferForDetails] = useState<MarketplaceOffer | null>(null);
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<MarketplaceOffer | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Carousel ref for smooth horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

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

      // 2. Carrega lista geral com filtros aplicados
      const regular = await marketplaceService.getOffers({
        search,
        category: selectedCategory,
        condition: selectedCondition,
        sortBy,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedCondition, sortBy]);

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
      {/* Top Header Bar */}
      <div className="relative border-b border-[#00D287]/15 bg-gradient-to-r from-[#070c18] via-[#0a1224] to-[#070c18] px-4 sm:px-8 py-6 overflow-hidden">
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30">
                <Flame className="w-3.5 h-3.5 fill-[#00D287]" />
                Super Ofertas • B2B
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">Lojista para Lojista</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Marketplace <span className="text-[#00D287]">Super Ofertas</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Criar Super Oferta</span>
              </button>
            )}

            <button
              onClick={() => setActiveView(activeView === 'explorar' ? 'painel' : 'explorar')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
                activeView === 'painel'
                  ? 'bg-slate-800 text-[#00D287] border-[#00D287]/40'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border-white/10'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{activeView === 'explorar' ? 'Meu Painel' : 'Ver Vitrine'}</span>
            </button>
          </div>
        </div>
      </div>

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

                  {currentUser && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#00D287] border border-[#00D287]/30 text-xs font-bold transition-all flex-shrink-0"
                    >
                      Cadastrar Oferta
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ========================================================================= */}
            {/* 2. SEÇÃO INFERIOR: DEMAIS OFERTAS / FEED HORIZONTAL ESCALONADO */}
            {/* ========================================================================= */}
            <section className="space-y-5 pt-4 border-t border-white/5">
              {/* Header & Filter Controls */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                      Demais Ofertas
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Explore todas as peças, equipamentos e lotes disponíveis na rede de lojistas
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {regularOffers.length} {regularOffers.length === 1 ? 'oferta disponível' : 'ofertas disponíveis'}
                  </span>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por produto, lote, ferramenta, modelo..."
                      className="w-full rounded-xl bg-[#090e1c] border border-white/10 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedCondition}
                      onChange={(e: any) => setSelectedCondition(e.target.value)}
                      className="w-full rounded-xl bg-[#090e1c] border border-white/10 px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:border-[#00D287] focus:outline-none"
                    >
                      <option value="Todas">Todas as Condições</option>
                      {CONDITIONS.filter(c => c !== 'Todas').map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="w-full rounded-xl bg-[#090e1c] border border-white/10 px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:border-[#00D287] focus:outline-none"
                    >
                      <option value="recent">Mais Recentes</option>
                      <option value="price_asc">Menor Preço</option>
                      <option value="price_desc">Maior Preço</option>
                      <option value="views">Mais Visualizados</option>
                    </select>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#00D287]/20 border-[#00D287] text-[#00D287]'
                            : 'bg-[#090e1c] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feed de Ofertas Horizontais com Efeito Escalonado */}
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
                      {search || selectedCategory !== 'Todas' || selectedCondition !== 'Todas'
                        ? 'Nenhum item corresponde aos filtros selecionados. Tente redefinir a busca.'
                        : 'Seja o primeiro lojista a publicar uma oferta no Marketplace B2B!'}
                    </p>
                  </div>
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
              ) : (
                <div className="space-y-4">
                  {regularOffers.map((offer, idx) => (
                    <HorizontalOfferCard
                      key={offer.id}
                      offer={offer}
                      isFavorite={favorites.includes(offer.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={(off) => setSelectedOfferForDetails(off)}
                      isStepped={idx % 2 === 1}
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
