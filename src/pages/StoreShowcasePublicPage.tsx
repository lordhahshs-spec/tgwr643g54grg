import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Store,
  Phone,
  Search,
  BatteryCharging,
  ShieldCheck,
  Package,
  MapPin,
  Instagram,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StoreShowcaseSettings, ShowcaseItem } from '@/types/showcase';
import { storeShowcaseService } from '@/services/storeShowcaseService';

export const StoreShowcasePublicPage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();

  const [settings, setSettings] = useState<StoreShowcaseSettings | null>(null);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Item Selecionado para Detalhes / Galeria
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!storeId) return;
      try {
        setLoading(true);
        const [storeData, itemsData] = await Promise.all([
          storeShowcaseService.getStoreShowcase(storeId),
          storeShowcaseService.getItems(storeId),
        ]);

        if (storeData) {
          setSettings(storeData);
        } else {
          // Fallback se não encontrar registro específico
          setSettings({
            storeId,
            storeName: 'Vitrine CellHub',
            storeLogoUrl: '',
            whatsapp: '',
            storeBio: 'Catálogo de aparelhos e celulares seminovos selecionados.',
          });
        }

        setItems(itemsData || []);
      } catch (err) {
        console.error('Erro ao carregar catálogo público:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [storeId]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.storage && item.storage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBrand = selectedBrand === 'Todas' || item.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00D287] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Carregando catálogo da loja...</span>
        </div>
      </div>
    );
  }

  const directStoreWhatsApp = settings?.whatsapp
    ? `https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Estou vendo o catálogo da loja e gostaria de tirar uma dúvida.`)}`
    : null;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-[#00D287] selection:text-slate-950">
      
      {/* Header da Loja */}
      <header className="border-b border-white/10 bg-[#070c1a]/95 backdrop-blur-xl sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Identidade da Loja */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-[#00D287]/40 overflow-hidden flex items-center justify-center shrink-0 shadow-md shadow-[#00D287]/10">
              {settings?.storeLogoUrl ? (
                <img src={settings.storeLogoUrl} alt={settings?.storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-7 h-7 text-[#00D287]" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">
                  {settings?.storeName || 'Loja Parceira'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verificado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                {settings?.storeBio || 'Catálogo de aparelhos e celulares disponíveis.'}
              </p>
              {settings?.address && (
                <div className="flex items-center gap-1 text-[10.5px] text-slate-400">
                  <MapPin className="w-3 h-3 text-[#00D287]" />
                  <span>{settings.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Contato com a Loja no WhatsApp */}
          {directStoreWhatsApp && (
            <a
              href={directStoreWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs shadow-lg shadow-[#00D287]/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Falar no WhatsApp da Loja</span>
            </a>
          )}
        </div>
      </header>

      {/* Conteúdo do Catálogo */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Barra de Busca & Filtros Rápidos */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aparelho por modelo ou marca (ex: iPhone 13, Samsung, 128GB)..."
              className="w-full bg-[#090e1d] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] shadow-sm"
            />
          </div>

          {/* Filtros por Marca */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['Todas', 'Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Outros'].map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedBrand === brand
                    ? 'bg-[#00D287] text-slate-950'
                    : 'bg-[#090e1d] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade de Aparelhos */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
          <span>{filteredItems.length} {filteredItems.length === 1 ? 'aparelho disponível' : 'aparelhos disponíveis'}</span>
          <span className="text-[#00D287] font-semibold">Garantia & Procedência</span>
        </div>

        {/* Lista de Aparelhos */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#090e1d] border border-white/10 space-y-3 my-8">
            <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum aparelho encontrado</h3>
            <p className="text-xs text-slate-400">
              Não encontramos nenhum aparelho com os termos pesquisados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const hasPhotos = item.images && item.images.length > 0;
              const coverPhoto = hasPhotos
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400';

              const whatsAppLink = settings
                ? storeShowcaseService.generateWhatsAppLink(item, settings)
                : '#';

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-[#090e1d] border border-white/10 hover:border-[#00D287]/40 transition-all flex flex-col overflow-hidden shadow-lg group cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setCurrentPhotoIdx(0);
                  }}
                >
                  {/* Foto de Capa */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={coverPhoto}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Tag de Condição */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-[#00D287] border border-[#00D287]/40 shadow-md">
                        {item.condition}
                      </span>
                    </div>

                    {/* Quantidade de Fotos */}
                    {item.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 text-slate-200 backdrop-blur-sm">
                        📷 {item.images.length} fotos
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>{item.brand}</span>
                        {item.storage && <span className="text-slate-300">{item.storage}</span>}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Badges do Aparelho */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        {item.batteryHealth && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                            <BatteryCharging className="w-3.5 h-3.5" />
                            {item.batteryHealth}%
                          </span>
                        )}
                        {item.warrantyDays && item.warrantyDays > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 font-semibold flex items-center gap-1 border border-blue-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {item.warrantyDays} dias de garantia
                          </span>
                        ) : null}
                        {item.color && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 font-medium">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preço e Botão de Contato */}
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Valor à Vista:</span>
                        <span className="text-lg sm:text-xl font-black text-[#00D287]">
                          {item.priceOnRequest ? 'A combinar' : formatBRL(item.price)}
                        </span>
                      </div>

                      {/* Botão de WhatsApp */}
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-3 px-4 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00D287]/20 active:scale-95"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Tenho Interesse • Enviar no WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer da Página Pública */}
      <footer className="border-t border-white/10 bg-[#070c1a] py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">{settings?.storeName} • Catálogo Oficial de Aparelhos</p>
        <p className="text-[11px]">Tecnologia e verificação garantida por CellHub</p>
      </footer>

      {/* Modal em Tela Cheia de Detalhes do Aparelho & Galeria de Fotos */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-[#060911]/95 backdrop-blur-md text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          {/* Header Minimalista */}
          <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            >
              <ChevronLeft className="w-4 h-4 text-[#00D287]" />
              <span>Voltar ao Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Body do Aparelho */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Galeria de Fotos (md:col-span-7) */}
              <div className="md:col-span-7 space-y-3">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
                  <img
                    src={selectedItem.images[currentPhotoIdx] || selectedItem.images[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain"
                  />

                  {/* Setas de navegação se houver múltiplas fotos */}
                  {selectedItem.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : selectedItem.images.length - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPhotoIdx((prev) => (prev < selectedItem.images.length - 1 ? prev + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Miniaturas */}
                {selectedItem.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedItem.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPhotoIdx(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          currentPhotoIdx === idx ? 'border-[#00D287] scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações e Botão CTA (md:col-span-5) */}
              <div className="md:col-span-5 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">
                      {selectedItem.condition}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{selectedItem.brand}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedItem.title}
                  </h2>
                </div>

                {/* Preço */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
                  <span className="text-xs text-slate-400">Preço Especial:</span>
                  <div className="text-2xl font-black text-[#00D287]">
                    {selectedItem.priceOnRequest ? 'A combinar no WhatsApp' : formatBRL(selectedItem.price)}
                  </div>
                </div>

                {/* Ficha Técnica Rápida */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5 text-xs">
                  {selectedItem.storage && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Armazenamento:</span>
                      <strong className="text-white">{selectedItem.storage}</strong>
                    </div>
                  )}
                  {selectedItem.batteryHealth && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Saúde da Bateria:</span>
                      <strong className="text-emerald-400 font-bold">{selectedItem.batteryHealth}%</strong>
                    </div>
                  )}
                  {selectedItem.color && (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Cor:</span>
                      <strong className="text-white">{selectedItem.color}</strong>
                    </div>
                  )}
                  {selectedItem.warrantyDays && selectedItem.warrantyDays > 0 ? (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Garantia da Loja:</span>
                      <strong className="text-blue-400">{selectedItem.warrantyDays} dias</strong>
                    </div>
                  ) : null}
                  {selectedItem.includesAccessories && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Acompanha:</span>
                      <strong className="text-white text-right">{selectedItem.includesAccessories}</strong>
                    </div>
                  )}
                </div>

                {/* Descrição Adicional se houver */}
                {selectedItem.description && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white block mb-1">Observações do Lojista:</strong>
                    {selectedItem.description}
                  </div>
                )}

                {/* Botão de Compra no WhatsApp */}
                <a
                  href={settings ? storeShowcaseService.generateWhatsAppLink(selectedItem, settings) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-xl shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  <span>Quero Este Aparelho • Enviar no WhatsApp</span>
                </a>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
export default StoreShowcasePublicPage;
