import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Plus,
  Search,
  Truck,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  PackageCheck,
  Building2,
  ArrowRight
} from 'lucide-react';
import { MarketplaceOffer, OfferCategory } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { HorizontalOfferCard } from '@/components/marketplace/HorizontalOfferCard';
import { StoryOfferCard } from '@/components/marketplace/StoryOfferCard';
import { StoriesViewerModal } from '@/components/marketplace/StoriesViewerModal';
import { OfferDetailsModal } from '@/components/marketplace/OfferDetailsModal';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { CreateOfficialOfferModal } from '@/components/marketplace/CreateOfficialOfferModal';
import { toast } from 'sonner';

interface CellHubShopTabProps {
  isDemo?: boolean;
  onUnlock?: (reason?: string) => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'todos', label: 'Tudo' },
  { id: 'Celulares', label: 'iPhones & Celulares' },
  { id: 'Peças de Reposição', label: 'Telas & Peças' },
  { id: 'Ferramentas de Bancada', label: 'Ferramentas' },
  { id: 'Acessórios & Cabos', label: 'Acessórios' },
];

export const CellHubShopTab: React.FC<CellHubShopTabProps> = ({ isDemo = false, onUnlock }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => leadAuthService.getCurrentUser());
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Modals
  const [selectedOfferForDetails, setSelectedOfferForDetails] = useState<MarketplaceOffer | null>(null);
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<MarketplaceOffer | null>(null);
  const [isCreateOfficialModalOpen, setIsCreateOfficialModalOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryOfferId, setSelectedStoryOfferId] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const data = await marketplaceService.getOffers();
      // Filtrar apenas ofertas oficiais da CellHub
      const officialOffers = data.filter((o) => o.isOfficial || o.sellerCompany.toLowerCase().includes('cellhub'));
      setOffers(officialOffers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const favs = await marketplaceService.getFavorites(userId);
      setFavorites(favs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const user = leadAuthService.getCurrentUser();
    setCurrentUser(user);
    if (user?.id) {
      loadFavorites(user.id);
    }
    loadData();

    // Sincronização em tempo real a cada 5 segundos
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleFavorite = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) {
      toast.info('Faça login para salvar favoritos.');
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
      onUnlock?.('O Checkout na Loja CellHub é exclusivo para membros com licença vitalícia ativa.');
      return;
    }
    setSelectedOfferForDetails(null);
    setSelectedOfferForCheckout(offer);
  };

  // Filtragem
  const filteredOffers = offers.filter((offer) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      offer.title.toLowerCase().includes(term) ||
      offer.category.toLowerCase().includes(term) ||
      (offer.subcategory && offer.subcategory.toLowerCase().includes(term));

    const cat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory === 'todos' ||
      offer.category.toLowerCase() === cat ||
      (offer.subcategory && offer.subcategory.toLowerCase() === cat);

    return matchesSearch && matchesCategory;
  });

  const hotOffers = offers.filter((o) => o.status === 'publicada');

  return (
    <div className="w-full min-h-full flex-1 bg-[#040711] text-slate-100 flex flex-col pb-12">
      {/* Top Header Bar Estilo Loja Oficial */}
      <header className="sticky top-0 z-30 bg-[#060a16]/95 backdrop-blur-2xl border-b border-white/10 px-3.5 sm:px-8 py-3 flex items-center justify-between gap-3 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md shadow-[#00D287]/30">
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                CellHub <span className="text-[#00D287]">Shop</span>
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Oficial
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Produtos com garantia de 90 dias enviados direto pela CellHub
            </p>
          </div>
        </div>

        {/* Botão de Criação de Oferta Oficial (Exclusivo para Administrador) */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsCreateOfficialModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Adicionar Produto Oficial</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </header>

      {/* Main Body Content */}
      <main className="flex-1 px-3.5 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner de Garantia Oficial CellHub */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#071322] to-slate-950 border border-[#00D287]/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                Vendido & Enviado Oficialmente por CellHub
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287]" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Garantia técnica de 90 dias, Nota Fiscal e rastreamento expresso com seguro total.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-[#00D287] bg-[#00D287]/10 px-2 py-1 rounded-lg border border-[#00D287]/20 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Envio para todo o Brasil
            </span>
          </div>
        </div>

        {/* Barra de Busca e Filtros de Categoria */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos oficiais CellHub..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                    : 'bg-[#090e1c] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stories / Destaques Oficiais */}
        {hotOffers.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Destaques em Alta
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Toque para ver detalhes</span>
            </div>

            <div
              ref={carouselRef}
              className="flex items-center gap-3 overflow-x-auto px-1 py-1.5 snap-x snap-mandatory scroll-smooth no-scrollbar"
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
          </section>
        )}

        {/* Grade de Produtos Oficiais */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D287]" />
              Catálogo Oficial CellHub ({filteredOffers.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-16 text-center flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-[#00D287] animate-spin" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nenhum produto oficial encontrado</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Novos lotes de aparelhos e ferramentas oficiais chegam semanalmente.
                </p>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsCreateOfficialModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Adicionar Primeiro Produto Oficial
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredOffers.map((offer) => (
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
      </main>

      {/* Modais */}
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
          isOpen={Boolean(selectedOfferForCheckout)}
          onClose={() => setSelectedOfferForCheckout(null)}
          offer={selectedOfferForCheckout}
          currentUser={currentUser}
          onOrderSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Stories Viewer Modal */}
      {isStoryViewerOpen && (
        <StoriesViewerModal
          isOpen={isStoryViewerOpen}
          offers={hotOffers}
          initialOfferId={selectedStoryOfferId}
          onClose={() => {
            setIsStoryViewerOpen(false);
            setSelectedStoryOfferId(null);
          }}
          onOpenCheckout={handleOpenCheckout}
          isFavorite={(id) => favorites.includes(id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Create Official Offer Modal (Admin only) */}
      {isCreateOfficialModalOpen && currentUser && (
        <CreateOfficialOfferModal
          isOpen={isCreateOfficialModalOpen}
          onClose={() => setIsCreateOfficialModalOpen(false)}
          currentUser={currentUser}
          onOfferCreated={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
