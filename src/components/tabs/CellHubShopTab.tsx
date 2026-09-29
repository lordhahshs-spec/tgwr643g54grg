import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  ShieldCheck,
  RefreshCw,
  Zap,
  PackageCheck,
  CheckCircle2,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';
import { MarketplaceOffer, OfferCategory } from '@/types/marketplace';
import { marketplaceService, clearMarketplaceCache } from '@/services/marketplaceService';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { MercadoLivreOfferCard } from '@/components/marketplace/MercadoLivreOfferCard';
import { OfferDetailsModal } from '@/components/marketplace/OfferDetailsModal';
import { CheckoutModal } from '@/components/marketplace/CheckoutModal';
import { CreateOfficialOfferModal } from '@/components/marketplace/CreateOfficialOfferModal';
import { toast } from 'sonner';

interface CellHubShopTabProps {
  isDemo?: boolean;
  onUnlock?: (reason?: string) => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos os Produtos' },
  { id: 'Celulares', label: 'iPhones & Celulares' },
  { id: 'Peças', label: 'Telas & Peças' },
  { id: 'Ferramentas', label: 'Ferramentas de Bancada' },
  { id: 'Acessórios', label: 'Acessórios & Cabos' },
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

  const loadData = async () => {
    try {
      // Busca estritamente ofertas oficiais da CellHub
      const data = await marketplaceService.getOffers({ isOfficial: true });
      setOffers(data);
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
    clearMarketplaceCache();
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

  // Filtragem no catálogo
  const filteredOffers = offers.filter((offer) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      offer.title.toLowerCase().includes(term) ||
      offer.category.toLowerCase().includes(term) ||
      (offer.subcategory && offer.subcategory.toLowerCase().includes(term));

    const cat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory === 'todos' ||
      offer.category.toLowerCase().includes(cat) ||
      (offer.subcategory && offer.subcategory.toLowerCase().includes(cat));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-full flex-1 bg-[#040711] text-slate-100 flex flex-col pb-12">
      {/* Top Header Bar Estilo Loja Oficial Mercado Livre */}
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
                <Zap className="w-2.5 h-2.5 fill-[#00D287]" /> Full Oficial
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Produtos originais e inspecionados com 90 dias de garantia direta
            </p>
          </div>
        </div>

        {/* Botão de Criação de Produto Oficial (Exclusivo para Administrador) */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsCreateOfficialModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Adicionar Produto Oficial</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </header>

      {/* Main Catalog Body */}
      <main className="flex-1 px-3.5 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Banner Oficial Mercado Livre / Full CellHub */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#071322] to-slate-950 border border-[#00D287]/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center flex-shrink-0 shadow-sm">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                Loja Oficial CellHub
                <CheckCircle2 className="w-4 h-4 text-[#00D287]" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Garantia técnica de 90 dias • Envio direto dos nossos galpões • Pagamento seguro em até 12x
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-[#00D287] bg-[#00D287]/10 px-2.5 py-1 rounded-xl border border-[#00D287]/20 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Envio Expresso para todo o Brasil
            </span>
          </div>
        </div>

        {/* Busca e Filtros de Categoria (Estilo Mercado Livre) */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no catálogo oficial CellHub (iPhones, telas, baterias, ferramentas)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
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

        {/* Grade de Produtos no Formato Mercado Livre */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D287]" />
              Catálogo Oficial ({filteredOffers.length} {filteredOffers.length === 1 ? 'produto' : 'produtos'})
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-[#00D287] animate-spin" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#090e1c] border border-white/5 space-y-3.5 p-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nenhum produto oficial cadastrado</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Os produtos oficiais adicionados pela administração aparecerão listados aqui no formato de catálogo.
                </p>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsCreateOfficialModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Adicionar Primeiro Produto Oficial
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
              {filteredOffers.map((offer) => (
                <MercadoLivreOfferCard
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

      {/* Modais de Detalhes e Checkout */}
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

      {/* Modal de Criação de Produto Oficial (Exclusivo Admin) */}
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
