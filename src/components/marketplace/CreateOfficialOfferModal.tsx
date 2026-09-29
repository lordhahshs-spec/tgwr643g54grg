import React, { useState, useEffect } from 'react';
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
  Sliders
} from 'lucide-react';
import { 
  OfferCategory, 
  OfferCondition, 
  ShippingPolicy,
  CategoryPackageDefault
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService } from '@/services/melhorEnvioService';
import { pricingRulesService, OFFICIAL_CATEGORIES } from '@/services/pricingRulesService';
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
  const [category, setCategory] = useState<OfferCategory>('Celulares');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  
  // Pricing Mode & Margins
  const [pricingMode, setPricingMode] = useState<'margin' | 'manual'>('margin');
  const [marginPercent, setMarginPercent] = useState<number>(15);
  const [price, setPrice] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [badgeText, setBadgeText] = useState('Garantia Oficial CellHub');

  // Shipping
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>('comprador_paga');
  const [packageWeight, setPackageWeight] = useState<number>(0.5);
  const [packageHeight, setPackageHeight] = useState<number>(8);
  const [packageWidth, setPackageWidth] = useState<number>(15);
  const [packageLength, setPackageLength] = useState<number>(20);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoriesList, setCategoriesList] = useState<string[]>(() => pricingRulesService.getCategories());

  // Auto-update default suggested margin when Category, Condition or Title changes
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
  }, [category]);

  useEffect(() => {
    melhorEnvioService.getPackageDefaults().then((defs) => {
      const match = defs.find((d) => d.category.toLowerCase() === 'celulares');
      if (match) {
        setPackageWeight(match.default_weight);
        setPackageHeight(match.default_height);
        setPackageWidth(match.default_width);
        setPackageLength(match.default_length);
      }
    });
  }, []);

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

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    try {
      new URL(imageUrlInput.trim());
      if (images.includes(imageUrlInput.trim())) {
        toast.info('Essa imagem já foi adicionada.');
        return;
      }
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput('');
    } catch {
      toast.error('Insira uma URL válida de imagem.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const parsedPrice = parseFloat(price) || 0;
  const parsedCost = parseFloat(supplierCost) || 0;
  const profitMargin = parsedPrice - parsedCost;
  const profitPercent = parsedCost > 0 ? ((profitMargin / parsedCost) * 100).toFixed(1) : '0';

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
    return true;
  };

  const handleSubmit = async () => {
    if (!handleValidateForm()) return;

    setIsSubmitting(true);
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
        description: description.trim() || 'Produto verificado com garantia técnica CellHub Shop.',
        details: details.trim() || undefined,
        price: parsedPrice,
        supplierCost: parsedCost > 0 ? parsedCost : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090e1c] border border-[#00D287]/30 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cadastrar Produto Oficial</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30">
                  CELLHUB SHOP
                </span>
              </div>
              <p className="text-xs text-slate-400">Catálogo Atacado com 90 dias de garantia e dropshipping</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
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
                    placeholder="Ex: iPhone 14 Pro Max 256GB Deep Purple - Impecável"
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
                          placeholder="Ex: 4700.00"
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
                          placeholder="Ex: 5890.00"
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
                          placeholder="Ex: 4700.00"
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

              {/* Imagens do Produto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Fotos do Produto <span className="text-rose-400">*</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    placeholder="Cole o link da imagem (URL) e clique em Adicionar"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#00D287] border border-[#00D287]/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição Detalhada</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes como estado estético, bateria, acessórios inclusos e notas técnicas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
                />
              </div>
            </>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex gap-4">
                <img
                  src={images[0]}
                  alt=""
                  className="w-24 h-24 rounded-xl object-cover bg-slate-900 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D287]/20 text-[#00D287]">
                    OFICIAL CELLHUB SHOP
                  </span>
                  <h4 className="text-sm font-bold text-white">{title}</h4>
                  <p className="text-xs text-slate-400">{category} • {condition}</p>
                  <div className="text-base font-black text-[#00D287]">
                    R$ {parsedPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Salvando Produto...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cadastrar na CellHub Shop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
