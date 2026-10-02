import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Sparkles,
  Smartphone,
  Search,
  Users,
  RefreshCw,
  Boxes,
  Layers,
  Wrench,
  Monitor
} from 'lucide-react';
import {
  OfferCategory,
  OfferCondition,
  ShippingPolicy,
  MarketplaceSupplier,
  ModelPriceItem
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { pricingRulesService, OFFICIAL_CATEGORIES } from '@/services/pricingRulesService';
import { tradeinService } from '@/services/tradeinService';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CreateOfficialOfferModalProps {
  isOpen?: boolean;
  currentUser: UserAccount;
  onClose: () => void;
  onCreated?: () => void;
  onOfferCreated?: () => void;
}

const CATEGORIES = OFFICIAL_CATEGORIES;

const CONDITIONS: OfferCondition[] = [
  'Novo',
  'Seminovo',
  'Usado',
  'Recondicionado'
];

// Regras Inteligentes por Categoria:
// 1. Grade de Modelos: produtos que possuem versões específicas para cada modelo de celular
export const categorySupportsModelGrid = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas', 'telas', 'baterias', 'peças', 'películas', 'conectores', 'carcaças'].includes(lower);
};

// 2. Variação de Cores (Feminina / Masculina): apenas faz sentido para Capinhas/Cases
export const categorySupportsVariations = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas'].includes(lower);
};

// Presets Populares por Marca
const BRAND_POPULAR_MODELS: Record<string, string[]> = {
  Apple: [
    'iPhone 18 Pro Max',
    'iPhone 18 Pro',
    'iPhone 17 Pro Max',
    'iPhone 17 Pro',
    'iPhone 17',
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14',
    'iPhone 13 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13',
    'iPhone 12 Pro Max',
    'iPhone 12',
    'iPhone 11',
    'iPhone XR',
    'iPhone X'
  ],
  Realme: [
    'Realme C55',
    'Realme C63 / C61',
    'Realme C65',
    'Realme C67 4G',
    'Realme 11 5G',
    'Realme 11 Pro+',
    'Realme 12 Pro+',
    'Realme Note 50',
    'Realme C53'
  ],
  Samsung: [
    'Galaxy A15',
    'Galaxy A25',
    'Galaxy A35',
    'Galaxy A55',
    'Galaxy S24 Ultra',
    'Galaxy S24',
    'Galaxy S23 Ultra',
    'Galaxy S23',
    'Galaxy A05',
    'Galaxy A06'
  ],
  Motorola: [
    'Moto G04 / G24',
    'Moto G34 5G',
    'Moto G54 5G',
    'Moto G84 5G',
    'Moto G14',
    'Edge 40 Neo',
    'Edge 50 Fusion',
    'Edge 50 Pro'
  ],
  Xiaomi: [
    'Redmi Note 13 4G',
    'Redmi Note 13 5G',
    'Redmi Note 13 Pro 5G',
    'Redmi 13C',
    'Redmi 12',
    'Poco X6 Pro',
    'Poco M6 Pro',
    'Poco F6'
  ],
  Infinix: [
    'Hot 30i',
    'Hot 40i',
    'Hot 40 Pro',
    'Note 30 5G',
    'Note 40 Pro',
    'Smart 8'
  ],
  Tecno: [
    'Spark 20',
    'Spark 20 Pro',
    'Spark Go 2024',
    'Camon 30'
  ]
};

export const CreateOfficialOfferModal: React.FC<CreateOfficialOfferModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onCreated,
  onOfferCreated,
}) => {
  if (isOpen === false) return null;

  // Tabs de navegação minimalista: 'geral' | 'modelos' | 'fotos'
  const [activeTab, setActiveTab] = useState<'geral' | 'modelos' | 'fotos'>('geral');

  // Product Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Capinhas');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  
  // Modelos e Marcas Compatíveis
  const [enableCompatibility, setEnableCompatibility] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple');
  const [appleModelsList, setAppleModelsList] = useState<string[]>(BRAND_POPULAR_MODELS.Apple);
  const [selectedAppleModels, setSelectedAppleModels] = useState<string[]>(BRAND_POPULAR_MODELS.Apple);
  const [modelSearch, setModelSearch] = useState('');
  
  // Preços individuais por modelo (ex: { 'iPhone 11': '6.65', 'iPhone 17': '7.77' })
  const [modelPrices, setModelPrices] = useState<Record<string, string>>({});

  // Modelos Manuais / Carregados para Outras Marcas
  const [manualModels, setManualModels] = useState<string[]>([]);
  const [manualModelInput, setManualModelInput] = useState('');

  // Variações de Cores (apenas ativas quando a categoria permite, ex: Capinhas)
  const [variationFeminino, setVariationFeminino] = useState(true);
  const [variationMasculino, setVariationMasculino] = useState(true);

  // Pricing Mode & Margins
  const [pricingMode, setPricingMode] = useState<'margin' | 'manual'>('margin');
  const [marginPercent, setMarginPercent] = useState<number>(45);
  const [price, setPrice] = useState('6.53');
  const [originalPrice, setOriginalPrice] = useState('');
  const [supplierCost, setSupplierCost] = useState('4.50');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);

  // Shipping
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>('comprador_paga');
  const [packageWeight, setPackageWeight] = useState<number>(0.1);
  const [packageHeight, setPackageHeight] = useState<number>(4);
  const [packageWidth, setPackageWidth] = useState<number>(12);
  const [packageLength, setPackageLength] = useState<number>(18);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suppliers
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  useEffect(() => {
    marketplaceService.getSuppliers().then((data) => {
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(data[0].id);
      }
    });
  }, []);

  // Carrega modelos Apple do Trade-in
  useEffect(() => {
    async function loadTradeInAppleModels() {
      try {
        const tradeinModels = await tradeinService.getModels('Apple', currentUser?.id, true);
        if (tradeinModels && tradeinModels.length > 0) {
          const uniqueNames = Array.from(
            new Set(
              tradeinModels
                .map((m) => m.model_name.trim())
                .filter((name) => Boolean(name) && name.toLowerCase().includes('iphone'))
            )
          );

          const merged = Array.from(new Set([...uniqueNames, ...BRAND_POPULAR_MODELS.Apple]));
          setAppleModelsList(merged);
          setSelectedAppleModels(merged);
        }
      } catch (err) {
        console.error('Erro ao carregar modelos do Trade-In:', err);
      }
    }

    loadTradeInAppleModels();
  }, [currentUser?.id]);

  // CATEGORIA INTELIGENTE: Atualiza dinamicamente as permissões de layout e margens ao mudar a categoria
  const isModelGridSupported = categorySupportsModelGrid(category);
  const isVariationSupported = categorySupportsVariations(category);

  const handleCategoryChange = (newCat: OfferCategory) => {
    setCategory(newCat);
    const suggested = pricingRulesService.getSuggestedMargin(newCat);
    setMarginPercent(suggested);

    const hasGrid = categorySupportsModelGrid(newCat);
    setEnableCompatibility(hasGrid);

    const hasVar = categorySupportsVariations(newCat);
    if (!hasVar) {
      setVariationFeminino(false);
      setVariationMasculino(false);
    } else {
      setVariationFeminino(true);
      setVariationMasculino(true);
    }

    // Se mudou para categoria sem grade (ex: Ferramentas), ajusta a aba atual se estiver em 'modelos'
    if (!hasGrid && activeTab === 'modelos') {
      setActiveTab('geral');
    }
  };

  // AUTO-PREÇO: Recalcula preço de venda ao mudar custo ou margem
  const parsedCost = parseFloat(supplierCost.replace(',', '.')) || 0;
  useEffect(() => {
    if (pricingMode === 'margin' && parsedCost > 0) {
      const calculated = pricingRulesService.calculatePriceFromCost(parsedCost, marginPercent);
      setPrice(calculated.toFixed(2));
    }
  }, [parsedCost, marginPercent, pricingMode]);

  const parsedPrice = parseFloat(price.replace(',', '.')) || 0;
  const profitMargin = parsedPrice > parsedCost ? parsedPrice - parsedCost : 0;
  const profitPercent = parsedCost > 0 ? Math.round((profitMargin / parsedCost) * 100) : 0;

  // INTELIGÊNCIA AUTÔNOMA: Detecção automática de marca e categoria ao digitar o título
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const lower = newTitle.toLowerCase();

    // Auto-detect Categoria
    if (lower.includes('capa') || lower.includes('capinha') || lower.includes('case')) {
      if (category !== 'Capinhas') handleCategoryChange('Capinhas');
    } else if (lower.includes('tela') || lower.includes('display') || lower.includes('frontal') || lower.includes('touch')) {
      if (category !== 'Telas') handleCategoryChange('Telas');
    } else if (lower.includes('bateria')) {
      if (category !== 'Baterias') handleCategoryChange('Baterias');
    } else if (lower.includes('película') || lower.includes('pelicula') || lower.includes('vidro 3d')) {
      if (category !== 'Películas') handleCategoryChange('Películas');
    } else if (lower.includes('carregador') || lower.includes('cabo') || lower.includes('fonte') || lower.includes('fone')) {
      if (category !== 'Acessórios') handleCategoryChange('Acessórios');
    }

    // Auto-detect Marca
    if (lower.includes('realme') && selectedBrand !== 'Realme') {
      setSelectedBrand('Realme');
      if (manualModels.length === 0) setManualModels(BRAND_POPULAR_MODELS.Realme || []);
    } else if ((lower.includes('iphone') || lower.includes('apple')) && selectedBrand !== 'Apple') {
      setSelectedBrand('Apple');
    } else if ((lower.includes('samsung') || lower.includes('galaxy')) && selectedBrand !== 'Samsung') {
      setSelectedBrand('Samsung');
      if (manualModels.length === 0) setManualModels(BRAND_POPULAR_MODELS.Samsung || []);
    } else if ((lower.includes('motorola') || lower.includes('moto')) && selectedBrand !== 'Motorola') {
      setSelectedBrand('Motorola');
      if (manualModels.length === 0) setManualModels(BRAND_POPULAR_MODELS.Motorola || []);
    } else if ((lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) && selectedBrand !== 'Xiaomi') {
      setSelectedBrand('Xiaomi');
      if (manualModels.length === 0) setManualModels(BRAND_POPULAR_MODELS.Xiaomi || []);
    }
  };

  // TEMPLATES RÁPIDOS DE 1 CLIQUE
  const applyQuickTemplate = (templateType: 'iphone_capa' | 'realme_capa' | 'tela_iphone' | 'bateria_iphone' | 'pelicula_3d' | 'carregador') => {
    if (templateType === 'iphone_capa') {
      setTitle('Capinha Magnética MagSafe Acrílica Transparente para iPhone');
      handleCategoryChange('Capinhas');
      setSelectedBrand('Apple');
      setSupplierCost('4.50');
      setMarginPercent(45);
      setVariationFeminino(true);
      setVariationMasculino(true);
      setSelectedAppleModels(appleModelsList);
      toast.success('Template Capinha iPhone aplicado!');
    } else if (templateType === 'realme_capa') {
      setTitle('Capinha Silicone Anti-Impacto com Proteção de Câmera Realme');
      handleCategoryChange('Capinhas');
      setSelectedBrand('Realme');
      setSupplierCost('4.43');
      setMarginPercent(45);
      setVariationFeminino(true);
      setVariationMasculino(true);
      setManualModels(BRAND_POPULAR_MODELS.Realme);
      toast.success('Template Capinha Realme aplicado!');
    } else if (templateType === 'tela_iphone') {
      setTitle('Tela Display Incell / OLED Premium com Touch');
      handleCategoryChange('Telas');
      setSelectedBrand('Apple');
      setSupplierCost('65.00');
      setMarginPercent(30);
      setVariationFeminino(false);
      setVariationMasculino(false);
      setSelectedAppleModels(appleModelsList);
      toast.success('Template Tela Display aplicado (sem variações de cor)!');
    } else if (templateType === 'bateria_iphone') {
      setTitle('Bateria Alta Capacidade Homologada Selo CellHub');
      handleCategoryChange('Baterias');
      setSelectedBrand('Apple');
      setSupplierCost('38.00');
      setMarginPercent(35);
      setVariationFeminino(false);
      setVariationMasculino(false);
      setSelectedAppleModels(appleModelsList);
      toast.success('Template Bateria aplicado (sem variações de cor)!');
    } else if (templateType === 'pelicula_3d') {
      setTitle('Película de Vidro 3D / 9D Privativa Borda Reforçada');
      handleCategoryChange('Películas');
      setSelectedBrand('Apple');
      setSupplierCost('2.20');
      setMarginPercent(50);
      setVariationFeminino(false);
      setVariationMasculino(false);
      setSelectedAppleModels(appleModelsList);
      toast.success('Template Película aplicado!');
    } else if (templateType === 'carregador') {
      setTitle('Fonte Carregador Rápido 20W USB-C Turbo Homologado');
      handleCategoryChange('Acessórios');
      setSupplierCost('11.50');
      setMarginPercent(40);
      setEnableCompatibility(false);
      toast.success('Template Carregador aplicado (item unitário)!');
    }
  };

  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(brandName);
    if (brandName !== 'Apple' && manualModels.length === 0 && BRAND_POPULAR_MODELS[brandName]) {
      setManualModels(BRAND_POPULAR_MODELS[brandName]);
    }
  };

  const handleLoadPopularBrandModels = () => {
    if (selectedBrand === 'Apple') {
      setSelectedAppleModels([...appleModelsList]);
      toast.success('Todos os modelos iPhone marcados!');
    } else if (BRAND_POPULAR_MODELS[selectedBrand]) {
      setManualModels(BRAND_POPULAR_MODELS[selectedBrand]);
      toast.success(`Modelos populares ${selectedBrand} carregados!`);
    }
  };

  const handleApplyBasePriceToAll = () => {
    const baseP = parsedPrice > 0 ? parsedPrice : 6.53;
    const updated: Record<string, string> = {};
    appleModelsList.forEach((m) => {
      updated[m] = baseP.toFixed(2);
    });
    manualModels.forEach((m) => {
      updated[m] = baseP.toFixed(2);
    });
    setModelPrices(updated);
    toast.success(`Preço R$ ${baseP.toFixed(2)} aplicado a todos os modelos!`);
  };

  const handleAddManualModel = () => {
    const trimmed = manualModelInput.trim();
    if (!trimmed) return;
    if (manualModels.includes(trimmed)) {
      toast.info('Este modelo já está na lista.');
      return;
    }
    setManualModels((prev) => [...prev, trimmed]);
    if (!modelPrices[trimmed]) {
      setModelPrices((prev) => ({
        ...prev,
        [trimmed]: parsedPrice > 0 ? parsedPrice.toFixed(2) : '6.53',
      }));
    }
    setManualModelInput('');
  };

  const handleRemoveManualModel = (index: number) => {
    setManualModels((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetModelPrice = (modelName: string, val: string) => {
    setModelPrices((prev) => ({
      ...prev,
      [modelName]: val,
    }));
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Insira uma URL válida iniciando com https://');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput('');
    toast.success('Imagem adicionada!');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submissão do Formulário
  const handleSubmit = async () => {
    if (!title.trim()) {
      setActiveTab('geral');
      toast.error('Informe o título do produto.');
      return;
    }
    if (parsedPrice <= 0) {
      setActiveTab('geral');
      toast.error('Informe um preço de venda válido.');
      return;
    }

    setIsSubmitting(true);
    const parsedOrig = parseFloat(originalPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const isDiscount = parsedOrig > parsedPrice;
    const discountPct = isDiscount ? Math.round(((parsedOrig - parsedPrice) / parsedOrig) * 100) : undefined;
    const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    const finalCompatibleModels = isModelGridSupported && enableCompatibility
      ? selectedBrand === 'Apple'
        ? selectedAppleModels
        : manualModels
      : [];

    const finalModelPricing: ModelPriceItem[] = finalCompatibleModels.map((m) => {
      const specificPrice = parseFloat(modelPrices[m]) || parsedPrice;
      return {
        model: m,
        price: specificPrice,
        active: true,
      };
    });

    const variationOptions: string[] = [];
    if (isVariationSupported) {
      if (variationFeminino) variationOptions.push('Cores \\Feminina');
      if (variationMasculino) variationOptions.push('Cores \\Masculina');
    }

    try {
      const res = await marketplaceService.createOffer({
        sellerId: currentUser.id,
        sellerCompany: 'CellHub Shop (Oficial)',
        sellerOwner: 'Leonardo Gomes',
        sellerEmail: 'lordhahshs@gmail.com',
        sellerCnpj: currentUser.cnpj || '48.912.834/0001-02',
        title: title.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        condition,
        description: description.trim() || 'Produto oficial com garantia técnica CellHub Shop.',
        price: parsedPrice,
        originalPrice: isDiscount ? parsedOrig : undefined,
        discountPercent: discountPct,
        supplierCost: parsedCost > 0 ? parsedCost : undefined,
        supplierId: matchedSupplier?.id,
        supplierName: matchedSupplier?.name,
        supplierTag: matchedSupplier?.tag,
        originZipCode: matchedSupplier?.postalCode,
        originStreet: matchedSupplier?.street,
        originNumber: matchedSupplier?.number,
        originComplement: matchedSupplier?.complement,
        originNeighborhood: matchedSupplier?.neighborhood,
        originCity: matchedSupplier?.city,
        originState: matchedSupplier?.state,
        shippingPolicy,
        freeShipping: shippingPolicy === 'frete_gratis',
        images,
        warrantyDays,
        isOfficial: true,
        badgeText: 'Garantia Oficial CellHub (90 Dias)',
        packageWeight,
        packageHeight,
        packageWidth,
        packageLength,
        compatibleBrand: (isModelGridSupported && enableCompatibility) ? selectedBrand : undefined,
        compatibleModels: finalCompatibleModels,
        modelPricing: finalModelPricing,
        variationType: variationOptions.length > 0 ? 'masculino_feminino' : 'nenhum',
        variationOptions,
      });

      if (res.success) {
        toast.success('Produto cadastrado com sucesso!');
        if (onOfferCreated) onOfferCreated();
        if (onCreated) onCreated();
        onClose();
      } else {
        toast.error(`Erro ao cadastrar: ${res.error || 'Tente novamente.'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppleModels = appleModelsList.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-0 md:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl bg-[#090e1a] border-0 md:border md:border-white/10 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER COMPACTO E MINIMALISTA */}
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-[#060a13] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center font-bold text-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">Cadastrar Produto no Atacado</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">CellHub Shop • {category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TEMPLATES RÁPIDOS (1 CLIQUE PARA PREENCHER TUDO) */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00D287]" /> Templates:
          </span>
          <button
            type="button"
            onClick={() => applyQuickTemplate('iphone_capa')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            📱 Capa iPhone
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate('realme_capa')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            ⚡ Capa Realme
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate('tela_iphone')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            🖥️ Tela Display
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate('bateria_iphone')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            🔋 Bateria
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate('pelicula_3d')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            🛡️ Película 3D
          </button>
          <button
            type="button"
            onClick={() => applyQuickTemplate('carregador')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 border border-white/5 transition-colors"
          >
            🔌 Carregador 20W
          </button>
        </div>

        {/* TABS DINÂMICAS: EXIBE SOMENTE AS ABAS QUE FAZEM SENTIDO PARA A CATEGORIA */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-white/5 bg-[#080d17] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'geral'
                ? 'bg-[#00D287] text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>1. Dados & Preço</span>
          </button>

          {isModelGridSupported && (
            <button
              type="button"
              onClick={() => setActiveTab('modelos')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'modelos'
                  ? 'bg-[#00D287] text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{isVariationSupported ? '2. Modelos & Cores' : '2. Grade de Modelos'}</span>
              <span className="text-[10px] opacity-80 font-normal">
                ({selectedBrand === 'Apple' ? selectedAppleModels.length : manualModels.length})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fotos'
                ? 'bg-[#00D287] text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{isModelGridSupported ? '3. Fotos & Envio' : '2. Fotos & Envio'}</span>
          </button>
        </div>

        {/* BODY COM SCROLL SUAVE */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* ABA 1: DADOS GERAIS E PREÇO */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Produto <span className="text-[#00D287]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={
                    category === 'Capinhas'
                      ? 'Ex: Capinha Magnética MagSafe Silicone Realme C55'
                      : category === 'Telas'
                      ? 'Ex: Tela Display OLED Incell Touch iPhone'
                      : 'Ex: Carregador Rápido 20W USB-C Turbo'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as OfferCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condição</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as OfferCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CARD DE PRECIFICAÇÃO MINIMALISTA */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#00D287]" /> Precificação no Atacado
                  </span>
                  <div className="flex items-center gap-1">
                    {[20, 30, 35, 45, 50].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMarginPercent(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          marginPercent === m
                            ? 'bg-[#00D287] text-slate-950'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Custo no Fornecedor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplierCost}
                      onChange={(e) => setSupplierCost(e.target.value)}
                      placeholder="4.50"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Preço Sugerido (R$)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          setPricingMode('manual');
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-[#00D287]/40 text-[#00D287] text-xs font-black focus:outline-none focus:border-[#00D287]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <span>Lucro unitário estimado:</span>
                  <span className="font-bold text-[#00D287]">+ R$ {profitMargin.toFixed(2)} ({profitPercent}%)</span>
                </div>
              </div>

              {/* FORNECEDOR DROPSHIPPING */}
              {suppliers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fornecedor de Origem (Melhor Envio)
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: MODELOS E VARIAÇÕES (SOMENTE SE A CATEGORIA SUPORTAR) */}
          {activeTab === 'modelos' && isModelGridSupported && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* SELEÇÃO DE MARCA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marca do Aparelho</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme', 'Outros'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelectBrand(b)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        selectedBrand.toLowerCase() === b.toLowerCase()
                          ? 'bg-[#00D287] text-slate-950 border-[#00D287] shadow-sm font-black'
                          : 'bg-slate-950/80 text-slate-300 border-white/10 hover:bg-slate-900'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* VARIAÇÕES DE COR MINIMALISTAS (APENAS PARA CAPINHAS) */}
              {isVariationSupported && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00D287]" /> Cores da Capinha:
                    </span>
                    <span className="text-[10px] text-slate-400">Ativa sub-linhas na grade</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVariationFeminino(!variationFeminino)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        variationFeminino
                          ? 'bg-pink-950/40 border-pink-500/50 text-pink-300'
                          : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>👩 Cores \Feminina</span>
                      {variationFeminino && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVariationMasculino(!variationMasculino)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        variationMasculino
                          ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                          : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>👨 Cores \Masculina</span>
                      {variationMasculino && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* CONTROLES DE PREÇO EM MASSA */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-white/5 text-xs">
                <span className="text-slate-400">Preço padrão: <strong className="text-white">R$ {parsedPrice.toFixed(2)}</strong></span>
                <button
                  type="button"
                  onClick={handleApplyBasePriceToAll}
                  className="px-2.5 py-1 rounded-lg bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Aplicar a todos os modelos
                </button>
              </div>

              {/* LISTAGEM DE MODELOS (APPLE OU OUTRAS MARCAS) */}
              {selectedBrand === 'Apple' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Buscar iPhone..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAppleModels([...appleModelsList])}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAppleModels([])}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-white/5">
                    {filteredAppleModels.map((m) => {
                      const isChecked = selectedAppleModels.includes(m);
                      return (
                        <div
                          key={m}
                          className={`pt-1.5 pb-1.5 px-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                            isChecked ? 'bg-white/5' : 'opacity-50'
                          }`}
                        >
                          <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none flex-1 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedAppleModels((prev) =>
                                  prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
                                )
                              }
                              className="accent-[#00D287] rounded"
                            />
                            <span className="truncate">{m}</span>
                          </label>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={modelPrices[m] || price || '6.53'}
                              onChange={(e) => handleSetModelPrice(m, e.target.value)}
                              className="w-16 px-1.5 py-0.5 bg-slate-900 border border-white/15 rounded text-xs text-[#00D287] font-bold text-right outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* OUTRAS MARCAS: POPULARES + INPUT MANUAL */
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualModelInput}
                      onChange={(e) => setManualModelInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualModel())}
                      placeholder={`Adicionar modelo ${selectedBrand} (ex: ${selectedBrand === 'Realme' ? 'Realme C55' : 'Galaxy A15'})...`}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualModel}
                      className="px-3 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {BRAND_POPULAR_MODELS[selectedBrand] && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Modelos sugeridos:</span>
                      <button
                        type="button"
                        onClick={handleLoadPopularBrandModels}
                        className="text-[10px] text-[#00D287] hover:underline font-bold"
                      >
                        + Carregar Populares {selectedBrand}
                      </button>
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {manualModels.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs text-white"
                      >
                        <span className="font-semibold">{m}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={modelPrices[m] || price || '6.53'}
                            onChange={(e) => handleSetModelPrice(m, e.target.value)}
                            className="w-16 px-1.5 py-0.5 bg-slate-900 border border-white/15 rounded text-xs text-[#00D287] font-bold text-right outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveManualModel(idx)}
                            className="p-1 hover:text-rose-400 text-slate-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA FOTOS E ENVIO */}
          {activeTab === 'fotos' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL da Imagem do Produto
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                    placeholder="https://exemplo.com/foto-produto.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-white/15 overflow-hidden group shrink-0 bg-slate-950">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material, acabamento, especificações técnicas, compatibilidade..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 outline-none focus:border-[#00D287]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Garantia (Dias)</label>
                  <input
                    type="number"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(Number(e.target.value) || 90)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Política de Frete</label>
                  <select
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value as ShippingPolicy)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                  >
                    <option value="comprador_paga">Comprador paga o frete</option>
                    <option value="frete_gratis">Frete Grátis</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER MINIMALISTA */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#060a13] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'fotos' ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'geral' && isModelGridSupported ? 'modelos' : 'fotos')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Publicando...' : 'Publicar no Catálogo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
