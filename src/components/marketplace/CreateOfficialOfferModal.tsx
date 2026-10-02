import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Search,
  RefreshCw,
  Boxes,
  Truck,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  Check
} from 'lucide-react';
import {
  OfferCategory,
  OfferCondition,
  ShippingPolicy,
  MarketplaceSupplier,
  ModelPriceItem
} from '@/types/marketplace';
import { marketplaceService, clearMarketplaceCache } from '@/services/marketplaceService';
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

export const categorySupportsModelGrid = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas', 'telas', 'baterias', 'peças', 'películas', 'conectores', 'carcaças'].includes(lower);
};

export const categorySupportsVariations = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas'].includes(lower);
};

export const categorySupportsWarranty = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  if (['capinhas', 'películas', 'peliculas', 'acessórios', 'acessorios'].includes(lower)) {
    return false;
  }
  return true;
};

const DEFAULT_BRAND_MODELS: Record<string, string[]> = {
  Realme: [
    'Realme 12 Pro+ 5G',
    'Realme 12 5G',
    'Realme 11 Pro+ 5G',
    'Realme 11 5G',
    'Realme C67 4G',
    'Realme C65',
    'Realme C63 / C61',
    'Realme C55',
    'Realme C53',
    'Realme Note 50'
  ],
  Apple: [
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
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
  Samsung: [
    'Galaxy S24 Ultra',
    'Galaxy S24 Plus',
    'Galaxy S24',
    'Galaxy S23 Ultra',
    'Galaxy S23',
    'Galaxy S23 FE',
    'Galaxy A55 5G',
    'Galaxy A35 5G',
    'Galaxy A25 5G',
    'Galaxy A15 4G/5G',
    'Galaxy A05s',
    'Galaxy A05'
  ],
  Motorola: [
    'Moto Edge 50 Ultra',
    'Moto Edge 50 Pro',
    'Moto Edge 50 Fusion',
    'Moto Edge 40 Neo',
    'Moto G84 5G',
    'Moto G54 5G',
    'Moto G34 5G',
    'Moto G24 Power',
    'Moto G24',
    'Moto G14',
    'Moto G04'
  ],
  Xiaomi: [
    'Redmi Note 13 Pro+ 5G',
    'Redmi Note 13 Pro 5G',
    'Redmi Note 13 5G',
    'Redmi Note 13 4G',
    'Redmi 13C',
    'Redmi 12',
    'Poco X6 Pro',
    'Poco X6',
    'Poco M6 Pro',
    'Poco F6'
  ],
  Outros: [
    'Modelo Genérico 1',
    'Modelo Genérico 2'
  ]
};

const AVAILABLE_BRANDS = ['Realme', 'Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Outros'];

export const CreateOfficialOfferModal: React.FC<CreateOfficialOfferModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onCreated,
  onOfferCreated
}) => {
  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Informações do Produto
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Capinhas');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');

  // Múltiplas Marcas Selecionadas
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Realme']);
  const [activeBrandTab, setActiveBrandTab] = useState<string>('Realme');
  const [brandModelsCatalog, setBrandModelsCatalog] = useState<Record<string, string[]>>(DEFAULT_BRAND_MODELS);
  
  // Modelos selecionados por marca
  const [selectedModelsByBrand, setSelectedModelsByBrand] = useState<Record<string, string[]>>({
    Realme: [...DEFAULT_BRAND_MODELS.Realme],
    Apple: [...DEFAULT_BRAND_MODELS.Apple],
    Samsung: [...DEFAULT_BRAND_MODELS.Samsung],
    Motorola: [...DEFAULT_BRAND_MODELS.Motorola],
    Xiaomi: [...DEFAULT_BRAND_MODELS.Xiaomi],
    Outros: [...DEFAULT_BRAND_MODELS.Outros]
  });

  const [modelSearch, setModelSearch] = useState('');
  const [modelPrices, setModelPrices] = useState<Record<string, string>>({});
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});

  // Variações de Cores (Capinhas)
  const [variationFeminino, setVariationFeminino] = useState(true);
  const [variationMasculino, setVariationMasculino] = useState(true);
  const [variationSortidas, setVariationSortidas] = useState(true);

  // Precificação
  const [pricingMode, setPricingMode] = useState<'margin' | 'manual'>('margin');
  const [marginPercent, setMarginPercent] = useState<number>(45);
  const [price, setPrice] = useState('6.53');
  const [originalPrice, setOriginalPrice] = useState('');
  const [supplierCost, setSupplierCost] = useState('4.50');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>('comprador_paga');

  // Fotos
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fornecedores
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const isModelGridSupported = categorySupportsModelGrid(category);
  const isVariationSupported = categorySupportsVariations(category);
  const hasWarranty = categorySupportsWarranty(category);

  // Carregar Fornecedores
  useEffect(() => {
    marketplaceService.getSuppliers().then((data) => {
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(data[0].id);
      }
    });
  }, []);

  // Carregar modelos do Trade-in Apple
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
          const merged = Array.from(new Set([...DEFAULT_BRAND_MODELS.Apple, ...uniqueNames]));
          setBrandModelsCatalog((prev) => ({ ...prev, Apple: merged }));
        }
      } catch (err) {
        console.warn('Modelos tradein:', err);
      }
    }
    loadTradeInAppleModels();
  }, [currentUser?.id]);

  // Sincronizar Categoria & Margem
  const handleCategoryChange = (newCat: OfferCategory) => {
    setCategory(newCat);
    const suggested = pricingRulesService.getSuggestedMargin(newCat);
    setMarginPercent(suggested);

    const hasVar = categorySupportsVariations(newCat);
    if (!hasVar) {
      setVariationFeminino(false);
      setVariationMasculino(false);
      setVariationSortidas(false);
    } else {
      setVariationFeminino(true);
      setVariationMasculino(true);
      setVariationSortidas(true);
    }
  };

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

  // Auto-detectar Marca & Categoria pelo Título
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const lower = val.toLowerCase();

    // Auto-detect Brand se usuário digitar
    if (lower.includes('realme') && !selectedBrands.includes('Realme')) {
      setSelectedBrands((prev) => Array.from(new Set([...prev, 'Realme'])));
      setActiveBrandTab('Realme');
    } else if ((lower.includes('iphone') || lower.includes('apple')) && !selectedBrands.includes('Apple')) {
      setSelectedBrands((prev) => Array.from(new Set([...prev, 'Apple'])));
      setActiveBrandTab('Apple');
    } else if ((lower.includes('samsung') || lower.includes('galaxy')) && !selectedBrands.includes('Samsung')) {
      setSelectedBrands((prev) => Array.from(new Set([...prev, 'Samsung'])));
      setActiveBrandTab('Samsung');
    } else if ((lower.includes('motorola') || lower.includes('moto')) && !selectedBrands.includes('Motorola')) {
      setSelectedBrands((prev) => Array.from(new Set([...prev, 'Motorola'])));
      setActiveBrandTab('Motorola');
    } else if ((lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) && !selectedBrands.includes('Xiaomi')) {
      setSelectedBrands((prev) => Array.from(new Set([...prev, 'Xiaomi'])));
      setActiveBrandTab('Xiaomi');
    }

    // Auto-detect Category
    if (lower.includes('capa') || lower.includes('case') || lower.includes('capinha')) {
      if (category !== 'Capinhas') handleCategoryChange('Capinhas');
    } else if (lower.includes('tela') || lower.includes('display') || lower.includes('touch')) {
      if (category !== 'Telas') handleCategoryChange('Telas');
    } else if (lower.includes('bateria')) {
      if (category !== 'Baterias') handleCategoryChange('Baterias');
    } else if (lower.includes('carregador') || lower.includes('fonte') || lower.includes('cabo')) {
      if (category !== 'Carregadores') handleCategoryChange('Carregadores');
    } else if (lower.includes('película') || lower.includes('pelicula')) {
      if (category !== 'Películas') handleCategoryChange('Películas');
    }
  };

  // Toggle Marca Selecionada (Permite selecionar múltiplas marcas)
  const handleToggleBrandSelection = (brandName: string) => {
    setSelectedBrands((prev) => {
      let updated: string[];
      if (prev.includes(brandName)) {
        // Se for a última marca, não deixa vazio
        if (prev.length === 1) {
          toast.info('Selecione pelo menos uma marca.');
          return prev;
        }
        updated = prev.filter((b) => b !== brandName);
        if (activeBrandTab === brandName && updated.length > 0) {
          setActiveBrandTab(updated[0]);
        }
      } else {
        updated = [...prev, brandName];
        setActiveBrandTab(brandName);
      }
      return updated;
    });
  };

  // Toggle Modelo em uma Marca
  const handleToggleModel = (brand: string, modelName: string) => {
    setSelectedModelsByBrand((prev) => {
      const list = prev[brand] || [];
      const exists = list.includes(modelName);
      const updated = exists ? list.filter((x) => x !== modelName) : [...list, modelName];
      return { ...prev, [brand]: updated };
    });
  };

  // Selecionar todos os modelos da marca ativa
  const handleSelectAllBrandModels = (brand: string) => {
    const all = brandModelsCatalog[brand] || [];
    setSelectedModelsByBrand((prev) => ({
      ...prev,
      [brand]: [...all]
    }));
    toast.success(`Todos os modelos de ${brand} foram marcados!`);
  };

  // Desmarcar todos os modelos da marca ativa
  const handleDeselectAllBrandModels = (brand: string) => {
    setSelectedModelsByBrand((prev) => ({
      ...prev,
      [brand]: []
    }));
  };

  // Adicionar modelo personalizado para uma marca
  const handleAddCustomModel = (brand: string) => {
    const inputVal = customModelInputs[brand] || '';
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (!(brandModelsCatalog[brand] || []).includes(trimmed)) {
      setBrandModelsCatalog((prev) => ({
        ...prev,
        [brand]: [trimmed, ...(prev[brand] || [])]
      }));
    }

    setSelectedModelsByBrand((prev) => ({
      ...prev,
      [brand]: [trimmed, ...(prev[brand] || [])]
    }));

    if (!modelPrices[trimmed]) {
      setModelPrices((prev) => ({
        ...prev,
        [trimmed]: parsedPrice > 0 ? parsedPrice.toFixed(2) : '6.53'
      }));
    }

    setCustomModelInputs((prev) => ({ ...prev, [brand]: '' }));
    toast.success(`Modelo "${trimmed}" adicionado em ${brand}!`);
  };

  // Aplicar preço base a todos os modelos
  const handleApplyBasePriceToAll = () => {
    const baseP = parsedPrice > 0 ? parsedPrice : 6.53;
    const updated: Record<string, string> = {};
    selectedBrands.forEach((b) => {
      (brandModelsCatalog[b] || []).forEach((m) => {
        updated[m] = baseP.toFixed(2);
      });
    });
    setModelPrices((prev) => ({ ...prev, ...updated }));
    toast.success(`Preço R$ ${baseP.toFixed(2)} aplicado a todos os modelos!`);
  };

  // Upload direto de fotos do dispositivo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} excede o limite de 8MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setImages((prev) => [...prev, dataUrl]);
          toast.success('Foto carregada!');
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Adicionar foto por URL
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image')) {
      toast.error('Insira uma URL de imagem válida (começando com https://)');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput('');
    toast.success('Foto adicionada!');
  };

  // Submissão do Formulário
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Informe o título do produto.');
      return;
    }
    if (parsedPrice <= 0) {
      toast.error('Informe um preço de venda válido.');
      return;
    }

    // Auto-captura URL digitada
    let finalImages = [...images];
    if (imageUrlInput.trim()) {
      const cleanUrl = imageUrlInput.trim();
      if ((cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:image')) && !finalImages.includes(cleanUrl)) {
        finalImages.push(cleanUrl);
      }
    }

    // Fallback de imagem caso o usuário não tenha enviado
    if (finalImages.length === 0) {
      const fallbackMap: Record<string, string> = {
        Capinhas: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
        Telas: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        Baterias: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
        Carregadores: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
        Películas: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      };
      finalImages = [fallbackMap[category] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'];
    }

    setIsSubmitting(true);
    const parsedOrig = parseFloat(originalPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const isDiscount = parsedOrig > parsedPrice;
    const discountPct = isDiscount ? Math.round(((parsedOrig - parsedPrice) / parsedOrig) * 100) : undefined;
    const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    // Concatena todos os modelos selecionados de todas as marcas ativas
    let finalCompatibleModels: string[] = [];
    if (isModelGridSupported) {
      selectedBrands.forEach((b) => {
        const list = selectedModelsByBrand[b] || [];
        finalCompatibleModels.push(...list);
      });
      finalCompatibleModels = Array.from(new Set(finalCompatibleModels));
    }

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
      if (variationSortidas) variationOptions.push('Cores / Sortidas');
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
        condition,
        description: description.trim() || 'Produto oficial com garantia e procedência CellHub Shop.',
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
        warrantyDays: hasWarranty ? warrantyDays : 0,
        images: finalImages,
        compatibleBrand: isModelGridSupported ? selectedBrands.join(', ') : undefined,
        compatibleModels: finalCompatibleModels,
        modelPricing: finalModelPricing,
        variationType: variationOptions.length > 0 ? 'masculino_feminino' : 'nenhum',
        variationOptions,
        packageWeight: 0.15,
        packageHeight: 4,
        packageWidth: 12,
        packageLength: 18,
        isOfficial: true,
        status: 'publicada',
        salesCount: 0,
      });

      if (res.success) {
        clearMarketplaceCache();
        toast.success('Produto publicado com sucesso no catálogo!');
        onCreated?.();
        onOfferCreated?.();
        onClose();
      } else {
        toast.error(res.error || 'Erro ao publicar produto no Supabase.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Falha na conexão ao criar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Total de modelos selecionados somando todas as marcas
  const totalSelectedModelsCount = isModelGridSupported
    ? selectedBrands.reduce((acc, b) => acc + (selectedModelsByBrand[b]?.length || 0), 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* TOP ENTERPRISE HEADER */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            title="Voltar (Pressione ESC)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono border border-white/10">
              ESC
            </kbd>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Cadastrar Produto no Atacado
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 text-[11px] font-bold">
                {category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Catálogo Oficial CellHub Shop • B2B Atacado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold shadow-lg shadow-[#00D287]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Publicar no Catálogo</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* FULL SCREEN BODY (2-COLUMN ENTERPRISE LAYOUT) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: INFORMAÇÕES, MARCAS, MODELOS, FOTOS & LOGÍSTICA (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: DADOS GERAIS */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#00D287]" /> Identificação do Produto
                </span>
                <span className="text-[11px] text-slate-400">Informações principais</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Título Comercial do Produto *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Capinha Magnética MagSafe Silicone Realme C55 / C67"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#00D287] transition-colors placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as OfferCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">Condição</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as OfferCondition)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Descrição Comercial (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Produto de alto padrão para revenda, acabamento premium e excelente durabilidade..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287] placeholder:text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* CARD 2: MULTI-SELEÇÃO DE MARCAS & GRADE DE MODELOS (SOMENTE SE A CATEGORIA SUPORTAR) */}
            {isModelGridSupported && (
              <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#00D287]" /> Marcas & Modelos Compatíveis
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Você pode selecionar **mais de uma marca** simultaneamente para este produto.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 text-xs font-bold">
                    {totalSelectedModelsCount} modelo(s) em {selectedBrands.length} marca(s)
                  </span>
                </div>

                {/* SELETOR DE MULTIPLAS MARCAS (TOGGLES ELEGANTES) */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Marcas Ativas (Clique para adicionar ou remover marcas):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {AVAILABLE_BRANDS.map((brandName) => {
                      const isSelected = selectedBrands.includes(brandName);
                      const modelCount = (selectedModelsByBrand[brandName] || []).length;
                      return (
                        <button
                          key={brandName}
                          type="button"
                          onClick={() => handleToggleBrandSelection(brandName)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-[#00D287]/15 border-[#00D287] text-white shadow-md shadow-[#00D287]/10'
                              : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{brandName}</span>
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-[#00D287] text-slate-950' : 'border border-white/20'}`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <span className={`text-[10.5px] ${isSelected ? 'text-[#00D287] font-semibold' : 'text-slate-500'}`}>
                            {isSelected ? `${modelCount} modelo(s)` : 'Inativo'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VARIAÇÕES DE CORES (EXCLUSIVO PARA CAPINHAS) */}
                {isVariationSupported && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Variações de Cor no Atacado:</span>
                      <span className="text-[10.5px] text-slate-400">Opções que o comprador poderá pedir</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-white font-medium cursor-pointer select-none bg-slate-900 px-3 py-2 rounded-xl border border-white/5 hover:border-pink-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={variationFeminino}
                          onChange={(e) => setVariationFeminino(e.target.checked)}
                          className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <span>👩 Cores \Feminina</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-white font-medium cursor-pointer select-none bg-slate-900 px-3 py-2 rounded-xl border border-white/5 hover:border-blue-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={variationMasculino}
                          onChange={(e) => setVariationMasculino(e.target.checked)}
                          className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <span>👨 Cores \Masculina</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-white font-medium cursor-pointer select-none bg-slate-900 px-3 py-2 rounded-xl border border-white/5 hover:border-amber-500/40 transition-colors" title="Qualquer cor sortida / mix de cores">
                        <input
                          type="checkbox"
                          checked={variationSortidas}
                          onChange={(e) => setVariationSortidas(e.target.checked)}
                          className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <span>🎨 Cores / Sortidas</span>
                        <span className="text-[10.5px] text-slate-400 font-normal">(Qualquer cor)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ABAS / SELEÇÃO DE MODELOS DAS MARCAS ATIVADAS */}
                <div className="space-y-3 pt-2">
                  {/* Seletor de visualização de marca */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {selectedBrands.map((b) => {
                        const isTabActive = activeBrandTab === b;
                        const count = (selectedModelsByBrand[b] || []).length;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setActiveBrandTab(b);
                              setModelSearch('');
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                              isTabActive
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span>{b}</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-[#00D287]/20 text-[#00D287] text-[10px]">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyBasePriceToAll}
                      className="px-3 py-1.5 rounded-lg bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reaplicar Preço Padrão (R$ {parsedPrice.toFixed(2)})</span>
                    </button>
                  </div>

                  {/* CONTROLE DOS MODELOS DA MARCA SELECIONADA */}
                  {selectedBrands.includes(activeBrandTab) && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="text"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder={`Buscar modelos ${activeBrandTab}...`}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectAllBrandModels(activeBrandTab)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-[#00D287]/20 hover:text-[#00D287] text-slate-300 text-xs font-medium transition-colors"
                          >
                            Marcar Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeselectAllBrandModels(activeBrandTab)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-medium transition-colors"
                          >
                            Desmarcar
                          </button>
                        </div>
                      </div>

                      {/* Adicionar Modelo Customizado para a Marca */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customModelInputs[activeBrandTab] || ''}
                          onChange={(e) =>
                            setCustomModelInputs((prev) => ({ ...prev, [activeBrandTab]: e.target.value }))
                          }
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), handleAddCustomModel(activeBrandTab))
                          }
                          placeholder={`Adicionar outro modelo ${activeBrandTab} (Ex: ${activeBrandTab === 'Apple' ? 'iPhone 17' : activeBrandTab === 'Realme' ? 'Realme GT 6' : 'Novo Modelo'})...`}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287] placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomModel(activeBrandTab)}
                          className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          + Adicionar Modelo
                        </button>
                      </div>

                      {/* Lista de Modelos com Checkbox e Preço */}
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5 border border-white/5 rounded-xl p-2 bg-slate-900/40">
                        {((brandModelsCatalog[activeBrandTab] || []).filter((m) =>
                          m.toLowerCase().includes(modelSearch.toLowerCase().trim())
                        )).map((modelName) => {
                          const isChecked = (selectedModelsByBrand[activeBrandTab] || []).includes(modelName);
                          return (
                            <div
                              key={modelName}
                              className={`pt-2 pb-2 px-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                isChecked ? 'bg-white/5' : 'opacity-35 hover:opacity-75'
                              }`}
                            >
                              <label className="flex items-center gap-3 text-xs text-white cursor-pointer select-none flex-1 truncate font-medium">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleModel(activeBrandTab, modelName)}
                                  className="accent-[#00D287] w-4 h-4 rounded cursor-pointer"
                                />
                                <span className="truncate">{modelName}</span>
                              </label>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] text-slate-400">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={modelPrices[modelName] || price || '6.53'}
                                  onChange={(e) =>
                                    setModelPrices((prev) => ({ ...prev, [modelName]: e.target.value }))
                                  }
                                  className="w-20 px-2 py-1 bg-slate-950 border border-white/15 rounded-lg text-xs text-[#00D287] font-bold text-right outline-none focus:border-[#00D287]"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CARD 3: FOTOS DO PRODUTO */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#00D287]" /> Fotos do Produto ({images.length})
                </span>
                <span className="text-[11px] text-slate-400">Envie arquivos do dispositivo ou links</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#00D287]/40 bg-[#00D287]/5 hover:bg-[#00D287]/10 text-slate-200 hover:text-white cursor-pointer transition-colors text-center">
                  <Upload className="w-5 h-5 text-[#00D287] mb-1" />
                  <span className="text-xs font-bold text-white">Escolher fotos do celular ou PC</span>
                  <span className="text-[10.5px] text-slate-400 mt-0.5">JPG, PNG ou WEBP até 8MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-950 border border-white/10">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Ou cole o link direto da foto:
                    </label>
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    + Adicionar Link
                  </button>
                </div>
              </div>

              {/* Grid de Imagens Carregadas */}
              {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-xl border border-[#00D287]/40 overflow-hidden group shrink-0 bg-slate-900 shadow-md"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#00D287] text-slate-950 text-[8px] font-black text-center py-0.5 uppercase">
                          Capa
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CARD 4: FORNECEDOR DE ORIGEM & LOGÍSTICA */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" /> Logística & Fornecedor de Origem
                </span>
                <span className="text-[11px] text-cyan-400 font-mono font-bold">Melhor Envio</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Fornecedor de Origem (Calculador de Frete):
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                      </option>
                    ))}
                  </select>

                  {matchedSupplier && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1.5">
                      <span>Código: <strong className="text-white font-mono">{matchedSupplier.tag}</strong></span>
                      <span>Endereço: <strong className="text-slate-200">{matchedSupplier.city}/{matchedSupplier.state} (CEP {matchedSupplier.postalCode})</strong></span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Política de Frete
                    </label>
                    <select
                      value={shippingPolicy}
                      onChange={(e) => setShippingPolicy(e.target.value as ShippingPolicy)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                    >
                      <option value="comprador_paga">Calculado no Checkout pelo Comprador</option>
                      <option value="frete_gratis">Frete Grátis (Pago pelo Vendedor)</option>
                    </select>
                  </div>

                  {/* GARANTIA TÉCNICA (SOMENTE SE A CATEGORIA PERMITIR - OCULTO PARA CAPINHAS E PELÍCULAS) */}
                  {hasWarranty ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Garantia Técnica (Dias)
                      </label>
                      <input
                        type="number"
                        value={warrantyDays}
                        onChange={(e) => setWarrantyDays(Number(e.target.value) || 90)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center px-3 py-2 rounded-xl bg-slate-950/60 border border-white/5">
                      <span className="text-[11px] text-slate-400 font-semibold">Garantia:</span>
                      <span className="text-xs text-slate-300 font-medium">
                        Produto de consumo sem garantia técnica de fábrica.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PRECIFICAÇÃO, MARGEM & PUBLICAR (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD DE PRECIFICAÇÃO EXECUTIVO */}
            <div className="sticky top-4 p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#00D287]" /> Precificação & Margem
                </span>
                <span className="text-xs text-[#00D287] font-bold">Atacado B2B</span>
              </div>

              {/* Atalhos Rápidos de Margem */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Margem de Lucro Desejada:</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[20, 30, 35, 45, 50].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMarginPercent(m);
                        setPricingMode('margin');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        marginPercent === m
                          ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Custos e Preço */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Custo no Fornecedor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    placeholder="4.50"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Preço Final de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setPricingMode('manual');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-[#00D287]/50 text-[#00D287] text-lg font-black focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Preço De: R$ (Opcional p/ Promoção com % OFF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 12.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Lucro Líquido Unitário:</span>
                  <span className="font-black text-[#00D287] text-sm">+ R$ {profitMargin.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Margem Aplicada:</span>
                  <span className="font-bold text-white">{profitPercent}%</span>
                </div>
                {isModelGridSupported && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400">Modelos Cadastrados:</span>
                    <span className="font-bold text-white">{totalSelectedModelsCount} aparelhos</span>
                  </div>
                )}
              </div>

              {/* Botão de Ação */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-sm font-black shadow-xl shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publicando no Catálogo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Publicar no Catálogo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
