import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Printer, 
  Share2, 
  PenTool, 
  RotateCcw, 
  ShieldCheck, 
  Smartphone,
  User,
  MapPin,
  Calendar,
  Lock,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TradeInEvaluation, CustomerData, ValuationSettings } from '@/types/tradein';
import { toast } from 'sonner';

interface ResponsibilityTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Partial<TradeInEvaluation> | null;
  settings?: ValuationSettings;
  onConfirmSave: (customerData: CustomerData, signatureData: string) => Promise<TradeInEvaluation | null>;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  settings,
  onConfirmSave
}) => {
  const [step, setStep] = useState<'form' | 'sign' | 'complete'>('form');
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    cpf: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    state: 'SP'
  });
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [savedEvaluation, setSavedEvaluation] = useState<TradeInEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setHasSignature(false);
      setSignatureImage('');
      setSavedEvaluation(null);
    }
  }, [isOpen]);

  if (!isOpen || !evaluation) return null;

  // Format CPF
  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    setCustomer(prev => ({ ...prev, cpf: formatted }));
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleProceedToSign = () => {
    if (!customer.name.trim() || !customer.cpf.trim() || !customer.phone.trim()) {
      toast.error('Preencha Nome, CPF e Telefone do vendedor para continuar.');
      return;
    }
    setStep('sign');
  };

  const handleFinalizeDocument = async () => {
    if (!hasSignature && !signatureImage) {
      toast.error('Por favor, colete a assinatura na tela.');
      return;
    }

    const canvas = canvasRef.current;
    let finalSign = signatureImage;
    if (canvas && hasSignature) {
      finalSign = canvas.toDataURL('image/png');
      setSignatureImage(finalSign);
    }

    setIsSaving(true);
    try {
      const result = await onConfirmSave(customer, finalSign);
      if (result) {
        setSavedEvaluation(result);
        setStep('complete');
        toast.success('Termo de responsabilidade gerado e salvo com sucesso!');
      }
    } catch (err) {
      toast.error('Erro ao gerar documento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const evaluationCode = savedEvaluation?.evaluation_code || evaluation.evaluation_code || 'AV-2025-PEND';
  const qrVerificationUrl = `https://cellhub.app/verificar/${evaluationCode}`;
  const storeName = settings?.store_name || 'CellHub Lojista';
  const termsText = settings?.terms_text || 'Declaro para os devidos fins que sou o legítimo proprietário do aparelho acima qualificado, respondendo civil e criminalmente pela procedência lícita do mesmo, atestando que o mesmo não é fruto de furto, roubo ou qualquer ilícito.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080c17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00D287]/10 border border-[#00D287]/30 flex items-center justify-center text-[#00D287]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Termo de Responsabilidade & Procedência
              </h2>
              <p className="text-xs text-slate-400">
                Documento legal de compra/recebimento de seminovo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: Customer Data */}
          {step === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary of evaluated device */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Aparelho Avaliado:</span>
                    <strong className="text-sm text-white font-bold">
                      {evaluation.brand} {evaluation.model_name} {evaluation.storage}
                    </strong>
                    {evaluation.imei && (
                      <span className="text-[11px] text-slate-400 block">IMEI: {evaluation.imei}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Negociado</span>
                  <span className="text-base font-black text-[#00D287]">
                    R$ {(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00D287]" />
                  Dados do Vendedor / Cliente
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Nome Completo:</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João da Silva Santos"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">CPF:</label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">WhatsApp / Telefone:</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Data de Nascimento (Opcional):</label>
                    <Input
                      type="date"
                      value={customer.birthDate || ''}
                      onChange={(e) => setCustomer(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Cidade / UF:</label>
                    <Input
                      value={customer.city || ''}
                      onChange={(e) => setCustomer(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Ex: São Paulo / SP"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Endereço Residencial (Opcional):</label>
                    <Input
                      value={customer.address || ''}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, bairro"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-slate-400 text-xs">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Os dados do cliente ficam protegidos e salvos exclusivamente para fins de garantia jurídica da procedência do aparelho no balcão da loja.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Signature on screen */}
          {step === 'sign' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">Cláusula de Procedência:</span>
                "{termsText}"
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#00D287]" />
                    Assinatura do Vendedor / Cliente na Tela:
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-[#00D287] rounded-xl overflow-hidden bg-white touch-none">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[180px] cursor-crosshair bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1.5 text-center">
                  ✍️ Assine com o dedo no celular/tablet ou com o mouse no computador.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Vendedor:</span>
                  <span className="text-white font-bold">{customer.name} (CPF: {customer.cpf})</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Pronto para validação
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 3: Complete Print/Share Document View */}
          {step === 'complete' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200 print:m-0 print:p-0">
              <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-md space-y-4 text-xs font-sans print:shadow-none print:border-none">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div>
                    <h3 className="text-base font-black tracking-tight text-slate-900">{storeName}</h3>
                    <p className="text-[11px] text-slate-600">Comprovante de Compra & Termo de Procedência</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono font-bold text-xs">
                      {evaluationCode}
                    </Badge>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Device Info */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Aparelho Adquirido</span>
                    <strong className="text-xs text-slate-900">{evaluation.brand} {evaluation.model_name} {evaluation.storage}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">IMEI Registrado</span>
                    <strong className="text-xs text-slate-900 font-mono">{evaluation.imei || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Tipo de Operação</span>
                    <span className="capitalize font-semibold text-slate-800">{evaluation.type === 'troca' ? 'Troca / Trade-In' : 'Compra Direta'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Pago / Creditado</span>
                    <strong className="text-sm font-black text-emerald-700">
                      R$ {(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t border-slate-200 pt-2 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Qualificação do Vendedor</span>
                  <p className="text-slate-800">
                    <strong>Nome:</strong> {customer.name} | <strong>CPF:</strong> {customer.cpf} | <strong>Tel:</strong> {customer.phone}
                  </p>
                  {customer.city && (
                    <p className="text-slate-700"><strong>Endereço:</strong> {customer.address || ''} - {customer.city}</p>
                  )}
                </div>

                {/* Legal Statement */}
                <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-600 leading-relaxed italic">
                  "{termsText}"
                </div>

                {/* Signature & Security Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-end justify-between">
                  <div className="text-center w-52">
                    {signatureImage ? (
                      <img src={signatureImage} alt="Assinatura" className="h-12 mx-auto object-contain" />
                    ) : (
                      <div className="h-12 border-b border-slate-400" />
                    )}
                    <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800">
                      {customer.name}
                    </div>
                    <span className="text-[9px] text-slate-500">Assinatura Eletrônica Registrada</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 rounded border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(qrVerificationUrl)}`}
                      alt="QR Code de Verificação"
                      className="w-14 h-14"
                    />
                    <span className="text-[8px] text-slate-500 mt-1 font-mono">Autenticidade: {evaluationCode}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          {step === 'form' && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProceedToSign}
                className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold"
              >
                Prosseguir para Assinatura →
              </Button>
            </>
          )}

          {step === 'sign' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                className="border-slate-800 text-slate-300 hover:text-white"
              >
                ← Voltar aos Dados
              </Button>
              <Button
                onClick={handleFinalizeDocument}
                disabled={isSaving}
                className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold"
              >
                {isSaving ? 'Gerando Documento...' : 'Confirmar e Gerar Termo'}
              </Button>
            </>
          )}

          {step === 'complete' && (
            <>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="border-slate-700 text-slate-200 hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#00D287]" /> Imprimir / Salvar PDF
              </Button>
              <Button
                onClick={onClose}
                className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold"
              >
                Concluir Avaliação ✓
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
