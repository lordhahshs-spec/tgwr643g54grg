import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  SlidersHorizontal, 
  ShoppingBag, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Package,
  Layers
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  OfferCategory, 
  OfferCondition 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { OfferCard } from '@/components/marketplace/OfferCard';
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

  // Offers & State
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
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

  useEffect(() => {
    const user = leadAuthService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      loadFavorites(user.id);
    }
    loadOffers();
  }, []);

  const loadFavorites = async (userId: string) => {
    const favs = await marketplaceService.getFavorites(userId);
    setFavorites(favs);
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getOffers({
        search,
        category: selectedCategory,
        condition: selectedCondition,
        sortBy,
        status: 'publicada',
      });
      setOffers(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar as ofertas do marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOffers();
    }, 250);
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
      toast.success('Oferta adicionada aos favoritos!');
    } else {
      setFavorites((prev) => prev.filter((id) => id !== offerId));
      toast.info('Oferta removida dos favoritos.');
    }
  };

  const handleOpenCheckout = (offer: MarketplaceOffer) => {
    setSelectedOfferForDetails(null);
    setSelectedOfferForCheckout(offer);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#050811] text-slate-100 custom-scrollbar">
      {/* Top B2B Banner Header */}
      <div className="relative border-b border-[#00D287]/15 bg-gradient-to-r from-[#070c18] via-[#0a1224] to-[#070c18] px-4 sm:px-8 py-6 sm:py-8 overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#00D287]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30">
                <Flame className="w-3.5 h-3.5 fill-[#00D287]" />
                Marketplace B2B • Lojista para Lojista
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• Custódia AurusPay 100% Protegida</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Super <span className="text-[#00D287]">Ofertas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Compre e venda celulares, peças, telas, baterias, ferramentas, maquinários de bancada e componentes diretamente entre lojistas autorizados de todo o Brasil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Criar Super Oferta</span>
              </button>
            )}

            <button
              onClick={() => setActiveView(activeView === 'explorar' ? 'painel' : 'explorar')}
              className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
                activeView === 'painel'
                  ? 'bg-slate-800 text-[#00D287] border-[#00D287]/40'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border-white/10'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{activeView === 'explorar' ? 'Meu Painel Lojista' : 'Voltar para Vitrine'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {activeView === 'painel' && currentUser ? (
          <MyMarketplacePanel
            currentUser={currentUser}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectOffer={(offer) => setSelectedOfferForDetails(offer)}
          />
        ) : (
          <>
            {/* Search and Filters Bar */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="md:col-span-6 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar telas OLED, baterias, placas, ferramentas, lotes..."
                    className="w-full rounded-2xl bg-[#090e1c] border border-white/10 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#00D287] focus:outline-none shadow-sm"
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

                {/* Condition Filter */}
                <div className="md:col-span-3">
                  <select
                    value={selectedCondition}
                    onChange={(e: any) => setSelectedCondition(e.target.value)}
                    className="w-full rounded-2xl bg-[#090e1c] border border-white/10 px-3.5 py-3 text-xs sm:text-sm text-slate-200 focus:border-[#00D287] focus:outline-none cursor-pointer"
                  >
                    <option value="Todas">Todas as Condições</option>
                    {CONDITIONS.filter(c => c !== 'Todas').map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full rounded-2xl bg-[#090e1c] border border-white/10 px-3.5 py-3 text-xs sm:text-sm text-slate-200 focus:border-[#00D287] focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Mais Recentes</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="views">Mais Visualizados</option>
                  </select>
                </div>
              </div>

              {/* Category Pills Horizontal Scroller */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-[#00D287]/20 border-[#00D287] text-[#00D287] shadow-sm shadow-[#00D287]/20'
                          : 'bg-[#090e1c] border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#00D287] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Carregando ofertas B2B disponíveis...</p>
              </div>
            ) : offers.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nenhuma oferta encontrada</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Não encontramos ofertas para o filtro selecionado. Tente alterar a categoria ou o termo de busca.
                  </p>
                </div>
                {currentUser && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#00D287] text-slate-950 text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Seja o primeiro a ofertar nesta categoria
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isFavorite={favorites.includes(offer.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(off) => setSelectedOfferForDetails(off)}
                  />
                ))}
              </div>
            )}
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
            loadOffers();
          }}
        />
      )}

      {isCreateModalOpen && currentUser && (
        <CreateOfferModal
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            loadOffers();
            setActiveView('painel');
          }}
        />
      )}
    </div>
  );
};
