import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  FileText, 
  Mail, 
  Lock, 
  ArrowRight, 
  Zap, 
  Eye, 
  EyeOff,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { leadAuthService } from '@/services/leadAuthService';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields as requested
  const [companyName, setCompanyName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // CNPJ mask formatting
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!companyName.trim() || !ownerName.trim() || !cnpj.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
          setIsSubmitting(false);
          return;
        }

        const { user, error } = await leadAuthService.registerAccount({
          companyName,
          ownerName,
          cnpj,
          email,
          password,
        });

        if (error || !user) {
          setErrorMessage(error || 'Erro ao registrar conta no Supabase.');
          setIsSubmitting(false);
          return;
        }

        // Redirect immediately into the platform
        navigate('/app');
      } else {
        // Login mode
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Por favor, digite seu e-mail e senha.');
          setIsSubmitting(false);
          return;
        }

        // Master admin direct check
        if (email.toLowerCase() === 'lordhahshs@gmail.com') {
          const { user } = await leadAuthService.login('lordhahshs@gmail.com', password);
          if (user && user.role === 'admin') {
            navigate('/admin');
            return;
          }
        }

        const { user, error } = await leadAuthService.login(email, password);
        if (error || !user) {
          setErrorMessage(error || 'Credenciais inválidas.');
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
      setErrorMessage(err?.message || 'Ocorreu um erro ao conectar com o banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#00D287]/30">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00D287] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#00D287]/30">
            <Zap className="w-4 h-4 text-slate-950 fill-current" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Aurus<span className="text-[#00D287]">Pay</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Voltar à VSL
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-[#00D287] hover:underline font-medium"
          >
            Painel Admin
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md bg-[#080c17] border border-[#00D287]/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#00D287]/10 relative">
          
          {/* Header of Form */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] text-[11px] font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Conexão Supabase Oficial</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isRegisterMode ? 'Cadastre Sua Empresa' : 'Entrar na Plataforma'}
            </h1>
            
            <p className="text-xs text-slate-400 mt-1">
              {isRegisterMode 
                ? 'Preencha os dados reais da sua loja para liberar o simulador e módulos.'
                : 'Acesse seu painel com seu e-mail e senha cadastrados.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950 border border-white/5 rounded-xl p-1 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                isRegisterMode 
                  ? 'bg-[#00D287] text-slate-950 font-bold shadow-md shadow-[#00D287]/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Novo Cadastro
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                !isRegisterMode 
                  ? 'bg-[#00D287] text-slate-950 font-bold shadow-md shadow-[#00D287]/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Já Tenho Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <>
                {/* Nome da Empresa */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome da Empresa / Loja:
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome da sua loja de celulares"
                      className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* Nome do Dono */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome do Dono / Responsável:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* CNPJ */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CNPJ:
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      required
                      value={cnpj}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl font-mono focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                E-mail:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="pl-9 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus:border-[#00D287]"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Senha de Acesso:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus:border-[#00D287]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 text-center font-medium bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                {errorMessage}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs sm:text-sm tracking-tight rounded-xl shadow-lg shadow-[#00D287]/20 transition-all mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando no Supabase...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isRegisterMode ? 'Cadastrar e Acessar Plataforma' : 'Entrar na Minha Conta'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-2">
        <p>AurusPay • Gestão e Vendas de Celulares</p>
      </footer>
    </div>
  );
};

export default AuthPage;
