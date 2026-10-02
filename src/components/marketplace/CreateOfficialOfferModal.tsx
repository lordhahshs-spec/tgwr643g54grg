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
  Sparkles
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

export const categorySupportsModelGrid = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas', 'telas', 'baterias', 'peças', 'películas', 'conectores', 'carcaças'].includes(lower);
};

export const categorySupportsVariations = (cat: string): boolean => {
  const lower = (cat || '').toLowerCase();
  return ['capinhas'].includes(lower);
};

const DEFAULT_BRAND_MODELS: Record<string, string[]> = {
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
  Outros: [
    'Modelo Genérico 1',
    'Modelo Genérico 2'
  ]
};

export const CreateOfficialOfferModal: React.FC<CreateOfficialOfferModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onCreated,
  onOfferCreated
}) => {
  if (!isOpen) return null;

  // Product Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Capinhas');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');

  // Selected Brand (Merchant chooses ONE brand at a time to keep it clean)
  const [selectedBrand, setSelectedBrand] = useState<string>('Realme');
  const [brandModelsCatalog, setBrandModelsCatalog] = useState<Record<string, string[]>>(DEFAULT_BRAND_MODELS);
  
  // Selected models for the active brand
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
  const [customModelInput, setCustomModelInput] = useState('');

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

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fornecedores
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const isModelGridSupported = categorySupportsModelGrid(category);
  const isVariationSupported = categorySupportsVariations(category);

  // Carregar Fornecedores
  useEffect(() => {
    marketplaceService.getSuppliers().then((data) => {
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(data[0].id);
      }
    });
  }, []);

  // Carregar modelos adicionais do Trade-In para Apple se disponível
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

  // Sincronizar Categoria & Margem sugerida
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

    // Auto-detect Brand
    if (lower.includes('realme')) {
      setSelectedBrand('Realme');
    } else if (lower.includes('iphone') || lower.includes('apple')) {
      setSelectedBrand('Apple');
    } else if (lower.includes('samsung') || lower.includes('galaxy')) {
      setSelectedBrand('Samsung');
    } else if (lower.includes('motorola') || lower.includes('moto')) {
      setSelectedBrand('Motorola');
    } else if (lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) {
      setSelectedBrand('Xiaomi');
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

  // Alterar Marca Selecionada
  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(brandName);
    setModelSearch('');
  };

  // Modelos disponíveis para a marca atual
  const currentBrandAllModels = brandModelsCatalog[selectedBrand] || [];
  const currentSelectedModels = selectedModelsByBrand[selectedBrand] || [];

  // Filtragem pela busca
  const filteredModels = currentBrandAllModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase().trim())
  );

  // Toggle selecionar modelo
  const handleToggleModel = (modelName: string) => {
    setSelectedModelsByBrand((prev) => {
      const list = prev[selectedBrand] || [];
      const exists = list.includes(modelName);
      const updated = exists ? list.filter((x) => x !== modelName) : [...list, modelName];
      return { ...prev, [selectedBrand]: updated };
    });
  };

  // Selecionar todos os modelos da marca
  const handleSelectAllBrandModels = () => {
    setSelectedModelsByBrand((prev) => ({
      ...prev,
      [selectedBrand]: [...currentBrandAllModels]
    }));
    toast.success(`Todos os modelos de ${selectedBrand} selecionados!`);
  };

  // Desmarcar todos os modelos da marca
  const handleDeselectAllBrandModels = () => {
    setSelectedModelsByBrand((prev) => ({
      ...prev,
      [selectedBrand]: []
    }));
  };

  // Adicionar modelo personalizado para a marca
  const handleAddCustomModel = () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) return;
    
    // Adiciona ao catálogo da marca se não existir
    if (!currentBrandAllModels.includes(trimmed)) {
      setBrandModelsCatalog((prev) => ({
        ...prev,
        [selectedBrand]: [trimmed, ...(prev[selectedBrand] || [])]
      }));
    }

    // Marca como selecionado
    if (!currentSelectedModels.includes(trimmed)) {
      setSelectedModelsByBrand((prev) => ({
        ...prev,
        [selectedBrand]: [trimmed, ...(prev[selectedBrand] || [])]
      }));
    }

    if (!modelPrices[trimmed]) {
      setModelPrices((prev) => ({
        ...prev,
        [trimmed]: parsedPrice > 0 ? parsedPrice.toFixed(2) : '6.53'
      }));
    }

    setCustomModelInput('');
    toast.success(`Modelo "${trimmed}" adicionado para ${selectedBrand}!`);
  };

  // Aplicar preço base a todos os modelos
  const handleApplyBasePriceToAll = () => {
    const baseP = parsedPrice > 0 ? parsedPrice : 6.53;
    const updated: Record<string, string> = {};
    currentBrandAllModels.forEach((m) => {
      updated[m] = baseP.toFixed(2);
    });
    setModelPrices(updated);
    toast.success(`Preço R$ ${baseP.toFixed(2)} aplicado a todos os modelos!`);
  };

  // Upload direto de foto do dispositivo
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
          toast.success('Foto carregada com sucesso!');
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
      toast.error('Insira uma URL de imagem válida (iniciando com https://)');
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

    // Auto-inclui a URL da foto se o usuário digitou mas esqueceu de clicar em "Adicionar"
    let finalImages = [...images];
    if (imageUrlInput.trim()) {
      const cleanUrl = imageUrlInput.trim();
      if ((cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:image')) && !finalImages.includes(cleanUrl)) {
        finalImages.push(cleanUrl);
      }
    }

    // Se nenhuma foto foi enviada, usa foto padrão de alta qualidade para a categoria
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

    // Modelos finais estritamente vinculados à marca selecionada
    const finalCompatibleModels = isModelGridSupported
      ? (selectedModelsByBrand[selectedBrand] || [])
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
        warrantyDays,
        images: finalImages,
        compatibleBrand: isModelGridSupported ? selectedBrand : undefined,
        compatibleModels: finalCompatibleModels,
        modelPricing: finalModelPricing,
        variationType: variationOptions.length > 0 ? 'masculino_feminino' : 'nenhum',
        variationOptions,
        packageWeight: 0.15,
        packageHeight: 4,
        packageWidth: 12,
        packageLength: 18,
        isOfficial: true,
        status: 'ativa',
        salesCount: 0,
      });

      if (res.success) {
        toast.success('Produto publicado no catálogo com sucesso!');
        onCreated?.();
        onOfferCreated?.();
        onClose();
      } else {
        toast.error(res.message || 'Erro ao publicar produto.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Falha na conexão ao criar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#080c17] border border-[#00D287]/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#060912] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 border border-[#00D287]/40 flex items-center justify-center text-[#00D287]">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Cadastrar Produto no Atacado
              </h2>
              <p className="text-[11px] text-slate-400">
                CellHub Shop • {category} {isModelGridSupported ? `• Marca: ${selectedBrand}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY (FLUIDO E ROLÁVEL) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* TÍTULO DO PRODUTO */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Título do Produto *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Capinha Magnética MagSafe Silicone Realme C55"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#00D287] transition-colors"
            />
          </div>

          {/* CATEGORIA & CONDIÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as OfferCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Condição</label>
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

          {/* SELEÇÃO ESPECÍFICA DE MARCA & GRADE DE MODELOS */}
          {isModelGridSupported && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#00D287]" /> Selecione a Marca do Produto
                </span>
                <span className="text-[10px] text-[#00D287] font-bold bg-[#00D287]/10 px-2 py-0.5 rounded">
                  {currentSelectedModels.length} modelo(s) de {selectedBrand} selecionado(s)
                </span>
              </div>

              {/* BOTOES DE MARCA (APENAS A MARCA QUE O LOJISTA QUER) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['Realme', 'Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Outros'].map((b) => {
                  const isCurrent = selectedBrand.toLowerCase() === b.toLowerCase();
                  const count = (selectedModelsByBrand[b] || []).length;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelectBrand(b)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#00D287] text-slate-950 border-[#00D287] font-black shadow-md shadow-[#00D287]/20 scale-[1.02]'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      <span>{b}</span>
                      <span className={`text-[9.5px] font-normal ${isCurrent ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                        ({count} ativos)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* VARIAÇÕES DE CORES (SOMENTE PARA CAPINHAS) */}
              {isVariationSupported && (
                <div className="pt-2.5 pb-1 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">Variações de Cor (Atacado):</span>
                    <span className="text-[10px] text-slate-500">Opções disponíveis para escolha do lojista</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-pink-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={variationFeminino}
                        onChange={(e) => setVariationFeminino(e.target.checked)}
                        className="accent-pink-500 rounded"
                      />
                      <span>👩 Cores \Feminina</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-blue-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={variationMasculino}
                        onChange={(e) => setVariationMasculino(e.target.checked)}
                        className="accent-blue-500 rounded"
                      />
                      <span>👨 Cores \Masculina</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none bg-slate-900 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-amber-500/40 transition-colors" title="Pode ir qualquer cor variada / sortimento misto">
                      <input
                        type="checkbox"
                        checked={variationSortidas}
                        onChange={(e) => setVariationSortidas(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      <span>🎨 Cores / Sortidas</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Qualquer cor)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* LISTA DE MODELOS DA MARCA SELECIONADA */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder={`Filtrar modelos ${selectedBrand}...`}
                      className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllBrandModels}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#00D287]/20 hover:text-[#00D287] text-slate-300 text-[11px] font-semibold transition-colors"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllBrandModels}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-[11px] font-semibold transition-colors"
                  >
                    Desmarcar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBasePriceToAll}
                    className="px-2.5 py-1.5 rounded-lg bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Preço Padrão
                  </button>
                </div>

                {/* Adicionar Modelo Customizado para a Marca */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomModel())}
                    placeholder={`Adicionar outro modelo ${selectedBrand} (Ex: ${selectedBrand === 'Apple' ? 'iPhone 17' : selectedBrand === 'Realme' ? 'Realme GT 6' : 'Modelo Especial'})...`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomModel}
                    className="px-3.5 py-1.5 rounded-lg bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Grid Rolável de Modelos da Marca Selecionada */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-white/5 border border-white/5 rounded-xl p-1 bg-slate-950/60">
                  {filteredModels.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      Nenhum modelo encontrado com a busca. Digite no campo acima para adicionar.
                    </div>
                  ) : (
                    filteredModels.map((m) => {
                      const isChecked = currentSelectedModels.includes(m);
                      return (
                        <div
                          key={m}
                          className={`pt-1.5 pb-1.5 px-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                            isChecked ? 'bg-white/5' : 'opacity-35'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none flex-1 truncate font-medium">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleModel(m)}
                              className="accent-[#00D287] w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="truncate">{m}</span>
                          </label>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={modelPrices[m] || price || '6.53'}
                              onChange={(e) => setModelPrices({ ...modelPrices, [m]: e.target.value })}
                              className="w-16 px-1.5 py-0.5 bg-slate-900 border border-white/15 rounded text-xs text-[#00D287] font-bold text-right outline-none focus:border-[#00D287]"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FORNECEDOR DE ORIGEM (MELHOR ENVIO) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" /> Fornecedor de Origem (Melhor Envio)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Origem do Frete</span>
            </div>

            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                </option>
              ))}
            </select>

            {matchedSupplier && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>Tag: <strong className="text-white">{matchedSupplier.tag}</strong></span>
                <span>CEP: <strong className="text-white font-mono">{matchedSupplier.postalCode}</strong> • {matchedSupplier.city}/{matchedSupplier.state}</span>
              </div>
            )}
          </div>

          {/* PRECIFICAÇÃO & MARGEM */}
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
                    onClick={() => {
                      setMarginPercent(m);
                      setPricingMode('margin');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-[11px] text-slate-400 mb-1">Preço Final de Venda (R$)</label>
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

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>Lucro unitário estimado:</span>
              <span className="font-bold text-[#00D287]">+ R$ {profitMargin.toFixed(2)} ({profitPercent}%)</span>
            </div>

            <div>
              <label className="block text-[10.5px] text-slate-400 mb-1">
                Preço Original "De: R$" (Opcional p/ Promoção com % OFF)
              </label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Ex: 12.00"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>

          {/* FOTOS DO PRODUTO (ARQUIVO OU LINK) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00D287]" /> Fotos do Produto ({images.length})
              </span>
              <span className="text-[10px] text-slate-400">Envie foto do aparelho/computador ou insira link</span>
            </div>

            {/* Upload Direto + Campo de URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Botão de Enviar Foto do PC / Celular */}
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#00D287]/40 bg-[#00D287]/5 hover:bg-[#00D287]/10 text-slate-200 hover:text-white cursor-pointer transition-colors text-xs font-semibold">
                <Upload className="w-4 h-4 text-[#00D287]" />
                <span>Escolher foto do dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              {/* Input de URL da Foto */}
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                  placeholder="Ou cole o link da foto https://..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
                >
                  + Link
                </button>
              </div>
            </div>

            {/* Grade de Fotos Carregadas com Preview */}
            {images.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl border border-[#00D287]/30 overflow-hidden group shrink-0 bg-slate-900 shadow-md">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-[#00D287] text-slate-950 text-[8px] font-black text-center py-0.5">
                        CAPA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Garantia (Dias)</label>
                <input
                  type="number"
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value) || 90)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Política de Frete</label>
                <select
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value as ShippingPolicy)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                >
                  <option value="comprador_paga">Calculado no Checkout</option>
                  <option value="frete_gratis">Frete Grátis (CellHub Paga)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição do Produto</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Capinha anti-impacto com bordas reforçadas e acabamento aveludado..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#060912] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black shadow-lg shadow-[#00D287]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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
      </div>
    </div>
  );
};
