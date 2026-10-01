import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Layers,
  ShieldCheck,
  Zap,
  Lock,
  XCircle,
  Trash2,
  AlertTriangle,
  Camera,
  RotateCcw,
  Check,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { ValuationModel, FaultDefinition } from '@/types/tradein';
import { tradeinAiService } from '@/services/tradeinAiService';
import { AiEvaluationSession, AiQuotaStatus, AiEvaluationPhoto } from '@/types/tradeinAi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TradeInAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentModel: ValuationModel | null;
  brandPresets: FaultDefinition[];
  onApplyDetectedFaults: (faultIds: string[], photos?: AiEvaluationPhoto[], visualSummary?: string[]) => void;
}

// Detecção inteligente de dispositivo móvel
const checkIsMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  const isTouchScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 800;
  return isMobileUA || isTouchScreen;
};

export const TradeInAiModal: React.FC<TradeInAiModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentModel,
  brandPresets,
  onApplyDetectedFaults
}) => {
  const [session, setSession] = useState<AiEvaluationSession | null>(null);
  const [quota, setQuota] = useState<AiQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Rejeição por não ser smartphone
  const [rejectionData, setRejectionData] = useState<{
    detectedObject: string;
    reason: string;
  } | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    detectedPresetIds: string[];
    visualSummary: string[];
    confidence: string;
    tierUsed?: 'free' | 'paid';
  } | null>(null);

  const isMobile = checkIsMobileDevice();
  const [activeTab, setActiveTab] = useState<'mobile_camera' | 'qr' | 'upload'>(isMobile ? 'mobile_camera' : 'qr');

  // Mobile / Camera State
  const [mobileFiles, setMobileFiles] = useState<{
    front: File | null;
    side: File | null;
    back: File | null;
  }>({ front: null, side: null, back: null });

  const [mobilePreviews, setMobilePreviews] = useState<{
    front: string | null;
    side: string | null;
    back: string | null;
  }>({ front: null, side: null, back: null });

  // Manual Desktop Upload State
  const [desktopFiles, setDesktopFiles] = useState<{
    front: File | null;
    side: File | null;
    back: File | null;
  }>({ front: null, side: null, back: null });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const isSessionCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    currentSessionIdRef.current = session?.id || null;
    isSessionCompletedRef.current = Boolean(analysisResult);
  }, [session?.id, analysisResult]);

  // Cancelar sessão ativa automaticamente se o lojista fechar o modal, mudar de aba ou sair da página
  useEffect(() => {
    const handleUnload = () => {
      const activeId = currentSessionIdRef.current;
      if (activeId && !isSessionCompletedRef.current) {
        tradeinAiService.cancelSession(activeId);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      
      const activeId = currentSessionIdRef.current;
      if (activeId && !isSessionCompletedRef.current) {
        tradeinAiService.cancelSession(activeId);
      }
    };
  }, []);

  const initSession = async () => {
    if (!currentModel) return;
    setLoading(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setRejectionData(null);
    setUpgradeRequired(false);
    setMobileFiles({ front: null, side: null, back: null });
    setMobilePreviews({ front: null, side: null, back: null });
    setDesktopFiles({ front: null, side: null, back: null });
    hasTriggeredRef.current = false;
    setActiveTab(isMobile ? 'mobile_camera' : 'qr');

    try {
      const q = await tradeinAiService.checkQuota(userId);
      setQuota(q);

      const res = await tradeinAiService.createSession({
        userId,
        brand: currentModel.brand,
        modelName: currentModel.model_name,
        storage: currentModel.storage,
        allowedPresets: brandPresets
      });

      if (res.success && res.session) {
        setSession(res.session);
      } else {
        toast.error('Erro ao gerar sessão de IA.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentModel) {
      initSession();
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setSession(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setRejectionData(null);
      hasTriggeredRef.current = false;
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, currentModel?.id]);

  // Sincronização Bidirecional Instantânea (Realtime + Polling Rápido)
  useEffect(() => {
    if (!isOpen || !session?.id) return;

    // 1. Inscrição em canal Realtime exclusivo desta sessão e deste lojista
    const channel = supabase
      .channel(`modal_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_evaluation_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const updated = payload.new as AiEvaluationSession;
          if (!updated) return;

          setSession(updated);

          // Se o celular clicou para resetar / tirar novas fotos
          if (
            ['phone_connected', 'waiting_for_phone', 'retrying'].includes(updated.status) &&
            (!updated.photos || updated.photos.length === 0)
          ) {
            setRejectionData(null);
            setAnalysisError(null);
            setAnalysisResult(null);
            setAnalyzing(false);
            hasTriggeredRef.current = false;
          }

          // Se o celular enviou novas fotos
          if (updated.status === 'photos_received' && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            runAiAnalysis(updated.id);
          }
        }
      )
      .subscribe();

    // 2. Polling de fallback a cada 1.2s para garantir mesmo em conexões instáveis
    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 120;

    pollingRef.current = setInterval(async () => {
      pollAttempts += 1;
      if (pollAttempts > MAX_POLL_ATTEMPTS) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      try {
        const updated = await tradeinAiService.getSession(session.id);
        if (!updated) return;

        if (updated.status !== session.status) {
          setSession(updated);
        }

        // Se o celular resetou
        if (
          ['phone_connected', 'waiting_for_phone', 'retrying'].includes(updated.status) &&
          (!updated.photos || updated.photos.length === 0) &&
          (rejectionData || analysisResult || analysisError)
        ) {
          setRejectionData(null);
          setAnalysisError(null);
          setAnalysisResult(null);
          setAnalyzing(false);
          hasTriggeredRef.current = false;
        }

        if (updated.status === 'photos_received' && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          runAiAnalysis(updated.id);
        }
      } catch (e) {
        // Silenciar
      }
    }, 1200);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, session?.id, rejectionData, analysisResult, analysisError]);

  const handleCancelSession = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    hasTriggeredRef.current = true;

    if (session?.id) {
      await tradeinAiService.cancelSession(session.id);
      toast.info('Sessão cancelada.');
    }
    onClose();
  };

  const handleRetryReopenedSession = async () => {
    if (!session) {
      initSession();
      return;
    }

    setAnalyzing(false);
    setRejectionData(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setDesktopFiles({ front: null, side: null, back: null });
    hasTriggeredRef.current = false;

    // Reseta no Supabase para reabrir a mesma sessão instantaneamente no smartphone
    await tradeinAiService.resetSessionForRetry(session.id);

    // Atualiza estado local da sessão mantendo o mesmo QR Code / Token
    setSession(prev => prev ? {
      ...prev,
      status: 'phone_connected',
      photos: [],
      detected_presets: [],
      visual_summary: []
    } : null);

    toast.success('Sessão reaberta! O celular já foi liberado para capturar novas fotos.');
  };

  const runAiAnalysis = async (sessionId?: string) => {
    setAnalyzing(true);
    setAnalysisError(null);
    setRejectionData(null);

    try {
      const res = await tradeinAiService.triggerEvaluation({
        sessionId: sessionId || session?.id,
        userId,
        brand: currentModel?.brand,
        modelName: currentModel?.model_name,
        allowedPresets: brandPresets
      });

      if (res.success) {
        if (res.isValidSmartphone === false) {
          setRejectionData({
            detectedObject: res.detectedObjectDescription || 'Objeto não reconhecido / Imagem inválida',
            reason: res.rejectionReason || 'As fotos enviadas não correspondem a um smartphone.'
          });
          toast.error('Fotos rejeitadas: As imagens não são de um smartphone!');
          return;
        }

        setAnalysisResult({
          detectedPresetIds: res.detectedPresetIds || [],
          visualSummary: res.visualSummary || [],
          confidence: res.confidence || 'high',
          tierUsed: res.tierUsed
        });
        toast.success('Diagnóstico concluído!');
      } else if (res.requiresUpgrade) {
        setUpgradeRequired(true);
      } else {
        setAnalysisError(res.message || 'Instabilidade momentânea no processamento visual.');
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'Instabilidade momentânea no processamento da IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMobilePhotoCapture = (type: 'front' | 'side' | 'back', file: File | null) => {
    if (!file) return;
    setMobileFiles(prev => ({ ...prev, [type]: file }));
    const url = URL.createObjectURL(file);
    setMobilePreviews(prev => ({ ...prev, [type]: url }));
  };

  const handleMobileSubmit = async () => {
    if (!mobileFiles.front || !mobileFiles.side || !mobileFiles.back || !session) {
      toast.error('Por favor, tire as 3 fotos do aparelho (Frente, Lateral e Traseira).');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setRejectionData(null);

    try {
      const itemsToUpload = [
        { type: 'front' as const, file: mobileFiles.front },
        { type: 'side' as const, file: mobileFiles.side },
        { type: 'back' as const, file: mobileFiles.back }
      ];

      const uploadRes = await tradeinAiService.uploadPhotosForSession(session.id, itemsToUpload);
      if (!uploadRes.success) {
        toast.error('Erro no upload das imagens.');
        setAnalyzing(false);
        return;
      }

      await runAiAnalysis(session.id);
    } catch (err) {
      setAnalysisError('Erro no upload das imagens.');
      setAnalyzing(false);
    }
  };

  const handleManualUploadSubmit = async () => {
    if (!desktopFiles.front || !desktopFiles.side || !desktopFiles.back || !session) {
      toast.error('Por favor, selecione as 3 fotos (Frontal, Lateral e Traseira).');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setRejectionData(null);

    try {
      const itemsToUpload = [
        { type: 'front' as const, file: desktopFiles.front },
        { type: 'side' as const, file: desktopFiles.side },
        { type: 'back' as const, file: desktopFiles.back }
      ];

      const uploadRes = await tradeinAiService.uploadPhotosForSession(session.id, itemsToUpload);
      if (!uploadRes.success) {
        toast.error('Erro no upload das imagens.');
        setAnalyzing(false);
        return;
      }

      await runAiAnalysis(session.id);
    } catch (err) {
      setAnalysisError('Erro no upload das imagens.');
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;
    onApplyDetectedFaults(
      analysisResult.detectedPresetIds,
      session?.photos || [],
      analysisResult.visualSummary
    );
    toast.success(`${analysisResult.detectedPresetIds.length} avarias aplicadas à cotação com base na tabela da loja!`);
    onClose();
  };

  if (!isOpen) return null;

  const mobileCaptureUrl = session 
    ? `${window.location.origin}/tradein/camera/${session.session_token}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-5 bg-black/90 md:backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-2xl bg-[#060a16] md:border md:border-white/10 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0">
        
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-[#090f1f]/95 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Botão Voltar no Mobile */}
            <button
              onClick={handleCancelSession}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
              <span className="text-xs">Voltar</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 hidden sm:flex items-center justify-center shadow-lg shadow-[#00D287]/20 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-black text-white tracking-tight">
                  Avaliação com IA
                </h2>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 font-black uppercase">
                  CellHub IA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[220px] sm:max-w-none">
                {currentModel?.brand} {currentModel?.model_name} ({currentModel?.storage})
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelSession}
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Fechar e cancelar sessão no celular"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-5 pb-24 md:pb-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#00D287] animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Iniciando sessão segura da CellHub IA...</p>
            </div>
          ) : upgradeRequired ? (
            <div className="p-6 rounded-2xl bg-[#090f1f] border border-amber-500/30 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Limite de Análises Gratuitas Atingido</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Você utilizou todas as suas análises gratuitas deste período. Para continuar realizando diagnósticos automáticos por inteligência artificial, ative a <strong>CellHub IA Ilimitada</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#040711] border border-white/10 max-w-xs mx-auto text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Plano IA Ilimitada:</span>
                  <strong className="text-white font-bold">R$ 9,90 / mês</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Franquia Gratuita:</span>
                  <span className="text-amber-400 font-bold">Renova no próximo período</span>
                </div>
              </div>

              <Button
                disabled
                className="bg-purple-600/80 text-white font-bold text-xs h-11 px-6 rounded-xl cursor-not-allowed opacity-90 shadow-md"
              >
                Ativar CellHub IA (Pagamento em Breve)
              </Button>
            </div>
          ) : rejectionData ? (
            /* Rejection Screen (Not a Smartphone) */
            <div className="p-6 rounded-3xl bg-[#090f1f] border-2 border-red-500/50 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">Fotos Rejeitadas pela IA</h3>
                <p className="text-xs text-red-300 font-semibold max-w-md mx-auto">
                  As fotografias enviadas não correspondem a um smartphone válido.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#040711] border border-white/10 text-xs space-y-1.5 text-left max-w-md mx-auto">
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">Objeto Detectado:</span>
                  <strong className="text-amber-400">{rejectionData.detectedObject}</strong>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">Diagnóstico:</span>
                  <span className="text-slate-200">{rejectionData.reason}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Por favor, aponte a câmera e tire fotos reais e nítidas do smartphone que está sendo avaliado.
              </p>

              <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <Button
                  onClick={handleRetryReopenedSession}
                  className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs h-11 px-6 rounded-2xl shadow-lg shadow-[#00D287]/25 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Liberar Celular para Novas Fotos
                </Button>

                <Button
                  variant="outline"
                  onClick={initSession}
                  className="border-white/10 bg-[#0c1424] text-slate-300 text-xs h-11 rounded-2xl px-4 hover:text-white"
                >
                  Gerar Novo QR Code
                </Button>
              </div>
            </div>
          ) : analysisError ? (
            <div className="p-6 rounded-3xl bg-[#090f1f] border border-amber-500/40 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Instabilidade Momentânea na IA</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {analysisError}. As fotos já estão salvas com segurança. Clique abaixo para reprocessar o laudo.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  onClick={() => runAiAnalysis(session?.id)}
                  disabled={analyzing}
                  className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs h-11 px-6 rounded-2xl shadow-lg shadow-[#00D287]/25 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                  {analyzing ? 'Reprocessando...' : 'Tentar Processar Novamente'}
                </Button>

                <Button
                  variant="outline"
                  onClick={initSession}
                  className="border-white/10 bg-[#0c1424] text-slate-300 text-xs h-11 rounded-2xl"
                >
                  Gerar Novo QR Code
                </Button>
              </div>
            </div>
          ) : analysisResult ? (
            /* Result Screen */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-[#00D287]/10 border border-[#00D287]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D287]/20 border border-[#00D287]/40 flex items-center justify-center text-[#00D287] shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Diagnóstico Visual Concluído!
                  </h4>
                  <p className="text-xs text-slate-300">
                    A IA identificou <strong>{analysisResult.detectedPresetIds.length}</strong> condições visíveis nas fotos.
                  </p>
                </div>
              </div>

              {/* Visual Summary */}
              {analysisResult.visualSummary.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#090f1f] border border-white/10 space-y-1.5 text-xs text-slate-300">
                  <span className="text-[11px] font-bold uppercase text-[#00D287] tracking-wider block">
                    Observações da IA:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {analysisResult.visualSummary.map((sum, i) => (
                      <li key={i}>{sum}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detected Avarias List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Avarias que serão marcadas automaticamente:
                </span>

                {analysisResult.detectedPresetIds.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#090f1f] border border-[#00D287]/20 text-center text-xs text-[#00D287] font-semibold">
                    ✨ Nenhuma avaria ou trinco visual significativo detectado nas fotos! O aparelho aparenta excelente estado de conservação.
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-2xl divide-y divide-white/5 bg-[#040711] max-h-48 overflow-y-auto scrollbar-thin">
                    {analysisResult.detectedPresetIds.map(id => {
                      const preset = brandPresets.find(p => p.id === id);
                      // Prioriza o valor cadastrado na tabela do modelo específico do lojista
                      const discountVal = currentModel?.fault_discounts?.[id] !== undefined
                        ? Number(currentModel.fault_discounts[id])
                        : Number(preset?.defaultDiscount || 0);

                      return (
                        <div key={id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                          <span className="text-white font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            {preset?.label || id}
                          </span>
                          <span className="text-red-400 font-bold">
                            - R$ {discountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={initSession}
                  className="border-white/10 bg-[#0c1424] text-slate-300 hover:text-white rounded-xl text-xs h-10"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tirar Novas Fotos
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs sm:text-sm h-10 px-5 rounded-xl shadow-lg shadow-[#00D287]/25"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Aplicar Avarias na Cotação
                </Button>
              </div>
            </div>
          ) : analyzing ? (
            <div className="py-14 text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Analisando Imagens com CellHub IA...</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  A inteligência artificial está escaneando a tela, bordas e traseira para identificar avarias físicas.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSession}
                  className="border-white/10 text-slate-400 hover:text-red-400 text-xs rounded-xl h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancelar esta Sessão
                </Button>
              </div>
            </div>
          ) : (
            /* Initial View: Mobile Camera vs QR Code vs Upload */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#040711] p-1 rounded-2xl border border-white/10 text-xs">
                <button
                  onClick={() => setActiveTab('mobile_camera')}
                  className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'mobile_camera'
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="truncate">{isMobile ? 'Câmera do Celular' : 'Câmera Direta'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('qr')}
                  className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'qr'
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="truncate">Outro Celular (QR)</span>
                </button>

                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="truncate">Galeria / PC</span>
                </button>
              </div>

              {/* TAB 1: MOBILE DIRECT CAMERA */}
              {activeTab === 'mobile_camera' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 rounded-2xl bg-[#090f1f] border border-[#00D287]/20 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00D287] animate-pulse shrink-0" />
                      <span className="text-slate-300 font-medium">
                        Toque em cada uma das 3 posições para fotografar direto com a câmera do celular:
                      </span>
                    </div>

                    <a
                      href={mobileCaptureUrl}
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#00D287] hover:underline font-bold shrink-0"
                    >
                      Modo Tela Cheia ↗
                    </a>
                  </div>

                  {/* 3 Camera Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'front' as const, label: '1. Foto Frontal', sub: 'Tela ligada com fundo claro' },
                      { type: 'side' as const, label: '2. Foto Lateral', sub: 'Bordas, aro e botões' },
                      { type: 'back' as const, label: '3. Foto Traseira', sub: 'Lentes das câmeras e tampa' }
                    ].map(slot => {
                      const hasPhoto = Boolean(mobileFiles[slot.type]);
                      const preview = mobilePreviews[slot.type];

                      return (
                        <div
                          key={slot.type}
                          className={`relative rounded-2xl border-2 p-3.5 flex flex-col items-center justify-between transition-all min-h-[150px] ${
                            hasPhoto
                              ? 'border-[#00D287] bg-[#00D287]/10'
                              : 'border-dashed border-white/20 bg-[#090f1f] hover:border-[#00D287]/50'
                          }`}
                        >
                          {/* Hidden File Input with Camera Capture Trigger */}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id={`camera-input-${slot.type}`}
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              handleMobilePhotoCapture(slot.type, f);
                            }}
                            className="hidden"
                          />

                          {preview ? (
                            <div className="w-full flex flex-col items-center space-y-2">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-md">
                                <img
                                  src={preview}
                                  alt={slot.label}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#00D287] text-slate-950 flex items-center justify-center font-bold">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              </div>
                              <span className="text-xs font-bold text-white text-center block">
                                {slot.label}
                              </span>
                              <label
                                htmlFor={`camera-input-${slot.type}`}
                                className="text-[11px] text-slate-400 hover:text-white cursor-pointer underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Refazer foto
                              </label>
                            </div>
                          ) : (
                            <label
                              htmlFor={`camera-input-${slot.type}`}
                              className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer space-y-2 py-3"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00D287] shadow-inner group-hover:scale-105 transition-transform">
                                <Camera className="w-6 h-6 stroke-[2]" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">{slot.label}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{slot.sub}</span>
                              </div>
                              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#00D287]/20 text-[#00D287] font-bold mt-1">
                                Abrir Câmera
                              </span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Progress / Submit Button */}
                  <div className="pt-2 space-y-2">
                    {quota && (
                      <p className="text-[11px] text-slate-400 text-center sm:text-left">
                        Franquia gratuita: <strong className="text-[#00D287]">{quota.remainingFree} restantes</strong> hoje.
                      </p>
                    )}

                    <Button
                      onClick={handleMobileSubmit}
                      disabled={!mobileFiles.front || !mobileFiles.side || !mobileFiles.back || analyzing}
                      className="w-full bg-[#00D287] hover:bg-[#00be7a] disabled:bg-[#0c1424] disabled:text-slate-600 text-slate-950 font-black text-xs sm:text-sm h-12 rounded-2xl shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      {!mobileFiles.front || !mobileFiles.side || !mobileFiles.back
                        ? `Tire as 3 Fotos (${[mobileFiles.front, mobileFiles.side, mobileFiles.back].filter(Boolean).length}/3)`
                        : '✨ Analisar Fotos com CellHub IA'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: QR CODE (FOR SECONDARY DEVICE) */}
              {activeTab === 'qr' && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center animate-in fade-in duration-150">
                  <div className="sm:col-span-6 flex flex-col items-center justify-center p-4 rounded-3xl bg-white text-black shadow-xl mx-auto">
                    <QRCodeDisplay
                      value={mobileCaptureUrl}
                      size={180}
                    />
                    <span className="text-[11px] font-bold text-slate-700 mt-2 text-center">
                      Aponte a câmera do seu smartphone
                    </span>
                  </div>

                  <div className="sm:col-span-6 space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" /> Como Funciona:
                      </span>
                      <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>Abra a câmera do seu celular e escaneie o QR Code ao lado.</li>
                        <li>Tire as 3 fotos do aparelho (Frente, Lateral e Traseira).</li>
                        <li>A <strong>CellHub IA</strong> analisará as imagens instantaneamente e marcará as avarias.</li>
                      </ol>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#090f1f] border border-white/10 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00D287] animate-ping"></div>
                      <span className="text-xs font-bold text-slate-200">
                        {session?.status === 'phone_connected'
                          ? 'Celular conectado! Aguardando envio das fotos...'
                          : 'Aguardando leitura do QR Code...'}
                      </span>
                    </div>

                    {quota && (
                      <p className="text-[11px] text-slate-400">
                        Franquia gratuita: <strong className="text-[#00D287]">{quota.remainingFree} restantes</strong> hoje (limite de {quota.freeLimit}).
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSession}
                      className="w-full border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/40 text-xs font-semibold rounded-xl h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Cancelar esta Sessão
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOAD MANUAL / PC */}
              {activeTab === 'upload' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-300">
                    Selecione as 3 fotos do aparelho salvas no computador ou galeria:
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {(['front', 'side', 'back'] as const).map(type => (
                      <label
                        key={type}
                        className="p-3 rounded-2xl border border-dashed border-white/15 bg-[#090f1f] hover:bg-[#0c1424] text-center cursor-pointer flex flex-col items-center justify-center space-y-1 text-xs"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setDesktopFiles(prev => ({ ...prev, [type]: f }));
                          }}
                          className="hidden"
                        />
                        <Upload className="w-4 h-4 text-[#00D287]" />
                        <span className="font-bold text-white capitalize">{type === 'front' ? 'Tela' : type === 'side' ? 'Lateral' : 'Traseira'}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-full">
                          {desktopFiles[type] ? desktopFiles[type]!.name : 'Selecionar'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <Button
                    onClick={handleManualUploadSubmit}
                    disabled={!desktopFiles.front || !desktopFiles.side || !desktopFiles.back || analyzing}
                    className="w-full bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs h-11 rounded-2xl shadow-lg shadow-[#00D287]/25"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" /> Analisar Fotos com CellHub IA
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
