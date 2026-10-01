import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Printer, 
  PenTool, 
  RotateCcw, 
  ShieldCheck, 
  Smartphone,
  User,
  MapPin,
  Lock,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TradeInEvaluation, CustomerData, ValuationSettings } from '@/types/tradein';
import { DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { toast } from 'sonner';

interface ResponsibilityTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Partial<TradeInEvaluation> | null;
  settings?: ValuationSettings;
  onConfirmSave: (customerData: CustomerData, signatureData: string, imei: string) => Promise<TradeInEvaluation | null>;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  settings,
  onConfirmSave
}) => {
  const [step, setStep] = useState<'form' | 'sign' | 'complete'>('form');
  const [imei, setImei] = useState<string>('');
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
      setImei(evaluation?.imei || '');
    }
  }, [isOpen, evaluation]);

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
    if (!imei.trim() || imei.trim().length < 8) {
      toast.error('Informe o IMEI do aparelho para validar o termo jurídico de procedência.');
      return;
    }
    if (!customer.name.trim() || !customer.cpf.trim() || !customer.phone.trim()) {
      toast.error('Preencha Nome, CPF e Telefone do vendedor do aparelho.');
      return;
    }
    setStep('sign');
  };

  const handleFinalizeDocument = async () => {
    const canvas = canvasRef.current;
    let finalSign = signatureImage;
    if (canvas && hasSignature) {
      finalSign = canvas.toDataURL('image/png');
      setSignatureImage(finalSign);
    }

    setIsSaving(true);
    try {
      const result = await onConfirmSave(customer, finalSign, imei.trim());
      if (result) {
        setSavedEvaluation(result);
        setStep('complete');
        toast.success('Termo de compra e responsabilidade salvo com sucesso!');
      }
    } catch (err) {
      toast.error('Erro ao gerar termo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const evaluationCode = savedEvaluation?.evaluation_code || evaluation.evaluation_code || 'REC-2025-PEND';
  const qrVerificationUrl = `https://cellhub.app/verificar/${evaluationCode}`;
  const storeName = settings?.store_name || 'Minha Loja de Celulares';
  const storeCnpj = settings?.store_cnpj || '';
  const storeAddress = settings?.store_address || '';
  const termsText = settings?.terms_text || DEFAULT_LEGAL_TERMS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080c17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0">
        
        {/* Modal Header (Hidden during Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Termo de Compra & Responsabilidade de Procedência
              </h2>
              <p className="text-xs text-slate-400">
                Resguardo jurídico completo contra receptação e garantia de posse lícita
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 print:p-0 print:overflow-visible">
          {/* STEP 1: IMEI & Customer Information */}
          {step === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Device Overview Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Aparelho Negociado:</span>
                    <strong className="text-xs sm:text-sm text-white font-bold">
                      {evaluation.brand} {evaluation.model_name} {evaluation.storage}
                    </strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor da Compra</span>
                  <span className="text-sm sm:text-base font-black text-blue-400">
                    R$ {(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Mandatory IMEI for Legal Term */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1.5">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Número de IMEI do Aparelho (Obrigatório para o termo):
                </label>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Digite os 15 dígitos do IMEI (Disque *#06# no celular)"
                  maxLength={15}
                  className="bg-slate-950 border-blue-500/40 text-xs sm:text-sm text-white font-mono rounded-xl focus:border-blue-400"
                />
                <span className="text-[10px] text-slate-400 block">
                  Identificador único do aparelho para assegurar o registro contra furto/bloqueio.
                </span>
              </div>

              {/* Customer Qualification Form */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Qualificação do Vendedor (Cliente que está entregando o aparelho)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Nome Completo do Vendedor:</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-blue-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">CPF do Vendedor:</label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-blue-500 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Telefone / WhatsApp:</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-blue-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Cidade / UF:</label>
                    <Input
                      value={customer.city || ''}
                      onChange={(e) => setCustomer(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Ex: São Paulo / SP"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-blue-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Endereço Residencial (Opcional):</label>
                    <Input
                      value={customer.address || ''}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, bairro"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400 text-xs">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Este documento fica arquivado digitalmente no banco de dados da sua loja para proteção legal futura.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Signature on Screen */}
          {step === 'sign' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-line font-sans">
                {termsText}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-400" />
                    Assinatura do Cliente na Tela:
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar Assinatura
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl overflow-hidden bg-white touch-none">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[160px] cursor-crosshair bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1.5 text-center">
                  ✍️ O cliente pode assinar com o dedo no celular/tablet ou você pode imprimir para assinatura física na próxima etapa.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Vendedor:</span>
                  <span className="text-white font-bold">{customer.name} (CPF: {customer.cpf})</span>
                </div>
                <span className="text-xs font-mono text-slate-300">IMEI: {imei}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Printable Document Layout */}
          {step === 'complete' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200 print:m-0 print:p-0">
              {/* Document for Screen and Print */}
              <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-xl space-y-4 text-xs font-sans print:shadow-none print:border-none print:p-0">
                {/* Store Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">{storeName}</h1>
                    {storeCnpj && <p className="text-[10px] text-slate-600 font-mono">CNPJ/CPF: {storeCnpj}</p>}
                    {storeAddress && <p className="text-[10px] text-slate-600">{storeAddress}</p>}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-slate-900 text-white font-mono font-bold text-xs">
                      {evaluationCode}
                    </Badge>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1 bg-slate-100 rounded border border-slate-200 font-bold uppercase text-[11px] text-slate-800">
                  Termo de Compra de Smartphone Usado & Declaração de Procedência
                </div>

                {/* Grid: Device Specs & Financial Values */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Aparelho Adquirido</span>
                    <strong className="text-xs text-slate-950">{evaluation.brand} {evaluation.model_name} {evaluation.storage}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Número do IMEI (Identificador)</span>
                    <strong className="text-xs text-slate-950 font-mono">{imei}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Tipo de Transação</span>
                    <span className="font-semibold text-slate-800">
                      {evaluation.type === 'troca' ? 'Troca / Abatimento na Compra' : 'Compra Direta pela Loja'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Valor Pago / Creditado</span>
                    <strong className="text-sm font-black text-emerald-700">
                      R$ {(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Customer Qualification */}
                <div className="border border-slate-200 bg-slate-50/60 p-3 rounded-lg space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Qualificação do Vendedor (Cliente)</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-800">
                    <div><strong>Nome:</strong> {customer.name}</div>
                    <div><strong>CPF:</strong> {customer.cpf}</div>
                    <div><strong>Telefone:</strong> {customer.phone}</div>
                    <div><strong>Cidade/UF:</strong> {customer.city || 'Não informado'}</div>
                    {customer.address && <div className="col-span-2"><strong>Endereço:</strong> {customer.address}</div>}
                  </div>
                </div>

                {/* Complete Legal Protection Clause */}
                <div className="border-t border-slate-200 pt-2 text-[9.5px] text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                  {termsText}
                </div>

                {/* Signatures & QR Code Section */}
                <div className="border-t-2 border-slate-300 pt-4 grid grid-cols-12 gap-3 items-end">
                  {/* Customer Signature */}
                  <div className="col-span-8 text-center space-y-1">
                    <div className="h-14 flex items-end justify-center">
                      {signatureImage ? (
                        <img src={signatureImage} alt="Assinatura" className="h-12 object-contain" />
                      ) : (
                        <div className="w-full border-b border-slate-500 mb-1" />
                      )}
                    </div>
                    <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-900">
                      {customer.name} (CPF: {customer.cpf})
                    </div>
                    <span className="text-[8.5px] text-slate-500 uppercase block">Assinatura do Vendedor / Proprietário</span>
                  </div>

                  {/* QR Code Verification */}
                  <div className="col-span-4 flex flex-col items-center text-center p-1.5 bg-slate-50 rounded border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${encodeURIComponent(qrVerificationUrl)}`}
                      alt="QR Code"
                      className="w-12 h-12"
                    />
                    <span className="text-[8px] text-slate-500 mt-1 font-mono font-bold">{evaluationCode}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions (Hidden during print) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 print:hidden">
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
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
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
                ← Voltar
              </Button>
              <Button
                onClick={handleFinalizeDocument}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {isSaving ? 'Salvando Termo...' : 'Gerar Termo de Compra'}
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
                <Printer className="w-4 h-4 text-blue-400" /> Imprimir Termo (A4 / PDF)
              </Button>
              <Button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Concluir e Fechar ✓
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
