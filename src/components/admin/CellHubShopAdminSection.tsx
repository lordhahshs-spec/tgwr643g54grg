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
import { CreateOfficialOfferModal } from '@/components/marketplace/CreateOfficialOfferModal';
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
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
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
    const hasMasc = product.variationOptions ? product.variationOptions.includes('Masculino') : true;
    const hasFem = product.variationOptions ? product.variationOptions.includes('Feminino') : true;
    setEditVariationMasculino(hasMasc);
    setEditVariationFeminino(hasFem);

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
        images: editImages,
        compatibleBrand: editCompatibleBrand || undefined,
        compatibleModels: editCompatibleModels,
        variationType: (editVariationMasculino || editVariationFeminino) ? 'masculino_feminino' : 'nenhum',
        variationOptions: [
          ...(editVariationMasculino ? ['Masculino'] : []),
          ...(editVariationFeminino ? ['Feminino'] : [])
        ],
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

      {/* 7. MODAL DE EDIÇÃO DE PRODUTO COM VÍNCULO DE FORNECEDOR */}
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
                  <p className="text-xs text-slate-400">Ajuste fornecedor de origem, preços, margens e fotos</p>
                </div>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 custom-scrollbar">
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

              {/* Modelos e Variações Compatíveis */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0e172e] to-[#090e1c] border border-[#00D287]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#00D287]" />
                    Compatibilidade & Modelos ({editCompatibleBrand || 'Sem Marca'})
                  </span>
                  <span className="text-[10px] text-[#00D287] bg-[#00D287]/15 px-2 py-0.5 rounded font-bold">
                    {editCompatibleModels.length} modelo(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme', 'Outros'].map((bName) => (
                    <button
                      key={bName}
                      type="button"
                      onClick={() => setEditCompatibleBrand(bName)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        editCompatibleBrand.toLowerCase() === bName.toLowerCase()
                          ? 'bg-[#00D287] text-slate-950 border-[#00D287]'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {bName}
                    </button>
                  ))}
                </div>

                {/* Tags de Modelos */}
                <div className="flex gap-2 pt-1">
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
                    placeholder="Adicionar modelo compatível..."
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
                    className="px-3 py-1.5 bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold rounded-xl"
                  >
                    + Adicionar
                  </button>
                </div>

                {editCompatibleModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                    {editCompatibleModels.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11px] text-white"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => setEditCompatibleModels(editCompatibleModels.filter((_, i) => i !== idx))}
                          className="hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Variações Masc/Fem */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-medium">Variação:</span>
                  <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVariationMasculino}
                      onChange={(e) => setEditVariationMasculino(e.target.checked)}
                      className="accent-[#00D287]"
                    />
                    <span>👨 Masculino</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVariationFeminino}
                      onChange={(e) => setEditVariationFeminino(e.target.checked)}
                      className="accent-[#00D287]"
                    />
                    <span>👩 Feminino</span>
                  </label>
                </div>
              </div>

              {/* Vínculo de Fornecedor & Origem do Frete */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    Fornecedor de Origem (Melhor Envio)
                  </label>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/20">
                    Origem de Frete
                  </span>
                </div>

                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Nenhum fornecedor vinculado (Usar padrão CellHub)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                    </option>
                  ))}
                </select>

                {(() => {
                  const sup = suppliers.find((s) => s.id === editSupplierId);
                  if (sup) {
                    return (
                      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Tag: <span className="font-mono text-white">{sup.tag}</span>
                          </span>
                          <span className="text-[11px] text-slate-300 font-mono font-bold">
                            CEP: {sup.postalCode}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Endereço base: {sup.street}, {sup.number} • {sup.neighborhood} • <strong>{sup.city} - {sup.state}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Bloco de Precificação & Margem */}
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

                {/* Preço Original (De: R$) Promocional */}
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-400" />
                    Preço Original "De: R$" (Opcional p/ Promoção)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    placeholder="Ex: 5990.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>
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

              {/* Imagens do Produto */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Fotos do Produto <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {editImages.length} foto{editImages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <label className="border-2 border-dashed border-white/15 bg-slate-950/80 hover:border-[#00D287]/50 hover:bg-slate-900/60 rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center mb-1.5 shadow">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white text-center">
                    Clique para selecionar novas fotos do seu dispositivo
                  </span>
                  <span className="text-[10.5px] text-slate-400 text-center">
                    PNG, JPG, WEBP (até 10MB)
                  </span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editImageUrlInput}
                    onChange={(e) => setEditImageUrlInput(e.target.value)}
                    placeholder="Ou cole o link direto da imagem..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditImage}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-white/10"
                  >
                    Adicionar URL
                  </button>
                </div>

                {editImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
                        <img src={img} alt="" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
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
