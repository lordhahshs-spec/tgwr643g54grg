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
  Zap,
  UploadCloud,
  Star,
  Building2,
  MapPin,
  Layers,
  Boxes
} from 'lucide-react';
import { 
  MarketplaceOffer, 
  OfferCategory, 
  OfferCondition, 
  ShippingPolicy,
  MarketplaceSupplier 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { pricingRulesService, MarginRule } from '@/services/pricingRulesService';
import { CreateOfficialOfferModal, categorySupportsModelGrid, categorySupportsVariations, categorySupportsWarranty } from '@/components/marketplace/CreateOfficialOfferModal';
import { CellHubSuppliersManager } from '@/components/admin/CellHubSuppliersManager';
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
  // Navigation Subtabs
  const [activeAdminTab, setActiveAdminTab] = useState<'catalogo' | 'fornecedores' | 'categorias'>('catalogo');

  const [products, setProducts] = useState<MarketplaceOffer[]>([]);
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
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
  const [editInitialMarginPercent, setEditInitialMarginPercent] = useState<number>(20);
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editSupplierCost, setEditSupplierCost] = useState('');
  const [editSupplierId, setEditSupplierId] = useState<string>('');
  const [editWarrantyDays, setEditWarrantyDays] = useState<number>(90);
  const [editDescription, setEditDescription] = useState('');
  const [editShippingPolicy, setEditShippingPolicy] = useState<ShippingPolicy>('comprador_paga');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Model Compatibility & Variations in Edit Modal
  const [editCompatibleBrand, setEditCompatibleBrand] = useState<string>('Apple');
  const [editCompatibleModels, setEditCompatibleModels] = useState<string[]>([]);
  const [editManualModelInput, setEditManualModelInput] = useState<string>('');
  const [editVariationMasculino, setEditVariationMasculino] = useState<boolean>(true);
  const [editVariationFeminino, setEditVariationFeminino] = useState<boolean>(true);
  const [editVariationSortidas, setEditVariationSortidas] = useState<boolean>(true);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [offersData, suppliersData] = await Promise.all([
        marketplaceService.getOffers({
          isOfficial: true,
          status: 'todas',
        }),
        marketplaceService.getSuppliers(),
      ]);
      setProducts(offersData);
      setSuppliers(suppliersData);
      setMarginRules(pricingRulesService.getRules());
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Erro ao carregar catálogo e fornecedores da CellHub Shop.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh em tempo real a cada 3 segundos para novos produtos e modificações
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
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
      toast.success(`Margem padrão de ${category} atualizada para ${margin}%!`);
    }
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
    if (window.confirm('Deseja resetar todas as categorias para a configuração inicial padrão da CellHub?')) {
      const reset = pricingRulesService.resetToDefaults();
      setMarginRules(reset);
      toast.success('Categorias restauradas para os padrões oficiais!');
    }
  };

  const handleToggleStatus = async (product: MarketplaceOffer) => {
    const nextStatus = product.status === 'publicada' ? 'pausada' : 'publicada';
    const success = await marketplaceService.updateOffer(product.id, { status: nextStatus });
    if (success) {
      toast.success(`Produto "${product.title}" ${nextStatus === 'publicada' ? 'ativado' : 'pausado'} com sucesso!`);
      loadData(true);
    } else {
      toast.error('Erro ao atualizar status do produto.');
    }
  };

  const handleDeleteProduct = async (product: MarketplaceOffer) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto oficial "${product.title}"?`)) return;
    const success = await marketplaceService.deleteOffer(product.id);
    if (success) {
      toast.success('Produto excluído com sucesso!');
      loadData(true);
    } else {
      toast.error('Erro ao excluir produto.');
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
    setEditSupplierId(product.supplierId || '');
    setEditWarrantyDays(product.warrantyDays || 90);
    setEditDescription(product.description || '');
    setEditShippingPolicy(product.shippingPolicy || (product.freeShipping ? 'frete_gratis' : 'comprador_paga'));
    setEditImages(product.images || []);
    setEditImageUrlInput('');

    // Load compatible brand & models
    setEditCompatibleBrand(product.compatibleBrand || 'Apple');
    setEditCompatibleModels(product.compatibleModels || []);
    const hasMasc = product.variationOptions && product.variationOptions.length > 0
      ? product.variationOptions.some((v) => v.toLowerCase().includes('masc'))
      : false;
    const hasFem = product.variationOptions && product.variationOptions.length > 0
      ? product.variationOptions.some((v) => v.toLowerCase().includes('fem'))
      : false;
    const hasSort = product.variationOptions && product.variationOptions.length > 0
      ? product.variationOptions.some((v) => v.toLowerCase().includes('sortid'))
      : true;
    setEditVariationMasculino(hasMasc);
    setEditVariationFeminino(hasFem);
    setEditVariationSortidas(hasSort);

    // Calculate current implied margin
    const costNum = product.supplierCost || 0;
    if (costNum > 0 && product.price > costNum) {
      const margin = Math.round(((product.price - costNum) / costNum) * 100);
      setEditMarginPercent(margin);
      setEditInitialMarginPercent(margin);
      setEditPricingMode('margin');
    } else {
      const suggested = pricingRulesService.getSuggestedMargin(product.category);
      setEditMarginPercent(suggested);
      setEditInitialMarginPercent(suggested);
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
    const hasVar = categorySupportsVariations(newCat);
    if (!hasVar) {
      setEditVariationFeminino(false);
      setEditVariationMasculino(false);
      setEditVariationSortidas(false);
    } else {
      setEditVariationFeminino(true);
      setEditVariationMasculino(true);
      setEditVariationSortidas(true);
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

    // Regra de Desconto: Estritamente vinculado ao campo "Preço Original (De: R$)"
    let finalOriginalPrice: number | null = null;
    let finalDiscountPercent: number | null = null;

    if (manualOriginal > parsedPrice) {
      finalOriginalPrice = manualOriginal;
      finalDiscountPercent = Math.round(((manualOriginal - parsedPrice) / manualOriginal) * 100);
    }

    const matchedSupplier = suppliers.find((s) => s.id === editSupplierId);

    let finalImages = [...editImages];
    if (editImageUrlInput.trim()) {
      let clean = editImageUrlInput.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image')) {
        clean = `https://${clean}`;
      }
      if (!finalImages.includes(clean)) {
        finalImages.push(clean);
      }
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
        supplierId: matchedSupplier?.id || undefined,
        supplierName: matchedSupplier?.name || undefined,
        supplierTag: matchedSupplier?.tag || undefined,
        originZipCode: matchedSupplier?.postalCode || editingProduct.originZipCode,
        originStreet: matchedSupplier?.street || editingProduct.originStreet,
        originNumber: matchedSupplier?.number || editingProduct.originNumber,
        originComplement: matchedSupplier?.complement || editingProduct.originComplement,
        originNeighborhood: matchedSupplier?.neighborhood || editingProduct.originNeighborhood,
        originCity: matchedSupplier?.city || editingProduct.originCity,
        originState: matchedSupplier?.state || editingProduct.originState,
        warrantyDays: editWarrantyDays,
        description: editDescription.trim(),
        shippingPolicy: editShippingPolicy,
        freeShipping: editShippingPolicy === 'frete_gratis',
        images: finalImages,
        compatibleBrand: categorySupportsModelGrid(editCategory) ? (editCompatibleBrand || undefined) : undefined,
        compatibleModels: categorySupportsModelGrid(editCategory) ? editCompatibleModels : [],
        variationType: (categorySupportsVariations(editCategory) && (editVariationMasculino || editVariationFeminino || editVariationSortidas)) ? 'masculino_feminino' : 'nenhum',
        variationOptions: categorySupportsVariations(editCategory) ? [
          ...(editVariationFeminino ? ['Cores \\Feminina'] : []),
          ...(editVariationMasculino ? ['Cores \\Masculina'] : []),
          ...(editVariationSortidas ? ['Cores / Sortidas'] : [])
        ] : [],
      });

      if (success) {
        toast.success('Produto oficial atualizado com sucesso!');
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

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`O arquivo ${file.name} não é uma imagem válida.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`A foto ${file.name} excede o limite de 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast.success('Foto(s) adicionada(s) ao produto!');
  };

  const handleAddEditImage = () => {
    let clean = editImageUrlInput.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image')) {
      clean = `https://${clean}`;
    }

    if (editImages.includes(clean)) {
      toast.info('Essa foto já foi adicionada.');
      return;
    }

    setEditImages((prev) => [...prev, clean]);
    setEditImageUrlInput('');
    toast.success('Link de foto adicionado!');
  };

  const handleRemoveEditImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.supplierTag && p.supplierTag.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'todos' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === 'todos' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP HEADER & FINANCIAL STATS DASHBOARD */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#090e1c] via-[#0d162d] to-[#090e1c] border border-[#00D287]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase text-[#00D287] tracking-wider mb-0.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Gestão Oficial da Loja
          </div>
          <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
            Dashboard CellHub Shop
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 font-bold uppercase tracking-wider">
              Oficial
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Catálogo oficial, gestão de fornecedores dropshipping e precificação inteligente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Produto Oficial</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION (Catálogo | Fornecedores & Frete de Origem | Categorias & Margens) */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('catalogo')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'catalogo'
              ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Catálogo</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeAdminTab === 'catalogo' ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'
          }`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('fornecedores')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'fornecedores'
              ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fornecedores</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeAdminTab === 'fornecedores' ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'
          }`}>
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('categorias')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeAdminTab === 'categorias'
              ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20 font-black'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Margens</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeAdminTab === 'categorias' ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'
          }`}>
            {marginRules.length}
          </span>
        </button>
      </div>

      {/* ABA 2: FORNECEDORES & FRETE DE ORIGEM (DROPSHIPPING) */}
      {activeAdminTab === 'fornecedores' && (
        <CellHubSuppliersManager products={products} />
      )}

      {/* ABA 3: CATEGORIAS & MARGENS DINÂMICAS */}
      {activeAdminTab === 'categorias' && (
        <div className="p-5 rounded-3xl bg-[#080c17] border border-[#00D287]/30 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00D287]" />
                Categorias & Margens de Lucro Sugeridas
              </h3>
              <p className="text-xs text-slate-400">
                Configure as margens padrões para auto-preenchimento ao cadastrar produtos em cada categoria.
              </p>
            </div>

            <button
              onClick={handleResetMarginRules}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              Restaurar 12 Categorias Padrão
            </button>
          </div>

          {/* Grid de Categorias */}
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

                    <button
                      onClick={() => handleDeleteCategory(rule.category)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                      title={`Apagar categoria "${rule.category}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-400 font-medium">Margem Sugerida:</span>
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
                </div>
              );
            })}
          </div>

          {/* Formulário para Adicionar Nova Categoria */}
          <form onSubmit={handleAddCategory} className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 text-[#00D287]" /> Nova Categoria:
            </span>

            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nome da Categoria (Ex: Tablets, Drones...)"
              className="flex-1 min-w-[180px] bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder:text-slate-600 outline-none focus:border-[#00D287]"
            />

            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">Margem:</span>
              <input
                type="number"
                value={newCatMargin}
                onChange={(e) => setNewCatMargin(e.target.value)}
                className="w-16 bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-white text-center font-bold outline-none focus:border-[#00D287]"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              Criar Categoria
            </button>
          </form>
        </div>
      )}

      {/* ABA 1: CATÁLOGO DE PRODUTOS */}
      {activeAdminTab === 'catalogo' && (
        <div className="space-y-6">
          {/* Métricas do Catálogo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Valor Total em Vitrine</span>
                <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                {formatBRL(totalCatalogValue)}
              </div>
              <p className="text-[11px] text-slate-500">
                Soma dos preços de venda ao consumidor
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#080c17] border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-transparent space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">Lucro Estimado Bruto</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                +{formatBRL(totalEstimatedProfit)}
              </div>
              <p className="text-[11px] text-emerald-300 font-medium">
                Margem média de {averageMarginPercent}% sobre custo
              </p>
            </div>

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
                Valor de aquisição direta / dropshipping
              </p>
            </div>

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

          {/* Filtros e Busca */}
          <div className="p-4 rounded-2xl bg-[#080c17] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, categoria ou tag de fornecedor..."
                className="w-full pl-10 pr-4 py-2 bg-[#040711] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
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

          {/* Tabela de Produtos com Fornecedor & Tag */}
          <div className="bg-[#080c17] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Nenhum produto oficial encontrado</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Cadastre produtos oficiais para exibi-los na vitrine com cálculo automático de frete de origem pelo Melhor Envio.
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
                      <th className="px-4 py-3">Fornecedor / Origem</th>
                      <th className="px-4 py-3">Preço Venda</th>
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
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <span className="font-bold text-white block truncate hover:text-[#00D287]">
                                  {product.title}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-slate-500 truncate">
                                    {product.category} • {product.condition}
                                  </span>
                                  {product.compatibleBrand && (
                                    <span className="text-[9.5px] font-bold text-blue-300 bg-blue-950/60 border border-blue-500/20 px-1.5 py-0.2 rounded">
                                      📱 {product.compatibleBrand} ({product.compatibleModels?.length || 0})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Fornecedor / Tag de Origem */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {product.supplierTag || product.supplierName ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                                  <Tag className="w-2.5 h-2.5" />
                                  {product.supplierTag || 'SEM-TAG'}
                                </span>
                                <span className="text-[10.5px] text-slate-400 block truncate max-w-[140px]">
                                  {product.supplierName || 'Fornecedor'} • {product.originCity || 'SP'}/{product.originState || 'SP'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">
                                Padrão CellHub
                              </span>
                            )}
                          </td>

                          {/* Preço de Venda */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="space-y-0.5">
                              {hasDiscount && product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[10px] text-slate-500 line-through block">
                                  {formatBRL(product.originalPrice)}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold text-xs">
                                  {formatBRL(product.price)}
                                </span>
                                {hasDiscount && discountPct > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    {discountPct}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Custo Fornecedor */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-slate-400 font-mono text-xs">
                              {cost > 0 ? formatBRL(cost) : '—'}
                            </span>
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

                              <button
                                onClick={() => handleOpenEdit(product)}
                                title="Editar produto"
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

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
        </div>
      )}

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

      {/* 7. MODAL DE EDIÇÃO DE PRODUTO OFICIAL (MINIMALISTA E DINÂMICO) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-5 overflow-hidden animate-in fade-in duration-150">
          <div className="relative w-full max-h-[92vh] max-w-2xl bg-[#090e1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-[#060912] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Editar Produto Oficial</h3>
                  <p className="text-[11px] text-slate-400">CellHub Shop • {editCategory}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Produto</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                />
              </div>

              {/* Categoria e Condição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => handleEditCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {activeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condição</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as OfferCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modelos e Variações (se a categoria suportar) */}
              {categorySupportsModelGrid(editCategory) && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#00D287]" /> Grade de Modelos Compatíveis
                    </span>
                    <span className="text-[10px] text-[#00D287] font-bold bg-[#00D287]/10 px-2 py-0.5 rounded">
                      {editCompatibleModels.length} modelo(s)
                    </span>
                  </div>

                  {/* Marcas */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme', 'Outros'].map((bName) => (
                      <button
                        key={bName}
                        type="button"
                        onClick={() => setEditCompatibleBrand(bName)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                          editCompatibleBrand.toLowerCase() === bName.toLowerCase()
                            ? 'bg-[#00D287] text-slate-950 border-[#00D287] font-black'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                        }`}
                      >
                        {bName}
                      </button>
                    ))}
                  </div>

                  {/* Variações Cores (somente se a categoria suportar, ex: Capinhas) */}
                  {categorySupportsVariations(editCategory) && (
                    <div className="pt-2.5 pb-1 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold">Variações de Cor (Atacado):</span>
                        <span className="text-[10px] text-slate-500">Opções disponíveis para o comprador</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 hover:border-pink-500/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={editVariationFeminino}
                            onChange={(e) => setEditVariationFeminino(e.target.checked)}
                            className="accent-pink-500 rounded"
                          />
                          <span>👩 Cores \Feminina</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 hover:border-blue-500/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={editVariationMasculino}
                            onChange={(e) => setEditVariationMasculino(e.target.checked)}
                            className="accent-blue-500 rounded"
                          />
                          <span>👨 Cores \Masculina</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 hover:border-amber-500/40 transition-colors" title="Pode ir qualquer cor variada / sortimento misto">
                          <input
                            type="checkbox"
                            checked={editVariationSortidas}
                            onChange={(e) => setEditVariationSortidas(e.target.checked)}
                            className="accent-amber-500 rounded"
                          />
                          <span>🎨 Cores / Sortidas</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Qualquer cor)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Adicionar Modelo */}
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={editManualModelInput}
                        onChange={(e) => setEditManualModelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const c = editManualModelInput.trim();
                            if (c && !editCompatibleModels.includes(c)) {
                              setEditCompatibleModels([...editCompatibleModels, c]);
                              setEditManualModelInput('');
                            }
                          }
                        }}
                        placeholder={`Adicionar modelo compatível de ${editCompatibleBrand}...`}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00D287]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const c = editManualModelInput.trim();
                          if (c && !editCompatibleModels.includes(c)) {
                            setEditCompatibleModels([...editCompatibleModels, c]);
                            setEditManualModelInput('');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {editCompatibleModels.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-white/5">
                        {editCompatibleModels.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                          >
                            <span>{m}</span>
                            <button
                              type="button"
                              onClick={() => setEditCompatibleModels(editCompatibleModels.filter((_, i) => i !== idx))}
                              className="hover:text-rose-400 text-slate-500 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-900/40 rounded-xl border border-white/5 text-slate-400 text-[11px] italic text-center">
                        Nenhum modelo específico selecionado para {editCompatibleBrand}. Digite acima para adicionar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fornecedor de Origem (Melhor Envio) */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" /> Fornecedor de Origem (Melhor Envio)
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">Origem do Frete</span>
                </div>

                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Nenhum fornecedor vinculado (Usar padrão CellHub)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Precificação & Margem */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#00D287]" /> Precificação & Margem de Venda
                  </span>

                  <div className="flex items-center gap-1">
                    {[20, 30, 35, 45, 50].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleEditMarginPercentChange(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          editMarginPercent === m
                            ? 'bg-[#00D287] text-slate-950'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Custo no Fornecedor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editSupplierCost}
                      onChange={(e) => handleEditSupplierCostChange(e.target.value)}
                      placeholder="4.50"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Preço Final de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-[#00D287]/40 text-[#00D287] text-xs font-black focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] text-slate-400 mb-1">
                    Preço Original "De: R$" (Opcional p/ Promoção com % OFF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    placeholder="Ex: 12.00"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>

              {/* Fotos, Garantia & Frete */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Fotos do Produto ({editImages.length})</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#00D287]/40 bg-[#00D287]/5 hover:bg-[#00D287]/10 text-slate-200 hover:text-white cursor-pointer transition-colors text-xs font-semibold">
                      <UploadCloud className="w-4 h-4 text-[#00D287]" />
                      <span>Escolher foto do computador</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={editImageUrlInput}
                        onChange={(e) => setEditImageUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEditImage())}
                        placeholder="Ou cole a URL https://..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                      />
                      <button
                        type="button"
                        onClick={handleAddEditImage}
                        className="px-3.5 py-1.5 bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        + Link
                      </button>
                    </div>
                  </div>
                </div>

                {editImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-slate-950 group shrink-0 shadow-md">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#00D287] text-slate-950 text-[7.5px] font-black text-center py-0.5">
                            CAPA
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categorySupportsWarranty(editCategory) ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Garantia Técnica (Dias)</label>
                      <input
                        type="number"
                        value={editWarrantyDays}
                        onChange={(e) => setEditWarrantyDays(Number(e.target.value) || 90)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center px-3 py-1.5 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[10.5px] text-slate-400 font-semibold">Garantia:</span>
                      <span className="text-xs text-slate-300">Produto de consumo (Sem garantia de fábrica)</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Política de Frete</label>
                    <select
                      value={editShippingPolicy}
                      onChange={(e) => setEditShippingPolicy(e.target.value as ShippingPolicy)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                    >
                      <option value="comprador_paga">Calculado no Checkout</option>
                      <option value="frete_gratis">Frete Grátis (CellHub Paga)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-white/5 bg-[#060912] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
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
