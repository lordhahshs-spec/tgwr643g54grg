import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Truck, ArrowRight } from 'lucide-react';
import { melhorEnvioService } from '@/services/melhorEnvioService';

export const MelhorEnvioCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(errorDescription || errorParam || 'Autorização recusada pelo Melhor Envio.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('Nenhum código de autorização foi retornado.');
      return;
    }

    // Troca o código pelo token oficial no backend
    melhorEnvioService.exchangeOAuthCode(code)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setTimeout(() => {
            navigate('/admin');
          }, 2500);
        } else {
          setStatus('error');
          setErrorMessage(res.error || 'Falha ao processar autorização.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Erro de conexão com o servidor.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-[#0a0f1e] border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 text-[#00D287] flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8" />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-[#00D287] animate-spin mx-auto" />
            <h2 className="text-lg font-bold">Conectando ao Melhor Envio...</h2>
            <p className="text-xs text-slate-400">
              Validando credenciais e sincronizando carteira oficial da CellHub.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Conta Vinculada com Sucesso!</h2>
            <p className="text-xs text-slate-400">
              O Melhor Envio agora está integrado ao CellHub. Redirecionando para o painel administrativo...
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold inline-flex items-center gap-2"
            >
              Ir para o Painel Admin <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-rose-400">Falha na Autorização</h2>
            <p className="text-xs text-slate-400 bg-rose-950/40 p-3 rounded-xl border border-rose-500/20">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Voltar ao Painel Administrativo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MelhorEnvioCallback;
