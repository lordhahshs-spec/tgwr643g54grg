import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Store, 
  FileText, 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Phone, 
  Upload, 
  Check, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { leadAuthService } from '@/services/leadAuthService';
import { CellHubLogo } from '@/components/CellHubLogo';
import { CELLHUB_DEFAULT_AVATARS } from '@/constants/cellHubAvatars';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Required Fields
  const [companyName, setCompanyName] = useState<string>(''); // Nome da loja (Razão Social)
  const [tradeName, setTradeName] = useState<string>(''); // Nome fantasia da loja
  const [cnpj, setCnpj] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Avatar / Logo Selection (Upload or one of 4 CellHub presets)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(CELLHUB_DEFAULT_AVATARS[0].dataUri);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  // CNPJ mask formatting: 00.000.000/0001-00
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  // WhatsApp mask: (00) 00000-0000
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultStr = event.target.result as string;
        setCustomAvatarPreview(resultStr);
        setSelectedAvatar(resultStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        // Validações
        if (!companyName.trim()) {
          setErrorMessage('Informe o Nome da loja (Razão Social).');
          setIsSubmitting(false);
          return;
        }
        if (!tradeName.trim()) {
          setErrorMessage('Informe o Nome Fantasia da loja.');
          setIsSubmitting(false);
          return;
        }
        if (!cnpj.trim() || cnpj.replace(/\D/g, '').length < 14) {
          setErrorMessage('Informe um CNPJ válido com 14 dígitos.');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setErrorMessage('Informe um e-mail válido.');
          setIsSubmitting(false);
          return;
        }
        if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 10) {
          setErrorMessage('Informe um número de WhatsApp com DDD.');
          setIsSubmitting(false);
          return;
        }
        if (!password.trim() || password.length < 6) {
          setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('As senhas digitadas não coincidem. Verifique a confirmação.');
          setIsSubmitting(false);
          return;
        }

        const { user, error } = await leadAuthService.registerAccount({
          companyName: companyName.trim(),
          tradeName: tradeName.trim(),
          ownerName: tradeName.trim() || companyName.trim(),
          cnpj: cnpj.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim(),
          avatarUrl: selectedAvatar,
          password: password.trim(),
          initialPlanStatus: 'demo', // Entra como demonstração aguardando pagamento
        });

        if (error || !user) {
          setErrorMessage(error || 'Erro ao registrar a conta. Verifique os dados.');
          setIsSubmitting(false);
          return;
        }

        // Redireciona imediatamente para a plataforma (modo bloqueado para plano demo)
        navigate('/app');
      } else {
        // Modo Login
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Por favor, informe seu e-mail e senha.');
          setIsSubmitting(false);
          return;
        }

        // Master admin direct check
        if (email.toLowerCase().trim() === 'lordhahshs@gmail.com') {
          const { user } = await leadAuthService.login('lordhahshs@gmail.com', password);
          if (user && user.role === 'admin') {
            navigate('/admin');
            return;
          }
        }

        const { user, error } = await leadAuthService.login(email.trim(), password.trim());
        if (error || !user) {
          setErrorMessage(error || 'Credenciais inválidas. Verifique os dados ou crie sua conta.');
          setIsSubmitting(false);
          return;
        }

        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao conectar ao banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#00D287]/30">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2">
        <CellHubLogo size="md" />

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isRegisterMode ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-xl w-full bg-[#080c17] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Switcher Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-950 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRegisterMode 
                  ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta da Loja
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isRegisterMode 
                  ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acessar Minha Conta
            </button>
          </div>

          <div className="mb-5 text-left">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isRegisterMode ? 'Cadastre sua Loja no CellHub' : 'Entrar na Plataforma'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRegisterMode 
                ? 'Preencha os dados da sua empresa para ter acesso à plataforma.' 
                : 'Informe seu e-mail e senha para gerenciar suas operações.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isRegisterMode ? (
              <>
                {/* 1. Nome da Loja (Razão Social) & Nome Fantasia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Nome da Loja (Razão Social) *
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Celulares Brasil Ltda"
                        className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Nome Fantasia da Loja *
                    </label>
                    <div className="relative">
                      <Store className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: GG Cell Acessórios"
                        className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CNPJ & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      CNPJ da Loja *
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0001-00"
                        className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl font-mono focus:border-[#00D287]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Número de WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl font-mono focus:border-[#00D287]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. E-mail */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    E-mail Comercial da Loja *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@sualoja.com.br"
                      className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* 4. Escolha de Imagem da Loja (Upload OU 4 Avatares CellHub) */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">
                      Foto / Logo da sua Loja
                    </span>
                    <label className="text-[10px] font-bold text-[#00D287] hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Fazer Upload do Logo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Se preferir, escolha uma das 4 logos oficiais do CellHub para o perfil da sua loja:
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {CELLHUB_DEFAULT_AVATARS.map((avatar) => {
                      const isSelected = selectedAvatar === avatar.dataUri;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(avatar.dataUri);
                            setCustomAvatarPreview(null);
                          }}
                          className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? 'border-[#00D287] bg-[#00D287]/15 ring-2 ring-[#00D287]/30'
                              : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                          }`}
                        >
                          <img src={avatar.dataUri} alt={avatar.label} className="w-10 h-10 rounded-lg object-contain" />
                          <span className="text-[9px] text-slate-300 font-semibold truncate w-full text-center">
                            {avatar.label.replace('CellHub ', '')}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#00D287] text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {customAvatarPreview && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
                      <img src={customAvatarPreview} alt="Preview" className="w-6 h-6 rounded-md object-cover border border-[#00D287]/40" />
                      <span>Logo personalizada da loja carregada com sucesso!</span>
                    </div>
                  )}
                </div>

                {/* 5. Senha & Repetir Senha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Senha de Acesso *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="pl-9 pr-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Repetir a Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a mesma senha"
                        className="pl-9 pr-9 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LOGIN MODE */
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="pl-9 h-11 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                    Sua Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="pl-9 pr-9 h-11 text-xs bg-slate-950 border-slate-800 text-white rounded-xl focus:border-[#00D287]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm tracking-tight rounded-xl shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Conectando...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>{isRegisterMode ? 'Criar Conta e Entrar na Plataforma' : 'Entrar no Sistema'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Minimal security guarantee note */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D287]" />
            <span>Acesso seguro com criptografia e validação de loja</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-2">
        <p>CellHub • Plataforma B2B de Celulares & Vendas</p>
      </footer>
    </div>
  );
};

export default AuthPage;
