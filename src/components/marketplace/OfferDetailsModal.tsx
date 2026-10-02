import React, { useState, useMemo, useEffect } from 'react';
import { MarketplaceOffer, MarketplaceReport, OrderItem } from '@/types/marketplace';
import {
  X,
  Heart,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Share2,
  ShoppingBag,
  Zap,
  ArrowDown,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Users,
  Check,
  Plus,
  Minus,
  Layers,
  Package,
  Search,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { categorySupportsWarranty } from '@/components/marketplace/CreateOfficialOfferModal';

interface OfferDetailsModalProps {
  offer: MarketplaceOffer | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (offerId: string, e: React.MouseEvent) => void;
  onInitiateCheckout?: (offer: MarketplaceOffer) => void;
  onBuyNow?: (offer: MarketplaceOffer) => void;
  currentUserId?: string;
  currentUserCompany?: string;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  onClose,
  isFavorite,
  onToggleFavorite,
  onInitiateCheckout,
  onBuyNow,
  currentUserId,
  currentUserCompany,
}) => {
  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && offer) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [offer, onClose]);

  if (!offer) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Model & Variation Selection (B2B wholesale flow)
  const hasCompatibleModels = Boolean(offer.compatibleModels && offer.compatibleModels.length > 0);
  const compatibleList = offer.compatibleModels || [];

  // Helper para buscar preço de cada modelo
  const getModelPrice = (modelName: string): number => {
    const match = offer.modelPricing?.find((mp) => mp.model.toLowerCase() === modelName.toLowerCase());
    if (match && typeof match.price === 'number' && match.price > 0) {
      return match.price;
    }
    return offer.price;
  };

  // Normalização das variações cadastradas (ex: 'Cores \\Feminina', 'Cores \\Masculina', 'Cores / Sortidas')
  const rawVariations = offer.variationOptions || [];
  const effectiveVariations = useMemo(() => {
    if (rawVariations.length === 0) return [];
    return rawVariations.map((v) => {
      const lower = v.toLowerCase();
      if (lower.includes('sortid')) return 'Cores / Sortidas';
      if (lower.includes('fem')) return 'Cores \\Feminina';
      if (lower.includes('masc')) return 'Cores \\Masculina';
      return v;
    });
  }, [rawVariations]);

  const hasVariations = effectiveVariations.length > 0;
  const showWarranty = categorySupportsWarranty(offer.category) && Number(offer.warrantyDays || 0) > 0;

  // Quantidades mapeadas por chave:
  // Se tem variação: `${modelName}__${varName}`
  // Se não tem variação: `${modelName}`
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Helpers de quantidade
  const handleSetQuantity = (key: string, val: number) => {
    const safe = Math.max(0, Math.floor(val || 0));
    setQuantities((prev) => ({
      ...prev,
      [key]: safe,
    }));
  };

  const handleIncrement = (key: string) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const handleDecrement = (key: string) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) - 1),
    }));
  };

  // Preenchimento rápido em lote
  const handleAddBatchToAll = (amountToAdd: number) => {
    setQuantities((prev) => {
      const updated = { ...prev };
      compatibleList.forEach((modelName) => {
        if (hasVariations) {
          effectiveVariations.forEach((varName) => {
            const key = `${modelName}__${varName}`;
            updated[key] = (updated[key] || 0) + amountToAdd;
          });
        } else {
          const key = modelName;
          updated[key] = (updated[key] || 0) + amountToAdd;
        }
      });
      return updated;
    });
    toast.success(`+${amountToAdd} adicionado a cada variação!`);
  };

  const handleClearAllQuantities = () => {
    setQuantities({});
    toast.info('Quantidades zeradas.');
  };

  // Total de unidades e valor total calculado em tempo real
  const { totalUnits, totalProductAmount, selectedItemsList } = useMemo(() => {
    let units = 0;
    let total = 0;
    const items: OrderItem[] = [];

    if (hasCompatibleModels) {
      compatibleList.forEach((modelName) => {
        const unitPrice = getModelPrice(modelName);

        if (hasVariations) {
          effectiveVariations.forEach((varName) => {
            const key = `${modelName}__${varName}`;
            const q = quantities[key] || 0;
            if (q > 0) {
              units += q;
              total += q * unitPrice;
              items.push({
                model: modelName,
                variation: varName,
                price: unitPrice,
                quantity: q,
              });
            }
          });
        } else {
          const key = modelName;
          const q = quantities[key] || 0;
          if (q > 0) {
            units += q;
            total += q * unitPrice;
            items.push({
              model: modelName,
              price: unitPrice,
              quantity: q,
            });
          }
        }
      });
    } else {
      units = 1;
      total = offer.price;
      items.push({
        model: offer.title,
        price: offer.price,
        quantity: 1,
      });
    }

    return {
      totalUnits: units,
      totalProductAmount: total > 0 ? total : offer.price,
      selectedItemsList: items,
    };
  }, [quantities, compatibleList, hasCompatibleModels, hasVariations, effectiveVariations, offer.price, offer.modelPricing, offer.title]);

  const hasDiscount = Boolean(
    (offer.originalPrice && offer.originalPrice > offer.price) ||
    (offer.discountPercent && offer.discountPercent > 0)
  );

  const discountPercent = offer.discountPercent || (
    offer.originalPrice && offer.originalPrice > offer.price
      ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
      : 0
  );

  const images = (offer.images && offer.images.length > 0) 
    ? offer.images 
    : [];

  const isOwner = currentUserId && (
    offer.sellerId === currentUserId || 
    offer.sellerCompany === currentUserCompany
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer.title,
          text: `Confira este produto no CellHub: ${offer.title} por ${formatBRL(offer.price)}`,
          url: window.location.href,
        });
      } catch (err) {
        // Cancelado
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleCheckoutClick = () => {
    if (hasCompatibleModels && totalUnits === 0) {
      toast.error('Informe a quantidade de pelo menos um modelo/variação para comprar.');
      return;
    }

    const payloadOffer = {
      ...offer,
      price: totalProductAmount,
      productPrice: totalProductAmount,
      selectedModel: selectedItemsList.map(i => `${i.quantity}x ${i.model}${i.variation ? ` (${i.variation})` : ''}`).join(', '),
      selectedVariation: selectedItemsList[0]?.variation || (hasVariations ? effectiveVariations[0] : undefined),
      orderItems: selectedItemsList,
      totalUnits: totalUnits > 0 ? totalUnits : 1,
    };

    if (onInitiateCheckout) {
      onInitiateCheckout(payloadOffer);
    } else if (onBuyNow) {
      onBuyNow(payloadOffer);
    }
  };

  // Filtragem de modelos na busca
  const filteredCompatibleList = compatibleList.filter((m) =>
    m.toLowerCase().includes(modelSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-[80] bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* TOP ENTERPRISE HEADER */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            title="Voltar (Pressione ESC)"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D287]" />
            <span className="hidden sm:inline">Voltar</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono border border-white/10">
              ESC
            </kbd>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-[#00D287]" /> {offer.isOfficial ? 'Oficial CellHub' : 'Oferta B2B'}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">
              {offer.category} {offer.compatibleBrand ? `• ${offer.compatibleBrand}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 flex items-center justify-center transition-colors cursor-pointer"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => onToggleFavorite?.(offer.id, e)}
            className={`w-9 h-9 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/5'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FULL SCREEN BODY (2-COLUMN ENTERPRISE LAYOUT) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: GALERIA, DETALHES, ESPECIFICAÇÕES & LOGÍSTICA (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CARD 1: FOTO PRINCIPAL & THUMBNAILS */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
              <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-900 to-[#060911] border border-white/5 overflow-hidden flex items-center justify-center">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex] || images[0]}
                    alt={offer.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-2 opacity-50" />
                    <span className="text-xs text-slate-500">Sem imagem disponível</span>
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-lg flex items-center gap-1">
                    <ArrowDown className="w-3.5 h-3.5" /> {discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all bg-slate-950 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#00D287] scale-105 shadow-md shadow-[#00D287]/25'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 2: ESPECIFICAÇÕES, LOGÍSTICA & GARANTIA */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-3.5 shadow-sm text-xs">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">
                Informações de Envio & Procedência
              </span>

              {/* Origem e Fornecedor */}
              <div className="flex items-start gap-2.5 text-slate-300">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Envio com Rastreio em Tempo Real</span>
                  <span className="text-[11px] text-slate-400">
                    {offer.supplierName ? `${offer.supplierName} • ` : ''}
                    {offer.originCity ? `${offer.originCity}/${offer.originState}` : 'Centro de Distribuição CellHub'}
                  </span>
                </div>
              </div>

              {/* Garantia Condicional */}
              {showWarranty && (
                <div className="flex items-start gap-2.5 text-slate-300 pt-1 border-t border-white/5">
                  <ShieldCheck className="w-4 h-4 text-[#00D287] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">
                      Garantia Técnica de {offer.warrantyDays} dias
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cobertura contra defeitos de fabricação com troca ágil.
                    </span>
                  </div>
                </div>
              )}

              {/* Condição */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                <span className="text-slate-400">Condição do Produto:</span>
                <span className="font-bold text-slate-200 bg-white/5 px-2 py-0.5 rounded">
                  {offer.condition || 'Novo'}
                </span>
              </div>
            </div>

            {/* CARD 3: DESCRIÇÃO DO PRODUTO */}
            {offer.description && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-2.5 shadow-sm text-xs">
                <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">
                  Descrição Comercial
                </span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs">
                  {offer.description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TÍTULO, PREÇO, GRADE DE COMPRA & CHECKOUT (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* HEADER DO PRODUTO & PRECIFICAÇÃO */}
            <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {offer.category} {offer.subcategory ? `• ${offer.subcategory}` : ''}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {offer.title}
                </h2>
              </div>

              {/* Preço Unitário */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Preço Unitário Atacado:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-[#00D287]">
                      {formatBRL(offer.price)}
                    </span>
                    {hasDiscount && offer.originalPrice && (
                      <span className="text-sm font-semibold text-slate-500 line-through">
                        {formatBRL(offer.originalPrice)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">/ un.</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-[#00D287]/10 border border-[#00D287]/20 text-[#00D287] text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-[#00D287]" /> Grade de Atacado B2B
                </div>
              </div>
            </div>

            {/* TABELA DE MODELOS & VARIAÇÕES (GRADE DE COMPRA) */}
            {hasCompatibleModels ? (
              <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
                
                {/* Header da Grade com Controles em Lote */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#00D287]" /> Seleção de Modelos & Variações
                    </span>
                    <span className="text-xs text-[#00D287] font-bold font-mono block mt-0.5">
                      {totalUnits} unidades adicionadas no pedido
                    </span>
                  </div>

                  {/* Atalhos Rápidos de Quantidade */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddBatchToAll(5)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-white/5"
                    >
                      +5 cada
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBatchToAll(10)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-white/5"
                    >
                      +10 cada
                    </button>
                    {totalUnits > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllQuantities}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de Busca de Modelos */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder={`Filtrar entre os ${compatibleList.length} modelos disponíveis...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287] placeholder:text-slate-500"
                  />
                </div>

                {/* Grade de Modelos Rolável e Confortável */}
                <div className="max-h-[440px] overflow-y-auto pr-1 divide-y divide-white/10 border border-white/5 rounded-2xl p-3 bg-slate-950/60">
                  {filteredCompatibleList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Nenhum modelo encontrado para "{modelSearchQuery}".
                    </div>
                  ) : (
                    filteredCompatibleList.map((modelName) => {
                      const unitPrice = getModelPrice(modelName);

                      // Se o produto possui variações (Feminina, Masculina, Sortidas)
                      if (hasVariations) {
                        return (
                          <div key={modelName} className="py-3.5 space-y-2">
                            {/* Nome do Modelo */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                {modelName}
                              </span>
                            </div>

                            {/* Linhas de Variações */}
                            <div className="space-y-1.5 pl-3 border-l-2 border-white/10">
                              {effectiveVariations.map((varName) => {
                                const key = `${modelName}__${varName}`;
                                const currentQty = quantities[key] || 0;
                                const isFem = varName.toLowerCase().includes('fem');
                                const isSortidas = varName.toLowerCase().includes('sortid');

                                return (
                                  <div
                                    key={key}
                                    className={`py-2 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                      currentQty > 0
                                        ? isSortidas
                                          ? 'bg-amber-950/30 border border-amber-500/40'
                                          : isFem
                                          ? 'bg-pink-950/30 border border-pink-500/30'
                                          : 'bg-blue-950/30 border border-blue-500/30'
                                        : 'hover:bg-white/5 bg-slate-900/40'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-[130px] sm:min-w-[180px]">
                                      <span className="text-xs font-semibold text-slate-200">
                                        {isSortidas ? '🎨 ' : ''}{varName}
                                      </span>
                                    </div>

                                    <div className="text-right whitespace-nowrap">
                                      <span className="text-xs font-bold text-slate-300 font-mono">
                                        {formatBRL(unitPrice)}
                                      </span>
                                    </div>

                                    {/* Steppers de Quantidade */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleDecrement(key)}
                                        disabled={currentQty <= 0}
                                        className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>

                                      <input
                                        type="number"
                                        min="0"
                                        value={currentQty === 0 ? '' : currentQty}
                                        placeholder="0"
                                        onChange={(e) => handleSetQuantity(key, parseInt(e.target.value, 10) || 0)}
                                        className="w-12 h-7 px-1 rounded-lg bg-slate-950 border border-white/20 text-white font-black text-xs text-center outline-none focus:border-[#00D287]"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => handleIncrement(key)}
                                        className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-[#00D287] hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>

                                      <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline">
                                        un.
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Caso sem variações (linha única)
                      const key = modelName;
                      const currentQty = quantities[key] || 0;

                      return (
                        <div
                          key={modelName}
                          className={`py-3 px-3 flex items-center justify-between gap-3 transition-colors ${
                            currentQty > 0 ? 'bg-[#00D287]/10 rounded-xl' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                              {modelName}
                            </span>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="text-xs font-bold text-white font-mono">
                              {formatBRL(unitPrice)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDecrement(key)}
                              disabled={currentQty <= 0}
                              className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={currentQty === 0 ? '' : currentQty}
                              placeholder="0"
                              onChange={(e) => handleSetQuantity(key, parseInt(e.target.value, 10) || 0)}
                              className="w-12 h-7 px-1 rounded-lg bg-slate-950 border border-white/20 text-white font-black text-xs text-center outline-none focus:border-[#00D287]"
                            />

                            <button
                              type="button"
                              onClick={() => handleIncrement(key)}
                              className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 text-[#00D287] hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline">
                              un.
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Breakdown de Itens Selecionados */}
                {totalUnits > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#00D287]/15 to-[#00D287]/5 border border-[#00D287]/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-bold">
                        Total Selecionado: <strong className="text-[#00D287]">{totalUnits} unidades</strong>
                      </span>
                      <span className="text-lg font-black text-[#00D287]">
                        {formatBRL(totalProductAmount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 max-h-24 overflow-y-auto space-y-1 pt-1.5 border-t border-white/10">
                      {selectedItemsList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="truncate pr-2">
                            • <strong>{item.quantity}x</strong> {item.model} {item.variation ? `(${item.variation})` : ''}
                          </span>
                          <span className="text-slate-400 font-mono shrink-0">
                            {formatBRL(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* STICKY CHECKOUT FOOTER CARD */}
            <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Subtotal a Pagar:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {formatBRL(totalProductAmount)}
                    </span>
                    {totalUnits > 0 && (
                      <span className="text-xs font-bold text-[#00D287]">
                        ({totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={Boolean(isOwner) || (hasCompatibleModels && totalUnits === 0)}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00D287] to-[#00b574] hover:from-[#00b574] hover:to-[#009b63] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00D287]/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOwner
                      ? 'Você é o anunciante'
                      : hasCompatibleModels && totalUnits === 0
                      ? 'Selecione as Quantidades'
                      : `Comprar Agora • ${formatBRL(totalProductAmount)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
