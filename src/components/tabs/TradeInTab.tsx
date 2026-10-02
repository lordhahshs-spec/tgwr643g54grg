import React, { useState, useEffect, useMemo } from 'react';
import {
  Repeat,
  Settings,
  History,
  ChevronDown,
  Calculator,
  FileSignature,
  Sparkles,
  Camera,
  CheckCircle2,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  PlusCircle,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ValuationModel,
  SelectedFault,
  CustomerData,
  TradeInEvaluation,
  ValuationSettings,
  DeviceBrand,
  FaultDefinition
} from '@/types/tradein';
import { AiEvaluationPhoto } from '@/types/tradeinAi';
import { tradeinService, getBrandPresets, BRANDS_LIST } from '@/services/tradeinService';
import { ResponsibilityTermModal } from '@/components/tradein/ResponsibilityTermModal';
import { TradeInHistoryModal } from '@/components/tradein/TradeInHistoryModal';
import { TradeInAdminModal } from '@/components/tradein/TradeInAdminModal';
import { TradeInAiModal } from '@/components/tradein/TradeInAiModal';
import { MissingStoreDataModal, MissingStoreField } from '@/components/tradein/MissingStoreDataModal';
import { leadAuthService } from '@/services/leadAuthService';

interface TradeInTabProps {
  onGoToAurusSimulator?: () => void;
}

export const TradeInTab: React.FC<TradeInTabProps> = () => {
  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  // Selected Brand & Models
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('Apple');
  const [allLoadedModels, setAllLoadedModels] = useState<ValuationModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Custom manual model fallback
  const [isManualModel, setIsManualModel] = useState<boolean>(false);
  const [customModelName, setCustomModelName] = useState<string>('');
  const [customBaseBuyPrice, setCustomBaseBuyPrice] = useState<number>(3000);

  // Selected faults checklist
  const [selectedFaults, setSelectedFaults] = useState<Record<string, boolean>>({});

  // IA evaluation feedback
  const [aiEvaluated, setAiEvaluated] = useState<boolean>(false);
  const [aiDetectedCount, setAiDetectedCount] = useState<number>(0);
  const [aiPhotos, setAiPhotos] = useState<AiEvaluationPhoto[]>([]);
  const [aiVisualSummary, setAiVisualSummary] = useState<string[]>([]);

  // Trade Bonus toggle
  const [willBuyFromStock, setWillBuyFromStock] = useState<boolean>(false);

  // Mini Calculo: Valor do celular que a loja vai vender
  const [sellingPhonePrice, setSellingPhonePrice] = useState<number | ''>('');

  // Mobile details collapse
  const [showMobileBreakdown, setShowMobileBreakdown] = useState<boolean>(false);

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminModalTab, setAdminModalTab] = useState<'models' | 'settings'>('models');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isMissingDataModalOpen, setIsMissingDataModalOpen] = useState<boolean>(false);
  const [missingStoreFields, setMissingStoreFields] = useState<MissingStoreField[]>([]);
  const [settings, setSettings] = useState<ValuationSettings | undefined>(undefined);

  // Carregamento consolidado ultra-rápido (carrega todas as marcas de uma só vez na memória)
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const [models, st] = await Promise.all([
        tradeinService.getAllModels(userId),
        tradeinService.getSettings(userId)
      ]);
      setAllLoadedModels(models);
      setSettings(st);
    } catch (err) {
      console.error('Erro ao carregar modelos de trade-in:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [userId]);

  // Filtragem síncrona 0ms por marca selecionada
  const modelsForBrand = useMemo(() => {
    const brandLower = selectedBrand.toLowerCase().trim();
    return allLoadedModels.filter(m => {
      const mBrand = (m.brand || '').toLowerCase().trim();
      return mBrand === brandLower || mBrand.includes(brandLower) || brandLower.includes(mBrand);
    });
  }, [allLoadedModels, selectedBrand]);

  const handleSelectBrand = (brand: DeviceBrand) => {
    setSelectedBrand(brand);
    setSelectedModelId('');
    setSelectedFaults({});
    setAiEvaluated(false);
    setAiDetectedCount(0);
    setAiPhotos([]);
    setAiVisualSummary([]);
    setIsManualModel(false);
  };

  const currentModel = useMemo(() => {
    if (isManualModel) {
      if (!customModelName.trim()) return null;
      return {
        id: 'manual',
        brand: selectedBrand,
        model_name: customModelName,
        storage: '128GB',
        base_price: Number(customBaseBuyPrice) * 1.3,
        buy_price: Number(customBaseBuyPrice),
        trade_bonus: 50,
        fault_discounts: {},
        is_active: true,
        display_order: 0
      } as ValuationModel;
    }
    if (!selectedModelId) return null;
    return modelsForBrand.find(m => m.id === selectedModelId) || null;
  }, [modelsForBrand, selectedModelId, isManualModel, customModelName, customBaseBuyPrice, selectedBrand]);

  const brandFaultDefinitions: FaultDefinition[] = useMemo(() => {
    return getBrandPresets(selectedBrand, currentModel?.model_name);
  }, [selectedBrand, currentModel?.model_name]);

  const activeFaultsList: SelectedFault[] = useMemo(() => {
    if (!currentModel) return [];
    const list: SelectedFault[] = [];

    brandFaultDefinitions.forEach(def => {
      if (selectedFaults[def.id]) {
        const discountVal = currentModel.fault_discounts?.[def.id] !== undefined
          ? currentModel.fault_discounts[def.id]
          : def.defaultDiscount;

        list.push({
          id: def.id,
          label: def.label,
          category: def.category,
          discount: discountVal
        });
      }
    });

    return list;
  }, [selectedFaults, currentModel, brandFaultDefinitions]);

  const totalFaultsDiscount = useMemo(() => {
    return activeFaultsList.reduce((acc, f) => acc + f.discount, 0);
  }, [activeFaultsList]);

  const baseValue = currentModel ? currentModel.buy_price : 0;
  const tradeBonusAmount = willBuyFromStock ? (currentModel?.trade_bonus || settings?.default_trade_bonus || 50) : 0;

  const finalValuation = useMemo(() => {
    if (!currentModel) return 0;
    const raw = baseValue - totalFaultsDiscount + tradeBonusAmount;
    return Math.max(Math.round(raw / 10) * 10, 50);
  }, [currentModel, baseValue, totalFaultsDiscount, tradeBonusAmount]);

  const differenceToPay = useMemo(() => {
    if (!sellingPhonePrice || Number(sellingPhonePrice) <= 0 || !currentModel) return 0;
    return Math.max(Number(sellingPhonePrice) - finalValuation, 0);
  }, [sellingPhonePrice, finalValuation, currentModel]);

  const toggleFault = (faultId: string) => {
    setSelectedFaults(prev => ({
      ...prev,
      [faultId]: !prev[faultId]
    }));
  };

  const handleApplyDetectedFaults = (
    detectedIds: string[],
    photos?: AiEvaluationPhoto[],
    visualSummary?: string[]
  ) => {
    const newFaultsMap: Record<string, boolean> = {};
    detectedIds.forEach(id => {
      newFaultsMap[id] = true;
    });
    setSelectedFaults(newFaultsMap);
    setAiEvaluated(true);
    setAiDetectedCount(detectedIds.length);
    if (photos && photos.length > 0) {
      setAiPhotos(photos);
    }
    if (visualSummary && visualSummary.length > 0) {
      setAiVisualSummary(visualSummary);
    }
  };

  const handleSaveEvaluationWithCustomer = async (
    customerData: CustomerData, 
    signatureData: string, 
    imeiValue: string
  ): Promise<TradeInEvaluation | null> => {
    if (!currentModel) return null;

    const res = await tradeinService.createEvaluation({
      userId: userId,
      type: willBuyFromStock ? 'troca' : 'compra',
      brand: currentModel.brand,
      model_name: currentModel.model_name,
      storage: currentModel.storage,
      imei: imeiValue || undefined,
      base_value: baseValue,
      faults_selected: activeFaultsList,
      total_faults_discount: totalFaultsDiscount,
      trade_bonus_applied: tradeBonusAmount,
      final_valuation: finalValuation,
      exchange_target_price: sellingPhonePrice ? Number(sellingPhonePrice) : 0,
      exchange_difference_to_pay: differenceToPay,
      customer_data: customerData,
      signature_data: signatureData,
      created_by_id: currentUser?.id,
      created_by_name: currentUser?.name || currentUser?.ownerName || 'Lojista'
    });

    if (res.success && res.evaluation) {
      return res.evaluation;
    }
    return null;
  };

  const handleRequestOpenTerm = () => {
    if (!currentModel) return;

    // Verificar se faltam dados essenciais da loja
    const effectiveStoreName = (settings?.store_name && settings.store_name !== 'Minha Loja de Celulares')
      ? settings.store_name
      : (currentUser?.tradeName || currentUser?.companyName || '');

    const effectiveStoreCnpj = settings?.store_cnpj?.trim() || currentUser?.cnpj?.trim() || '';
    const effectiveStoreAddress = settings?.store_address?.trim() || (
      [currentUser?.shippingStreet, currentUser?.shippingCity].filter(Boolean).join(', ')
    );

    const missing: MissingStoreField[] = [];

    if (!effectiveStoreName) {
      missing.push({
        key: 'name',
        label: 'Nome Fantasia / Razão Social da Loja',
        description: 'Identifica qual estabelecimento comercial está realizando a compra do aparelho.'
      });
    }

    if (!effectiveStoreCnpj) {
      missing.push({
        key: 'cnpj',
        label: 'CNPJ / CPF da Empresa',
        description: 'Necessário para a legalidade fiscal e assinatura contratual do termo.'
      });
    }

    if (!effectiveStoreAddress) {
      missing.push({
        key: 'address',
        label: 'Endereço Completo do Ponto de Venda',
        description: 'Localização onde a transação física e vistoria foram efetuadas.'
      });
    }

    if (missing.length > 0) {
      setMissingStoreFields(missing);
      setIsMissingDataModalOpen(true);
    } else {
      setIsTermModalOpen(true);
    }
  };

  const handleOpenStoreSettingsFromWarning = () => {
    setIsMissingDataModalOpen(false);
    setAdminModalTab('settings');
    setIsAdminModalOpen(true);
  };

  const handleProceedToTermAnyway = () => {
    setIsMissingDataModalOpen(false);
    setIsTermModalOpen(true);
  };

  return (
    <div className="w-full bg-[#040711] text-slate-100 p-3 sm:p-5 pb-32 sm:pb-6 space-y-4 flex flex-col justify-start">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#060a16] p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-xl shadow-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00D287] to-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-[#00D287]/25">
            <Repeat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Avaliação de Aparelho <span className="text-[#00D287]">(Seminovos & Troca)</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30">
                <Sparkles className="w-3 h-3" /> CellHub IA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calcule o valor de compra do seminovo com laudo visual por inteligência artificial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex-1 sm:flex-initial border-white/10 bg-[#0c1424] text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 h-9 px-3.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#00D287]" />
            Histórico de Termos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdminModalTab('models');
              setIsAdminModalOpen(true);
            }}
            className="flex-1 sm:flex-initial border-[#00D287]/30 bg-[#00D287]/10 text-[#00D287] hover:text-slate-950 hover:bg-[#00D287] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 h-9 px-3.5 transition-all shadow-sm shadow-[#00D287]/10"
          >
            <Settings className="w-3.5 h-3.5" />
            Minha Tabela
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      {/* DESKTOP VIEW (12 cols) */}
      <div className="hidden lg:flex bg-[#060a16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-white/10 bg-[#090f1f]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D287] animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              Mesa de Avaliação Trade-In
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-semibold bg-[#0c1424] px-2.5 py-1 rounded-lg border border-white/5">
            {modelsForBrand.length} modelos cadastrados ({selectedBrand})
          </div>
        </div>

        <div className="p-5 grid grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto">
          {/* Left Column (7 cols) */}
          <div className="col-span-7 flex flex-col space-y-3.5 min-h-0">
            {/* 1. Seleção de Marca e Modelo */}
            <div className="space-y-2.5 bg-[#090f1f] p-3.5 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-[#00D287] text-slate-950 font-black text-[10px] flex items-center justify-center">1</span>
                Marca e Modelo do Aparelho
              </label>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {BRANDS_LIST.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => handleSelectBrand(brand)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/25 scale-105'
                          : 'bg-[#0c1424] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {isLoadingModels ? (
                <div className="h-11 rounded-xl bg-[#040711] border border-white/10 flex items-center gap-2.5 px-4 text-xs text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D287]" />
                  <span>Carregando modelos de {selectedBrand}...</span>
                </div>
              ) : modelsForBrand.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0c1424] border border-white/10 text-center space-y-2">
                  <p className="text-xs text-slate-300">
                    Nenhum modelo cadastrado para <strong>{selectedBrand}</strong> ainda.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="bg-[#00D287] hover:bg-[#00be7a] text-slate-950 text-xs font-black h-8 rounded-xl"
                  >
                    + Cadastrar em Minha Tabela
                  </Button>
                </div>
              ) : (
                <div className="relative pt-0.5">
                  <select
                    value={selectedModelId}
                    onChange={(e) => {
                      setSelectedModelId(e.target.value);
                      setAiEvaluated(false);
                      setAiDetectedCount(0);
                      setSelectedFaults({});
                    }}
                    className={`w-full bg-[#040711] border text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2 text-white outline-none appearance-none pr-10 cursor-pointer h-11 shadow-sm transition-all ${
                      !selectedModelId ? 'border-amber-500/70 ring-1 ring-amber-500/30 text-slate-400' : 'border-white/10 focus:border-[#00D287]'
                    }`}
                  >
                    <option value="" disabled>
                      👉 Escolha o modelo ({selectedBrand})...
                    </option>
                    {modelsForBrand.map(m => (
                      <option key={m.id} value={m.id} className="text-white bg-[#060a16]">
                        {m.model_name} {m.storage} — Base: R$ {m.buy_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* 2. Hero Card de Avaliação com IA */}
            {currentModel ? (
              <div className={`p-4 rounded-2xl border transition-all shrink-0 ${
                aiEvaluated
                  ? 'bg-gradient-to-r from-emerald-950/40 via-[#06151f] to-[#060a16] border-[#00D287]/40 shadow-lg shadow-[#00D287]/10'
                  : 'bg-gradient-to-r from-[#0d221c] via-[#081824] to-[#060a16] border-[#00D287]/50 shadow-xl shadow-[#00D287]/15'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-[#00D287] text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#00D287] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Etapa Essencial: Fotos com IA
                      </span>
                      {aiEvaluated && (
                        <span className="bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Laudo Concluído ({aiDetectedCount} avarias)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {aiEvaluated
                        ? `A IA analisou as fotos e marcou automaticamente as avarias detectadas.`
                        : `Fotografe Frente, Traseira e Lateral para laudo visual com IA.`}
                    </p>
                  </div>

                  <Button
                    size="default"
                    onClick={() => setIsAiModalOpen(true)}
                    className={`font-black text-xs h-10 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2 shrink-0 transition-all ${
                      aiEvaluated
                        ? 'bg-[#0c1424] hover:bg-[#121e35] text-slate-200 border border-white/10'
                        : 'bg-gradient-to-r from-[#00D287] to-emerald-400 hover:from-[#00be7a] hover:to-emerald-500 text-slate-950 font-black scale-105 shadow-[#00D287]/30'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    {aiEvaluated ? 'Reavaliar com IA' : 'Abrir Câmera IA'}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#090f1f]/50 border border-dashed border-white/10 text-center text-slate-400 text-xs">
                Selecione o modelo do aparelho no Passo 1 para liberar a Câmera IA e a lista de avarias.
              </div>
            )}

            {/* 3. Checklist de Avarias */}
            {currentModel && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 font-black text-[10px] flex items-center justify-center">3</span>
                    <span className="text-xs font-bold text-slate-200 block">
                      Revisão de Avarias / Testes Funcionais ({selectedBrand})
                    </span>
                  </div>
                  
                  <span className="text-[11px] text-slate-400 bg-[#090f1f] px-2 py-0.5 rounded-md border border-white/5">
                    {activeFaultsList.length} marcada(s)
                  </span>
                </div>

                <div className="border border-white/10 rounded-2xl bg-[#090f1f] overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                  <div className="overflow-y-auto max-h-[260px] divide-y divide-white/5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-0.5">
                    {brandFaultDefinitions.map(fault => {
                      const isChecked = !!selectedFaults[fault.id];
                      const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                        ? currentModel.fault_discounts[fault.id]
                        : fault.defaultDiscount;

                      return (
                        <div
                          key={fault.id}
                          onClick={() => toggleFault(fault.id)}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          className={`flex items-center justify-between py-2.5 px-3.5 cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-red-950/30' : 'hover:bg-[#0c1424]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isChecked
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isChecked && (
                                <svg className="w-3 h-3 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs ${isChecked ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                              {fault.label}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-red-400 shrink-0">
                            – R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trade Bonus Row */}
                  <div
                    onClick={() => setWillBuyFromStock(prev => !prev)}
                    role="checkbox"
                    aria-checked={willBuyFromStock}
                    tabIndex={0}
                    className={`flex items-center justify-between py-2.5 px-3.5 cursor-pointer select-none transition-colors border-t border-white/10 shrink-0 ${
                      willBuyFromStock ? 'bg-[#00D287]/15' : 'bg-[#0c1424] hover:bg-[#101b30]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                        willBuyFromStock
                          ? 'bg-[#00D287] border-[#00D287] text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        {willBuyFromStock && (
                          <svg className="w-3 h-3 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${willBuyFromStock ? 'text-[#00D287] font-bold' : 'text-slate-300 font-medium'}`}>
                        Cliente vai levar outro aparelho da loja (+ R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </span>
                    </div>

                    <span className="text-xs font-black text-[#00D287] shrink-0">
                      + R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols) */}
          <div className="col-span-5 flex flex-col justify-between space-y-4 min-h-0">
            <div className="space-y-3.5">
              {/* Card "Valor de compra" */}
              <div className="border border-white/10 rounded-2xl bg-[#090f1f] p-4 space-y-3.5 shadow-xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 block">
                      Valor final de compra do aparelho
                    </span>
                    {currentModel && (
                      <span className="text-[10px] font-black bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 px-2 py-0.5 rounded-full">
                        {currentModel.model_name}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-[#00D287] tracking-tight mt-1">
                    R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="space-y-2 text-xs border-t border-white/10 pt-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Valor na compra / base</span>
                    <strong className="text-white font-bold">
                      R$ {baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {activeFaultsList.length > 0 && (
                    <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                      {activeFaultsList.map(f => (
                        <div key={f.id} className="flex justify-between text-red-400 font-medium">
                          <span className="truncate max-w-[200px]">{f.label}</span>
                          <strong className="font-bold shrink-0">– R$ {f.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {willBuyFromStock && tradeBonusAmount > 0 && (
                    <div className="flex justify-between text-[#00D287] font-medium">
                      <span>Bônus na troca</span>
                      <strong className="font-bold">+ R$ {tradeBonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}

                  <div className="flex justify-between text-white font-black border-t border-white/10 pt-2.5 text-sm">
                    <span>Total Avaliado</span>
                    <span className="text-[#00D287] font-black">
                      R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulação de Troca */}
              <div className="border border-[#00D287]/30 rounded-2xl bg-gradient-to-b from-[#0a1815] to-[#090f1f] p-4 space-y-2.5 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#00D287]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#00D287]">
                    Simulação de Troca (Abatimento)
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Valor do celular que a loja vai vender (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                    <Input
                      type="number"
                      value={sellingPhonePrice}
                      onChange={(e) => setSellingPhonePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 4500"
                      className="bg-[#040711] border-white/10 pl-9 text-sm text-white font-bold rounded-xl focus:border-[#00D287] h-10"
                    />
                  </div>
                </div>

                {sellingPhonePrice && Number(sellingPhonePrice) > 0 ? (
                  <div className="p-3 rounded-xl bg-[#060a16] border border-white/10 space-y-1.5 text-xs animate-in fade-in duration-200">
                    <div className="flex justify-between text-slate-300">
                      <span>Aparelho vendido:</span>
                      <span>R$ {Number(sellingPhonePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-red-400 font-semibold">
                      <span>(-) Avaliação do usado:</span>
                      <span>- R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-white font-black border-t border-white/10 pt-1.5 text-sm">
                      <span className="text-slate-300">Cliente paga apenas:</span>
                      <span className="text-[#00D287] font-black">
                        R$ {differenceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    Digite o valor do celular da loja para calcular automaticamente o saldo a pagar.
                  </p>
                )}
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="space-y-2 shrink-0 pt-1">
              <Button
                disabled={!currentModel}
                onClick={handleRequestOpenTerm}
                className="w-full bg-[#00D287] hover:bg-[#00be7a] disabled:bg-[#0c1424] disabled:text-slate-600 text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-[#00D287]/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <FileSignature className="w-4 h-4 stroke-[2.5]" />
                {currentModel ? 'Gerar Termo de Compra & Assinatura' : 'Selecione um Modelo Primeiro'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE REFORMULATED STEP-BY-STEP VIEW (Clean, No-Overlap, Touch-Friendly) */}
      <div className="flex lg:hidden flex-col space-y-4">
        
        {/* Passo 1: Marca e Modelo */}
        <div className="bg-[#060a16] p-4 rounded-2xl border border-white/10 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00D287] text-slate-950 font-black text-xs flex items-center justify-center shrink-0">1</span>
              Selecionar Aparelho
            </label>
            <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
              {modelsForBrand.length} modelos
            </span>
          </div>

          {/* Horizontal scrollable Brand Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {BRANDS_LIST.map((brand) => {
              const isSelected = selectedBrand === brand;
              return (
                <button
                  key={brand}
                  onClick={() => handleSelectBrand(brand)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#00D287] text-slate-950 font-black shadow-md shadow-[#00D287]/20 scale-105'
                      : 'bg-[#0c1424] text-slate-300 border border-white/10 active:bg-white/10'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>

          {/* Model Selector */}
          {isLoadingModels ? (
            <div className="h-12 rounded-xl bg-[#040711] border border-white/10 flex items-center gap-2.5 px-3.5 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00D287]" />
              <span>Carregando modelos...</span>
            </div>
          ) : modelsForBrand.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#0c1424] border border-white/10 text-center space-y-2">
              <p className="text-xs text-slate-300">
                Nenhum modelo cadastrado para <strong>{selectedBrand}</strong>.
              </p>
              <Button
                size="sm"
                onClick={() => setIsAdminModalOpen(true)}
                className="w-full bg-[#00D287] text-slate-950 font-black text-xs h-9 rounded-xl"
              >
                + Cadastrar Modelo
              </Button>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setAiEvaluated(false);
                  setAiDetectedCount(0);
                  setSelectedFaults({});
                }}
                className={`w-full bg-[#040711] border text-xs font-bold rounded-xl px-3.5 py-3 text-white outline-none appearance-none pr-10 cursor-pointer h-12 shadow-sm transition-all ${
                  !selectedModelId ? 'border-amber-500/70 ring-1 ring-amber-500/30 text-amber-200' : 'border-[#00D287]/40 text-white'
                }`}
              >
                <option value="" disabled>
                  👉 Escolha o modelo ({selectedBrand})...
                </option>
                {modelsForBrand.map(m => (
                  <option key={m.id} value={m.id} className="text-white bg-[#060a16]">
                    {m.model_name} {m.storage} — Base: R$ {m.buy_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Passo 2: Câmera IA */}
        {currentModel ? (
          <div className="bg-[#060a16] p-4 rounded-2xl border border-[#00D287]/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#00D287] text-slate-950 font-black text-xs flex items-center justify-center shrink-0">2</span>
                Diagnóstico com IA
              </label>
              {aiEvaluated && (
                <span className="bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Laudo Concluído
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {aiEvaluated
                ? `Fotos analisadas com sucesso (${aiDetectedCount} avarias identificadas). Você pode revisar a lista abaixo.`
                : `Tire fotos de Frente, Traseira e Lateral para laudo visual com inteligência artificial.`}
            </p>

            <Button
              onClick={() => setIsAiModalOpen(true)}
              className={`w-full font-black text-xs h-11 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                aiEvaluated
                  ? 'bg-[#0c1424] hover:bg-[#121e35] text-slate-200 border border-white/10'
                  : 'bg-gradient-to-r from-[#00D287] to-emerald-400 text-slate-950 shadow-[#00D287]/25'
              }`}
            >
              <Camera className="w-4 h-4 text-slate-950" />
              {aiEvaluated ? 'Reavaliar com IA' : 'Abrir Câmera IA'}
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Button>
          </div>
        ) : null}

        {/* Passo 3: Checklist de Avarias */}
        {currentModel ? (
          <div className="bg-[#060a16] p-4 rounded-2xl border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-black text-xs flex items-center justify-center shrink-0">3</span>
                Revisão de Avarias
              </label>
              <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full">
                {activeFaultsList.length} marcada(s)
              </span>
            </div>

            {/* Faults List (Full items, comfortable tap target) */}
            <div className="space-y-1.5">
              {brandFaultDefinitions.map(fault => {
                const isChecked = !!selectedFaults[fault.id];
                const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                  ? currentModel.fault_discounts[fault.id]
                  : fault.defaultDiscount;

                return (
                  <div
                    key={fault.id}
                    onClick={() => toggleFault(fault.id)}
                    role="checkbox"
                    aria-checked={isChecked}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer select-none transition-all min-h-[46px] border ${
                      isChecked
                        ? 'bg-red-950/40 border-red-500/40 text-white'
                        : 'bg-[#090f1f] border-white/5 text-slate-300 active:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                        isChecked
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${isChecked ? 'font-bold text-white' : 'font-medium'}`}>
                        {fault.label}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-red-400 shrink-0">
                      – R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}

              {/* Trade Bonus Row */}
              <div
                onClick={() => setWillBuyFromStock(prev => !prev)}
                role="checkbox"
                aria-checked={willBuyFromStock}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer select-none transition-all min-h-[46px] border ${
                  willBuyFromStock
                    ? 'bg-[#00D287]/15 border-[#00D287]/40'
                    : 'bg-[#090f1f] border-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                    willBuyFromStock
                      ? 'bg-[#00D287] border-[#00D287] text-slate-950'
                      : 'border-slate-600 bg-slate-900'
                  }`}>
                    {willBuyFromStock && (
                      <svg className="w-3.5 h-3.5 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${willBuyFromStock ? 'text-[#00D287] font-bold' : 'text-slate-300 font-medium'}`}>
                    Cliente vai levar outro da loja
                  </span>
                </div>

                <span className="text-xs font-black text-[#00D287] shrink-0">
                  + R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Passo 4: Resumo de Compra & Simulação */}
        {currentModel ? (
          <div className="bg-[#060a16] p-4 rounded-2xl border border-white/10 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Valor Final de Compra
              </span>
              <span className="text-[10px] font-black bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 px-2 py-0.5 rounded-full">
                {currentModel.model_name}
              </span>
            </div>

            <div className="text-3xl font-black text-[#00D287] tracking-tight">
              R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

            {/* Toggle Detalhes de Cálculo */}
            <button
              onClick={() => setShowMobileBreakdown(prev => !prev)}
              className="w-full flex items-center justify-between text-xs text-slate-400 font-bold py-1.5 border-t border-white/10"
            >
              <span>{showMobileBreakdown ? 'Ocultar detalhes' : 'Ver detalhamento do cálculo'}</span>
              {showMobileBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMobileBreakdown && (
              <div className="space-y-2 text-xs bg-[#090f1f] p-3 rounded-xl border border-white/5 animate-in fade-in duration-150">
                <div className="flex justify-between text-slate-300">
                  <span>Valor base da tabela:</span>
                  <strong className="text-white">R$ {baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>

                {activeFaultsList.map(f => (
                  <div key={f.id} className="flex justify-between text-red-400">
                    <span className="truncate max-w-[200px]">{f.label}:</span>
                    <strong>– R$ {f.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                ))}

                {willBuyFromStock && tradeBonusAmount > 0 && (
                  <div className="flex justify-between text-[#00D287]">
                    <span>Bônus troca:</span>
                    <strong>+ R$ {tradeBonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Simulação de Troca */}
            <div className="bg-[#090f1f] p-3.5 rounded-xl border border-[#00D287]/20 space-y-2">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#00D287]" />
                <span className="text-[11px] font-bold text-[#00D287] uppercase">
                  Simulação de Troca
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                <Input
                  type="number"
                  value={sellingPhonePrice}
                  onChange={(e) => setSellingPhonePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Preço do celular vendido..."
                  className="bg-[#040711] border-white/10 pl-8 text-xs text-white font-bold rounded-xl h-10"
                />
              </div>

              {sellingPhonePrice && Number(sellingPhonePrice) > 0 ? (
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Venda:</span>
                    <span>R$ {Number(sellingPhonePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>(-) Usado:</span>
                    <span>- R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1 border-t border-white/5">
                    <span>Cliente paga:</span>
                    <span className="text-[#00D287] font-black text-sm">
                      R$ {differenceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

      </div>

      {/* FIXED BOTTOM FLOATING BAR (MOBILE ONLY) */}
      <div className="lg:hidden fixed bottom-[64px] left-0 right-0 z-40 bg-[#060a16]/95 backdrop-blur-md border-t border-white/10 p-3 px-4 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">
            Valor de Compra
          </span>
          <span className="text-base font-black text-[#00D287]">
            {currentModel ? `R$ ${finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Selecione o modelo'}
          </span>
        </div>

        <Button
          disabled={!currentModel}
          onClick={handleRequestOpenTerm}
          className="bg-[#00D287] hover:bg-[#00be7a] disabled:bg-[#0c1424] disabled:text-slate-600 text-slate-950 font-black text-xs h-11 px-4 rounded-xl shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 shrink-0"
        >
          <FileSignature className="w-4 h-4 stroke-[2.5]" />
          Gerar Termo
        </Button>
      </div>

      {/* Modals */}
      <ResponsibilityTermModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        currentUser={currentUser}
        evaluation={{
          brand: selectedBrand,
          model_name: currentModel?.model_name || '',
          storage: currentModel?.storage || '',
          base_value: baseValue,
          faults_selected: activeFaultsList,
          total_faults_discount: totalFaultsDiscount,
          trade_bonus_applied: tradeBonusAmount,
          final_valuation: finalValuation,
          type: willBuyFromStock ? 'troca' : 'compra',
          exchange_target_price: sellingPhonePrice ? Number(sellingPhonePrice) : 0,
          exchange_difference_to_pay: differenceToPay,
          photos: aiPhotos,
          visual_summary: aiVisualSummary,
          ai_evaluated: aiEvaluated
        }}
        settings={settings}
        onSaveWithCustomer={handleSaveEvaluationWithCustomer}
        onOpenStoreSettings={() => {
          setIsTermModalOpen(false);
          setAdminModalTab('settings');
          setIsAdminModalOpen(true);
        }}
        onSavedSuccessfully={() => {
          setSelectedModelId('');
          setSelectedFaults({});
          setAiEvaluated(false);
          setAiDetectedCount(0);
          setAiPhotos([]);
          setAiVisualSummary([]);
          setSellingPhonePrice('');
          setWillBuyFromStock(false);
        }}
      />

      <TradeInHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={userId}
      />

      <TradeInAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          loadModels();
        }}
        userId={userId}
        initialTab={adminModalTab}
      />

      <TradeInAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        userId={userId || 'anon'}
        currentModel={currentModel}
        brandPresets={brandFaultDefinitions}
        onApplyDetectedFaults={handleApplyDetectedFaults}
      />

      <MissingStoreDataModal
        isOpen={isMissingDataModalOpen}
        onClose={() => setIsMissingDataModalOpen(false)}
        missingFields={missingStoreFields}
        onOpenStoreSettings={handleOpenStoreSettingsFromWarning}
        onProceedAnyway={handleProceedToTermAnyway}
      />
    </div>
  );
};