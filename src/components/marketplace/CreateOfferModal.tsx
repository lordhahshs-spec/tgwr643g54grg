import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { 
  OfferCategory, 
  OfferCondition, 
  MarketplaceOffer 
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
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
  const [category, setCategory] = useState<OfferCategory>('Peças');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState<OfferCondition>('Novo');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [freeShipping, setFreeShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Preset Sample Images for fast testing
  const addQuickPresetPhotos = () => {
    const presets = [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=60',
    ];
    setImages(presets);
    toast.success('3 fotos demonstrativas adicionadas!');
  };

  // Handle local image file upload
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

  // Validation
  const validateForm = (): boolean => {
    if (!title.trim() || title.length < 5) {
      toast.error('Informe um título com pelo menos 5 caracteres.');
      return false;
    }

    if (images.length < 3) {
      toast.error(`Para garantir a transparência B2B, adicione no mínimo 3 fotos do produto. (Atualmente: ${images.length})`);
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

    return true;
  };

  const handleGoToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('preview');
    }
  };

  const handlePublishOffer = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const parsedPrice = parseFloat(price.replace(',', '.'));
    const parsedShipping = freeShipping ? 0 : parseFloat(shippingCost.replace(',', '.') || '0');

    const result = await marketplaceService.createOffer({
      sellerId: currentUser.id,
      sellerCompany: currentUser.companyName,
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
      freeShipping,
      shippingCost: parsedShipping,
      images,
      status: 'publicada',
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Super Oferta B2B publicada com sucesso na rede de lojistas!');
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
                Venda peças, lotes ou equipamentos diretamente para outros lojistas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className={`px-2.5 py-1 rounded-md font-semibold ${step === 'form' ? 'bg-[#00D287]/20 text-[#00D287]' : 'text-slate-500'}`}>
                1. Dados & Fotos
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

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 'form' ? (
            <form onSubmit={handleGoToPreview} className="space-y-6">
              {/* Fotos Obrigatórias (Mínimo 3) */}
              <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-[#00D287]" />
                      Fotos Reais do Produto (Formato 9:16 Vertical / Stories)
                      <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                        images.length >= 3
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {images.length}/3 fotos mínimas
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proporção recomendada: <strong className="text-white">9:16 (Vertical / Stories de Celular)</strong>. As fotos devem ser nítidas e enquadradas sem distorção.
                    </p>
                  </div>
                </div>

                {/* Image Previews Grid with 9:16 Aspect Ratio */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-white/10 group"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover object-center" />
                      <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                        #{idx + 1} • 9:16
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-opacity"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Card (File upload) */}
                  <label className="relative aspect-[9/16] rounded-xl border-2 border-dashed border-[#00D287]/40 hover:border-[#00D287] bg-[#00D287]/5 hover:bg-[#00D287]/10 flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Plus className="w-6 h-6 text-[#00D287] mb-1" />
                    <span className="text-xs font-bold text-white">Adicionar Foto</span>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1">Formato 9:16</span>
                    <span className="text-[9px] text-slate-500">ou arraste arquivo</span>
                  </label>
                </div>

                {/* Add Image via URL */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou cole a URL direta de uma foto (https://...)"
                    className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#00D287]/20 text-slate-200 hover:text-[#00D287] border border-white/10 text-xs font-semibold transition-colors"
                  >
                    Adicionar URL
                  </button>
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Título da Oferta *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Lote 10x Telas OLED iPhone 13 Pro Grade A+ ou Estação de Solda Sugon"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-slate-200 focus:border-[#00D287] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subcategoria / Modelo / Marca (opcional)
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Ex: Apple, Xiaomi, Estação de Ar, etc."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Condição do Item *
                  </label>
                  <select
                    value={condition}
                    onChange={(e: any) => setCondition(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-slate-200 focus:border-[#00D287] focus:outline-none"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preço Lojista (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 850,00"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-sm text-white font-bold placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                  />
                </div>
              </div>

              {/* Frete */}
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#00D287] flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Modalidade de Envio</h4>
                    <p className="text-[11px] text-slate-400">Defina se o frete é por sua conta ou do lojista comprador</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={freeShipping}
                      onChange={(e) => setFreeShipping(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00D287] focus:ring-0 bg-slate-900 border-white/20"
                    />
                    <span>Oferecer Frete Grátis</span>
                  </label>

                  {!freeShipping && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">R$</span>
                      <input
                        type="text"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        placeholder="Valor do frete"
                        className="w-24 rounded-lg bg-slate-950 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-[#00D287] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição e Especificações */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descrição Detalhada do Produto *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o estado do item, histórico, garantia para outros lojistas, tempo de uso, testes realizados..."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:border-[#00D287] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Detalhes Técnicos / Conteúdo do Lote (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Ex: Part Number, voltagem 220V, quantidade exata de peças no pacote, etc."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-[#00D287] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Form Action */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#00D287]/20"
                >
                  <span>Revisar Oferta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: PREVIEW */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00D287]" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Revisão Pré-Publicação</h4>
                    <p className="text-xs text-slate-300">Confira como os outros lojistas verão sua oferta na vitrine B2B.</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Editar Dados
                </button>
              </div>

              {/* Preview Card Showcase */}
              <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Preview Story (9:16)</span>
                  <div className="w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative shadow-xl">
                    <img src={images[0]} alt="" className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 p-3 text-left space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">{title}</h4>
                      <div className="text-sm font-black text-[#00D287]">
                        {formatBRL(parseFloat(price.replace(',', '.')) || 0)}
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {freeShipping ? 'Frete grátis' : shippingCost ? `+ ${shippingCost} frete` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser.companyName}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 overflow-x-auto max-w-full">
                    {images.map((img, idx) => (
                      <div key={idx} className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover object-center" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="flex gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-[#00D287] font-bold">
                      {condition}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300">
                      {category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{title}</h3>

                  <div className="text-2xl font-black text-[#00D287]">
                    {formatBRL(parseFloat(price.replace(',', '.')) || 0)}
                  </div>

                  <div className="text-xs text-slate-400">
                    {freeShipping ? '✓ Frete Grátis incluso' : `+ Frete de ${shippingCost || 'R$ 0,00'}`}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 whitespace-pre-line">
                    {description}
                  </div>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    Vendedor: <span className="text-slate-200 font-semibold">{currentUser.companyName}</span> ({currentUser.ownerName})
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Voltar e alterar
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePublishOffer}
                  className="px-8 py-3 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-lg shadow-[#00D287]/25 flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? 'Publicando...' : 'Confirmar e Publicar Agora'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
