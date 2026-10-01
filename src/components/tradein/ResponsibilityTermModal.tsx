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
      toast.error('Informe o IMEI do aparelho para validar o termo jurídico.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#11161d] border border-[#252d37] rounded-xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0">
        
        {/* Header (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-[#252d37] bg-[#171d25] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#16b981] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#f3f5f7] tracking-tight">
                Termo de Compra & Responsabilidade de Procedência
              </h2>
              <p className="text-xs text-[#a3adb8]">
                Resguardo legal com qualificação do cliente e registro de IMEI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#11161d] border border-[#252d37] text-[#a3adb8] hover:text-white hover:bg-[#252d37] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-[#252d37] print:p-0 print:overflow-visible">
          {/* STEP 1: IMEI & Customer Form */}
          {step === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Device Overview Banner */}
              <div className="p-4 rounded-xl bg-[#171d25] border border-[#252d37] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#16b981] shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#737e8a] block font-medium">Aparelho Negociado:</span>
                    <strong className="text-sm text-[#f3f5f7] font-semibold">
                      {evaluation.brand} {evaluation.model_name} {evaluation.storage}
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#737e8a] block uppercase font-medium">Valor a Pagar</span>
                  <span className="text-base sm:text-lg font-bold text-[#16b981]">
                    R$ {evaluation.final_valuation?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* IMEI Input Box (Crucial for legal safety) */}
              <div className="p-4 rounded-xl bg-[#171d25] border border-[#252d37] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#f3f5f7] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#16b981]" />
                    Número de IMEI do Aparelho (Obrigatório):
                  </label>
                  <span className="text-[11px] text-[#737e8a]">Disque *#06# no teclado</span>
                </div>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 18))}
                  placeholder="Ex: 354892091234567"
                  className="bg-[#11161d] border-[#252d37] text-sm text-[#f3f5f7] font-mono tracking-wider rounded-lg h-11 focus:border-[#16b981]"
                />
              </div>

              {/* Customer Identification */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#a3adb8] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#16b981]" />
                  Dados do Cliente / Vendedor
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-[#a3adb8] font-medium block">Nome Completo do Cliente:</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo do vendedor"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#f3f5f7] rounded-lg h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#a3adb8] font-medium block">CPF:</label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#f3f5f7] rounded-lg h-10 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#a3adb8] font-medium block">Telefone / WhatsApp:</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#f3f5f7] rounded-lg h-10"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-[#a3adb8] font-medium block">Endereço Residencial (Opcional):</label>
                    <Input
                      value={customer.address}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, complemento - Bairro, Cidade"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#f3f5f7] rounded-lg h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#252d37]">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-[#252d37] text-[#a3adb8] hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProceedToSign}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold flex items-center gap-2 h-10 px-5 rounded-lg"
                >
                  <PenTool className="w-4 h-4" /> Avançar para Assinatura
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Digital Signature on Canvas */}
          {step === 'sign' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-lg bg-[#171d25] border border-[#252d37] space-y-1 text-xs">
                <span className="text-[#a3adb8] block">
                  Vendedor: <strong className="text-[#f3f5f7]">{customer.name}</strong> • CPF: <strong className="text-[#f3f5f7]">{customer.cpf}</strong>
                </span>
                <span className="text-[#a3adb8] block">
                  Aparelho: <strong className="text-[#f3f5f7]">{evaluation.brand} {evaluation.model_name}</strong> (IMEI: <strong className="text-[#f3f5f7]">{imei}</strong>)
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#f3f5f7] flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#16b981]" />
                    Assinatura Digital do Vendedor (Na tela ou celular):
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-xs text-[#a3adb8] hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar assinatura
                  </button>
                </div>

                <div className="border border-[#252d37] rounded-xl bg-white overflow-hidden shadow-inner touch-none relative">
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
                    className="w-full h-40 cursor-crosshair block"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Desenhe ou assine com o dedo / caneta nesta área
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#171d25] border border-[#252d37] text-[11px] text-[#a3adb8] space-y-1 leading-relaxed">
                <strong className="text-[#f3f5f7] block">Cláusula Penal (Art. 180 e 299 CPB):</strong>
                O cliente atesta ser legítimo proprietário e se responsabiliza integralmente pela procedência do aparelho.
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#252d37]">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="border-[#252d37] text-[#a3adb8] hover:text-white"
                >
                  ← Voltar dados
                </Button>
                <Button
                  onClick={handleFinalizeDocument}
                  disabled={isSaving}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold flex items-center gap-2 h-10 px-5 rounded-lg shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalizar e Gerar Recibo
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Complete Print Layout (A4 format ready) */}
          {step === 'complete' && (
            <div className="space-y-4">
              {/* Screen Confirmation Banner (Hidden on Print) */}
              <div className="p-4 rounded-xl bg-[#171d25] border border-[#16b981]/30 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#16b981]" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#f3f5f7]">Termo de Compra Salvo com Sucesso!</h3>
                    <p className="text-[11px] text-[#a3adb8]">Código de Validação: {evaluationCode}</p>
                  </div>
                </div>
                <Button
                  onClick={handlePrint}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold text-xs flex items-center gap-1.5 h-9 rounded-lg shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimir Documento (A4 / PDF)
                </Button>
              </div>

              {/* Printable Legal Document Container */}
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none font-sans space-y-5 text-xs sm:text-sm leading-relaxed">
                {/* Document Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                      {storeName}
                    </h1>
                    {storeCnpj && <p className="text-xs text-slate-600 font-medium">CNPJ/CPF: {storeCnpj}</p>}
                    {storeAddress && <p className="text-xs text-slate-600">{storeAddress}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Nº DO RECIBO</span>
                    <span className="text-sm sm:text-base font-mono font-black text-slate-900">{evaluationCode}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="text-center font-bold uppercase tracking-wider text-xs border border-slate-400 bg-slate-100 py-1.5 rounded">
                  TERMO DE COMPRA E DECLARAÇÃO DE PROCEDÊNCIA & RESPONSABILIDADE
                </div>

                {/* Seller & Device Details Table */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded border border-slate-300 bg-slate-50/50">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">1. QUALIFICAÇÃO DO VENDEDOR</span>
                    <p className="font-semibold">Nome: {customer.name}</p>
                    <p>CPF: {customer.cpf}</p>
                    <p>Telefone: {customer.phone}</p>
                    {customer.address && <p>Endereço: {customer.address}</p>}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">2. CARACTERIZAÇÃO DO SMARTPHONE</span>
                    <p className="font-semibold">Modelo: {evaluation.brand} {evaluation.model_name} {evaluation.storage}</p>
                    <p className="font-mono font-bold text-slate-900">IMEI: {imei}</p>
                    <p>Modalidade: {evaluation.type === 'troca' ? 'Troca / Trade-In com Abatimento' : 'Compra Direta'}</p>
                  </div>
                </div>

                {/* Values Breakdown */}
                <div className="border border-slate-300 rounded p-3 bg-white space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span>Valor Base do Aparelho:</span>
                    <span>R$ {evaluation.base_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {evaluation.faults_selected && evaluation.faults_selected.length > 0 && (
                    <div className="py-1 border-y border-dashed border-slate-300 space-y-0.5 text-[11px] text-slate-700">
                      <span className="font-bold text-slate-800 block">Deduções / Avarias Identificadas:</span>
                      {evaluation.faults_selected.map(f => (
                        <div key={f.id} className="flex justify-between pl-2">
                          <span>• {f.label}:</span>
                          <span className="text-red-700 font-semibold">– R$ {f.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {evaluation.trade_bonus_applied && evaluation.trade_bonus_applied > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>(+) Bônus de Fidelidade na Troca:</span>
                      <span>+ R$ {evaluation.trade_bonus_applied.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between font-black text-sm sm:text-base border-t border-slate-900 pt-1 text-slate-900">
                    <span>VALOR TOTAL PAGO PELA LOJA:</span>
                    <span>R$ {evaluation.final_valuation?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Legal Clauses Text */}
                <div className="p-3 border border-slate-300 rounded text-[10px] text-slate-700 space-y-1 whitespace-pre-line leading-relaxed font-sans bg-slate-50/30">
                  {termsText}
                </div>

                {/* Signatures & QR Code */}
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end border-t border-slate-400">
                  {/* Digital Signature Image or Line */}
                  <div className="text-center space-y-1.5">
                    {signatureImage ? (
                      <img
                        src={signatureImage}
                        alt="Assinatura"
                        className="h-16 mx-auto object-contain border-b border-slate-900 pb-1"
                      />
                    ) : (
                      <div className="border-b border-slate-900 h-14 mx-4"></div>
                    )}
                    <span className="font-bold block text-xs uppercase text-slate-900">{customer.name}</span>
                    <span className="text-[10px] text-slate-500 block">Assinatura do Vendedor / Titular (CPF: {customer.cpf})</span>
                  </div>

                  {/* Store Stamp / Signature */}
                  <div className="text-center space-y-1.5">
                    <div className="border-b border-slate-900 h-14 mx-4 flex items-end justify-center pb-1">
                      <span className="text-[11px] font-bold text-slate-700">{storeName}</span>
                    </div>
                    <span className="font-bold block text-xs uppercase text-slate-900">Responsável pela Avaliação</span>
                    <span className="text-[10px] text-slate-500 block">Visto da Loja Compradora</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-[#252d37] print:hidden">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-[#252d37] text-[#a3adb8] hover:text-white"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Imprimir Documento
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
