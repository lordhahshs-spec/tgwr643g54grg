import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Camera, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  UploadCloud,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tradeinAiService } from '@/services/tradeinAiService';
import { AiEvaluationSession } from '@/types/tradeinAi';
import { toast } from 'sonner';

type PhotoStep = 'front' | 'side' | 'back';

interface CapturedPhoto {
  file: File;
  previewUrl: string;
}

export default function TradeInCameraPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<AiEvaluationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<PhotoStep>('front');
  const [photos, setPhotos] = useState<Record<PhotoStep, CapturedPhoto | null>>({
    front: null,
    side: null,
    back: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) {
        setErrorMsg('Código da sessão inválido.');
        setLoading(false);
        return;
      }

      const s = await tradeinAiService.getSession(sessionId);
      if (!s) {
        setErrorMsg('Sessão expirada ou não encontrada. Por favor, gere um novo QR Code no computador.');
        setLoading(false);
        return;
      }

      if (new Date(s.expires_at).getTime() < Date.now()) {
        setErrorMsg('Esta sessão expirou. Gere um novo QR Code na tela da loja.');
        setLoading(false);
        return;
      }

      setSession(s);
      setLoading(false);

      // Notificar que o celular conectou
      tradeinAiService.updateSessionStatus(s.id, 'phone_connected');
    }

    loadSession();
  }, [sessionId]);

  const handleCaptureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotos(prev => ({
      ...prev,
      [currentStep]: { file, previewUrl }
    }));

    // Avançar automaticamente para a próxima foto
    if (currentStep === 'front') {
      setCurrentStep('side');
    } else if (currentStep === 'side') {
      setCurrentStep('back');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAll = async () => {
    if (!photos.front || !photos.side || !photos.back || !session) {
      toast.error('Por favor, tire as 3 fotografias solicitadas.');
      return;
    }

    setIsUploading(true);
    try {
      const itemsToUpload: { type: 'front' | 'side' | 'back'; file: File }[] = [
        { type: 'front', file: photos.front.file },
        { type: 'side', file: photos.side.file },
        { type: 'back', file: photos.back.file }
      ];

      const res = await tradeinAiService.uploadPhotosForSession(session.id, itemsToUpload);
      if (res.success) {
        setIsCompleted(true);
        toast.success('Fotos enviadas com sucesso!');
      } else {
        toast.error(res.error || 'Erro no envio das fotos.');
      }
    } catch (err) {
      toast.error('Erro ao enviar fotografias.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-slate-300 font-bold">Conectando com a CellHub IA...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Atenção</h2>
        <p className="text-xs text-slate-300 max-w-xs">{errorMsg}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Fotos Enviadas com Sucesso!</h2>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            A <strong>CellHub IA</strong> já está processando o diagnóstico visual do <span className="text-blue-400 font-bold">{session.brand} {session.model_name}</span> na tela da loja.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 text-xs text-slate-400 max-w-xs space-y-1">
          <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Diagnóstico em andamento
          </p>
          <p>Você já pode olhar para a tela do computador para ver o resultado.</p>
        </div>
      </div>
    );
  }

  const stepLabels: Record<PhotoStep, { title: string; desc: string; icon: string }> = {
    front: {
      title: '1. Foto Frontal (Tela)',
      desc: 'Enquadre a tela inteira do aparelho em um ambiente bem iluminado.',
      icon: '📱'
    },
    side: {
      title: '2. Foto Lateral / Moldura',
      desc: 'Fotografe as laterais, cantos e botões para verificar marcas ou trincas.',
      icon: '📐'
    },
    back: {
      title: '3. Foto Traseira (Carcaça & Câmeras)',
      desc: 'Enquadre a tampa traseira e as lentes das câmeras.',
      icon: '📸'
    }
  };

  const allPhotosTaken = Boolean(photos.front && photos.side && photos.back);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Hidden File Input for Native Camera Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="pt-2 pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white uppercase tracking-wider">CellHub IA • Câmera</h1>
            <p className="text-[11px] text-slate-400">{session.brand} {session.model_name} ({session.storage})</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Conectado
        </div>
      </div>

      {/* Main Step Photo Capture Box */}
      <div className="my-auto py-4 space-y-4">
        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {(['front', 'side', 'back'] as PhotoStep[]).map((st, idx) => {
            const isDone = Boolean(photos[st]);
            const isCurrent = currentStep === st;

            return (
              <button
                key={st}
                onClick={() => setCurrentStep(st)}
                className={`p-2 rounded-xl text-center border transition-all text-xs flex flex-col items-center gap-1 ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-500/10 text-white font-bold'
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium'
                    : 'border-slate-800 bg-[#0f172a] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="text-[10px] capitalize">{st === 'front' ? 'Tela' : st === 'side' ? 'Lateral' : 'Traseira'}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Guidance Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
          <div className="text-3xl">{stepLabels[currentStep].icon}</div>
          <h3 className="text-sm font-bold text-white">{stepLabels[currentStep].title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {stepLabels[currentStep].desc}
          </p>
        </div>

        {/* Photo Preview / Camera Trigger */}
        <div className="relative aspect-[4/3] rounded-2xl bg-[#080c17] border-2 border-dashed border-slate-700 overflow-hidden flex flex-col items-center justify-center">
          {photos[currentStep] ? (
            <>
              <img
                src={photos[currentStep]!.previewUrl}
                alt={currentStep}
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleCaptureClick}
                className="absolute bottom-3 bg-black/70 backdrop-blur-sm border border-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" /> Tirar Novamente
              </button>
            </>
          ) : (
            <button
              onClick={handleCaptureClick}
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 active:bg-slate-800/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-600/20 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Tirar Foto Agora</span>
                <span className="text-[11px] text-slate-400">Toque para abrir a câmera</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-3 pb-2 space-y-2 border-t border-slate-800/80">
        {allPhotosTaken ? (
          <Button
            onClick={handleUploadAll}
            disabled={isUploading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm h-12 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Enviando Fotos para a IA...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Concluir & Enviar para Avaliação IA
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleCaptureClick}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-12 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Tirar Foto ({currentStep === 'front' ? 'Frente' : currentStep === 'side' ? 'Lateral' : 'Traseira'})
          </Button>
        )}

        <p className="text-[10px] text-slate-500 text-center">
          CellHub IA • Diagnóstico visual seguro e criptografado
        </p>
      </div>
    </div>
  );
}
