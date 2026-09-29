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
  Sparkles,
  ArrowRight,
  Boxes,
  Smartphone,
  Cpu,
  Wrench,
  Headphones
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

const CATEGORIES: { id: string; label: string; icon: any }[] = [
  { id: 'todos', label: 'Todos os Produtos', icon: Boxes },
  { id: 'Celulares', label: 'iPhones & Celulares', icon: Smartphone },
  { id: 'Peças', label: 'Telas & Peças', icon: Cpu },
  { id: 'Ferramentas', label: 'Ferramentas de Bancada', icon: Wrench },
  { id: 'Acessórios', label: 'Acessórios & Cabos', icon: Headphones },
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
      offer.category.toLowerCase() === cat ||
      (offer.subcategory && offer.subcategory.toLowerCase() === cat);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-full flex-1 bg-[#040711] text-slate-100 flex flex-col pb-16">
      {/* Top Header Bar Estilo Loja Oficial Mercado Livre Full Width */}
      <header className="sticky top-0 z-30 bg-[#060a16]/95 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-lg shadow-black/40 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md shadow-[#00D287]/30">
            <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                CellHub <span className="text-[#00D287]">Shop</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#00D287]" /> Full Oficial
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Produtos originais e inspecionados com 90 dias de garantia direta
            </p>
          </div>
        </div>

        {/* Botão de Criação de Produto Oficial (Exclusivo para Administrador) */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsCreateOfficialModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Produto Oficial</span>
          </button>
        )}
      </header>

      {/* Main Catalog Body - Full Width Edge to Edge */}
      <main className="flex-1 px-4 sm:px-8 py-4 sm:py-6 w-full space-y-5">
        {/* Banner Oficial Mercado Livre / Full CellHub (Full Width) */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#071322] to-slate-950 border border-[#00D287]/30 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center flex-shrink-0 shadow-sm">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                Loja Oficial CellHub
                <CheckCircle2 className="w-4 h-4 text-[#00D287]" />
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Garantia técnica de 90 dias • Envio direto dos nossos galpões • Pagamento seguro em até 12x
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <span className="text-xs font-bold text-[#00D287] bg-[#00D287]/10 px-3 py-1.5 rounded-xl border border-[#00D287]/20 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Envio Expresso para todo o Brasil
            </span>
          </div>
        </div>

        {/* Busca e Filtros de Categoria (Estilo Mercado Livre Full Width) */}
        <div className="w-full space-y-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no catálogo oficial CellHub (iPhones, telas, baterias, ferramentas)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#080d1a] border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287] transition-all shadow-inner"
            />
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/25'
                      : 'bg-[#090e1c] text-slate-400 hover:text-white border border-white/5 hover:border-white/15'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[2.5]' : 'opacity-70'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade de Produtos ou Card Imersivo Completo */}
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D287] shadow-sm shadow-[#00D287]" />
              Catálogo Oficial ({filteredOffers.length} {filteredOffers.length === 1 ? 'produto' : 'produtos'})
            </h3>
          </div>

          {loading ? (
            <div className="py-24 text-center flex items-center justify-center w-full">
              <RefreshCw className="w-7 h-7 text-[#00D287] animate-spin" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="w-full min-h-[380px] rounded-3xl bg-gradient-to-b from-[#080d1b] to-[#040711] border border-white/10 flex flex-col items-center justify-center p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
              {/* Efeito luminoso de fundo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00D287]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-[#00D287]/10 border border-[#00D287]/25 flex items-center justify-center mx-auto text-[#00D287] mb-4 shadow-lg shadow-[#00D287]/10">
                <ShoppingBag className="w-8 h-8 stroke-[2]" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white">
                Catálogo Oficial CellHub Pronto para Vendas
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
                Nenhum produto cadastrado no momento. Cadastre aparelhos, telas, baterias e ferramentas com cálculo de margem e fotos para preencher toda a vitrine.
              </p>

              {currentUser?.role === 'admin' ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCreateOfficialModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all cursor-pointer transform active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar Primeiro Produto Oficial</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>Aguardando publicação de novos lotes pela equipe CellHub</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4.5">
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
