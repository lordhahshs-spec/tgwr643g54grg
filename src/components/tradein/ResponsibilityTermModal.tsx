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
  Lock,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Camera,
  Layers,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradeInEvaluation, CustomerData, ValuationSettings, SelectedFault } from '@/types/tradein';
import { AiEvaluationPhoto } from '@/types/tradeinAi';
import { DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { toast } from 'sonner';

interface ExtendedEvaluation extends Partial<TradeInEvaluation> {
  photos?: AiEvaluationPhoto[];
  visual_summary?: string[];
  ai_evaluated?: boolean;
}

interface ResponsibilityTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: ExtendedEvaluation | null;
  settings?: ValuationSettings;
  currentUser?: any;
  onConfirmSave: (customerData: CustomerData, signatureData: string, imei: string) => Promise<TradeInEvaluation | null>;
  onOpenStoreSettings?: () => void;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  settings,
  currentUser,
  onConfirmSave,
  onOpenStoreSettings
}) => {
  const [step, setStep] = useState<'form' | 'sign' | 'complete'>('form');
  const [imei, setImei] = useState<string>('');
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string; time: string }>({
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

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
      setCurrentDateTime({
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }
  }, [isOpen, evaluation]);

  if (!isOpen || !evaluation) return null;

  // Dados consolidados da Loja
  const storeName = settings?.store_name || currentUser?.tradeName || currentUser?.companyName || 'CellHub Shop';
  const storeCnpj = settings?.store_cnpj || currentUser?.cnpj || '';
  const storeAddress = settings?.store_address || currentUser?.address || '';
  const storePhone = currentUser?.whatsapp || currentUser?.phone || '';

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

  // Format Phone
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    } else if (raw.length > 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    setCustomer(prev => ({ ...prev, phone: formatted }));
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
        toast.success('Termo gerado e registrado com sucesso!');
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

  const photosList = evaluation.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#060a16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-slate-100 print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0">
        
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090f1f]/90 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Termo de Compra, Procedência & Responsabilidade
              </h2>
              <p className="text-xs text-slate-400">
                Respaldo jurídico com assinatura digital, dados da loja e laudo do aparelho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin print:p-0 print:overflow-visible space-y-5">
          
          {step === 'form' && (
            /* STEP 1: COMPLETE CUSTOMER & STORE AUDIT FORM */
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Header Info: Store & Date Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#090f1f] border border-white/10 text-xs">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-[#00D287] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white block">{storeName}</span>
                      {onOpenStoreSettings && (!storeCnpj || !storeAddress) && (
                        <button
                          type="button"
                          onClick={onOpenStoreSettings}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
                        >
                          (Editar dados da loja)
                        </button>
                      )}
                    </div>
                    {storeCnpj ? (
                      <span className="text-slate-400 block font-mono">CNPJ: {storeCnpj}</span>
                    ) : (
                      <span className="text-amber-400/90 block font-mono text-[11px]">⚠️ CNPJ não configurado</span>
                    )}
                    {storeAddress ? (
                      <span className="text-slate-400 block truncate max-w-xs">{storeAddress}</span>
                    ) : (
                      <span className="text-amber-400/90 block text-[11px]">⚠️ Endereço não configurado</span>
                    )}
                  </div>
                </div>

                <div className="flex sm:justify-end items-start gap-3 text-slate-400 sm:text-right">
                  <div className="space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1.5 text-slate-300 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#00D287]" />
                      <span>{currentDateTime.date}</span>
                      <Clock className="w-3.5 h-3.5 text-[#00D287] ml-1" />
                      <span>{currentDateTime.time}</span>
                    </div>
                    <span className="text-[11px] text-[#00D287] font-black uppercase tracking-wider block">
                      {evaluation.type === 'troca' ? 'Troca / Retomada' : 'Compra Direta'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Device Breakdown Card */}
              <div className="p-4 rounded-2xl bg-[#040711] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Aparelho Avaliado</span>
                      <strong className="text-sm font-black text-white">
                        {evaluation.brand} {evaluation.model_name} ({evaluation.storage})
                      </strong>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Final Pago ao Cliente</span>
                    <span className="text-xl sm:text-2xl font-black text-[#00D287]">
                      R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Detailed Values Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#090f1f] border border-white/5">
                    <span className="text-slate-400 text-[11px] block">Valor Base Tabela:</span>
                    <strong className="text-white font-bold">
                      R$ {Number(evaluation.base_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090f1f] border border-white/5">
                    <span className="text-slate-400 text-[11px] block">Desconto Avarias:</span>
                    <strong className={Number(evaluation.total_faults_discount || 0) > 0 ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'}>
                      - R$ {Number(evaluation.total_faults_discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090f1f] border border-white/5">
                    <span className="text-slate-400 text-[11px] block">Bônus Trade-In:</span>
                    <strong className={Number(evaluation.trade_bonus_applied || 0) > 0 ? 'text-[#00D287] font-bold' : 'text-slate-400 font-bold'}>
                      + R$ {Number(evaluation.trade_bonus_applied || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090f1f] border border-[#00D287]/20">
                    <span className="text-slate-400 text-[11px] block">Laudo de Vistoria:</span>
                    <strong className="text-[#00D287] font-bold">
                      {evaluation.ai_evaluated ? '✨ Vistoria por IA' : 'Manual'}
                    </strong>
                  </div>
                </div>

                {/* Selected Faults List */}
                {evaluation.faults_selected && evaluation.faults_selected.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#090f1f] border border-white/5 space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Avarias Identificadas e Descontadas ({evaluation.faults_selected.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto scrollbar-thin">
                      {evaluation.faults_selected.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-[#060a16] border border-white/5 text-[11px]">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{f.label}</span>
                          <span className="text-red-400 font-bold shrink-0">- R$ {Number(f.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos Gallery from AI Inspection (If present) */}
              {photosList.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#090f1f] border border-[#00D287]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#00D287]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Fotos Anexadas da Vistoria com IA ({photosList.length})
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] font-black border border-[#00D287]/30">
                      Laudo Digital Anexado
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {photosList.map((photo, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-white/10 bg-[#040711] aspect-video group">
                        <img 
                          src={photo.url} 
                          alt={`Foto ${photo.type}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-center">
                          <span className="text-[10px] font-bold text-[#00D287] uppercase">
                            {photo.type === 'front' ? '1. Tela / Frente' : photo.type === 'side' ? '2. Laterais' : '3. Traseira'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IMEI & Security Verification */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#040711] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#00D287] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Número do IMEI do Aparelho (15 dígitos):
                  </label>
                  <span className="text-[11px] text-slate-400">Consulte discando *#06# no teclado</span>
                </div>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Ex: 354892109876543"
                  className="bg-[#090f1f] border-white/10 text-sm text-white font-mono tracking-wider rounded-xl h-11 focus:border-[#00D287]"
                />
              </div>

              {/* Customer Identification */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#090f1f] border border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00D287]" />
                  Identificação do Vendedor (Cliente que está entregando)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">Nome Completo do Cliente: *</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João da Silva Santos"
                      className="bg-[#040711] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">CPF do Vendedor: *</label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="bg-[#040711] border-white/10 text-xs sm:text-sm text-white font-mono rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">WhatsApp / Telefone:</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="bg-[#040711] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">Endereço Residencial do Vendedor:</label>
                    <Input
                      value={customer.address}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua / Avenida, Número, Bairro, Cidade - UF"
                      className="bg-[#040711] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/10 bg-[#0c1424] text-slate-300 hover:text-white rounded-2xl text-xs h-11 px-5"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGoToSign}
                  className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black flex items-center gap-2 h-11 px-6 rounded-2xl shadow-lg shadow-[#00D287]/25 text-xs sm:text-sm"
                >
                  Continuar para Assinatura →
                </Button>
              </div>
            </div>
          )}

          {step === 'sign' && (
            /* STEP 2: DIGITAL SIGNATURE PAD */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-[#090f1f] border border-white/10 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">
                  Declaração do Vendedor: {customer.name} (CPF: {customer.cpf})
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Declaro sob as penas da lei que sou proprietário(a) legítimo(a) do aparelho {evaluation.brand} {evaluation.model_name} ({evaluation.storage}) {imei ? `(IMEI: ${imei})` : ''} e me responsabilizo integralmente pela sua procedência lícita.
                </p>
              </div>

              {/* Signature Canvas Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#00D287]" />
                    Assine com o dedo ou mouse no quadro abaixo:
                  </label>
                  <button
                    onClick={clearSignature}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar Assinatura
                  </button>
                </div>

                <div className="border-2 border-dashed border-white/20 rounded-2xl bg-white overflow-hidden touch-none h-44 flex items-center justify-center relative cursor-crosshair shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={700}
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
                    <span className="absolute text-slate-400 text-xs pointer-events-none select-none font-medium">
                      Assine aqui ✍️
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="border-white/10 bg-[#0c1424] text-slate-300 hover:text-white rounded-2xl text-xs h-11"
                >
                  ← Voltar
                </Button>
                <Button
                  onClick={handleFinalizeAndSave}
                  disabled={!hasSignature || isSaving}
                  className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black flex items-center gap-2 h-11 px-6 rounded-2xl shadow-lg shadow-[#00D287]/25 text-xs sm:text-sm"
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
              <div className="p-4 rounded-2xl bg-[#090f1f] border border-[#00D287]/40 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-[#00D287] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Termo de Compra & Responsabilidade Gerado!
                    </h4>
                    <p className="text-xs text-slate-400">
                      Código: <span className="font-mono font-bold text-[#00D287]">{savedEvaluation?.evaluation_code}</span> — Salvo no histórico digital da loja.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrint}
                    className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs flex items-center gap-1.5 h-10 px-5 rounded-2xl shadow-lg shadow-[#00D287]/25"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Termo A4 / PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-white/10 bg-[#0c1424] text-slate-300 hover:text-white text-xs h-10 rounded-2xl"
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              {/* Printable Term Document (Optimized for A4 paper print) */}
              <div className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-0 font-sans text-xs sm:text-sm leading-relaxed">
                
                {/* Header with Store and Order Info */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                      {storeName}
                    </h1>
                    {storeCnpj && (
                      <p className="text-xs text-slate-700 font-bold font-mono">
                        CNPJ: {storeCnpj}
                      </p>
                    )}
                    {storeAddress && (
                      <p className="text-[11px] text-slate-600">
                        {storeAddress}
                      </p>
                    )}
                    {storePhone && (
                      <p className="text-[11px] text-slate-600">
                        Contato / WhatsApp: {storePhone}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[11px] font-black uppercase bg-slate-900 text-white px-2.5 py-1 rounded inline-block">
                      {evaluation.type === 'troca' ? 'TROCA COM RETOMADA' : 'RECIBO DE COMPRA & PROCEDÊNCIA'}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      Nº {savedEvaluation?.evaluation_code || 'REC-XXXXX'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Data: {currentDateTime.date} às {currentDateTime.time}
                    </p>
                  </div>
                </div>

                {/* Device & Value Summary Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Aparelho Adquirido:</span>
                    <strong className="text-sm text-slate-900 block font-black">
                      {evaluation.brand} {evaluation.model_name} ({evaluation.storage})
                    </strong>
                    {imei && (
                      <p className="text-xs font-mono font-bold text-blue-800">
                        IMEI: {imei}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-600 block">
                      Valor Base de Tabela: R$ {Number(evaluation.base_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Valor Final Pago:</span>
                    <strong className="text-base sm:text-xl text-emerald-800 font-black block">
                      R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    {Number(evaluation.total_faults_discount || 0) > 0 && (
                      <p className="text-[11px] text-red-600 font-semibold">
                        Avarias deduzidas: - R$ {Number(evaluation.total_faults_discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {Number(evaluation.trade_bonus_applied || 0) > 0 && (
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        Bônus Trade-In aplicado: + R$ {Number(evaluation.trade_bonus_applied).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Faults Table (If any) */}
                {evaluation.faults_selected && evaluation.faults_selected.length > 0 && (
                  <div className="mb-4 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                    <span className="text-[11px] font-bold uppercase text-slate-800 block mb-1">
                      Avarias e Condições Físicas Deduzidas:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {evaluation.faults_selected.map(f => (
                        <div key={f.id} className="flex justify-between border-b border-slate-200 py-0.5">
                          <span className="text-slate-800">• {f.label}</span>
                          <span className="text-red-700 font-bold">- R$ {Number(f.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached AI Inspection Photos in Print / Term Document */}
                {photosList.length > 0 && (
                  <div className="mb-4 p-3 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase text-slate-800">
                        Laudo de Vistoria Visual Digital por IA (Fotos Anexadas):
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        Identificação de avarias e conservação física
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {photosList.map((photo, i) => (
                        <div key={i} className="border border-slate-300 rounded p-1 bg-white text-center">
                          <img 
                            src={photo.url} 
                            alt={`Foto ${photo.type}`} 
                            className="h-24 w-full object-contain rounded mb-1" 
                          />
                          <span className="text-[9px] font-bold text-slate-700 uppercase block">
                            {photo.type === 'front' ? '1. Frente / Tela' : photo.type === 'side' ? '2. Laterais' : '3. Traseira / Câmeras'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed text-justify">
                    {settings?.terms_text || DEFAULT_LEGAL_TERMS}
                  </p>
                </div>

                {/* Signature Box */}
                <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6">
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
                        {storeName}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      Responsável / Vistoriador
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {savedEvaluation?.created_by_name || currentUser?.name || currentUser?.ownerName || 'Lojista'}
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
