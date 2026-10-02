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
  ShieldCheck
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

const DEFAULT_APPLE_MODELS = [
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
];

const BRAND_POPULAR_MODELS: Record<string, string[]> = {
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
    'Note 40 Pro'
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

  // Product Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Capinhas');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  
  // Modelos & Compatibilidade
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple');
  const [appleModelsList, setAppleModelsList] = useState<string[]>(DEFAULT_APPLE_MODELS);
  const [selectedAppleModels, setSelectedAppleModels] = useState<string[]>(DEFAULT_APPLE_MODELS);
  const [modelSearch, setModelSearch] = useState('');
  const [modelPrices, setModelPrices] = useState<Record<string, string>>({});
  const [manualModels, setManualModels] = useState<string[]>([]);
  const [manualModelInput, setManualModelInput] = useState('');

  // Variações de Cores
  const [variationFeminino, setVariationFeminino] = useState(true);
  const [variationMasculino, setVariationMasculino] = useState(true);

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

  useEffect(() => {
    marketplaceService.getSuppliers().then((data) => {
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(data[0].id);
      }
    });
  }, []);

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
          const merged = Array.from(new Set([...uniqueNames, ...DEFAULT_APPLE_MODELS]));
          setAppleModelsList(merged);
          setSelectedAppleModels(merged);
        }
      } catch (err) {
        console.error('Erro ao carregar modelos do Trade-In:', err);
      }
    }
    loadTradeInAppleModels();
  }, [currentUser?.id]);

  const handleCategoryChange = (newCat: OfferCategory) => {
    setCategory(newCat);
    const suggested = pricingRulesService.getSuggestedMargin(newCat);
    setMarginPercent(suggested);

    const hasVar = categorySupportsVariations(newCat);
    if (!hasVar) {
      setVariationFeminino(false);
      setVariationMasculino(false);
    } else {
      setVariationFeminino(true);
      setVariationMasculino(true);
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const lower = newTitle.toLowerCase();

    // Auto-detect marca
    if (lower.includes('realme') && selectedBrand !== 'Realme') {
      setSelectedBrand('Realme');
      if (manualModels.length === 0 && BRAND_POPULAR_MODELS.Realme) setManualModels(BRAND_POPULAR_MODELS.Realme);
    } else if ((lower.includes('iphone') || lower.includes('apple')) && selectedBrand !== 'Apple') {
      setSelectedBrand('Apple');
    } else if ((lower.includes('samsung') || lower.includes('galaxy')) && selectedBrand !== 'Samsung') {
      setSelectedBrand('Samsung');
      if (manualModels.length === 0 && BRAND_POPULAR_MODELS.Samsung) setManualModels(BRAND_POPULAR_MODELS.Samsung);
    } else if ((lower.includes('motorola') || lower.includes('moto')) && selectedBrand !== 'Motorola') {
      setSelectedBrand('Motorola');
      if (manualModels.length === 0 && BRAND_POPULAR_MODELS.Motorola) setManualModels(BRAND_POPULAR_MODELS.Motorola);
    } else if ((lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) && selectedBrand !== 'Xiaomi') {
      setSelectedBrand('Xiaomi');
      if (manualModels.length === 0 && BRAND_POPULAR_MODELS.Xiaomi) setManualModels(BRAND_POPULAR_MODELS.Xiaomi);
    }

    // Auto-detect categoria
    if (lower.includes('capa') || lower.includes('capinha') || lower.includes('case')) {
      if (category !== 'Capinhas') handleCategoryChange('Capinhas');
    } else if (lower.includes('tela') || lower.includes('display') || lower.includes('frontal')) {
      if (category !== 'Telas') handleCategoryChange('Telas');
    } else if (lower.includes('bateria')) {
      if (category !== 'Baterias') handleCategoryChange('Baterias');
    } else if (lower.includes('película') || lower.includes('pelicula')) {
      if (category !== 'Películas') handleCategoryChange('Películas');
    }
  };

  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(brandName);
    if (brandName !== 'Apple' && manualModels.length === 0 && BRAND_POPULAR_MODELS[brandName]) {
      setManualModels(BRAND_POPULAR_MODELS[brandName]);
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Informe o título do produto.');
      return;
    }
    if (parsedPrice <= 0) {
      toast.error('Informe um preço de venda válido.');
      return;
    }

    setIsSubmitting(true);
    const parsedOrig = parseFloat(originalPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const isDiscount = parsedOrig > parsedPrice;
    const discountPct = isDiscount ? Math.round(((parsedOrig - parsedPrice) / parsedOrig) * 100) : undefined;
    const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    const finalCompatibleModels = isModelGridSupported
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
        compatibleBrand: isModelGridSupported ? selectedBrand : undefined,
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

  const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-5 overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full max-h-[92vh] max-w-2xl bg-[#090e1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-[#060912] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Cadastrar Produto Atacado</h3>
              <p className="text-[11px] text-slate-400">CellHub Shop • {category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY COM SCROLL CONTÍNUO E FLUIDO */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TÍTULO */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Produto <span className="text-[#00D287]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Capinha Magnética MagSafe Acrílica Transparente para iPhone"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
            />
          </div>

          {/* CATEGORIA E CONDIÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* COMPATIBILIDADE, GRADE DE MODELOS & VARIAÇÕES (SOMENTE SE A CATEGORIA PERMITIR) */}
          {isModelGridSupported && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#00D287]" /> Grade de Modelos Compatíveis
                </span>
                <span className="text-[10px] text-[#00D287] font-bold bg-[#00D287]/10 px-2 py-0.5 rounded">
                  {selectedBrand === 'Apple' ? selectedAppleModels.length : manualModels.length} modelo(s)
                </span>
              </div>

              {/* Marca */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme', 'Outros'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleSelectBrand(b)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      selectedBrand.toLowerCase() === b.toLowerCase()
                        ? 'bg-[#00D287] text-slate-950 border-[#00D287] font-black'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* VARIAÇÕES DE CORES (SOMENTE PARA CAPINHAS) */}
              {isVariationSupported && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Variações de Cor:</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={variationFeminino}
                        onChange={(e) => setVariationFeminino(e.target.checked)}
                        className="accent-pink-500 rounded"
                      />
                      <span>👩 Cores \Feminina</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-white font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={variationMasculino}
                        onChange={(e) => setVariationMasculino(e.target.checked)}
                        className="accent-blue-500 rounded"
                      />
                      <span>👨 Cores \Masculina</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Botão de Preço Rápido */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                <span className="text-slate-400">Preço padrão: <strong className="text-white">R$ {parsedPrice.toFixed(2)}</strong></span>
                <button
                  type="button"
                  onClick={handleApplyBasePriceToAll}
                  className="px-2 py-0.5 rounded bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] font-bold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Aplicar a todos
                </button>
              </div>

              {/* LISTA DE MODELOS */}
              {selectedBrand === 'Apple' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Buscar iPhone..."
                        className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAppleModels([...appleModelsList])}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAppleModels([])}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-[11px] font-semibold"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1 divide-y divide-white/5">
                    {filteredAppleModels.map((m) => {
                      const isChecked = selectedAppleModels.includes(m);
                      return (
                        <div
                          key={m}
                          className={`pt-1 pb-1 px-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                            isChecked ? 'bg-white/5' : 'opacity-40'
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
                              onChange={(e) => setModelPrices({ ...modelPrices, [m]: e.target.value })}
                              className="w-16 px-1.5 py-0.5 bg-slate-900 border border-white/15 rounded text-xs text-[#00D287] font-bold text-right outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* OUTRAS MARCAS */
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={manualModelInput}
                      onChange={(e) => setManualModelInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualModel())}
                      placeholder={`Nome do modelo ${selectedBrand}...`}
                      className="flex-1 px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualModel}
                      className="px-3 py-1 rounded-lg bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {BRAND_POPULAR_MODELS[selectedBrand] && (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-slate-400">Populares {selectedBrand}:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setManualModels(BRAND_POPULAR_MODELS[selectedBrand]);
                          toast.success(`Modelos ${selectedBrand} carregados!`);
                        }}
                        className="text-[10px] text-[#00D287] hover:underline font-bold"
                      >
                        + Carregar Todos
                      </button>
                    </div>
                  )}

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {manualModels.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-xs text-white"
                      >
                        <span className="font-semibold">{m}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={modelPrices[m] || price || '6.53'}
                            onChange={(e) => setModelPrices({ ...modelPrices, [m]: e.target.value })}
                            className="w-16 px-1.5 py-0.5 bg-slate-950 border border-white/15 rounded text-xs text-[#00D287] font-bold text-right outline-none"
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

          {/* FOTOS, GARANTIA & FRETE */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL da Foto do Produto</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-[#00D287]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-bold"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-xl border border-white/15 overflow-hidden group shrink-0 bg-slate-950">
                    <img src={img} alt="" className="w-full h-full object-cover" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <option value="comprador_paga">Calculado no Checkout</option>
                  <option value="frete_gratis">Frete Grátis (CellHub Paga)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre acabamento, botões, bordas e qualidade técnica..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 outline-none focus:border-[#00D287]"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3.5 border-t border-white/5 bg-[#060912] flex items-center justify-between gap-3 shrink-0">
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
            className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Publicando...' : 'Publicar no Catálogo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
