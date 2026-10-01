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
  Lock
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleGoToSign = () => {
    if (!customer.name.trim() || !customer.cpf.trim() || customer.cpf.length < 14) {
      toast.error('Preencha o Nome Completo e um CPF válido do cliente.');
      return;
    }
    setStep('sign');
  };

  const handleFinalizeAndSave = async () => {
    if (!hasSignature && !signatureImage) {
      toast.error('Por favor, colha a assinatura do cliente antes de prosseguir.');
      return;
    }

    const canvas = canvasRef.current;
    const sigData = canvas ? canvas.toDataURL('image/png') : signatureImage;
    setSignatureImage(sigData);

    setIsSaving(true);
    try {
      const saved = await onConfirmSave(customer, sigData, imei);
      if (saved) {
        setSavedEvaluation(saved);
        setStep('complete');
        toast.success('Termo gerado e compra registrada com sucesso!');
      } else {
        toast.error('Ocorreu um erro ao salvar o registro.');
      }
    } catch (err) {
      toast.error('Erro ao registrar avaliação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100 print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0">
        
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#1e293b]/80 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Termo de Compra, Procedência & Responsabilidade
              </h2>
              <p className="text-xs text-slate-400">
                Respaldo jurídico com assinatura digital e dados do vendedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin print:p-0 print:overflow-visible">
          {step === 'form' && (
            /* STEP 1: CUSTOMER FORM & IMEI */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#1e293b] border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Aparelho Avaliado</span>
                    <strong className="text-sm font-bold text-white">
                      {evaluation.brand} {evaluation.model_name} ({evaluation.storage})
                    </strong>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Valor a ser Pago</span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* IMEI & Security Verification */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[#0a0f1d] border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    Número do IMEI (15 dígitos):
                  </label>
                  <span className="text-[11px] text-slate-400">Consulte discando *#06# no teclado</span>
                </div>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Ex: 354892109876543"
                  className="bg-[#1e293b] border-slate-700 text-sm text-white font-mono tracking-wider rounded-xl h-11 focus:border-blue-500"
                />
              </div>

              {/* Customer Identification */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Identificação do Vendedor (Cliente que está entregando)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">Nome Completo do Cliente: *</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João da Silva Santos"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">CPF do Vendedor: *</label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm text-white font-mono rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">WhatsApp / Telefone:</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">Endereço Residencial (Opcional):</label>
                    <Input
                      value={customer.address}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua / Avenida, Número, Bairro, Cidade"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGoToSign}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 h-10 px-5 rounded-xl shadow-md shadow-blue-600/30"
                >
                  Continuar para Assinatura →
                </Button>
              </div>
            </div>
          )}

          {step === 'sign' && (
            /* STEP 2: DIGITAL SIGNATURE PAD */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-slate-700 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">
                  Declaração do Vendedor: {customer.name} (CPF: {customer.cpf})
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Declaro que sou proprietário(a) legítimo(a) deste aparelho e me responsabilizo integralmente pela sua procedência legal.
                </p>
              </div>

              {/* Signature Canvas Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-400" />
                    Assine com o dedo ou mouse no quadro abaixo:
                  </label>
                  <button
                    onClick={clearSignature}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar Assinatura
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-600 rounded-xl bg-white overflow-hidden touch-none h-44 flex items-center justify-center relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={180}
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <span className="absolute text-slate-400 text-xs pointer-events-none select-none">
                      Assine aqui ✍️
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                >
                  ← Voltar
                </Button>
                <Button
                  onClick={handleFinalizeAndSave}
                  disabled={!hasSignature || isSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 h-10 px-5 rounded-xl shadow-md shadow-blue-600/30"
                >
                  {isSaving ? 'Salvando...' : 'Concluir & Gerar Termo'}
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            /* STEP 3: SUCCESS & PRINTABLE VIEW */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Success Notification Bar (Hidden in Print) */}
              <div className="p-4 rounded-xl bg-[#1e293b] border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Termo gerado com sucesso!
                    </h4>
                    <p className="text-xs text-slate-400">
                      Código: <span className="font-mono font-bold text-blue-400">{savedEvaluation?.evaluation_code}</span> — Salvo no histórico digital.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 h-9 rounded-xl shadow-md shadow-blue-600/30"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir Termo A4
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs h-9 rounded-xl"
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              {/* Printable Term Document (Optimized for A4 paper print) */}
              <div className="bg-white text-black p-6 sm:p-8 rounded-xl shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-0 font-sans text-xs sm:text-sm leading-relaxed">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                      {settings?.store_name || 'CELLHUB — COMPRA & AVALIAÇÃO DE SEMINOVOS'}
                    </h1>
                    {settings?.store_cnpj && (
                      <p className="text-xs text-slate-600 font-semibold">
                        CNPJ/CPF: {settings.store_cnpj}
                      </p>
                    )}
                    {settings?.store_address && (
                      <p className="text-xs text-slate-600">
                        {settings.store_address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black uppercase bg-slate-900 text-white px-2.5 py-1 rounded">
                      {evaluation.type === 'troca' ? 'TROCA COM RETOMADA' : 'RECIBO DE COMPRA'}
                    </span>
                    <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                      Nº {savedEvaluation?.evaluation_code || 'REC-XXXXX'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Device & Value Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Aparelho Adquirido:</span>
                    <strong className="text-sm text-slate-900">{evaluation.brand} {evaluation.model_name} ({evaluation.storage})</strong>
                    {imei && (
                      <p className="text-xs font-mono font-bold text-blue-800 mt-0.5">
                        IMEI: {imei}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Valor Final Pago:</span>
                    <strong className="text-base sm:text-lg text-emerald-700 font-black">
                      R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    {Number(evaluation.total_faults_discount || 0) > 0 && (
                      <p className="text-[11px] text-red-600 font-medium">
                        (Avarias deduzidas: -R$ {evaluation.total_faults_discount})
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Data */}
                <div className="mb-4 p-3 border border-slate-300 rounded-lg bg-slate-50">
                  <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                    Qualificação do Vendedor (Cliente):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Nome:</span> <strong className="text-slate-900">{customer.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">CPF:</span> <strong className="text-slate-900 font-mono">{customer.cpf}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Telefone:</span> <strong className="text-slate-900">{customer.phone || 'Não informado'}</strong>
                    </div>
                    {customer.address && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-slate-500">Endereço:</span> <span className="text-slate-800">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal Terms Clauses */}
                <div className="mb-4">
                  <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                    Cláusulas de Declaração de Procedência & Responsabilidade:
                  </span>
                  <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed text-justify">
                    {settings?.terms_text || DEFAULT_LEGAL_TERMS}
                  </p>
                </div>

                {/* Signature Box */}
                <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="h-16 flex items-center justify-center border-b border-slate-900">
                      {signatureImage ? (
                        <img 
                          src={signatureImage} 
                          alt="Assinatura do Vendedor" 
                          className="max-h-14 max-w-full object-contain" 
                        />
                      ) : (
                        <span className="text-xs italic text-slate-400">Assinatura Digital Registrada</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      {customer.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      CPF: {customer.cpf}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="h-16 flex items-center justify-center border-b border-slate-900">
                      <span className="text-xs font-bold text-slate-800">
                        {settings?.store_name || 'Lojista Responsável'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      Responsável / Vistoriador
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {savedEvaluation?.created_by_name || 'CellHub'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
