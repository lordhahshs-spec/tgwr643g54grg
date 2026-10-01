import React, { useState } from 'react';
import { UserAccount, leadAuthService } from '@/services/leadAuthService';
import {
  X,
  Camera,
  User,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Smartphone,
  Apple,
  Download,
  Sparkles,
  Check,
  LogOut,
  UploadCloud,
  Share,
  PlusSquare,
  ArrowLeft
} from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserUpdated: (user: UserAccount) => void;
  onLogout: () => void;
  onUnlockModal?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onLogout,
  onUnlockModal
}) => {
  const { isMobile, isAndroid, isIOS, canPromptNativeInstall, triggerInstall } = useMobileDetection();

  const [tradeName, setTradeName] = useState(currentUser?.tradeName || currentUser?.companyName || '');
  const [ownerName, setOwnerName] = useState(currentUser?.ownerName || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      toast.success('Foto carregada! Clique em "Salvar Alterações" para confirmar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await leadAuthService.updateUserProfile(currentUser.id, {
        avatarUrl,
        tradeName: tradeName.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      });

      if (res.success && res.user) {
        onUserUpdated(res.user);
        toast.success('Perfil atualizado com sucesso!');
        onClose();
      } else {
        toast.error(res.error || 'Erro ao salvar perfil.');
      }
    } catch {
      toast.error('Erro de conexão ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstallApp = async () => {
    if (isAndroid && canPromptNativeInstall) {
      const success = await triggerInstall();
      if (success) {
        toast.success('App CellHub instalado com sucesso!');
      }
    } else if (isIOS) {
      setShowIosGuide(true);
    } else {
      toast.info('Para instalar no seu celular ou computador, utilize a opção "Instalar Aplicativo" ou "Adicionar à Tela Inicial" no menu do seu navegador.');
    }
  };

  const isDemo = currentUser.role !== 'admin' && currentUser.planStatus !== 'ativo';

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 md:backdrop-blur-md flex items-center justify-center md:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-md bg-[#090e1c] md:border md:border-white/10 md:rounded-3xl p-4 sm:p-6 space-y-5 shadow-2xl overflow-y-auto overscroll-contain flex flex-col pt-[max(env(safe-area-inset-top,0px),12px)] md:pt-6 pb-[max(env(safe-area-inset-bottom,0px),16px)] md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
            </button>
            <User className="w-5 h-5 text-[#00D287]" />
            <h3 className="text-base font-bold text-white">Meu Perfil de Lojista</h3>
          </div>
          <button
            onClick={onClose}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Foto de Perfil / Avatar Uploader */}
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="relative group">
            {/* Anel Gradiente Estilo Instagram */}
            <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287] shadow-xl">
              <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-black overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={tradeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-white uppercase">
                    {(tradeName || currentUser.companyName).substring(0, 2)}
                  </span>
                )}
              </div>
            </div>

            {/* Botão de Upload com Input Oculto */}
            <label
              htmlFor="avatar-file-upload"
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#00D287] text-slate-950 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Trocar foto de perfil"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <input
                id="avatar-file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center">
            <span className="text-xs font-semibold text-white block">
              {tradeName || currentUser.companyName}
            </span>
            <span className="text-[11px] text-slate-400">
              CNPJ: {currentUser.cnpj}
            </span>
          </div>
        </div>

        {/* Status da Conta */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${isDemo ? 'text-amber-400' : 'text-[#00D287]'}`} />
            <div>
              <span className="text-xs font-bold text-white block">
                {isDemo ? 'Modo Demonstração' : 'Licença Vitalícia Ativa'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isDemo ? 'Recursos com limites de degustação' : 'Acesso total liberado para sempre'}
              </span>
            </div>
          </div>

          {isDemo && onUnlockModal && (
            <button
              onClick={() => {
                onClose();
                onUnlockModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-[#00D287]/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Liberar
            </button>
          )}
        </div>

        {/* Formulário de Edição */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nome Fantasia da Loja
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: Cell Express"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nome do Responsável
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ex: Lucas Ferreira"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              WhatsApp para Vendas & Contato
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
              />
            </div>
          </div>
        </div>

        {/* Seção Baixar Aplicativo (Android / iOS / PWA) - Visível apenas para Administradores em fase de testes */}
        {currentUser?.role === 'admin' && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              Aplicativo Móvel (Ambiente de Testes)
            </span>

            <button
              type="button"
              onClick={handleInstallApp}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0a1526] hover:from-[#0a1526] hover:to-[#0f2038] border border-[#00D287]/30 text-white flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00D287]/20 text-[#00D287] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block group-hover:text-[#00D287] transition-colors">
                    Testar Instalação no Celular
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Acesso exclusivo para administradores
                  </span>
                </div>
              </div>

              <Download className="w-4 h-4 text-[#00D287] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Ações Finais */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Passo a Passo iOS */}
        {showIosGuide && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/15 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Apple className="w-4 h-4" /> Passo a Passo no iPhone
              </span>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              1. Toque em <strong>Compartilhar</strong> (<Share className="w-3 h-3 inline text-blue-400" />) na barra inferior do Safari.
            </p>
            <p className="text-[11px] text-slate-300">
              2. Escolha <strong>Adicionar à Tela de Início</strong> (<PlusSquare className="w-3 h-3 inline text-[#00D287]" />).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
