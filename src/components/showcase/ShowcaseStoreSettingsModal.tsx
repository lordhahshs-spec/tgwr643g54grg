import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Building2,
  Phone,
  Camera,
  Check,
  MessageSquare,
  Sparkles,
  MapPin,
  Instagram
} from 'lucide-react';
import { StoreShowcaseSettings } from '@/types/showcase';
import { toast } from 'sonner';

interface ShowcaseStoreSettingsModalProps {
  settings: StoreShowcaseSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: StoreShowcaseSettings) => Promise<void>;
}

export const ShowcaseStoreSettingsModal: React.FC<ShowcaseStoreSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [storeLogoUrl, setStoreLogoUrl] = useState(settings.storeLogoUrl || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '');
  const [storeBio, setStoreBio] = useState(settings.storeBio || '');
  const [address, setAddress] = useState(settings.address || '');
  const [instagramUrl, setInstagramUrl] = useState(settings.instagramUrl || '');
  const [customMessageTemplate, setCustomMessageTemplate] = useState(settings.customMessageTemplate || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStoreName(settings.storeName || '');
      setStoreLogoUrl(settings.storeLogoUrl || '');
      setWhatsapp(settings.whatsapp || '');
      setStoreBio(settings.storeBio || '');
      setAddress(settings.address || '');
      setInstagramUrl(settings.instagramUrl || '');
      setCustomMessageTemplate(settings.customMessageTemplate || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setStoreLogoUrl(result);
        toast.success('Foto da loja carregada!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error('Informe o nome da sua loja.');
      return;
    }
    if (!whatsapp.trim()) {
      toast.error('Informe o WhatsApp para receber os pedidos dos clientes.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...settings,
        storeName: storeName.trim(),
        storeLogoUrl: storeLogoUrl.trim(),
        whatsapp: whatsapp.trim().replace(/\D/g, ''),
        storeBio: storeBio.trim(),
        address: address.trim(),
        instagramUrl: instagramUrl.trim(),
        customMessageTemplate: customMessageTemplate.trim(),
      });
      toast.success('Configurações da vitrine salvas com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Header Superior Minimalista */}
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
              <Building2 className="w-4 h-4 text-[#00D287]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-none">
                Configurações da Vitrine & WhatsApp
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                Personalize o nome, logotipo e o número que receberá os contatos dos clientes
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
                <span>Salvar Configurações</span>
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
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          
          {/* Foto / Logotipo da Loja */}
          <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-[#00D287]/40 overflow-hidden flex items-center justify-center shadow-lg">
                {storeLogoUrl ? (
                  <img
                    src={storeLogoUrl}
                    alt={storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-500" />
                )}
              </div>

              <label
                htmlFor="store-logo-upload"
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#00D287] text-slate-950 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Trocar logo da loja"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <input
                  id="store-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h3 className="text-sm font-bold text-white">Foto ou Logotipo da Loja</h3>
              <p className="text-xs text-slate-400">
                Esta imagem aparecerá no topo do catálogo que seus clientes verão ao abrir o link.
              </p>
              <div className="pt-1">
                <input
                  type="url"
                  value={storeLogoUrl}
                  onChange={(e) => setStoreLogoUrl(e.target.value)}
                  placeholder="Ou cole a URL direta da imagem..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                />
              </div>
            </div>
          </div>

          {/* Dados Cadastrais da Vitrine */}
          <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-4 shadow-sm">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Building2 className="w-4 h-4 text-[#00D287]" /> Identificação & Contato Oficial
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Cell Express SP"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00D287]" /> WhatsApp para Pedidos (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 11999999999"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#00D287]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Quando o cliente escolher um aparelho, o botão de compra abrirá este número diretamente.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bio / Apresentação da Loja (Visível no topo do catálogo)
                </label>
                <textarea
                  rows={2}
                  value={storeBio}
                  onChange={(e) => setStoreBio(e.target.value)}
                  placeholder="Ex: Celulares novos e seminovos selecionados com procedência e 90 dias de garantia oficial."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Endereço / Cidade da Loja (Opcional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Centro - São Paulo / SP"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-rose-400" /> Instagram da Loja (Opcional)
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="Ex: @cellexpress"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                />
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-sm shadow-xl shadow-[#00D287]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Salvando Configurações...</span>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Salvar Configurações da Vitrine</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
