import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Truck,
  Box,
  Eye,
  Percent,
  Sliders,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Smartphone,
  Tag,
  ArrowDown,
  Zap
} from 'lucide-react';
import { MarketplaceOffer, OfferCategory, OfferCondition, ShippingPolicy } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { pricingRulesService, MarginRule } from '@/services/pricingRulesService';
import { CreateOfficialOfferModal } from '@/components/marketplace/CreateOfficialOfferModal';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CellHubShopAdminSectionProps {
  currentUser: UserAccount | null;
}

const CONDITIONS: OfferCondition[] = [
  'Novo',
  'Excelente',
  'Muito Bom',
  'Bom',
  'Com Detalhe',
  'Para Peças/Sucata',
];

const PRESET_MARGINS = [10, 15, 20, 25, 30, 35, 40, 50];

export const CellHubShopAdminSection: React.FC<CellHubShopAdminSectionProps> = ({
  currentUser,
}) => {
  const [products, setProducts] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Margin Rules State (Dynamic list of categories)
  const [marginRules, setMarginRules] = useState<MarginRule[]>([]);
  const [isRulesPanelOpen, setIsRulesPanelOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatMargin, setNewCatMargin] = useState<string>('30');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceOffer | null>(null);

  // Edit Form Fields & Dynamic Pricing
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Celulares');
  const [editCondition, setEditCondition] = useState<OfferCondition>('Novo');
  const [editPricingMode, setEditPricingMode] = useState<'margin' | 'manual'>('margin');
  const [editMarginPercent, setEditMarginPercent] = useState<number>(20);
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editSupplierCost, setEditSupplierCost] = useState('');
  const [editWarrantyDays, setEditWarrantyDays] = useState<number>(90);
  const [editDescription, setEditDescription] = useState('');
  const [editShippingPolicy, setEditShippingPolicy] = useState<ShippingPolicy>('comprador_paga');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await marketplaceService.getOffers({
        isOfficial: true,
        status: 'todas',
      });
      setProducts(data);
      setMarginRules(pricingRulesService.getRules());
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Erro ao carregar catálogo da CellHub Shop.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Metrics calculation
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'publicada').length;
  const pausedProducts = products.filter((p) => p.status === 'pausada').length;
  const discountedProductsCount = products.filter((p) => 
    (p.originalPrice && p.originalPrice > p.price) || (p.discountPercent && p.discountPercent > 0)
  ).length;

  const totalCatalogValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalSupplierCost = products.reduce((acc, p) => acc + (p.supplierCost || 0), 0);
  const totalEstimatedProfit = totalCatalogValue - totalSupplierCost;
  const averageMarginPercent = totalSupplierCost > 0 ? Math.round((totalEstimatedProfit / totalSupplierCost) * 100) : 0;

  // Active Category names for dropdowns
  const activeCategories = marginRules.map((r) => r.category);

  // Margin Rules handlers
  const handleUpdateMarginRule = (category: string, margin: number) => {
    const success = pricingRulesService.updateRule(category, margin);
    if (success) {
      setMarginRules(pricingRulesService.getRules());
      toast.success(`Margem de ${category} atualizada para ${margin}%!`);
    }
  };

  const handleApplyMarginToCategoryProducts = async (category: string, newMargin: number) => {
    const categoryProducts = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase() && p.supplierCost && p.supplierCost > 0
    );

    if (categoryProducts.length === 0) {
      toast.info(`Nenhum produto cadastrado com custo na categoria "${category}".`);
      return;
    }

    if (!window.confirm(`Deseja recalcular e aplicar a margem de ${newMargin}% em todos os ${categoryProducts.length} produtos de "${category}"? Produtos com redução de preço receberão o selo promocional e gatilho de desconto.`)) {
      return;
    }

    let updatedCount = 0;
    for (const prod of categoryProducts) {
      const cost = prod.supplierCost!;
      const calculatedPrice = pricingRulesService.calculatePriceFromCost(cost, newMargin);
      const isPriceDrop = calculatedPrice < prod.price;
      
      const originalPrice = isPriceDrop 
        ? (prod.originalPrice || prod.price) 
        : (calculatedPrice < (prod.originalPrice || 0) ? prod.originalPrice : undefined);

      const discountPercent = originalPrice && originalPrice > calculatedPrice
        ? Math.round(((originalPrice - calculatedPrice) / originalPrice) * 100)
        : undefined;

      await marketplaceService.updateOffer(prod.id, {
        price: calculatedPrice,
        originalPrice: originalPrice || undefined,
        discountPercent: discountPercent || undefined,
      });
      updatedCount++;
    }

    toast.success(`${updatedCount} produtos de "${category}" atualizados com a nova margem de ${newMargin}%!`);
    loadData(true);
  };

  const handleDeleteCategory = (category: string) => {
    if (window.confirm(`Tem certeza que deseja APAGAR a categoria "${category}" do sistema?`)) {
      const success = pricingRulesService.deleteRule(category);
      if (success) {
        setMarginRules(pricingRulesService.getRules());
        toast.success(`Categoria "${category}" foi apagada com sucesso!`);
      }
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      toast.error('Informe o nome da categoria.');
      return;
    }
    const marginNum = parseFloat(newCatMargin);
    if (isNaN(marginNum) || marginNum <= 0) {
      toast.error('Informe uma margem percentual válida.');
      return;
    }

    const success = pricingRulesService.addRule(cleanName, marginNum, newCatDesc.trim() || undefined);
    if (success) {
      setMarginRules(pricingRulesService.getRules());
      setNewCatName('');
      setNewCatDesc('');
      toast.success(`Categoria "${cleanName}" adicionada com sucesso!`);
    }
  };

  const handleResetMarginRules = () => {
    if (window.confirm('Deseja restaurar as 12 categorias e regras de margem padrão de fábrica?')) {
      const defs = pricingRulesService.resetToDefaults();
      setMarginRules(defs);
      toast.success('Categorias e regras restauradas para os valores padrão.');
    }
  };

  const handleToggleStatus = async (product: MarketplaceOffer) => {
    const nextStatus = product.status === 'publicada' ? 'pausada' : 'publicada';
    try {
      const success = await marketplaceService.updateOffer(product.id, {
        status: nextStatus,
      });
      if (success) {
        toast.success(`Produto ${nextStatus === 'publicada' ? 'ativado' : 'pausado'} no catálogo.`);
        loadData(true);
      }
    } catch (e) {
      toast.error('Erro ao atualizar status do produto.');
    }
  };

  const handleDeleteProduct = async (product: MarketplaceOffer) => {
    if (window.confirm(`Deseja realmente excluir o produto "${product.title}" do catálogo oficial?`)) {
      try {
        const success = await marketplaceService.deleteOffer(product.id);
        if (success) {
          toast.success('Produto excluído com sucesso.');
          loadData(true);
        }
      } catch (e) {
        toast.error('Erro ao excluir produto.');
      }
    }
  };

  const handleOpenEdit = (product: MarketplaceOffer) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditCondition(product.condition);
    setEditPrice(String(product.price));
    setEditOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setEditSupplierCost(String(product.supplierCost || ''));
    setEditWarrantyDays(product.warrantyDays || 90);
    setEditDescription(product.description || '');
    setEditShippingPolicy(product.shippingPolicy || (product.freeShipping ? 'frete_gratis' : 'comprador_paga'));
    setEditImages(product.images || []);
    setEditImageUrlInput('');

    // Calculate current implied margin
    const costNum = product.supplierCost || 0;
    if (costNum > 0 && product.price > costNum) {
      const margin = Math.round(((product.price - costNum) / costNum) * 100);
      setEditMarginPercent(margin);
      setEditPricingMode('margin');
    } else {
      const suggested = pricingRulesService.getSuggestedMargin(product.category);
      setEditMarginPercent(suggested);
      setEditPricingMode('manual');
    }
  };

  const handleEditCategoryChange = (newCat: string) => {
    setEditCategory(newCat);
    const suggested = pricingRulesService.getSuggestedMargin(newCat);
    setEditMarginPercent(suggested);
    if (editPricingMode === 'margin' && editSupplierCost) {
      const costNum = parseFloat(editSupplierCost);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, suggested);
        setEditPrice(calculated.toFixed(2));
      }
    }
  };

  const handleEditSupplierCostChange = (val: string) => {
    setEditSupplierCost(val);
    if (editPricingMode === 'margin') {
      const costNum = parseFloat(val);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, editMarginPercent);
        setEditPrice(calculated.toFixed(2));
      }
    }
  };

  const handleEditMarginPercentChange = (newMargin: number) => {
    setEditMarginPercent(newMargin);
    if (editPricingMode === 'margin' && editSupplierCost) {
      const costNum = parseFloat(editSupplierCost);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, newMargin);
        setEditPrice(calculated.toFixed(2));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    if (!editTitle.trim()) {
      toast.error('Informe o título do produto.');
      return;
    }
    const parsedPrice = parseFloat(editPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const parsedCost = parseFloat(editSupplierCost.replace(/\./g, '').replace(',', '.')) || 0;
    const manualOriginal = parseFloat(editOriginalPrice.replace(/\./g, '').replace(',', '.')) || 0;

    if (parsedPrice <= 0) {
      toast.error('Informe um preço de venda válido.');
      return;
    }

    // Regra de redução de preço e indicador de desconto:
    // Se o preço foi reduzido abaixo do preço anterior ou se tem preço original definido
    let finalOriginalPrice: number | null = null;
    let finalDiscountPercent: number | null = null;

    if (manualOriginal > parsedPrice) {
      finalOriginalPrice = manualOriginal;
      finalDiscountPercent = Math.round(((manualOriginal - parsedPrice) / manualOriginal) * 100);
    } else if (parsedPrice < editingProduct.price) {
      // Redução de preço detectada (ex: margem baixada de 20% para 15%)
      finalOriginalPrice = editingProduct.originalPrice || editingProduct.price;
      finalDiscountPercent = Math.round(((finalOriginalPrice - parsedPrice) / finalOriginalPrice) * 100);
    } else if (editingProduct.originalPrice && parsedPrice < editingProduct.originalPrice) {
      finalOriginalPrice = editingProduct.originalPrice;
      finalDiscountPercent = Math.round(((editingProduct.originalPrice - parsedPrice) / editingProduct.originalPrice) * 100);
    }

    setIsSavingEdit(true);
    try {
      const success = await marketplaceService.updateOffer(editingProduct.id, {
        title: editTitle.trim(),
        category: editCategory as OfferCategory,
        condition: editCondition,
        price: parsedPrice,
        originalPrice: finalOriginalPrice || undefined,
        discountPercent: finalDiscountPercent || undefined,
        supplierCost: parsedCost,
        warrantyDays: editWarrantyDays,
        description: editDescription.trim(),
        shippingPolicy: editShippingPolicy,
        freeShipping: editShippingPolicy === 'frete_gratis',
        images: editImages,
      });

      if (success) {
        if (finalDiscountPercent && finalDiscountPercent > 0) {
          toast.success(`Produto atualizado! Selo de desconto de -${finalDiscountPercent}% com setinha vermelha ativado na vitrine 🔥`);
        } else {
          toast.success('Produto oficial atualizado com sucesso!');
        }
        setEditingProduct(null);
        loadData(true);
      } else {
        toast.error('Erro ao salvar alterações do produto.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao comunicar com o servidor.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddEditImage = () => {
    if (!editImageUrlInput.trim()) return;
    setEditImages([...editImages, editImageUrlInput.trim()]);
    setEditImageUrlInput('');
  };

  const handleRemoveEditImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'todos' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === 'todos' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FINANCIAL STATS DASHBOARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#090e1c] via-[#0d162d] to-[#090e1c] border border-[#00D287]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#00D287] tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" /> Gestão Oficial da Loja
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Dashboard CellHub Shop
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 font-bold uppercase tracking-wider">
              Oficial
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle total de categorias, estoque próprio, custos de fornecedores, descontos e regras de margem (%).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button
            onClick={() => setIsRulesPanelOpen(!isRulesPanelOpen)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isRulesPanelOpen
                ? 'bg-[#00D287]/20 text-[#00D287] border-[#00D287]/40 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
            }`}
          >
            <Settings className="w-4 h-4 text-[#00D287]" />
            <span>Gerenciar Categorias ({marginRules.length})</span>
            {isRulesPanelOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Produto Oficial</span>
          </button>
        </div>
      </div>

      {/* 2. DRAWER DE CATEGORIAS E REGRAS DE MARGEM DINÂMICAS */}
      {isRulesPanelOpen && (
        <div className="p-5 rounded-3xl bg-[#080c17] border border-[#00D287]/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00D287]" />
                Categorias & Margens de Lucro Dinâmicas (1 para 1)
              </h3>
              <p className="text-xs text-slate-400">
                Altere a porcentagem de lucro padrão por categoria ou crie/remova categorias personalizadas.
              </p>
            </div>

            <button
              onClick={handleResetMarginRules}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Restaurar 12 Categorias Padrão
            </button>
          </div>

          {/* Grid de Categorias com Botão Apagar e Aplicar em Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {marginRules.map((rule) => {
              const countInCat = products.filter(p => p.category.toLowerCase() === rule.category.toLowerCase()).length;

              return (
                <div
                  key={rule.category}
                  className="p-3.5 rounded-2xl bg-[#050811] border border-white/5 hover:border-[#00D287]/30 space-y-2 relative transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-white text-xs block truncate">
                        {rule.category}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {countInCat} produto{countInCat !== 1 ? 's' : ''} cadastrado{countInCat !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Botão de Apagar Categoria */}
                    <button
                      onClick={() => handleDeleteCategory(rule.category)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                      title={`Apagar categoria "${rule.category}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-400 font-medium">Margem:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1"
                        value={rule.marginPercent}
                        onChange={(e) => handleUpdateMarginRule(rule.category, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-[#00D287] font-black text-center outline-none focus:border-[#00D287]"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {countInCat > 0 && (
                    <button
                      onClick={() => handleApplyMarginToCategoryProducts(rule.category, rule.marginPercent)}
                      className="w-full mt-1.5 py-1 px-2 rounded-lg bg-[#00D287]/10 hover:bg-[#00D287]/20 text-[#00D287] text-[10px] font-bold transition-all border border-[#00D287]/20 flex items-center justify-center gap-1 cursor-pointer"
                      title={`Recalcular todos os ${countInCat} produtos de ${rule.category} com margem de ${rule.marginPercent}%`}
                    >
                      <Zap className="w-3 h-3" /> Aplicar {rule.marginPercent}% em {countInCat} item(s)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulário para Adicionar Nova Categoria */}
          <form onSubmit={handleAddCategory} className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 text-[#00D287]" /> Adicionar Nova Categoria:
            </span>

            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nome da Categoria (Ex: Tablets, Periféricos...)"
              className="flex-1 min-w-[180px] bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder:text-slate-600 outline-none focus:border-[#00D287]"
            />

            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">Margem:</span>
              <input
                type="number"
                value={newCatMargin}
                onChange={(e) => setNewCatMargin(e.target.value)}
                placeholder="30"
                className="w-16 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-bold text-center outline-none focus:border-[#00D287]"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Categoria</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Total do Catálogo */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Valor em Catálogo</span>
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatBRL(totalCatalogValue)}
          </div>
          <p className="text-[11px] text-slate-500">
            Soma dos preços de venda cadastrados
          </p>
        </div>

        {/* Card 2: Lucro Bruto Estimado */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Margem de Lucro Estimada</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatBRL(totalEstimatedProfit)}
          </div>
          <p className="text-[11px] text-emerald-300 font-medium">
            Margem média de {averageMarginPercent}% sobre custo
          </p>
        </div>

        {/* Card 3: Custo de Fornecedores */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Custo de Fornecedores</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-200">
            {formatBRL(totalSupplierCost)}
          </div>
          <p className="text-[11px] text-slate-500">
            Valor de aquisição direta / atacado
          </p>
        </div>

        {/* Card 4: Total de Produtos & Descontos Ativos */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Produtos & Promoções</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-2">
            {activeProducts}
            {discountedProductsCount > 0 && (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                {discountedProductsCount} com desconto 🔥
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {pausedProducts} pausados • {totalProducts} total
          </p>
        </div>
      </div>

      {/* 4. FILTERS & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-[#080c17] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto por título ou categoria..."
            className="w-full pl-10 pr-4 py-2 bg-[#040711] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Categoria Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#040711] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00D287]"
          >
            <option value="todos">Todas Categorias ({activeCategories.length})</option>
            {activeCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#040711] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00D287]"
          >
            <option value="todos">Todos Status</option>
            <option value="publicada">Ativos na Vitrine</option>
            <option value="pausada">Pausados</option>
          </select>
        </div>
      </div>

      {/* 5. PRODUTOS TABLE */}
      <div className="bg-[#080c17] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhum produto oficial encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cadastre produtos para exibi-los na vitrine atacado da CellHub Shop com garantia de 90 dias.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Adicionar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#050811] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria / Condição</th>
                  <th className="px-4 py-3">Preço Venda & Desconto</th>
                  <th className="px-4 py-3">Custo Fornecedor</th>
                  <th className="px-4 py-3">Margem / Lucro</th>
                  <th className="px-4 py-3">Garantia</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredProducts.map((product) => {
                  const cost = product.supplierCost || 0;
                  const profit = product.price - cost;
                  const marginPct = cost > 0 ? Math.round((profit / cost) * 100) : 0;
                  const isPublished = product.status === 'publicada';
                  
                  const hasDiscount = Boolean(
                    (product.originalPrice && product.originalPrice > product.price) ||
                    (product.discountPercent && product.discountPercent > 0)
                  );
                  const discountPct = product.discountPercent || (
                    product.originalPrice && product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0
                  );

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Foto e Título */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-[#040711] border border-white/10 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Box className="w-5 h-5 text-slate-600" />
                            )}
                            {hasDiscount && (
                              <div className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-md">
                                <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-white block truncate hover:text-[#00D287]">
                              {product.title}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate block">
                              ID: {product.id.substring(0, 8)}... • Envio Direto CellHub
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria / Condição */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-slate-200 font-bold block">{product.category}</span>
                        <span className="text-[10px] text-slate-400">{product.condition}</span>
                      </td>

                      {/* Preço de Venda com Indicador de Desconto */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {hasDiscount && product.originalPrice && product.originalPrice > product.price ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] text-slate-500 line-through">
                                {formatBRL(product.originalPrice)}
                              </span>
                              <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 px-1 py-0.2 rounded border border-rose-500/30 flex items-center gap-0.5">
                                <ArrowDown className="w-2.5 h-2.5 stroke-[3] text-rose-400" />
                                -{discountPct}% OFF
                              </span>
                            </div>
                            <span className="text-[#00D287] font-black text-sm block">
                              {formatBRL(product.price)}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-white font-black text-sm block">
                              {formatBRL(product.price)}
                            </span>
                            <span className="text-[10px] text-slate-400">12x de {formatBRL(product.price / 12)}</span>
                          </div>
                        )}
                      </td>

                      {/* Custo do Fornecedor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-slate-300 font-bold block">
                          {cost > 0 ? formatBRL(cost) : 'Não informado'}
                        </span>
                        <span className="text-[10px] text-slate-500">Custo direto</span>
                      </td>

                      {/* Margem e Lucro */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            profit > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            +{formatBRL(profit)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({marginPct}%)
                          </span>
                        </div>
                      </td>

                      {/* Garantia */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00D287] bg-[#00D287]/10 px-2 py-0.5 rounded border border-[#00D287]/20">
                          <ShieldCheck className="w-3 h-3" />
                          {product.warrantyDays || 90} dias
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isPublished
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isPublished ? '● Ativo' : '○ Pausado'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Pausar / Ativar */}
                          <button
                            onClick={() => handleToggleStatus(product)}
                            title={isPublished ? 'Pausar anúncio' : 'Ativar anúncio'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isPublished
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isPublished ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={() => handleOpenEdit(product)}
                            title="Editar produto"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            title="Excluir produto"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. MODAL DE CRIAÇÃO DE PRODUTO OFICIAL */}
      {isCreateModalOpen && currentUser && (
        <CreateOfficialOfferModal
          isOpen={isCreateModalOpen}
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onOfferCreated={() => {
            loadData(true);
          }}
        />
      )}

      {/* 7. MODAL DE EDIÇÃO DE PRODUTO COM DETECÇÃO DE DESCONTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#090e1c] border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar Produto Oficial</h3>
                  <p className="text-xs text-slate-400">Ajuste preços, regras de margem e descontos promocionais</p>
                </div>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Título do Produto</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                />
              </div>

              {/* Categoria e Condição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => handleEditCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {activeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Condição</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as OfferCondition)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloco de Precificação & Margem no Modal de Edição */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-[#00D287]/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#00D287]" />
                    Precificação & Margem
                  </span>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5 self-start">
                    <button
                      type="button"
                      onClick={() => setEditPricingMode('margin')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        editPricingMode === 'margin'
                          ? 'bg-[#00D287] text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Percent className="w-3 h-3" />
                      Por Porcentagem (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPricingMode('manual')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        editPricingMode === 'manual'
                          ? 'bg-[#00D287] text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3 h-3" />
                      Manual (Fixo)
                    </button>
                  </div>
                </div>

                {editPricingMode === 'margin' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Custo no Fornecedor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editSupplierCost}
                          onChange={(e) => handleEditSupplierCostChange(e.target.value)}
                          placeholder="Ex: 3500.00"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#00D287]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-300">
                            Margem de Lucro (%)
                          </label>
                          <span className="text-[10px] text-[#00D287] font-bold">
                            Padrão: {pricingRulesService.getSuggestedMargin(editCategory)}%
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={editMarginPercent}
                            onChange={(e) => handleEditMarginPercentChange(parseFloat(e.target.value) || 0)}
                            className="w-full px-3.5 py-2 pr-8 rounded-xl bg-slate-900 border border-white/10 text-[#00D287] font-black text-sm focus:outline-none focus:border-[#00D287]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Preset margin pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1">Atalhos:</span>
                      {PRESET_MARGINS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleEditMarginPercentChange(m)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            editMarginPercent === m
                              ? 'bg-[#00D287] text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5'
                          }`}
                        >
                          +{m}%
                        </button>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Preço de Venda Calculado:</span>
                      <span className="text-base font-black text-[#00D287]">
                        R$ {parseFloat(editPrice) > 0 ? parseFloat(editPrice).toFixed(2) : '0,00'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Preço de Venda Final (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-[#00D287] font-black text-sm focus:outline-none focus:border-[#00D287]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Custo no Fornecedor (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editSupplierCost}
                        onChange={(e) => setEditSupplierCost(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-bold text-sm focus:outline-none focus:border-[#00D287]"
                      />
                    </div>
                  </div>
                )}

                {/* Bloco de Desconto e Preço "De / Por" Promocional */}
                {(() => {
                  const currentParsedPrice = parseFloat(editPrice.replace(/\./g, '').replace(',', '.')) || 0;
                  const origPriceNum = parseFloat(editOriginalPrice.replace(/\./g, '').replace(',', '.')) || editingProduct.originalPrice || (currentParsedPrice < editingProduct.price ? editingProduct.price : 0);
                  const isDiscountActive = origPriceNum > currentParsedPrice && currentParsedPrice > 0;
                  const discountPct = isDiscountActive ? Math.round(((origPriceNum - currentParsedPrice) / origPriceNum) * 100) : 0;

                  return (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-rose-400" />
                          Preço Original "De: R$" (Opcional p/ Promoção)
                        </label>
                        {isDiscountActive && (
                          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                            -{discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <input
                        type="number"
                        step="0.01"
                        value={editOriginalPrice}
                        onChange={(e) => setEditOriginalPrice(e.target.value)}
                        placeholder={`Preço anterior: R$ ${editingProduct.price.toFixed(2)}`}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-[#00D287]"
                      />

                      {isDiscountActive && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-red-600/20 via-rose-600/15 to-transparent border border-red-500/30 text-xs text-rose-200 flex items-center gap-2">
                          <ArrowDown className="w-4 h-4 text-red-400 stroke-[3] flex-shrink-0 animate-bounce" />
                          <div>
                            <span className="font-black text-white block">
                              Gatilho de Urgência Ativo: Redução de -{discountPct}%!
                            </span>
                            <span className="text-[10.5px] text-rose-300">
                              O produto exibirá o selo vermelho de <strong>{discountPct}% OFF</strong> no canto superior direito da vitrine.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Garantia & Frete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Garantia (Dias)</label>
                  <input
                    type="number"
                    value={editWarrantyDays}
                    onChange={(e) => setEditWarrantyDays(Number(e.target.value) || 90)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Política de Frete</label>
                  <select
                    value={editShippingPolicy}
                    onChange={(e) => setEditShippingPolicy(e.target.value as ShippingPolicy)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    <option value="frete_gratis">Frete Grátis (CellHub Paga)</option>
                    <option value="comprador_paga">Calculado no Checkout</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                />
              </div>

              {/* Imagens */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Fotos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={editImageUrlInput}
                    onChange={(e) => setEditImageUrlInput(e.target.value)}
                    placeholder="Link da imagem..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditImage}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-[#00D287] border border-[#00D287]/30 text-xs font-bold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 disabled:opacity-50 cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
