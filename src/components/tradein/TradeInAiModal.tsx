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
  Trash2
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
      hasTriggeredRef.current = false;
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, currentModel?.id]);

  // Polling para acompanhar o celular conectado e recebimento das fotos
  useEffect(() => {
    if (!isOpen || !session || analysisResult || analyzing || upgradeRequired || hasTriggeredRef.current) return;

    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 60; // 3 minutos

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

        // Se o celular terminou de subir as fotos e ainda não disparou
        if (updated.status === 'photos_received' && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          runAiAnalysis(updated.id);
        }
      } catch (e) {
        // Silenciar erros transitórios de polling
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, session?.id, session?.status, analysisResult, analyzing, upgradeRequired]);

  const handleCancelSession = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    hasTriggeredRef.current = true;

    if (session?.id) {
      await tradeinAiService.cancelSession(session.id);
      toast.info('Sessão cancelada.');
    }
    onClose();
  };

  const runAiAnalysis = async (sessionId?: string) => {
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await tradeinAiService.triggerEvaluation({
        sessionId: sessionId || session?.id,
        userId,
        brand: currentModel?.brand,
        modelName: currentModel?.model_name,
        allowedPresets: brandPresets
      });

      if (res.success && res.detectedPresetIds) {
        setAnalysisResult({
          detectedPresetIds: res.detectedPresetIds,
          visualSummary: res.visualSummary || [],
          confidence: res.confidence || 'high',
          tierUsed: res.tierUsed
        });
        toast.success('Análise visual concluída com sucesso!');
      } else if (res.requiresUpgrade) {
        setUpgradeRequired(true);
      } else {
        setAnalysisError(res.message || 'Instabilidade momentânea no processamento visual.');
      }
    } catch (err: any) {
      setAnalysisError('Instabilidade momentânea no processamento da IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload Manual pelo Computador
  const handleManualUploadSubmit = async () => {
    if (!desktopFiles.front || !desktopFiles.side || !desktopFiles.back || !session) {
      toast.error('Por favor, selecione as 3 fotos (Frontal, Lateral e Traseira).');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

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
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#1e293b]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md shadow-blue-600/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Avaliação Visual Automática com IA
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold uppercase">
                  CellHub IA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aparelho: <strong className="text-slate-200">{currentModel?.brand} {currentModel?.model_name}</strong> ({currentModel?.storage})
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Iniciando sessão segura da CellHub IA...</p>
            </div>
          ) : upgradeRequired ? (
            /* Quota Exceeded Block */
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-amber-500/30 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Limite de Análises Gratuitas Atingido</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Você utilizou todas as suas análises gratuitas deste período. Para continuar realizando diagnósticos automáticos por inteligência artificial, ative a <strong>CellHub IA Ilimitada</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-slate-800 max-w-xs mx-auto text-xs space-y-1">
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
          ) : analysisError ? (
            /* Error with direct Retry Button without losing photos */
            <div className="p-6 rounded-3xl bg-[#1e293b] border border-amber-500/40 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Instabilidade Momentânea na IA</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {analysisError}. As fotos já estão salvas com segurança no sistema. Clique abaixo para reprocessar o laudo.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  onClick={() => runAiAnalysis(session?.id)}
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-11 px-6 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                  {analyzing ? 'Reprocessando...' : 'Tentar Processar Novamente'}
                </Button>

                <Button
                  variant="outline"
                  onClick={initSession}
                  className="border-slate-700 bg-slate-800 text-slate-300 text-xs h-11 rounded-2xl"
                >
                  Gerar Novo QR Code
                </Button>
              </div>
            </div>
          ) : analysisResult ? (
            /* Result Screen */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
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
                <div className="p-3.5 rounded-xl bg-[#1e293b] border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <span className="text-[11px] font-bold uppercase text-blue-400 tracking-wider block">
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
                  <div className="p-4 rounded-xl bg-[#1e293b] border border-slate-800 text-center text-xs text-emerald-400 font-medium">
                    ✨ Nenhuma avaria ou trinco visual significativo detectado nas fotos! O aparelho aparenta excelente estado de conservação.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-[#0a0f1d] max-h-48 overflow-y-auto scrollbar-thin">
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
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={initSession}
                  className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs h-10"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tirar Novas Fotos
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm h-10 px-5 rounded-xl shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aplicar Avarias na Cotação
                </Button>
              </div>
            </div>
          ) : analyzing ? (
            /* Analyzing Loader */
            <div className="py-14 text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
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
                  className="border-slate-800 text-slate-400 hover:text-red-400 text-xs rounded-xl h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancelar esta Sessão
                </Button>
              </div>
            </div>
          ) : (
            /* Initial QR Code / Upload View */
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="grid grid-cols-2 gap-2 bg-[#0a0f1d] p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'qr'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Escanear QR Code (Celular)
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Enviar Fotos do Computador
                </button>
              </div>

              {activeTab === 'qr' ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* QR Code Container */}
                  <div className="sm:col-span-6 flex flex-col items-center justify-center p-4 rounded-3xl bg-white text-black shadow-xl mx-auto">
                    <QRCodeDisplay
                      value={mobileCaptureUrl}
                      size={180}
                    />
                    <span className="text-[11px] font-bold text-slate-700 mt-2 text-center">
                      Aponte a câmera do seu smartphone
                    </span>
                  </div>

                  {/* Instructions & Status */}
                  <div className="sm:col-span-6 space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" /> Como Funciona:
                      </span>
                      <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>Abra a câmera do seu celular e escaneie o QR Code ao lado.</li>
                        <li>Tire as 3 fotos do aparelho (Frente, Lateral e Traseira).</li>
                        <li>A <strong>CellHub IA</strong> analisará as imagens instantaneamente e marcará as avarias.</li>
                      </ol>
                    </div>

                    {/* Status Live Indicator */}
                    <div className="p-3 rounded-2xl bg-[#1e293b] border border-slate-800 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></div>
                      <span className="text-xs font-bold text-slate-200">
                        {session?.status === 'phone_connected' 
                          ? 'Celular conectado! Aguardando envio das fotos...' 
                          : 'Aguardando leitura do QR Code...'}
                      </span>
                    </div>

                    {quota && (
                      <p className="text-[11px] text-slate-400">
                        Franquia gratuita: <strong className="text-blue-400">{quota.remainingFree} restantes</strong> hoje (limite de {quota.freeLimit}).
                      </p>
                    )}

                    {/* Cancel button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSession}
                      className="w-full border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 text-xs font-semibold rounded-xl h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Cancelar esta Sessão
                    </Button>
                  </div>
                </div>
              ) : (
                /* Desktop Upload Form */
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Selecione as 3 fotos do aparelho salvas no computador:
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {(['front', 'side', 'back'] as const).map(type => (
                      <label 
                        key={type}
                        className="p-3 rounded-2xl border border-dashed border-slate-700 bg-[#1e293b]/70 hover:bg-[#1e293b] text-center cursor-pointer flex flex-col items-center justify-center space-y-1 text-xs"
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
                        <Upload className="w-4 h-4 text-blue-400" />
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
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-11 rounded-2xl shadow-lg shadow-blue-600/30"
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
