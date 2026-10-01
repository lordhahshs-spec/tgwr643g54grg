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
  Check, 
  Ban, 
  XCircle, 
  Lock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tradeinAiService } from '@/services/tradeinAiService';
import { AiEvaluationSession } from '@/types/tradeinAi';
import { toast } from 'sonner';

type PhotoStep = 'front' | 'side' | 'back';

interface CapturedPhoto {
  file: Blob;
  previewUrl: string;
}

// Compactador rápido de fotos no navegador mobile (HTML5 Canvas)
async function compressImage(file: File, maxDimension = 1280, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
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
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) {
        setErrorMsg('Código da sessão inválido.');
        setLoading(false);
        return;
      }

      const localSubmitted = sessionStorage.getItem(`submitted_${sessionId}`);
      if (localSubmitted) {
        setIsCompleted(true);
        setLoading(false);
        return;
      }

      const s = await tradeinAiService.getSession(sessionId);
      if (!s) {
        setErrorMsg('Sessão expirada ou não encontrada. Gere um novo QR Code na tela da loja.');
        setLoading(false);
        return;
      }

      if (s.status === 'cancelled') {
        setIsCancelled(true);
        setLoading(false);
        return;
      }

      if (['photos_received', 'analyzing', 'completed'].includes(s.status) || (s.photos && s.photos.length > 0)) {
        setIsCompleted(true);
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

      if (s.status === 'waiting_for_phone') {
        tradeinAiService.updateSessionStatus(s.id, 'phone_connected');
      }
    }

    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || isCompleted || isCancelled) return;

    statusPollingRef.current = setInterval(async () => {
      try {
        const s = await tradeinAiService.getSession(sessionId);
        if (!s) return;

        if (s.status === 'cancelled') {
          setIsCancelled(true);
          if (statusPollingRef.current) clearInterval(statusPollingRef.current);
        } else if (['photos_received', 'analyzing', 'completed'].includes(s.status)) {
          setIsCompleted(true);
          if (statusPollingRef.current) clearInterval(statusPollingRef.current);
        }
      } catch (err) {
        // Silenciar
      }
    }, 1500);

    return () => {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    };
  }, [sessionId, isCompleted, isCancelled]);

  const stepMeta: Record<PhotoStep, { title: string; desc: string; tip: string; next: PhotoStep | null }> = {
    front: {
      title: '1. Foto Frontal (Tela do Celular)',
      desc: 'Fotografe a tela inteira do smartphone de frente.',
      tip: 'Atenção: Aponte apenas para o smartphone com a tela enquadrada.',
      next: 'side'
    },
    side: {
      title: '2. Foto das Laterais / Bordas',
      desc: 'Fotografe as quinas e bordas de alumínio/vidro.',
      tip: 'Mostre marcas de queda, amassados ou arranhões nas laterais.',
      next: 'back'
    },
    back: {
      title: '3. Foto da Traseira e Câmeras',
      desc: 'Fotografe a tampa traseira e o bloco de câmeras.',
      tip: 'Enquadre bem a tampa e as lentes de câmera do smartphone.',
      next: null
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgressText('Otimizando foto...');
      const compressedBlob = await compressImage(file, 1280, 0.8);
      const previewUrl = URL.createObjectURL(compressedBlob);

      setPhotos(prev => ({
        ...prev,
        [currentStep]: {
          file: compressedBlob,
          previewUrl
        }
      }));

      const next = stepMeta[currentStep].next;
      if (next) {
        setCurrentStep(next);
      }
      setUploadProgressText('');
    } catch (err) {
      toast.error('Erro ao processar imagem.');
      setUploadProgressText('');
    }
  };

  const handleFinishAndUpload = async () => {
    if (!photos.front || !photos.side || !photos.back || !session) {
      toast.error('Por favor, tire as 3 fotografias do smartphone.');
      return;
    }

    if (isCancelled || isCompleted) {
      toast.error('Esta sessão já foi concluída ou cancelada.');
      return;
    }

    setIsUploading(true);
    setUploadProgressText('Enviando fotos otimizadas para o computador...');

    try {
      const itemsToUpload = [
        { type: 'front' as const, file: photos.front.file },
        { type: 'side' as const, file: photos.side.file },
        { type: 'back' as const, file: photos.back.file }
      ];

      const res = await tradeinAiService.uploadPhotosForSession(session.id, itemsToUpload);

      if (res.success) {
        sessionStorage.setItem(`submitted_${sessionId}`, 'true');
        setIsCompleted(true);
        if (statusPollingRef.current) clearInterval(statusPollingRef.current);
        toast.success('Fotos enviadas com sucesso!');
      } else {
        toast.error(res.error || 'Erro ao enviar fotos.');
      }
    } catch (err: any) {
      toast.error('Erro de conexão ao enviar fotos.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040711] flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#00D287] animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Conectando à sessão da loja...</p>
        </div>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-[#040711] flex items-center justify-center p-5 text-white">
        <div className="max-w-sm w-full bg-[#060a16] border border-red-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white">Sessão Cancelada no Computador</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              O lojista cancelou ou fechou esta sessão no computador. Esta página foi desativada por segurança.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block bg-[#0c1424] p-2.5 rounded-xl border border-white/5">
              Gere um novo QR Code na tela da loja para realizar uma nova avaliação.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#040711] flex items-center justify-center p-5 text-white">
        <div className="max-w-sm w-full bg-[#060a16] border border-red-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Atenção</h2>
            <p className="text-xs text-slate-400">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#040711] flex items-center justify-center p-5 text-white">
        <div className="max-w-sm w-full bg-[#060a16] border border-[#00D287]/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white">Fotos Enviadas com Sucesso!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              As fotos deste smartphone já foram enviadas e processadas pelo sistema da loja.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c1424] border border-white/10 text-xs space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[#00D287] font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Sessão Concluída & Bloqueada</span>
            </div>
            <span className="text-[11px] text-slate-400 block pt-1">
              Para avaliar outro smartphone, gere um novo QR Code na tela da loja.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const allPhotosCaptured = Boolean(photos.front && photos.side && photos.back);

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between bg-[#060a16] p-3.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">CellHub IA • Câmera</span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {session?.brand} {session?.model_name}
              </span>
            </div>
          </div>

          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 font-black">
            Sessão Ativa
          </span>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {(['front', 'side', 'back'] as PhotoStep[]).map((step, idx) => {
            const hasPhoto = Boolean(photos[step]);
            const isCurrent = currentStep === step;

            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                  hasPhoto
                    ? 'bg-[#00D287]/15 border-[#00D287]/40 text-[#00D287]'
                    : isCurrent
                    ? 'bg-[#00D287] border-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20'
                    : 'bg-[#060a16] border-white/10 text-slate-400'
                }`}
              >
                {hasPhoto ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                <span>{step === 'front' ? 'Frente' : step === 'side' ? 'Laterais' : 'Traseira'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Capture Frame */}
      <div className="my-4 bg-[#060a16] border border-white/10 rounded-3xl p-5 text-center space-y-4 shadow-xl flex-1 flex flex-col justify-center">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white">{stepMeta[currentStep].title}</h3>
          <p className="text-xs text-slate-300">{stepMeta[currentStep].desc}</p>
        </div>

        {/* Photo Preview / Placeholder Box */}
        <div className="relative aspect-[4/3] rounded-2xl bg-[#040711] border-2 border-dashed border-white/15 flex flex-col items-center justify-center overflow-hidden">
          {photos[currentStep] ? (
            <>
              <img
                src={photos[currentStep]!.previewUrl}
                alt={currentStep}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#060a16]/95 text-white font-bold text-xs rounded-xl border border-white/20 shadow-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tirar Novamente
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-[11px] text-slate-400">{stepMeta[currentStep].tip}</p>
            </div>
          )}
        </div>

        {/* Hidden Camera Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        {/* Trigger Camera Button */}
        {!photos[currentStep] && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs h-12 rounded-2xl shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 text-sm"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            Tirar Foto do Aparelho
          </Button>
        )}
      </div>

      {/* Bottom Finish Button */}
      <div className="space-y-2 pb-2">
        {uploadProgressText && (
          <p className="text-[11px] text-[#00D287] text-center font-bold animate-pulse">
            {uploadProgressText}
          </p>
        )}

        <Button
          onClick={handleFinishAndUpload}
          disabled={!allPhotosCaptured || isUploading}
          className={`w-full font-black text-xs sm:text-sm h-12 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${
            allPhotosCaptured
              ? 'bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black scale-[1.02] shadow-[#00D287]/30'
              : 'bg-[#0c1424] text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              Enviando Fotos com IA...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              {allPhotosCaptured ? 'Enviar Fotos para Avaliação' : 'Tire as 3 fotos para concluir'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
