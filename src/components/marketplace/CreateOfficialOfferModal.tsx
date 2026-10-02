import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Tag,
  ArrowRight,
  ArrowLeft,
  Box,
  Scale,
  DollarSign,
  Sparkles,
  HelpCircle,
  Clock,
  Percent,
  Sliders,
  ArrowDown,
  Image as ImageIcon,
  Star,
  Smartphone,
  CheckSquare,
  Square,
  Search,
  Users
} from 'lucide-react';
import {
  OfferCategory,
  OfferCondition,
  ShippingPolicy,
  CategoryPackageDefault,
  MarketplaceSupplier
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService } from '@/services/melhorEnvioService';
import { pricingRulesService, OFFICIAL_CATEGORIES } from '@/services/pricingRulesService';
import { tradeinService, BRANDS_LIST } from '@/services/tradeinService';
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
  'Recondicionado',
  'Com avaria',
  'Para retirada de peças',
  'Outro'
];

const PRESET_MARGINS = [10, 15, 20, 25, 30, 35, 40, 50];

// Fallback robusto de modelos Apple organizados por geração decrescente
const DEFAULT_APPLE_MODELS = [
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
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 13 mini',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 12 mini',
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
  'iPhone XR',
  'iPhone XS Max',
  'iPhone XS',
  'iPhone X',
  'iPhone SE (2ª/3ª geração)',
  'iPhone 8 Plus',
  'iPhone 8',
  'iPhone 7 Plus',
  'iPhone 7'
];

export const CreateOfficialOfferModal: React.FC<CreateOfficialOfferModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onCreated,
  onOfferCreated,
}) => {
  if (isOpen === false) return null;
  const [step, setStep] = useState<'form' | 'preview'>('form');

  // Product Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Capinhas');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  
  // Modelos e Marcas Compatíveis (Especial para Capinhas e Acessórios)
  const [enableCompatibility, setEnableCompatibility] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple');
  const [appleModelsList, setAppleModelsList] = useState<string[]>(DEFAULT_APPLE_MODELS);
  const [selectedAppleModels, setSelectedAppleModels] = useState<string[]>(DEFAULT_APPLE_MODELS);
  const [appleSearchFilter, setAppleSearchFilter] = useState('');
  
  // Modelos Manuais para Outras Marcas (Samsung, Motorola, Xiaomi, etc.)
  const [manualModels, setManualModels] = useState<string[]>([]);
  const [manualModelInput, setManualModelInput] = useState('');

  // Variações de Cores / Perfil (Apenas Masculino / Feminino)
  const [variationMasculino, setVariationMasculino] = useState(true);
  const [variationFeminino, setVariationFeminino] = useState(true);

  // Pricing Mode & Margins
  const [pricingMode, setPricingMode] = useState<'margin' | 'manual'>('margin');
  const [marginPercent, setMarginPercent] = useState<number>(45);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [badgeText, setBadgeText] = useState('Garantia Oficial CellHub');

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
  const [isDragging, setIsDragging] = useState(false);

  const [categoriesList, setCategoriesList] = useState<string[]>(() => pricingRulesService.getCategories());

  // Suppliers (Dropshipping / Melhor Envio origin)
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

  // Carrega modelos cadastrados na aba de Avaliação de Aparelhos (Trade-In)
  useEffect(() => {
    async function loadTradeInAppleModels() {
      try {
        const tradeinModels = await tradeinService.getModels('Apple', currentUser?.id, true);
        if (tradeinModels && tradeinModels.length > 0) {
          // Extrai nomes únicos de modelos de iPhone da tabela de avaliação
          const uniqueNames = Array.from(
            new Set(
              tradeinModels
                .map((m) => m.model_name.trim())
                .filter((name) => Boolean(name) && name.toLowerCase().includes('iphone'))
            )
          );

          // Mescla com a lista padrão para garantir cobertura completa
          const merged = Array.from(new Set([...uniqueNames, ...DEFAULT_APPLE_MODELS]));
          setAppleModelsList(merged);
          // Por padrão, todos vêm marcados conforme instrução
          setSelectedAppleModels(merged);
        } else {
          setAppleModelsList(DEFAULT_APPLE_MODELS);
          setSelectedAppleModels(DEFAULT_APPLE_MODELS);
        }
      } catch (err) {
        console.error('Erro ao carregar modelos do Trade-In:', err);
        setAppleModelsList(DEFAULT_APPLE_MODELS);
        setSelectedAppleModels(DEFAULT_APPLE_MODELS);
      }
    }

    loadTradeInAppleModels();
  }, [currentUser?.id]);

  // Auto-update default suggested margin when Category changes
  useEffect(() => {
    const list = pricingRulesService.getCategories();
    setCategoriesList(list);
    if (!list.includes(category) && list.length > 0) {
      setCategory(list[0] as OfferCategory);
    }
    const suggested = pricingRulesService.getSuggestedMargin(category);
    setMarginPercent(suggested);
    if (pricingMode === 'margin' && supplierCost) {
      const costNum = parseFloat(supplierCost);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, suggested);
        setPrice(calculated.toFixed(2));
      }
    }

    // Se for Capinhas ou Acessórios, ativa compatibilidade por padrão
    const isCapinhaOrAcc = ['capinhas', 'acessórios', 'telas', 'películas'].includes(category.toLowerCase());
    setEnableCompatibility(isCapinhaOrAcc);
  }, [category]);

  useEffect(() => {
    melhorEnvioService.getPackageDefaults().then((defs) => {
      const match = defs.find((d) => d.category.toLowerCase() === category.toLowerCase());
      if (match) {
        setPackageWeight(match.default_weight);
        setPackageHeight(match.default_height);
        setPackageWidth(match.default_width);
        setPackageLength(match.default_length);
      }
    });
  }, [category]);

  const handleCategoryChange = (cat: OfferCategory) => {
    setCategory(cat);
    melhorEnvioService.getPackageDefaults().then((defs) => {
      const match = defs.find((d) => d.category.toLowerCase() === cat.toLowerCase());
      if (match) {
        setPackageWeight(match.default_weight);
        setPackageHeight(match.default_height);
        setPackageWidth(match.default_width);
        setPackageLength(match.default_length);
      }
    });
  };

  // Modelos Apple: Toggle individual
  const handleToggleAppleModel = (modelName: string) => {
    setSelectedAppleModels((prev) =>
      prev.includes(modelName)
        ? prev.filter((m) => m !== modelName)
        : [...prev, modelName]
    );
  };

  // Modelos Apple: Marcar todos
  const handleSelectAllApple = () => {
    setSelectedAppleModels([...appleModelsList]);
    toast.success('Todos os modelos Apple foram marcados!');
  };

  // Modelos Apple: Desmarcar todos
  const handleDeselectAllApple = () => {
    setSelectedAppleModels([]);
    toast.info('Todos os modelos foram desmarcados.');
  };

  // Modelos Manuais (Outras Marcas): Adicionar
  const handleAddManualModel = () => {
    const clean = manualModelInput.trim();
    if (!clean) return;

    if (manualModels.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      toast.info('Este modelo já foi adicionado.');
      return;
    }

    setManualModels((prev) => [...prev, clean]);
    setManualModelInput('');
  };

  // Modelos Manuais: Remover
  const handleRemoveManualModel = (index: number) => {
    setManualModels((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Supplier Cost input in margin mode
  const handleSupplierCostChange = (val: string) => {
    setSupplierCost(val);
    if (pricingMode === 'margin') {
      const costNum = parseFloat(val);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, marginPercent);
        setPrice(calculated.toFixed(2));
      } else {
        setPrice('');
      }
    }
  };

  // Handle Margin Percent change
  const handleMarginPercentChange = (newMargin: number) => {
    setMarginPercent(newMargin);
    if (pricingMode === 'margin' && supplierCost) {
      const costNum = parseFloat(supplierCost);
      if (!isNaN(costNum) && costNum > 0) {
        const calculated = pricingRulesService.calculatePriceFromCost(costNum, newMargin);
        setPrice(calculated.toFixed(2));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`O arquivo ${file.name} não é uma imagem suportada.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`A foto ${file.name} excede o limite de 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast.success('Foto(s) adicionada(s) com sucesso!');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`O arquivo ${file.name} não é uma imagem suportada.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`A foto ${file.name} excede o limite de 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success('Foto(s) adicionada(s) com sucesso!');
  };

  const handleAddImage = () => {
    let clean = imageUrlInput.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image')) {
      clean = `https://${clean}`;
    }

    if (images.includes(clean)) {
      toast.info('Essa imagem já foi adicionada.');
      return;
    }

    setImages([...images, clean]);
    setImageUrlInput('');
    toast.success('Link de imagem adicionado!');
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
    toast.success('Definida como foto principal!');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const parsedPrice = parseFloat(price) || 0;
  const parsedCost = parseFloat(supplierCost) || 0;
  const profitMargin = parsedPrice - parsedCost;
  const profitPercent = parsedCost > 0 ? ((profitMargin / parsedCost) * 100).toFixed(1) : '0';

  const filteredAppleModels = useMemo(() => {
    const q = appleSearchFilter.toLowerCase().trim();
    if (!q) return appleModelsList;
    return appleModelsList.filter((m) => m.toLowerCase().includes(q));
  }, [appleModelsList, appleSearchFilter]);

  const handleValidateForm = () => {
    if (!title.trim()) {
      toast.error('Informe o título do produto.');
      return false;
    }
    if (parsedPrice <= 0) {
      toast.error('Informe um preço de venda final válido.');
      return false;
    }
    if (images.length === 0) {
      toast.error('Adicione pelo menos 1 imagem do produto.');
      return false;
    }

    if (enableCompatibility) {
      if (selectedBrand === 'Apple' && selectedAppleModels.length === 0) {
        toast.error('Selecione ao menos 1 modelo de iPhone compatível.');
        return false;
      }
      if (selectedBrand !== 'Apple' && selectedBrand !== 'Universal' && manualModels.length === 0) {
        toast.error('Adicione ao menos 1 modelo compatível para a marca selecionada.');
        return false;
      }
    }

    if (!variationMasculino && !variationFeminino) {
      toast.error('Selecione ao menos uma opção de variação (Masculino ou Feminino).');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!handleValidateForm()) return;

    setIsSubmitting(true);
    const parsedOrig = parseFloat(originalPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const isDiscount = parsedOrig > parsedPrice;
    const discountPct = isDiscount ? Math.round(((parsedOrig - parsedPrice) / parsedOrig) * 100) : undefined;

    const matchedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    // Determina lista final de modelos compatíveis
    const finalCompatibleModels = enableCompatibility
      ? selectedBrand === 'Apple'
        ? selectedAppleModels
        : manualModels
      : [];

    // Determina opções de variação
    const variationOptions: string[] = [];
    if (variationMasculino) variationOptions.push('Masculino');
    if (variationFeminino) variationOptions.push('Feminino');

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
        description: description.trim() || 'Produto oficial verificado com garantia técnica CellHub Shop.',
        details: details.trim() || undefined,
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
        compatibleBrand: enableCompatibility ? selectedBrand : undefined,
        compatibleModels: finalCompatibleModels,
        variationType: variationOptions.length > 0 ? 'masculino_feminino' : 'nenhum',
        variationOptions: variationOptions,
      });

      if (res.success) {
        toast.success('Produto oficial cadastrado com sucesso no catálogo da CellHub Shop!');
        if (onOfferCreated) onOfferCreated();
        if (onCreated) onCreated();
        onClose();
      } else {
        toast.error(`Erro ao cadastrar produto: ${res.error || 'Tente novamente.'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro inesperado ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 md:backdrop-blur-sm md:p-4 overflow-hidden">
      <div className="relative w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-3xl bg-[#090e1c] md:border md:border-[#00D287]/30 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Botão Voltar no Mobile */}
            <button
              onClick={step === 'preview' ? () => setStep('form') : onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
              <span className="text-xs">Voltar</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] hidden sm:flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base font-bold text-white">Cadastrar Produto Oficial</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">
                  CELLHUB SHOP
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[220px] sm:max-w-none">Catálogo Atacado com modelos e variações Masc/Fem</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="hidden md:flex w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-5 pb-24 md:pb-6">
          {step === 'form' ? (
            <>
              {/* Informações Básicas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Título do Produto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Capinha Magnética MagSafe Acrílica Anti-Impacto"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as OfferCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Condição</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as OfferCondition)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                    >
                      {CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO: MARCAS & MODELOS COMPATÍVEIS (CAPINHAS / ACESSÓRIOS) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0e172e] to-[#090e1c] border border-[#00D287]/30 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        Marca & Modelos Compatíveis
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">
                          Catálogo Atacado
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Selecione a marca e os modelos compatíveis com este produto.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer self-start sm:self-auto bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                    <input
                      type="checkbox"
                      checked={enableCompatibility}
                      onChange={(e) => setEnableCompatibility(e.target.checked)}
                      className="rounded accent-[#00D287] w-4 h-4"
                    />
                    <span>Ativar compatibilidade de modelos</span>
                  </label>
                </div>

                {enableCompatibility && (
                  <div className="space-y-3.5">
                    {/* Seleção de Marca */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Marca do Aparelho
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Realme', 'Infinix', 'Tecno', 'Outros'].map((brandName) => {
                          const isSelected = selectedBrand.toLowerCase() === brandName.toLowerCase();
                          return (
                            <button
                              key={brandName}
                              type="button"
                              onClick={() => setSelectedBrand(brandName)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#00D287] text-slate-950 border-[#00D287] shadow-md shadow-[#00D287]/20 font-black'
                                  : 'bg-slate-950/80 text-slate-300 border-white/10 hover:border-white/20 hover:bg-slate-900'
                              }`}
                            >
                              <span>{brandName}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-slate-950 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CASO 1: APPLE (Utiliza modelos do Trade-in com tudo marcado por padrão) */}
                    {selectedBrand === 'Apple' ? (
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-[#00D287]/20 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#00D287]" />
                              Modelos Apple (Cadastrados na Avaliação Trade-In)
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Todos os modelos vêm marcados por padrão. Desmarque apenas os que não possuem essa capinha.
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={handleSelectAllApple}
                              className="px-2.5 py-1 rounded-lg bg-[#00D287]/15 hover:bg-[#00D287]/25 text-[#00D287] border border-[#00D287]/30 text-[10.5px] font-bold transition-colors"
                            >
                              Marcar Todos
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllApple}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-[10.5px] font-bold transition-colors"
                            >
                              Desmarcar Todos
                            </button>
                          </div>
                        </div>

                        {/* Barra de Busca de Modelos Apple */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={appleSearchFilter}
                            onChange={(e) => setAppleSearchFilter(e.target.value)}
                            placeholder="Buscar modelo de iPhone (ex: 14 Pro, 15, 13)..."
                            className="w-full pl-8 pr-3.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
                          />
                        </div>

                        {/* Contador de selecionados */}
                        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                          <span>{selectedAppleModels.length} de {appleModelsList.length} modelos selecionados</span>
                          {selectedAppleModels.length === 0 && (
                            <span className="text-rose-400 font-semibold">Selecione ao menos 1 modelo</span>
                          )}
                        </div>

                        {/* Grid de Modelos com Checkbox */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {filteredAppleModels.map((modelName) => {
                            const isChecked = selectedAppleModels.includes(modelName);
                            return (
                              <label
                                key={modelName}
                                onClick={() => handleToggleAppleModel(modelName)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-all border ${
                                  isChecked
                                    ? 'bg-[#00D287]/15 border-[#00D287]/40 text-white font-semibold'
                                    : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-[#00D287] shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600 shrink-0" />
                                )}
                                <span className="truncate">{modelName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* CASO 2: OUTRAS MARCAS (Adição Manual de Modelos) */
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Adicionar Modelos para {selectedBrand}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Digite o nome do modelo (ex: Galaxy S24 Ultra, Moto G84, Redmi Note 13) e clique em Adicionar.
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualModelInput}
                            onChange={(e) => setManualModelInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualModel())}
                            placeholder={`Nome do modelo ${selectedBrand}...`}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
                          />
                          <button
                            type="button"
                            onClick={handleAddManualModel}
                            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Adicionar
                          </button>
                        </div>

                        {/* Lista de Modelos Adicionados */}
                        {manualModels.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {manualModels.length} modelo(s) configurado(s):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {manualModels.map((m, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 text-white text-xs font-medium"
                                >
                                  {m}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveManualModel(idx)}
                                    className="p-0.5 hover:text-rose-400 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
                            Nenhum modelo manual adicionado ainda para {selectedBrand}.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SEÇÃO: VARIAÇÃO DE CORES (APENAS MASCULINO / FEMININO) */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#00D287]" />
                        Variação de Cores & Kits de Atacado
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Conforme padrão de atacado: apenas variação de kit Masculino e Feminino (sem escolha individual de cor).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label
                      onClick={() => setVariationMasculino(!variationMasculino)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        variationMasculino
                          ? 'bg-blue-950/40 border-blue-500/50 text-white font-bold'
                          : 'bg-slate-950/60 border-white/10 text-slate-500'
                      }`}
                    >
                      {variationMasculino ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs block text-white">👨 Kit Masculino</span>
                        <span className="text-[10px] text-slate-400 font-normal">Preto, grafite, azul escuro, etc.</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setVariationFeminino(!variationFeminino)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        variationFeminino
                          ? 'bg-pink-950/40 border-pink-500/50 text-white font-bold'
                          : 'bg-slate-950/60 border-white/10 text-slate-500'
                      }`}
                    >
                      {variationFeminino ? (
                        <CheckSquare className="w-4 h-4 text-pink-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs block text-white">👩 Kit Feminino</span>
                        <span className="text-[10px] text-slate-400 font-normal">Rosa, lilás, glitter, clean, etc.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bloco de Precificação Dinâmica & Margem */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-[#00D287]/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#00D287]" />
                    Precificação & Margem de Lucro (Privado)
                  </span>

                  {/* Pricing Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5 self-start">
                    <button
                      type="button"
                      onClick={() => setPricingMode('margin')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                        pricingMode === 'margin'
                          ? 'bg-[#00D287] text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Percent className="w-3 h-3" />
                      Por Porcentagem (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('manual')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                        pricingMode === 'manual'
                          ? 'bg-[#00D287] text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3 h-3" />
                      Manual (Fixo)
                    </button>
                  </div>
                </div>

                {/* Mode A: Porcentagem Automática */}
                {pricingMode === 'margin' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Custo no Fornecedor (R$) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={supplierCost}
                          onChange={(e) => handleSupplierCostChange(e.target.value)}
                          placeholder="Ex: 6.65"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#00D287]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-300">
                            Margem de Lucro (%)
                          </label>
                          <span className="text-[10px] text-[#00D287] font-bold">
                            Padrão de {category}: {pricingRulesService.getSuggestedMargin(category)}%
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={marginPercent}
                            onChange={(e) => handleMarginPercentChange(parseFloat(e.target.value) || 0)}
                            className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-900 border border-white/10 text-[#00D287] font-black text-sm focus:outline-none focus:border-[#00D287]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Margin Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 mr-1">Atalhos:</span>
                      {PRESET_MARGINS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMarginPercentChange(m)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            marginPercent === m
                              ? 'bg-[#00D287] text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5'
                          }`}
                        >
                          +{m}%
                        </button>
                      ))}
                    </div>

                    {/* Calculated Output */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Preço de Venda Final Calculado:</span>
                        <span className="text-lg font-black text-[#00D287]">
                          R$ {parsedPrice > 0 ? parsedPrice.toFixed(2) : '0,00'}
                        </span>
                      </div>
                      {parsedCost > 0 && (
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Lucro Líquido Estimado:</span>
                          <span className="font-bold text-white">
                            + R$ {profitMargin.toFixed(2)} ({profitPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode B: Manual (Preço Fixo) */
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Preço de Venda Final (R$) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Ex: 12.90"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-[#00D287] font-black text-sm focus:outline-none focus:border-[#00D287]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Custo no Fornecedor (R$) - Opcional
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={supplierCost}
                          onChange={(e) => setSupplierCost(e.target.value)}
                          placeholder="Ex: 6.65"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-bold text-sm focus:outline-none focus:border-[#00D287]"
                        />
                      </div>
                    </div>

                    {parsedCost > 0 && parsedPrice > parsedCost && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Margem Estimada CellHub:</span>
                        <span className="text-[#00D287] font-black">
                          + R$ {profitMargin.toFixed(2)} ({profitPercent}%)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Preço Original / Promoção com Desconto */}
                {(() => {
                  const origPriceNum = parseFloat(originalPrice.replace(/\./g, '').replace(',', '.')) || 0;
                  const isDiscountActive = origPriceNum > parsedPrice && parsedPrice > 0;
                  const discountPct = isDiscountActive ? Math.round(((origPriceNum - parsedPrice) / origPriceNum) * 100) : 0;

                  return (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-rose-400" />
                          Preço Original "De: R$" (Opcional - Ativa Selo de Desconto)
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
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="Ex: 25.00 (Valor de tabela antes do desconto)"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-[#00D287]"
                      />

                      {isDiscountActive && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-red-600/20 via-rose-600/15 to-transparent border border-red-500/30 text-xs text-rose-200 flex items-center gap-2">
                          <ArrowDown className="w-4 h-4 text-red-400 stroke-[3] flex-shrink-0 animate-bounce" />
                          <div>
                            <span className="font-black text-white block">
                              Gatilho de Urgência Ativo: Redução de -{discountPct}%!
                            </span>
                            <span className="text-[10.5px] text-rose-300">
                              O anúncio exibirá o selo vermelho de <strong>{discountPct}% OFF</strong> no catálogo da CellHub Shop.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Descrição e Detalhes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Descrição do Produto
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva as qualidades, acabamento, botões metalizados e proteção da capinha..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>

              {/* Garantia e Política de Frete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00D287]" /> Garantia (Dias)
                  </label>
                  <input
                    type="number"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(Number(e.target.value) || 90)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Política de Frete</label>
                  <select
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value as ShippingPolicy)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                  >
                    <option value="frete_gratis">Frete Grátis (CellHub Paga)</option>
                    <option value="comprador_paga">Frete Calculado no Checkout (Cliente Paga)</option>
                  </select>
                </div>
              </div>

              {/* Vínculo de Fornecedor & Origem do Frete (Melhor Envio) */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    Fornecedor de Origem (Dropshipping / Frete Automático)
                  </label>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/20">
                    Origem Melhor Envio
                  </span>
                </div>

                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Selecione o fornecedor deste produto...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.tag}] {s.name} — {s.city}/{s.state} (CEP {s.postalCode})
                    </option>
                  ))}
                </select>

                {(() => {
                  const sup = suppliers.find((s) => s.id === selectedSupplierId);
                  if (!sup) {
                    return (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Selecione o fornecedor responsável por despachar este produto. O endereço e CEP dele serão usados para calcular o frete exato de origem até o comprador.
                      </p>
                    );
                  }
                  return (
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Tag Vinculada: <span className="font-mono text-white">{sup.tag}</span>
                        </span>
                        <span className="text-[11px] text-slate-300 font-mono font-bold">
                          CEP Origem: {sup.postalCode}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Endereço de envio: {sup.street}, {sup.number} • {sup.neighborhood} • <strong>{sup.city} - {sup.state}</strong>
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Imagens do Produto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Fotos do Produto <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {images.length} foto{images.length !== 1 ? 's' : ''} adicionada{images.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Upload Fotos */}
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#00D287] bg-[#00D287]/15 scale-[1.01]'
                      : 'border-white/15 bg-slate-950/80 hover:border-[#00D287]/50 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center mb-2 shadow-md shadow-[#00D287]/10">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white text-center">
                    Clique para selecionar fotos do seu dispositivo
                  </span>
                  <span className="text-[11px] text-slate-400 text-center mt-0.5">
                    ou arraste e solte arquivos aqui (PNG, JPG, WEBP até 10MB)
                  </span>
                </label>

                {/* Inserir Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    placeholder="Ou cole o link direto da foto na web (URL) aqui..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#00D287] border border-[#00D287]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Link
                  </button>
                </div>

                {/* Galeria */}
                {images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] text-slate-400 font-semibold block">
                      Fotos selecionadas (clique na estrela para definir a capa):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group aspect-square rounded-xl overflow-hidden border bg-slate-950 transition-all ${
                            idx === 0 ? 'border-[#00D287] ring-2 ring-[#00D287]/30 shadow-lg' : 'border-white/10'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-contain p-1" />
                          
                          {idx === 0 && (
                            <div className="absolute top-1 left-1 bg-[#00D287] text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 z-10">
                              <Star className="w-2.5 h-2.5 fill-slate-950" /> CAPA
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="p-1.5 rounded-lg bg-[#00D287] text-slate-950 hover:scale-105 transition-transform"
                                title="Definir como foto principal"
                              >
                                <Star className="w-3 h-3 fill-slate-950" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-rose-600 text-white hover:scale-105 transition-transform"
                              title="Remover foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Visualização Prévia */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  {images[0] && (
                    <img src={images[0]} alt="" className="w-20 h-20 rounded-xl object-contain bg-slate-900 border border-white/5" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">{title}</h4>
                    <p className="text-xs text-slate-400">{category} • {condition}</p>
                    <p className="text-base font-black text-[#00D287] mt-1">
                      R$ {parsedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                {enableCompatibility && (
                  <div className="pt-2 border-t border-white/10 text-xs">
                    <span className="text-slate-400 block mb-1">
                      Marca: <strong className="text-white">{selectedBrand}</strong> • Modelos compatíveis:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {(selectedBrand === 'Apple' ? selectedAppleModels : manualModels).map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-200 text-[10.5px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b574] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>Cadastrando...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publicar no Catálogo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
