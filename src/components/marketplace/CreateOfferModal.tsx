import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Truck, 
  Tag, 
  Eye, 
  Layers,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Box,
  Scale,
  Edit3,
  Check
} from 'lucide-react';
import { 
  OfferCategory, 
  OfferCondition, 
  MarketplaceOffer,
  ShippingPolicy,
  ShippingAddress,
  CategoryPackageDefault
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService } from '@/services/melhorEnvioService';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CreateOfferModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES: OfferCategory[] = [
  'Celulares',
  'Peças',
  'Telas',
  'Baterias',
  'Conectores',
  'Acessórios',
  'Ferramentas',
  'Máquinas',
  'Eletrônicos',
  'Componentes',
  'Lotes',
  'Outros'
];

const CONDITIONS: OfferCondition[] = [
  'Novo',
  'Seminovo',
  'Usado',
  'Recondicionado',
  'Com avaria',
  'Para retirada de peças',
  'Outro'
];

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  currentUser,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState<'form' | 'preview'>('form');

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OfferCategory>('Celulares');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  
  // Shipping Policy
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>('comprador_paga');

  // Packaging & Dimensions
  const [packageDefaults, setPackageDefaults] = useState<CategoryPackageDefault[]>([]);
  const [packageWeight, setPackageWeight] = useState<number>(0.5); // kg
  const [packageHeight, setPackageHeight] = useState<number>(8);   // cm
  const [packageWidth, setPackageWidth] = useState<number>(15);    // cm
  const [packageLength, setPackageLength] = useState<number>(20);  // cm
  const [customDimensionsOpen, setCustomDimensionsOpen] = useState(false);

  // Seller Origin Address
  const [originAddress, setOriginAddress] = useState<ShippingAddress>({
    zipCode: currentUser.shippingZipCode || '',
    street: currentUser.shippingStreet || '',
    number: currentUser.shippingNumber || '',
    complement: currentUser.shippingComplement || '',
    neighborhood: currentUser.shippingNeighborhood || '',
    city: currentUser.shippingCity || '',
    state: currentUser.shippingState || '',
    phone: currentUser.whatsapp || currentUser.shippingPhone || '',
    name: currentUser.ownerName || currentUser.companyName || '',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [hasSavedOrigin, setHasSavedOrigin] = useState(false);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load package defaults & seller origin address
  useEffect(() => {
    melhorEnvioService.getPackageDefaults().then((defs) => {
      setPackageDefaults(defs);
      applyCategoryDefaults('Celulares', defs);
    });

    marketplaceService.getSellerOriginAddress(currentUser.id).then((saved) => {
      if (saved && saved.zipCode) {
        setOriginAddress(saved);
        setHasSavedOrigin(true);
      } else {
        setIsEditingAddress(true);
      }
    });
  }, [currentUser.id]);

  // Apply default dimensions when category changes
  const applyCategoryDefaults = (selectedCat: OfferCategory, defsList = packageDefaults) => {
    const found = defsList.find(
      (d) => d.category.toLowerCase() === selectedCat.toLowerCase() ||
             d.id.toLowerCase() === selectedCat.toLowerCase()
    );
    if (found) {
      setPackageWeight(found.default_weight);
      setPackageHeight(found.default_height);
      setPackageWidth(found.default_width);
      setPackageLength(found.default_length);
    }
  };

  const handleCategoryChange = (newCat: OfferCategory) => {
    setCategory(newCat);
    applyCategoryDefaults(newCat);
  };

  // Quick Preset Sample Images for testing
  const addQuickPresetPhotos = () => {
    const presets = [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=60',
    ];
    setImages(presets);
    toast.success('3 fotos demonstrativas adicionadas!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`A foto ${file.name} excede o limite de 8MB.`);
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
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      toast.error('Insira uma URL válida de imagem começando com https://');
      return;
    }
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    toast.success('Imagem adicionada com sucesso!');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Auto-complete address via ViaCEP
  const handleCepLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    setOriginAddress((prev) => ({ ...prev, zipCode: clean }));
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setOriginAddress((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          toast.success('Endereço localizado via CEP!');
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err);
      }
    }
  };

  // Validation
  const validateForm = (): boolean => {
    if (!title.trim() || title.length < 5) {
      toast.error('Informe um título com pelo menos 5 caracteres.');
      return false;
    }

    if (images.length < 3) {
      toast.error(`Para garantir a confiabilidade na rede de lojistas, adicione no mínimo 3 fotos do produto. (Atualmente: ${images.length})`);
      return false;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Informe um valor numérico válido para a oferta.');
      return false;
    }

    if (!description.trim() || description.length < 10) {
      toast.error('Informe uma descrição detalhada com pelo menos 10 caracteres.');
      return false;
    }

    const cleanCep = (originAddress.zipCode || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('Informe um CEP de origem válido com 8 dígitos para a cotação de frete.');
      return false;
    }

    if (!originAddress.street.trim() || !originAddress.number.trim() || !originAddress.city.trim() || !originAddress.state.trim()) {
      toast.error('Complete todos os campos obrigatórios do endereço de envio de origem.');
      return false;
    }

    return true;
  };

  const handleGoToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Auto-save address to user profile
      marketplaceService.saveSellerOriginAddress(currentUser.id, originAddress);
      setHasSavedOrigin(true);
      setIsEditingAddress(false);
      setStep('preview');
    }
  };

  const handlePublishOffer = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const parsedPrice = parseFloat(price.replace(',', '.'));
    const isFree = shippingPolicy === 'frete_gratis';

    // Save origin address to seller profile permanently
    await marketplaceService.saveSellerOriginAddress(currentUser.id, originAddress);

    const result = await marketplaceService.createOffer({
      sellerId: currentUser.id,
      sellerCompany: currentUser.tradeName || currentUser.companyName,
      sellerOwner: currentUser.ownerName,
      sellerEmail: currentUser.email,
      sellerCnpj: currentUser.cnpj,
      title: title.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      condition,
      description: description.trim(),
      details: details.trim() || undefined,
      price: parsedPrice,
      freeShipping: isFree,
      shippingCost: 0,
      shippingPolicy,
      packageWeight: Number(packageWeight) || 0.5,
      packageHeight: Number(packageHeight) || 8,
      packageWidth: Number(packageWidth) || 15,
      packageLength: Number(packageLength) || 20,
      originZipCode: originAddress.zipCode.replace(/\D/g, ''),
      originStreet: originAddress.street.trim(),
      originNumber: originAddress.number.trim(),
      originComplement: originAddress.complement?.trim() || undefined,
      originNeighborhood: originAddress.neighborhood.trim(),
      originCity: originAddress.city.trim(),
      originState: originAddress.state.trim().toUpperCase(),
      images,
      status: 'publicada',
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Super Oferta publicada com sucesso na rede de lojistas!');
      onCreated();
      onClose();
    } else {
      toast.error(result.error || 'Erro ao publicar oferta.');
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#070b16] border border-[#00D287]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080c17]/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Criar Super Oferta B2B
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Venda celulares, peças ou equipamentos diretamente para outros lojistas com frete Melhor Envio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className={`px-2.5 py-1 rounded-md font-semibold ${step === 'form' ? 'bg-[#00D287]/20 text-[#00D287]' : 'text-slate-500'}`}>
                1. Produto & Frete
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded-md font-semibold ${step === 'preview' ? 'bg-[#00D287]/20 text-[#00D287]' : 'text-slate-500'}`}>
                2. Revisão & Publicação
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-white text-sm">
          {step === 'form' ? (
            <form onSubmit={handleGoToPreview} className="space-y-6">
              {/* Fotos (Mínimo 3) */}
              <div className="bg-[#0b1020] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Fotos do Produto <span className="text-rose-400">* (mínimo 3)</span>
                    </label>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${images.length >= 3 ? 'bg-[#00D287]/20 text-[#00D287]' : 'bg-rose-500/20 text-rose-400'}`}>
                      {images.length}/3 fotos
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addQuickPresetPhotos}
                    className="text-xs text-[#00D287] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Preencher 3 fotos de teste
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black/40">
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-rose-400 opacity-90 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00D287] text-black">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}

                  <label className="aspect-square rounded-xl border border-dashed border-white/20 hover:border-[#00D287] bg-white/[0.02] hover:bg-[#00D287]/5 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-400 text-center px-1">Upload</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou cole o link direto de uma foto (https://...)"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="bg-[#0b1020] border border-white/5 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Informações da Oferta
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Título da Oferta *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: iPhone 13 Pro 128GB Bateria 91% Impecável com Caixa"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Categoria *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as OfferCategory)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#00D287] outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Subcategoria / Modelo
                    </label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="Ex: Apple, Samsung, Mechanic"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Condição *
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as OfferCondition)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#00D287] outline-none"
                    >
                      {CONDITIONS.map((cond) => (
                        <option key={cond} value={cond} className="bg-slate-900 text-white">
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Preço de Venda à Vista (R$) *
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ex: 1450.00"
                      className="w-full bg-black/40 border border-[#00D287]/40 rounded-xl px-3.5 py-2.5 text-base font-bold text-[#00D287] placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Detalhes Técnicos / Part Number / Garantia
                    </label>
                    <input
                      type="text"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Ex: Garantia 90 dias, IMEI limpo, sem marcas"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Descrição Completa da Oferta *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o estado do produto, funcionamento, itens inclusos e detalhes para o lojista comprador..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none resize-none"
                    required
                  />
                </div>
              </div>

              {/* Política de Frete & Logística do Melhor Envio */}
              <div className="bg-[#0b1020] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#00D287]" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Política de Frete & Logística (Melhor Envio)
                    </h3>
                  </div>
                </div>

                {/* Opções de Frete */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingPolicy('comprador_paga')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      shippingPolicy === 'comprador_paga'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white shadow-lg shadow-[#00D287]/10'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${shippingPolicy === 'comprador_paga' ? 'border-[#00D287] bg-[#00D287]' : 'border-slate-500'}`}>
                      {shippingPolicy === 'comprador_paga' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Comprador paga o frete</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        O comprador escolhe PAC, SEDEX ou Jadlog no checkout e paga o frete junto com o produto.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingPolicy('frete_gratis')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      shippingPolicy === 'frete_gratis'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white shadow-lg shadow-[#00D287]/10'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${shippingPolicy === 'frete_gratis' ? 'border-[#00D287] bg-[#00D287]' : 'border-slate-500'}`}>
                      {shippingPolicy === 'frete_gratis' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#00D287]">Frete Grátis</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        O comprador paga apenas o produto. O custo da etiqueta é descontado do seu repasse líquido.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Dimensões e Embalagem Conservadora Automática */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        Dimensões da Embalagem para Cotação (Padrão: {category})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomDimensionsOpen(!customDimensionsOpen)}
                      className="text-xs text-[#00D287] hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {customDimensionsOpen ? 'Usar padrão da categoria' : 'Personalizar medidas'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    O sistema aplica automaticamente medidas conservadoras para evitar cobranças excedentes no Melhor Envio.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        disabled={!customDimensionsOpen}
                        value={packageWeight}
                        onChange={(e) => setPackageWeight(parseFloat(e.target.value) || 0.1)}
                        className={`w-full bg-black/60 border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none ${customDimensionsOpen ? 'border-[#00D287]' : 'border-white/10 opacity-80'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Altura (cm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="2"
                        disabled={!customDimensionsOpen}
                        value={packageHeight}
                        onChange={(e) => setPackageHeight(parseInt(e.target.value) || 2)}
                        className={`w-full bg-black/60 border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none ${customDimensionsOpen ? 'border-[#00D287]' : 'border-white/10 opacity-80'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Largura (cm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="10"
                        disabled={!customDimensionsOpen}
                        value={packageWidth}
                        onChange={(e) => setPackageWidth(parseInt(e.target.value) || 10)}
                        className={`w-full bg-black/60 border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none ${customDimensionsOpen ? 'border-[#00D287]' : 'border-white/10 opacity-80'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Comprimento (cm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="15"
                        disabled={!customDimensionsOpen}
                        value={packageLength}
                        onChange={(e) => setPackageLength(parseInt(e.target.value) || 15)}
                        className={`w-full bg-black/60 border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none ${customDimensionsOpen ? 'border-[#00D287]' : 'border-white/10 opacity-80'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço de Origem (Remetente) */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00D287]" />
                      <span className="text-xs font-semibold text-slate-200">
                        Endereço de Origem (Local de Coleta/Postagem)
                      </span>
                    </div>

                    {hasSavedOrigin && !isEditingAddress && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className="text-xs text-[#00D287] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Alterar endereço
                      </button>
                    )}
                  </div>

                  {hasSavedOrigin && !isEditingAddress ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs text-slate-300 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {originAddress.street}, {originAddress.number} {originAddress.complement ? `(${originAddress.complement})` : ''}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {originAddress.neighborhood} - {originAddress.city}/{originAddress.state} • CEP: {originAddress.zipCode}
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-[#00D287]/15 text-[#00D287] rounded-md text-[10px] font-bold">
                        Reutilizado
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <p className="text-[11px] text-slate-400">
                        Este endereço será salvo no seu perfil de lojista e reutilizado nas próximas ofertas automaticamente.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            CEP de Origem *
                          </label>
                          <input
                            type="text"
                            maxLength={9}
                            value={originAddress.zipCode}
                            onChange={(e) => handleCepLookup(e.target.value)}
                            placeholder="00000-000"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Rua / Avenida *
                          </label>
                          <input
                            type="text"
                            value={originAddress.street}
                            onChange={(e) => setOriginAddress({ ...originAddress, street: e.target.value })}
                            placeholder="Ex: Rua Santa Ifigênia"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Número *
                          </label>
                          <input
                            type="text"
                            value={originAddress.number}
                            onChange={(e) => setOriginAddress({ ...originAddress, number: e.target.value })}
                            placeholder="123"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Complemento
                          </label>
                          <input
                            type="text"
                            value={originAddress.complement}
                            onChange={(e) => setOriginAddress({ ...originAddress, complement: e.target.value })}
                            placeholder="Sala 4"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Bairro *
                          </label>
                          <input
                            type="text"
                            value={originAddress.neighborhood}
                            onChange={(e) => setOriginAddress({ ...originAddress, neighborhood: e.target.value })}
                            placeholder="Centro"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Cidade / UF *
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={originAddress.city}
                              onChange={(e) => setOriginAddress({ ...originAddress, city: e.target.value })}
                              placeholder="São Paulo"
                              className="w-2/3 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                            />
                            <input
                              type="text"
                              maxLength={2}
                              value={originAddress.state}
                              onChange={(e) => setOriginAddress({ ...originAddress, state: e.target.value.toUpperCase() })}
                              placeholder="SP"
                              className="w-1/3 bg-black/60 border border-white/10 rounded-lg px-1.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Avanço */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00D287]/90 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all"
                >
                  Revisar Oferta
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* ETAPA 2: PREVIEW */
            <div className="space-y-6">
              <div className="bg-[#0b1020] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex-shrink-0">
                    <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#00D287]/15 text-[#00D287]">
                        {category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/5 text-slate-300">
                        {condition}
                      </span>
                      {shippingPolicy === 'frete_gratis' && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400">
                          Frete Grátis
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white leading-tight">
                      {title}
                    </h3>

                    <div className="text-xl font-extrabold text-[#00D287]">
                      {formatBRL(parseFloat(price.replace(',', '.')) || 0)}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Resumo de Logística do Envio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs text-slate-300">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Origem de Postagem</div>
                    <div className="font-semibold text-white">{originAddress.street}, {originAddress.number}</div>
                    <div className="text-slate-400">{originAddress.city}/{originAddress.state} • CEP {originAddress.zipCode}</div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Embalagem de Cotação</div>
                    <div className="font-semibold text-white">{packageWeight} kg • {packageLength}x{packageWidth}x{packageHeight} cm</div>
                    <div className="text-slate-400">
                      Política: {shippingPolicy === 'frete_gratis' ? 'Frete Grátis (Vendedor assume)' : 'Cliente paga o frete no checkout'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Confirmação */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-5 py-2.5 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar e Editar
                </button>

                <button
                  type="button"
                  onClick={handlePublishOffer}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00D287]/90 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Publicando Oferta...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Publicar Oferta no Marketplace
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
