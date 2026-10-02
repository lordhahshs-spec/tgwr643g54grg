import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  Printer,
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
  DollarSign,
  ArrowLeft,
  Download,
  History,
  FileCheck
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
  onSaveWithCustomer?: (customerData: CustomerData, signatureData: string, imei: string) => Promise<TradeInEvaluation | null>;
  onConfirmSave?: (customerData: CustomerData, signatureData: string, imei: string) => Promise<TradeInEvaluation | null>;
  onSavedSuccessfully?: () => void;
  onOpenStoreSettings?: () => void;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  settings,
  currentUser,
  onSaveWithCustomer,
  onConfirmSave,
  onSavedSuccessfully,
  onOpenStoreSettings
}) => {
  const [step, setStep] = useState<'form' | 'document'>('form');
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

  const [savedEvaluation, setSavedEvaluation] = useState<TradeInEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
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
  const storeName = settings?.store_name || currentUser?.tradeName || currentUser?.companyName || 'Minha Loja de Celulares';
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

  const handleGenerateAndSave = async () => {
    if (!customer.name.trim() || !customer.cpf.trim() || customer.cpf.length < 14) {
      toast.error('Preencha o Nome Completo e o CPF do cliente antes de gerar o termo.');
      return;
    }

    setIsSaving(true);
    try {
      const saveFn = onSaveWithCustomer || onConfirmSave;
      if (saveFn) {
        // Marcamos como assinatura física em papel para impressão
        const physicalSignatureData = 'ASSINATURA_FISICA_EM_PAPEL_A4';
        const saved = await saveFn(customer, physicalSignatureData, imei);
        if (saved) {
          setSavedEvaluation(saved);
          setStep('document');
          toast.success('Termo gerado e salvo no histórico da loja com sucesso!');
          if (onSavedSuccessfully) {
            onSavedSuccessfully();
          }
        } else {
          toast.error('Ocorreu um erro ao salvar a avaliação no banco.');
        }
      } else {
        setStep('document');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const photosList = evaluation.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-5 bg-black/90 md:backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full h-[100dvh] md:h-auto md:max-h-[94vh] md:max-w-4xl bg-[#060a16] md:border md:border-white/10 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0 pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0">
        
        {/* Top Header (Hidden in Print) */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-[#090f1f]/95 backdrop-blur-md flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={step === 'document' ? () => setStep('form') : onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#00D287]" />
              <span className="text-xs">{step === 'document' ? 'Editar Dados' : 'Voltar'}</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#00D287]/15 border border-[#00D287]/30 hidden sm:flex items-center justify-center text-[#00D287] shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                Termo de Compra & Responsabilidade
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[240px] sm:max-w-none">
                {step === 'form' ? 'Preencha os dados do cliente para gerar o comprovante' : 'Documento pronto para impressão em folha A4 e assinatura física'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 scrollbar-thin print:p-0 print:overflow-visible space-y-5 pb-24 md:pb-6">
          
          {step === 'form' && (
            /* STEP 1: FORMULÁRIO DE DADOS DO CLIENTE & AUDITORIA */
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto border-white/10 bg-[#0c1424] text-slate-300 hover:text-white rounded-2xl text-xs h-11 px-5"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleGenerateAndSave}
                  disabled={isSaving || !customer.name.trim() || !customer.cpf.trim()}
                  className="w-full sm:w-auto bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black flex items-center justify-center gap-2 h-12 px-7 rounded-2xl shadow-lg shadow-[#00D287]/25 text-xs sm:text-sm"
                >
                  <FileCheck className="w-4 h-4 stroke-[2.5]" />
                  {isSaving ? 'Gerando Termo...' : 'Gerar Termo de Compra & Salvar'}
                </Button>
              </div>
            </div>
          )}

          {step === 'document' && (
            /* STEP 2: DOCUMENTO OFICIAL FORMATADO PARA IMPRESSÃO EM PAPEL A4 E PDF */
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Action Toolbar (Hidden on print) */}
              <div className="p-4 rounded-2xl bg-[#090f1f] border border-[#00D287]/40 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shadow-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-[#00D287] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Termo Gerado e Registrado no Histórico!
                    </h4>
                    <p className="text-xs text-slate-400">
                      Código: <span className="font-mono font-bold text-[#00D287]">{savedEvaluation?.evaluation_code || 'REGISTRADO'}</span> — O comprovante está pronto para impressão.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-initial bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 h-10 px-5 rounded-2xl shadow-lg shadow-[#00D287]/25"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Termo A4
                  </Button>

                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex-1 sm:flex-initial border-white/10 bg-[#0c1424] text-slate-200 hover:text-white text-xs flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl"
                  >
                    <Download className="w-4 h-4 text-[#00D287]" /> Salvar em PDF
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-xs h-10 px-3 rounded-2xl"
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              {/* Printable Term Document (A4 Container) */}
              <div className="printable-term-document bg-white text-slate-950 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                
                {/* Header with Store and Order Info */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
                  <div className="space-y-0.5 max-w-[65%]">
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                      {storeName}
                    </h1>
                    {storeCnpj && (
                      <p className="text-xs text-slate-800 font-bold font-mono">
                        CNPJ: {storeCnpj}
                      </p>
                    )}
                    {storeAddress && (
                      <p className="text-[11px] text-slate-700 leading-tight">
                        {storeAddress}
                      </p>
                    )}
                    {storePhone && (
                      <p className="text-[11px] text-slate-700">
                        Telefone / WhatsApp: {storePhone}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase bg-slate-900 text-white px-2.5 py-1 rounded inline-block">
                      {evaluation.type === 'troca' ? 'TROCA COM RETOMADA' : 'COMPRA & RESPONSABILIDADE'}
                    </span>
                    <p className="text-xs font-mono font-black text-slate-900">
                      Nº {savedEvaluation?.evaluation_code || 'REC-' + Math.floor(10000 + Math.random() * 90000)}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Data: {currentDateTime.date} às {currentDateTime.time}
                    </p>
                  </div>
                </div>

                {/* Device & Value Summary Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Aparelho Adquirido / Usado:</span>
                    <strong className="text-sm text-slate-900 block font-black">
                      {evaluation.brand} {evaluation.model_name} ({evaluation.storage})
                    </strong>
                    {imei ? (
                      <p className="text-xs font-mono font-black text-slate-900">
                        IMEI: {imei}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">
                        IMEI não informado no momento da vistoria
                      </p>
                    )}
                    <span className="text-[11px] text-slate-600 block">
                      Valor Base de Tabela: R$ {Number(evaluation.base_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Valor Final Pago / Abatido:</span>
                    <strong className="text-base sm:text-xl text-emerald-800 font-black block">
                      R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    {Number(evaluation.total_faults_discount || 0) > 0 && (
                      <p className="text-[11px] text-red-700 font-semibold">
                        Avarias deduzidas: - R$ {Number(evaluation.total_faults_discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {Number(evaluation.trade_bonus_applied || 0) > 0 && (
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        Bônus Trade-In: + R$ {Number(evaluation.trade_bonus_applied).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Faults Table (If any) */}
                {evaluation.faults_selected && evaluation.faults_selected.length > 0 && (
                  <div className="mb-3 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
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
                  <div className="mb-3 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-slate-800">
                        Laudo de Vistoria Visual Digital (Fotos Anexadas):
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        Registro fotográfico do estado físico
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {photosList.map((photo, i) => (
                        <div key={i} className="border border-slate-300 rounded p-1 bg-white text-center">
                          <img 
                            src={photo.url} 
                            alt={`Foto ${photo.type}`} 
                            className="h-20 w-full object-contain rounded mb-0.5" 
                          />
                          <span className="text-[8px] font-bold text-slate-700 uppercase block">
                            {photo.type === 'front' ? '1. Frente / Tela' : photo.type === 'side' ? '2. Laterais' : '3. Traseira'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Data */}
                <div className="mb-3 p-3 border border-slate-300 rounded-lg bg-slate-50">
                  <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                    Qualificação do Vendedor (Cliente que entrega o aparelho):
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

                {/* Physical Signature Fields with Dotted Lines */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8">
                  {/* Assinatura do Cliente */}
                  <div className="text-center space-y-1.5">
                    <div className="h-14 border-b border-dashed border-slate-900"></div>
                    <strong className="text-xs text-slate-900 block font-black uppercase">
                      {customer.name}
                    </strong>
                    <p className="text-[10px] text-slate-600 font-mono">
                      CPF: {customer.cpf}
                    </p>
                    <span className="text-[10px] text-slate-500 italic block">
                      Assinatura do Vendedor (Cliente)
                    </span>
                  </div>

                  {/* Assinatura da Loja */}
                  <div className="text-center space-y-1.5">
                    <div className="h-14 border-b border-dashed border-slate-900"></div>
                    <strong className="text-xs text-slate-900 block font-black uppercase">
                      {storeName}
                    </strong>
                    {storeCnpj && (
                      <p className="text-[10px] text-slate-600 font-mono">
                        CNPJ: {storeCnpj}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-500 italic block">
                      Assinatura do Responsável da Loja
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