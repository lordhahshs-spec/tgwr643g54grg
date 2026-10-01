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
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { ValuationModel, FaultDefinition } from '@/types/tradein';
import { tradeinAiService } from '@/services/tradeinAiService';
import { AiEvaluationSession, AiQuotaStatus } from '@/types/tradeinAi';
import { toast } from 'sonner';

interface TradeInAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentModel: ValuationModel | null;
  brandPresets: FaultDefinition[];
  onApplyDetectedFaults: (faultIds: string[]) => void;
}

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

  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'upload'>('qr');

  // Manual Desktop Upload State
  const [desktopFiles, setDesktopFiles] = useState<{
    front: File | null;
    side: File | null;
    back: File | null;
  }>({ front: null, side: null, back: null });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const initSession = async () => {
    if (!currentModel) return;
    setLoading(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setRejectionData(null);
    setUpgradeRequired(false);
    hasTriggeredRef.current = false;

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

  useEffect(() => {
    if (!isOpen || !session || analysisResult || analyzing || upgradeRequired || rejectionData || hasTriggeredRef.current) return;

    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 60;

    pollingRef.current = setInterval(async () => {
      pollAttempts += 1;
      if (pollAttempts > MAX_POLL_ATTEMPTS || hasTriggeredRef.current) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      try {
        const updated = await tradeinAiService.getSession(session.id);
        if (!updated) return;

        if (updated.status !== session.status) {
          setSession(updated);
        }

        if (updated.status === 'photos_received' && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          runAiAnalysis(updated.id);
        }
      } catch (e) {
        // Silenciar
      }
    }, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, session?.id, session?.status, analysisResult, analyzing, upgradeRequired, rejectionData]);

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
    onApplyDetectedFaults(analysisResult.detectedPresetIds);
    toast.success(`${analysisResult.detectedPresetIds.length} avarias aplicadas à cotação!`);
    onClose();
  };

  if (!isOpen) return null;

  const mobileCaptureUrl = session 
    ? `${window.location.origin}/tradein/camera/${session.session_token}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#060a16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090f1f]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-[#00D287]/20 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Avaliação Visual Automática com IA
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 font-black uppercase">
                  CellHub IA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aparelho: <strong className="text-white font-bold">{currentModel?.brand} {currentModel?.model_name}</strong> ({currentModel?.storage})
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
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
                      return (
                        <div key={id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                          <span className="text-white font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            {preset?.label || id}
                          </span>
                          <span className="text-red-400 font-bold">
                            - R$ {preset?.defaultDiscount || 0}
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
            /* Initial QR Code / Upload View */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-[#040711] p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'qr'
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Escanear QR Code (Celular)
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Enviar Fotos do Computador
                </button>
              </div>

              {activeTab === 'qr' ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
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
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Selecione as 3 fotos do aparelho salvas no computador:
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
