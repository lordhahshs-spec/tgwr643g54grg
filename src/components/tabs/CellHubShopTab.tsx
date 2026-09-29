import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
  Zap,
  PackageCheck,
  CheckCircle2,
  Sparkles,
  Search,
  SlidersHorizontal,
  X
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
  { id: 'Celulares', label: 'Celulares' },
  { id: 'Peças', label: 'Peças' },
  { id: 'Telas', label: 'Telas' },
  { id: 'Baterias', label: 'Baterias' },
  { id: 'Conectores', label: 'Conectores' },
  { id: 'Acessórios', label: 'Acessórios' },
  { id: 'Ferramentas', label: 'Ferramentas' },
  { id: 'Máquinas', label: 'Máquinas' },
  { id: 'Eletrônicos', label: 'Eletrônicos' },
  { id: 'Componentes', label: 'Componentes' },
  { id: 'Lotes', label: 'Lotes' },
  { id: 'Outros', label: 'Outros' },
];

export const CellHubShopTab: React.FC<CellHubShopTabProps> = ({ isDemo = false, onUnlock }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => leadAuthService.getCurrentUser());
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredOffers = offers.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || o.title.toLowerCase().includes(q) || (o.description && o.description.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'todos' || o.category.toLowerCase() === selectedCategory.toLowerCase();
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

        {/* Search Bar & Category Navigation Pills */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modelo, marca ou produto oficial..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#080d1b] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills (12 Categorias Oficiais) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = cat.id === 'todos' 
                ? offers.length 
                : offers.filter((o) => o.category.toLowerCase() === cat.id.toLowerCase()).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#00D287] text-slate-950 border-[#00D287] shadow-sm shadow-[#00D287]/20'
                      : 'bg-[#080d1b] text-slate-300 hover:text-white hover:bg-slate-800 border-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950 text-[#00D287]' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divisor Dinâmico Minimalista com Brilho Verde */}
        <div className="relative py-2 flex items-center justify-center my-1 w-full">
          <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#00D287]/40 to-transparent relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D287]/80 to-transparent blur-[1.5px] opacity-80 animate-pulse" />
          </div>
          <div className="absolute w-2 h-2 rounded-full bg-[#00D287] shadow-[0_0_12px_#00D287] opacity-90 animate-pulse" />
        </div>

        {/* Grade de Produtos ou Card Imersivo Completo */}
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D287] shadow-sm shadow-[#00D287]" />
              Catálogo Atacado ({filteredOffers.length} {filteredOffers.length === 1 ? 'produto' : 'produtos'})
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
                Catálogo Atacado CellHub Pronto para Vendas
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
                    <span>Adicionar Primeiro Produto no Atacado</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-[#00D287]" />
                  <span>Estoque sendo abastecido pelos fornecedores credenciados</span>
                </div>
              )}
            </div>
          ) : (
            /* Grade Estilo Mercado Livre Full Width */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 w-full">
              {filteredOffers.map((offer) => (
                <MercadoLivreOfferCard
                  key={offer.id}
                  offer={offer}
                  isFavorite={favorites.includes(offer.id)}
                  onToggleFavorite={(e) => handleToggleFavorite(offer.id, e)}
                  onClick={() => setSelectedOfferForDetails(offer)}
                  onBuyClick={() => handleOpenCheckout(offer)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DETALHES DA OFERTA */}
      {selectedOfferForDetails && (
        <OfferDetailsModal
          offer={selectedOfferForDetails}
          currentUserId={currentUser?.id}
          currentUserCompany={currentUser?.tradeName || currentUser?.companyName}
          isFavorite={favorites.includes(selectedOfferForDetails.id)}
          onClose={() => setSelectedOfferForDetails(null)}
          onToggleFavorite={(e) => handleToggleFavorite(selectedOfferForDetails.id, e)}
          onBuyNow={() => handleOpenCheckout(selectedOfferForDetails)}
        />
      )}

      {/* MODAL DE CHECKOUT OFICIAL CELLHUB */}
      {selectedOfferForCheckout && currentUser && (
        <CheckoutModal
          offer={selectedOfferForCheckout}
          currentUser={currentUser}
          onClose={() => setSelectedOfferForCheckout(null)}
          onSuccess={() => {
            setSelectedOfferForCheckout(null);
            loadData();
          }}
        />
      )}

      {/* MODAL DE CRIAÇÃO EXCLUSIVA DE OFERTA OFICIAL (ADMIN) */}
      {isCreateOfficialModalOpen && currentUser && (
        <CreateOfficialOfferModal
          isOpen={isCreateOfficialModalOpen}
          currentUser={currentUser}
          onClose={() => setIsCreateOfficialModalOpen(false)}
          onOfferCreated={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
