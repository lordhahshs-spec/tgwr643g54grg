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
  Clock
} from 'lucide-react';
import { 
  OfferCategory, 
  OfferCondition, 
  ShippingPolicy,
  CategoryPackageDefault
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService } from '@/services/melhorEnvioService';
import { UserAccount } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CreateOfficialOfferModalProps {
  isOpen?: boolean;
  currentUser: UserAccount;
  onClose: () => void;
  onCreated?: () => void;
  onOfferCreated?: () => void;
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
  
  // Pricing & Margins
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

  // Cálculo de Margem de Lucro do Dropshipping
  const parsedPrice = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
  const parsedCost = parseFloat(supplierCost.replace(/\./g, '').replace(',', '.')) || 0;
  const profitMargin = parsedPrice > 0 ? parsedPrice - parsedCost : 0;
  const profitPercent = parsedPrice > 0 ? Math.round((profitMargin / parsedPrice) * 100) : 0;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Informe o título do produto.');
      return;
    }
    if (parsedPrice <= 0) {
      toast.error('Informe o preço de venda da oferta.');
      return;
    }
    if (images.length === 0) {
      toast.error('Adicione ao menos 1 foto do produto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await marketplaceService.createOffer({
        sellerId: currentUser.id,
        sellerCompany: 'CellHub Oficial',
        sellerOwner: 'Equipe CellHub',
        sellerEmail: 'contato@cellhub.shop',
        title: title.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        condition,
        description: description.trim() || `${title} com Envio e Garantia Oficial CellHub.`,
        details: details.trim() || undefined,
        price: parsedPrice,
        freeShipping: shippingPolicy === 'frete_gratis',
        shippingPolicy,
        packageWeight,
        packageHeight,
        packageWidth,
        packageLength,
        images,
        status: 'publicada',
        isOfficial: true,
        supplierCost: parsedCost,
        warrantyDays,
        badgeText,
      });

      if (res.success) {
        toast.success('Produto Oficial CellHub cadastrado no Catálogo com sucesso!');
        onCreated?.();
        onOfferCreated?.();
        onClose();
      } else {
        toast.error(res.error || 'Erro ao publicar oferta oficial.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao salvar oferta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#080c17] border border-[#00D287]/30 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#080c17] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00D287]/20 border border-[#00D287]/40 text-[#00D287] flex items-center justify-center shadow-md shadow-[#00D287]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Cadastrar Super Oferta Oficial
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/40">
                  Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Produto próprio / Dropshipping privado com envio e garantia CellHub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Informações Principais do Produto */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Título do Produto / Modelo <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: iPhone 15 Pro Max 256GB Titânio Natural - Lacrado"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-[#00D287] transition-colors"
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
                  {CATEGORIES.map((cat) => (
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

            {/* Preços e Margem Dropshipping */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-[#00D287]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#00D287]" />
                  Precificação & Margem de Lucro (Privado)
                </span>
                <span className="text-[10px] text-slate-400">O lead verá apenas o preço final de venda</span>
              </div>

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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-[#00D287] font-black text-sm focus:outline-none focus:border-[#00D287]"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-bold text-sm focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>

              {parsedCost > 0 && parsedPrice > parsedCost && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Margem Estimada CellHub:</span>
                  <span className="text-[#00D287] font-black">
                    + R$ {profitMargin.toFixed(2)} ({profitPercent}%)
                  </span>
                </div>
              )}
            </div>

            {/* Garantia e Selo de Confiança */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00D287]" /> Garantia (Dias)
                </label>
                <input
                  type="number"
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value) || 90)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Política de Frete</label>
                <select
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value as ShippingPolicy)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#00D287]"
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
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#00D287] border border-[#00D287]/30 text-xs font-bold flex items-center gap-1 transition-colors"
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
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-[#00D287] text-slate-950 uppercase">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição Completa */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Descrição & Detalhes Técnicos
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descreva as especificações, itens inclusos e detalhes do aparelho..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Publicando...' : 'Publicar Super Oferta Oficial'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
