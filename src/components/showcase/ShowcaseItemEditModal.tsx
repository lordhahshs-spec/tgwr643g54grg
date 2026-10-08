import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Camera,
  Upload,
  Trash2,
  Check,
  Smartphone,
  ShieldCheck,
  BatteryCharging,
  Package,
  Layers,
  HelpCircle,
  Tag,
  DollarSign
} from 'lucide-react';
import { ShowcaseItem } from '@/types/showcase';
import { toast } from 'sonner';

interface ShowcaseItemEditModalProps {
  storeId: string;
  item: ShowcaseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<ShowcaseItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
}

export const ShowcaseItemEditModal: React.FC<ShowcaseItemEditModalProps> = ({
  storeId,
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState('Smartphones');
  const [condition, setCondition] = useState('Seminovo Impecável');
  const [price, setPrice] = useState<string>('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState<string>('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [includesAccessories, setIncludesAccessories] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('90');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'available' | 'reserved' | 'sold'>('available');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setBrand(item.brand || 'Apple');
      setCategory(item.category || 'Smartphones');
      setCondition(item.condition || 'Seminovo Impecável');
      setPrice(item.price ? String(item.price) : '');
      setPriceOnRequest(Boolean(item.priceOnRequest));
      setBatteryHealth(item.batteryHealth ? String(item.batteryHealth) : '');
      setStorage(item.storage || '128GB');
      setColor(item.color || '');
      setIncludesAccessories(item.includesAccessories || '');
      setWarrantyDays(item.warrantyDays ? String(item.warrantyDays) : '90');
      setDescription(item.description || '');
      setStatus(item.status || 'available');
      setImages(item.images || []);
    } else {
      // Novo Item
      setTitle('');
      setBrand('Apple');
      setCategory('Smartphones');
      setCondition('Seminovo Impecável');
      setPrice('');
      setPriceOnRequest(false);
      setBatteryHealth('88');
      setStorage('128GB');
      setColor('');
      setIncludesAccessories('Acompanha caixa original e carregador');
      setWarrantyDays('90');
      setDescription('');
      setStatus('available');
      setImages([]);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  // Upload de arquivos do dispositivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione arquivos de imagem.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success('Foto(s) adicionada(s) com sucesso!');
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    toast.success('Imagem adicionada via link!');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Informe o nome ou modelo do aparelho.');
      return;
    }

    if (!priceOnRequest && (!price || Number(price) <= 0)) {
      toast.error('Informe o preço ou marque a opção "Preço a Combinar".');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        id: item?.id,
        storeId,
        title: title.trim(),
        brand,
        category,
        condition,
        images,
        price: priceOnRequest ? 0 : Number(price),
        priceOnRequest,
        batteryHealth: batteryHealth ? parseInt(batteryHealth, 10) : undefined,
        storage: storage.trim(),
        color: color.trim(),
        includesAccessories: includesAccessories.trim(),
        warrantyDays: warrantyDays ? parseInt(warrantyDays, 10) : 90,
        description: description.trim(),
        status,
      });

      toast.success(item ? 'Aparelho atualizado na vitrine!' : 'Aparelho adicionado à sua vitrine!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar aparelho.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Header Minimalista em Tela Cheia */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D287]" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#00D287]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-none">
                {item ? 'Editar Aparelho na Vitrine' : 'Novo Aparelho na Vitrine'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                Fotos reais e detalhes para seu cliente escolher no WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Aparelho</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Dados Principais e Fotos (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Fotos Reais do Aparelho */}
              <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#00D287]" /> Fotos Reais do Aparelho
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tire fotos da tela, laterais e traseira. Fotos reais aumentam as conversões em até 3x!
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#00D287]">
                    {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl bg-[#00D287]/20 hover:bg-[#00D287]/30 border border-[#00D287]/40 text-[#00D287] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload do Celular / PC</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2 min-w-[200px]">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Ou cole o link de uma imagem (URL)..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Preview Grid */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-white/10 group"
                      >
                        <img
                          src={img}
                          alt={`Aparelho ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#00D287] text-slate-950 shadow-md">
                            Capa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-white/10 text-center space-y-2 bg-slate-950/40">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Nenhuma foto adicionada ainda. Clique em "Upload do Celular / PC" para selecionar fotos da galeria.
                    </p>
                  </div>
                )}
              </section>

              {/* Informações Principais do Aparelho */}
              <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#00D287]" /> Identificação do Aparelho
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Título / Nome do Aparelho *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: iPhone 13 128GB Azul Meia-Noite"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Marca
                    </label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D287]"
                    >
                      <option value="Apple">Apple (iPhone)</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi / Poco / Redmi</option>
                      <option value="Motorola">Motorola</option>
                      <option value="Realme">Realme</option>
                      <option value="Outros">Outras Marcas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Categoria na Vitrine
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D287]"
                    >
                      <option value="Smartphones">Smartphones / Celulares</option>
                      <option value="iPhones">iPhones</option>
                      <option value="Android">Android</option>
                      <option value="Tablets / iPads">Tablets / iPads</option>
                      <option value="Smartwatches">Smartwatches / Apple Watch</option>
                      <option value="Acessórios">Acessórios</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Condição de Uso *
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D287]"
                    >
                      <option value="Novo Lacrado">✨ Novo Lacrado na Caixa</option>
                      <option value="Seminovo Impecável">🌟 Seminovo Impecável (Grade A+)</option>
                      <option value="Seminovo Bom">👍 Seminovo Bom Estado (Grade A)</option>
                      <option value="Usado com Marcas">👌 Usado (com pequenas marcas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Armazenamento
                    </label>
                    <input
                      type="text"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      placeholder="Ex: 128GB, 256GB, 64GB"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-[#00D287]" /> Saúde da Bateria (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(e.target.value)}
                      placeholder="Ex: 89 (opcional para iPhone)"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Cor do Aparelho
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ex: Grafite, Estelar, Preto"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </section>

              {/* Detalhes de Garantia & Acessórios */}
              <section className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00D287]" /> Garantia & Itens Inclusos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Garantia da Loja (Dias)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(e.target.value)}
                      placeholder="90"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      O Que Acompanha?
                    </label>
                    <input
                      type="text"
                      value={includesAccessories}
                      onChange={(e) => setIncludesAccessories(e.target.value)}
                      placeholder="Ex: Caixa, cabo original e carregador"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Descrição Adicional / Observações (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Aparelho impecável de único dono, nunca foi aberto, com película 3D aplicada..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Coluna Direita: Preço & Status de Venda (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card de Preço & Negociação */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <DollarSign className="w-4 h-4 text-[#00D287]" /> Preço de Venda
                </span>

                {/* Opção Preço a Combinar */}
                <label className="p-3.5 rounded-xl border border-white/10 bg-slate-950/80 flex items-start gap-3 cursor-pointer hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={priceOnRequest}
                    onChange={(e) => setPriceOnRequest(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-[#00D287] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Preço a Combinar no WhatsApp
                    </span>
                    <span className="text-[11px] text-slate-400">
                      O cliente verá "Preço sob consulta" e combinará com você direto no WhatsApp.
                    </span>
                  </div>
                </label>

                {!priceOnRequest && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Valor do Aparelho (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00D287]">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required={!priceOnRequest}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="2.450,00"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status de Disponibilidade */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-3 shadow-sm">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <Package className="w-4 h-4 text-[#00D287]" /> Disponibilidade
                </span>

                <div className="space-y-2">
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${status === 'available' ? 'border-[#00D287] bg-[#00D287]/10 text-white' : 'border-white/10 bg-slate-950 text-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'available'}
                        onChange={() => setStatus('available')}
                        className="accent-[#00D287]"
                      />
                      <span className="text-xs font-bold">🟢 Disponível para Venda</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${status === 'reserved' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-white/10 bg-slate-950 text-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'reserved'}
                        onChange={() => setStatus('reserved')}
                        className="accent-amber-500"
                      />
                      <span className="text-xs font-bold">🟡 Reservado para Cliente</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${status === 'sold' ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-white/10 bg-slate-950 text-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'sold'}
                        onChange={() => setStatus('sold')}
                        className="accent-rose-500"
                      />
                      <span className="text-xs font-bold">🔴 Vendido</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-xl shadow-[#00D287]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Salvando Aparelho...</span>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Salvar na Vitrine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
