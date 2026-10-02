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
  FileCheck,
  ChevronDown,
  ChevronUp
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
  const [showEvaluationDetails, setShowEvaluationDetails] = useState<boolean>(false);
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
      setShowEvaluationDetails(false);
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
        const physicalSignatureData = 'ASSINATURA_FISICA_EM_PAPEL_A4';
        const saved = await saveFn(customer, physicalSignatureData, imei);
        if (saved) {
          setSavedEvaluation(saved);
          setStep('document');
          toast.success('Termo gerado com sucesso!');
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
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Header Superior Minimalista */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={step === 'document' ? () => setStep('form') : onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D287]" />
            <span className="hidden sm:inline">{step === 'document' ? 'Editar Dados' : 'Voltar'}</span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#00D287]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-none">
                Termo de Compra & Responsabilidade
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                {step === 'form' ? 'Preencha os dados do cliente e aparelho' : 'Visualização em A4 com assinatura'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {step === 'document' && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
        <div className="max-w-4xl mx-auto">
          
          {step === 'form' && (
            /* STEP 1: FORMULÁRIO MINIMALISTA E DIRETO */
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Resumo Rápido do Aparelho & Valor (Minimal Card) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1424] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Aparelho Selecionado
                    </span>
                    <strong className="text-sm sm:text-base font-black text-white">
                      {evaluation.brand} {evaluation.model_name} ({evaluation.storage})
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Valor Final de Compra
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#00D287]">
                      R$ {Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Toggle discreto para ver detalhes / fotos */}
                {(evaluation.faults_selected && evaluation.faults_selected.length > 0 || photosList.length > 0) && (
                  <div className="border-t border-white/5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEvaluationDetails(prev => !prev)}
                      className="text-[11px] text-[#00D287] hover:underline font-semibold flex items-center gap-1"
                    >
                      {showEvaluationDetails ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Ocultar detalhes e fotos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Ver avarias descontadas ({evaluation.faults_selected?.length || 0}) e fotos ({photosList.length})
                        </>
                      )}
                    </button>

                    {showEvaluationDetails && (
                      <div className="mt-2.5 space-y-2.5 text-xs animate-in fade-in duration-150">
                        {/* Avarias */}
                        {evaluation.faults_selected && evaluation.faults_selected.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-[#060a16] border border-white/5 space-y-1">
                            {evaluation.faults_selected.map(f => (
                              <div key={f.id} className="flex justify-between text-slate-300 text-[11px]">
                                <span>• {f.label}</span>
                                <span className="text-red-400 font-bold">– R$ {Number(f.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fotos em miniatura */}
                        {photosList.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {photosList.map((p, idx) => (
                              <div key={idx} className="relative rounded-lg overflow-hidden border border-white/10 aspect-video bg-black">
                                <img src={p.url} alt={`Foto ${p.type}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-[#00D287] text-center font-bold uppercase py-0.5">
                                  {p.type === 'front' ? 'Tela' : p.type === 'side' ? 'Lateral' : 'Traseira'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Formulário: Dados do Cliente */}
              <div className="p-4 rounded-2xl bg-[#0c1424] border border-white/10 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <User className="w-3.5 h-3.5 text-[#00D287]" />
                  <span>Dados do Vendedor (Cliente)</span>
                </div>

                <div className="space-y-2.5">
                  {/* Nome Completo */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome Completo do Cliente *
                    </label>
                    <Input
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Carlos Eduardo de Souza"
                      className="bg-[#060a16] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>

                  {/* CPF e WhatsApp lado a lado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        CPF do Cliente *
                      </label>
                      <Input
                        required
                        value={customer.cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                        className="bg-[#060a16] border-white/10 text-xs sm:text-sm text-white font-mono rounded-xl h-10 focus:border-[#00D287]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        WhatsApp / Celular
                      </label>
                      <Input
                        value={customer.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="bg-[#060a16] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                      />
                    </div>
                  </div>

                  {/* Endereço (opcional) */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Endereço do Cliente <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    <Input
                      value={customer.address}
                      onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="bg-[#060a16] border-white/10 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </div>

              {/* IMEI do Aparelho */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1424] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#00D287]" />
                    Número do IMEI (15 dígitos):
                  </label>
                  <span className="text-[10px] text-slate-400">Digite *#06# no teclado</span>
                </div>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Ex: 354892109876543"
                  className="bg-[#060a16] border-white/10 text-xs sm:text-sm text-white font-mono tracking-wider rounded-xl h-10 focus:border-[#00D287]"
                />
              </div>

              {/* Botão Principal de Geração */}
              <div className="pt-2">
                <Button
                  onClick={handleGenerateAndSave}
                  disabled={isSaving || !customer.name.trim() || !customer.cpf.trim()}
                  className="w-full bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs sm:text-sm h-12 rounded-2xl shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <Printer className="w-4 h-4" />
                  {isSaving ? 'Gerando Termo...' : `Gerar e Imprimir Termo (R$ ${Number(evaluation.final_valuation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                </Button>
              </div>
            </div>
          )}

          {step === 'document' && (
            /* STEP 2: DOCUMENTO OFICIAL FORMATADO PARA IMPRESSÃO A4 */
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Action Toolbar (Hidden on print) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1424] border border-[#00D287]/40 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shadow-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00D287] shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Termo Gerado com Sucesso!
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Nº <span className="font-mono font-bold text-[#00D287]">{savedEvaluation?.evaluation_code || 'REGISTRADO'}</span> — Salvo no histórico da loja.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-initial bg-[#00D287] hover:bg-[#00be7a] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl shadow-md shadow-[#00D287]/20"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Termo A4
                  </Button>

                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex-1 sm:flex-initial border-white/10 bg-[#060a16] text-slate-200 hover:text-white text-xs flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl"
                  >
                    <Download className="w-4 h-4 text-[#00D287]" /> Salvar PDF
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-xs h-10 px-3 rounded-xl"
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
      </main>
    </div>
  );
};