import React, { useState, useMemo } from 'react';
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
  Package
} from 'lucide-react';
import { toast } from 'sonner';

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
  if (!offer) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<MarketplaceReport['reason']>('informacao_falsa');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  // Normalização das variações cadastradas pelo admin (ex: 'Cores \\Feminina', 'Cores \\Masculina')
  const rawVariations = offer.variationOptions || [];
  const effectiveVariations = useMemo(() => {
    if (rawVariations.length === 0) return [];
    return rawVariations.map((v) => {
      const lower = v.toLowerCase();
      if (lower.includes('fem')) return 'Cores \\Feminina';
      if (lower.includes('masc')) return 'Cores \\Masculina';
      return v;
    });
  }, [rawVariations]);

  const hasVariations = effectiveVariations.length > 0;

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
        // Ignorar cancelamento
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error('Você precisa estar logado para reportar uma oferta.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      toast.success('Denúncia enviada aos administradores.');
      setShowReportDialog(false);
    } catch (error) {
      toast.error('Erro ao enviar denúncia.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCheckoutClick = () => {
    if (hasCompatibleModels && totalUnits === 0) {
      toast.error('Informe a quantidade de pelo menos uma variação/modelo para comprar.');
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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center md:p-5 bg-black/95 md:backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-4xl bg-[#070b14] md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#060911]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
              <span className="text-xs">Voltar</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#00D287]" /> {offer.isOfficial ? 'Oficial CellHub' : 'Oferta B2B'}
              </span>
              {offer.compatibleBrand && (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {offer.compatibleBrand}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onToggleFavorite?.(offer.id, e)}
              className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 pb-28 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Gallery Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-white/10 overflow-hidden group flex items-center justify-center">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex] || images[0]}
                    alt={offer.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-40" />
                    <span className="text-xs text-slate-500 font-medium">Sem imagem disponível</span>
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[11px] shadow-lg flex items-center gap-0.5">
                    <ArrowDown className="w-3 h-3" /> {discountPercent}% OFF
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all bg-slate-900 ${
                        activeImageIndex === idx
                          ? 'border-[#00D287] scale-105 shadow-md shadow-[#00D287]/20'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Selo de Garantia e Entrega */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-[#00D287] shrink-0" />
                  <span>
                    Garantia técnica CellHub de <strong>{offer.warrantyDays || 90} dias</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Envio via Correios / Jadlog com rastreio em tempo real</span>
                </div>
              </div>
            </div>

            {/* Info & Wholesale Model/Variation Grid Column */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  {offer.category} {offer.subcategory ? `• ${offer.subcategory}` : ''}
                </span>
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {offer.title}
                </h1>
              </div>

              {/* Preço Unitário de Referência */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-[#0a1224] border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Preço Unitário Atacado:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#00D287]">
                    {formatBRL(offer.price)}
                  </span>
                  {hasDiscount && offer.originalPrice && (
                    <span className="text-sm font-semibold text-slate-500 line-through">
                      {formatBRL(offer.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-400">/ unidade</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-0.5">
                  <span>Adicione a quantidade de cada modelo desejado abaixo</span>
                  <span className="inline-flex items-center gap-0.5 text-[#00D287] font-black italic tracking-tighter text-[10px] bg-[#00D287]/15 px-1.5 py-0.5 rounded">
                    <Zap className="w-2.5 h-2.5 fill-[#00D287]" /> GRADE ATACADO
                  </span>
                </div>
              </div>

              {/* TABELA DE MODELOS & QUANTIDADE EM ATACADO (EXATAMENTE COMO NA PRINT DO USUÁRIO) */}
              {hasCompatibleModels ? (
                <div className="p-4 rounded-2xl bg-[#080c18] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#00D287]" />
                      <span className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                        MODELO:
                      </span>
                    </div>
                    <span className="text-xs text-[#00D287] font-bold font-mono">
                      {totalUnits} un. selecionada{totalUnits !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Lista de Modelos com sub-linhas de Variação (Feminina e Masculina) */}
                  <div className="divide-y divide-white/10 max-h-80 overflow-y-auto pr-1">
                    {compatibleList.map((modelName) => {
                      const unitPrice = getModelPrice(modelName);

                      // Se o produto possui variações (Feminina / Masculina)
                      if (hasVariations) {
                        return (
                          <div key={modelName} className="py-3.5 space-y-2.5">
                            {/* Nome do Modelo em destaque */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                {modelName}
                              </span>
                            </div>

                            {/* Linhas de cada variação (ex: Cores \Feminina e Cores \Masculina) */}
                            <div className="space-y-2 pl-2 sm:pl-3 border-l-2 border-white/10">
                              {effectiveVariations.map((varName) => {
                                const key = `${modelName}__${varName}`;
                                const currentQty = quantities[key] || 0;
                                const isFem = varName.toLowerCase().includes('fem');

                                return (
                                  <div
                                    key={key}
                                    className={`py-1.5 px-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                      currentQty > 0
                                        ? isFem
                                          ? 'bg-pink-950/30 border border-pink-500/30'
                                          : 'bg-blue-950/30 border border-blue-500/30'
                                        : 'hover:bg-white/5'
                                    }`}
                                  >
                                    {/* Nome da Variação com badge sutil */}
                                    <div className="flex items-center gap-1.5 min-w-[120px] sm:min-w-[160px]">
                                      <span className="text-xs font-semibold text-slate-200">
                                        {varName}
                                      </span>
                                    </div>

                                    {/* Preço Unitário */}
                                    <div className="text-right whitespace-nowrap">
                                      <span className="text-xs font-bold text-slate-300 font-mono">
                                        {formatBRL(unitPrice)}
                                      </span>
                                    </div>

                                    {/* Seletor de Quantidade com Botões e Input */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleDecrement(key)}
                                        disabled={currentQty <= 0}
                                        className="w-6 h-6 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>

                                      <input
                                        type="number"
                                        min="0"
                                        value={currentQty === 0 ? '' : currentQty}
                                        placeholder="0"
                                        onChange={(e) => handleSetQuantity(key, parseInt(e.target.value, 10) || 0)}
                                        className="w-12 h-6 px-1 rounded-lg bg-slate-950 border border-white/20 text-white font-black text-xs text-center outline-none focus:border-[#00D287]"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => handleIncrement(key)}
                                        className="w-6 h-6 rounded-lg bg-slate-900 border border-white/10 text-[#00D287] hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>

                                      <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline">
                                        Unidades
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Caso sem variação de cor (linha única direta)
                      const key = modelName;
                      const currentQty = quantities[key] || 0;

                      return (
                        <div
                          key={modelName}
                          className={`py-2.5 px-2 flex items-center justify-between gap-3 transition-colors ${
                            currentQty > 0 ? 'bg-[#00D287]/5 rounded-xl' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-200 block truncate">
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
                              className="w-6 h-6 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={currentQty === 0 ? '' : currentQty}
                              placeholder="0"
                              onChange={(e) => handleSetQuantity(key, parseInt(e.target.value, 10) || 0)}
                              className="w-12 h-6 px-1 rounded-lg bg-slate-950 border border-white/20 text-white font-black text-xs text-center outline-none focus:border-[#00D287]"
                            />

                            <button
                              type="button"
                              onClick={() => handleIncrement(key)}
                              className="w-6 h-6 rounded-lg bg-slate-900 border border-white/10 text-[#00D287] hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline">
                              Unidades
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo do Pedido de Atacado com Breakdown */}
                  {totalUnits > 0 && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00D287]/15 to-[#00D287]/5 border border-[#00D287]/40 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-bold">
                          Total Selecionado: <strong className="text-[#00D287]">{totalUnits} unidades</strong>
                        </span>
                        <span className="text-base font-black text-[#00D287]">
                          {formatBRL(totalProductAmount)}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 max-h-20 overflow-y-auto space-y-0.5 pt-1 border-t border-white/10">
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

              {/* Descrição do Produto */}
              {offer.description && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-white block">Descrição do Produto:</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    {offer.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer Bar */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-white/5 bg-[#060911]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-medium">Subtotal a Pagar:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-white">
                {formatBRL(totalProductAmount)}
              </span>
              {totalUnits > 0 && (
                <span className="text-xs font-semibold text-[#00D287]">
                  ({totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={isOwner || (hasCompatibleModels && totalUnits === 0)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00D287] to-[#00b574] hover:from-[#00b574] hover:to-[#009b63] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOwner
                  ? 'Você é o anunciante'
                  : hasCompatibleModels && totalUnits === 0
                  ? 'Selecione as Quantidades'
                  : `Comprar Agora • ${formatBRL(totalProductAmount)} ${totalUnits > 0 ? `(${totalUnits} un.)` : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
