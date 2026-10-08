import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  Search,
  Filter,
  Smartphone,
  Phone,
  ShieldCheck,
  BatteryCharging,
  Package,
  Settings,
  Eye,
  Sparkles,
  Share2
} from 'lucide-react';
import { StoreShowcaseSettings, ShowcaseItem } from '@/types/showcase';
import { storeShowcaseService } from '@/services/storeShowcaseService';
import { leadAuthService } from '@/services/leadAuthService';
import { ShowcaseItemEditModal } from './ShowcaseItemEditModal';
import { ShowcaseStoreSettingsModal } from './ShowcaseStoreSettingsModal';
import { toast } from 'sonner';

export const VitrineVirtualTab: React.FC = () => {
  const [currentUser] = useState(() => leadAuthService.getCurrentUser());
  const [storeSlug, setStoreSlug] = useState(() => storeShowcaseService.getStoreSlug(currentUser));

  const [settings, setSettings] = useState<StoreShowcaseSettings>({
    storeId: storeSlug,
    storeName: currentUser?.tradeName || currentUser?.companyName || 'Minha Loja',
    storeLogoUrl: currentUser?.avatarUrl || '',
    whatsapp: currentUser?.whatsapp || '',
    storeBio: 'Celulares novos e seminovos selecionados com garantia e procedência.',
  });

  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modais em Tela Cheia
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Carregar dados da vitrine e itens
  const loadData = async () => {
    try {
      setLoading(true);
      const slug = storeShowcaseService.getStoreSlug(currentUser);
      setStoreSlug(slug);

      const existingSettings = await storeShowcaseService.getStoreShowcase(slug);
      if (existingSettings) {
        setSettings(existingSettings);
      } else {
        // Inicializa com dados da conta do lojista
        const initialSettings: StoreShowcaseSettings = {
          storeId: slug,
          userId: currentUser?.id,
          storeName: currentUser?.tradeName || currentUser?.companyName || 'Minha Loja',
          storeLogoUrl: currentUser?.avatarUrl || '',
          whatsapp: currentUser?.whatsapp || '',
          storeBio: 'Celulares novos e seminovos com garantia e procedência.',
        };
        await storeShowcaseService.saveStoreShowcase(initialSettings);
        setSettings(initialSettings);
      }

      const storeItems = await storeShowcaseService.getItems(slug);
      setItems(storeItems);
    } catch (e) {
      console.error('Erro ao carregar vitrine:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // URL pública da vitrine
  const publicShowcaseUrl = `${window.location.origin}/vitrine/${storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicShowcaseUrl);
    setCopiedLink(true);
    toast.success('Link da sua vitrine copiado! Envie para seus clientes.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleOpenPublicView = () => {
    window.open(publicShowcaseUrl, '_blank');
  };

  const handleSaveItem = async (itemData: Omit<ShowcaseItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    await storeShowcaseService.saveItem(itemData);
    await loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este aparelho da sua vitrine?')) {
      await storeShowcaseService.deleteItem(itemId, storeSlug);
      toast.success('Aparelho removido.');
      await loadData();
    }
  };

  const handleSaveSettings = async (updatedSettings: StoreShowcaseSettings) => {
    const saved = await storeShowcaseService.saveStoreShowcase(updatedSettings);
    setSettings(saved);
  };

  // Filtragem dos itens
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.storage && item.storage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBrand = selectedBrand === 'Todas' || item.brand === selectedBrand;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'available' && item.status === 'available') ||
      (selectedStatus === 'sold' && item.status === 'sold');

    return matchesSearch && matchesBrand && matchesStatus;
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex-1 w-full flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Banner / Header da Vitrine Virtual */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#070d1e] via-[#091326] to-[#0a1b2a] border border-[#00D287]/30 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Dados da Loja */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-[#00D287]/40 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {settings.storeLogoUrl ? (
                <img src={settings.storeLogoUrl} alt={settings.storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-[#00D287]" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white">
                  {settings.storeName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 uppercase">
                  Vitrine Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {settings.storeBio || 'Catálogo de aparelhos para enviar no WhatsApp.'}
              </p>
              {settings.whatsapp && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp: {settings.whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas: Copiar Link & Nova Aparelho */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Copiar link para enviar ao cliente"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#00D287]" /> : <Copy className="w-4 h-4 text-[#00D287]" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da Vitrine'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPublicView}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Visualizar catálogo como cliente"
            >
              <Eye className="w-4 h-4 text-[#00D287]" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Configurações da Loja e WhatsApp"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsEditModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Aparelho</span>
            </button>
          </div>
        </div>

        {/* Link em destaque para compartilhamento rápido */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 truncate w-full sm:w-auto">
            <span className="text-[#00D287] font-bold shrink-0">🔗 Link para o Cliente:</span>
            <span className="font-mono text-slate-200 truncate select-all">{publicShowcaseUrl}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1 rounded-lg bg-[#00D287]/20 hover:bg-[#00D287]/30 text-[#00D287] font-bold text-[11px] transition-colors cursor-pointer"
            >
              {copiedLink ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={handleOpenPublicView}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Abrir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por modelo, marca (ex: iPhone 13, Samsung, 128GB)..."
            className="w-full bg-[#090e1d] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['Todas', 'Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Outros'].map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedBrand === brand
                  ? 'bg-[#00D287] text-slate-950 font-bold'
                  : 'bg-[#090e1d] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal: Lista ou Empty State */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Carregando vitrine de aparelhos...
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl bg-[#090e1d] border border-white/10 text-center space-y-4 max-w-xl mx-auto my-8 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center mx-auto shadow-lg shadow-[#00D287]/10">
            <Smartphone className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              Nenhum aparelho cadastrado na sua vitrine ainda
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Cadastre os celulares e produtos que você tem no estoque com fotos reais e valores. Ao final, você terá um link exclusivo para enviar aos seus clientes no WhatsApp!
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsEditModalOpen(true);
            }}
            className="px-6 py-3 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs shadow-xl shadow-[#00D287]/20 flex items-center gap-2 mx-auto transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Primeiro Aparelho</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Nenhum aparelho encontrado com os filtros selecionados.
        </div>
      ) : (
        /* Grid de Aparelhos Cadastrados */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const hasPhotos = item.images && item.images.length > 0;
            const coverPhoto = hasPhotos
              ? item.images[0]
              : 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400';

            const whatsAppLink = storeShowcaseService.generateWhatsAppLink(item, settings);

            return (
              <div
                key={item.id}
                className="group rounded-2xl bg-[#090e1d] border border-white/10 hover:border-[#00D287]/40 transition-all flex flex-col overflow-hidden shadow-lg"
              >
                {/* Imagem de Capa */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={coverPhoto}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[#00D287] border border-[#00D287]/30">
                      {item.condition}
                    </span>
                    {item.status === 'sold' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow-md">
                        Vendido
                      </span>
                    )}
                    {item.status === 'reserved' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-md">
                        Reservado
                      </span>
                    )}
                  </div>

                  {/* Quantidade de Fotos */}
                  {item.images.length > 1 && (
                    <span className="absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-slate-200 backdrop-blur-sm">
                      📷 {item.images.length} fotos
                    </span>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{item.brand}</span>
                      {item.storage && <span>{item.storage}</span>}
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h4>

                    {/* Badges de Detalhes */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {item.batteryHealth && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/20">
                          <BatteryCharging className="w-3 h-3" />
                          {item.batteryHealth}%
                        </span>
                      )}
                      {item.warrantyDays && item.warrantyDays > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-medium flex items-center gap-1 border border-blue-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          {item.warrantyDays}d garantia
                        </span>
                      ) : null}
                      {item.color && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-medium">
                          {item.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preço e Ações */}
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Preço ao Cliente:</span>
                      <span className="text-sm sm:text-base font-black text-[#00D287]">
                        {item.priceOnRequest ? 'A combinar' : formatBRL(item.price)}
                      </span>
                    </div>

                    {/* Botões do Card */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        title="Simular mensagem no WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Testar WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                        title="Editar aparelho"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/5"
                        title="Remover aparelho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal em Tela Cheia de Edição/Criação de Aparelho */}
      <ShowcaseItemEditModal
        storeId={storeSlug}
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Modal em Tela Cheia de Configurações da Loja & WhatsApp */}
      <ShowcaseStoreSettingsModal
        settings={settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
