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
  Layers,
  ArrowRight
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
import { tradeinService, getBrandPresets, BRANDS_LIST } from '@/services/tradeinService';
import { ResponsibilityTermModal } from '@/components/tradein/ResponsibilityTermModal';
import { TradeInHistoryModal } from '@/components/tradein/TradeInHistoryModal';
import { TradeInAdminModal } from '@/components/tradein/TradeInAdminModal';
import { TradeInAiModal } from '@/components/tradein/TradeInAiModal';
import { leadAuthService } from '@/services/leadAuthService';

interface TradeInTabProps {
  onGoToAurusSimulator?: () => void;
}

export const TradeInTab: React.FC<TradeInTabProps> = () => {
  // Current user / lojista
  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  // Selected Brand & Models (Starts with NO model pre-selected)
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('Apple');
  const [allModels, setAllModels] = useState<ValuationModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Custom manual model fallback
  const [isManualModel, setIsManualModel] = useState<boolean>(false);
  const [customModelName, setCustomModelName] = useState<string>('');
  const [customBaseBuyPrice, setCustomBaseBuyPrice] = useState<number>(3000);

  // Selected faults checklist
  const [selectedFaults, setSelectedFaults] = useState<Record<string, boolean>>({});

  // IA evaluation state feedback
  const [aiEvaluated, setAiEvaluated] = useState<boolean>(false);
  const [aiDetectedCount, setAiDetectedCount] = useState<number>(0);

  // Trade Bonus toggle ("Cliente vai levar outro seminovo do nosso estoque")
  const [willBuyFromStock, setWillBuyFromStock] = useState<boolean>(false);

  // Mini Calculo: Valor do celular que a loja vai vender (apenas a caixinha com o valor)
  const [sellingPhonePrice, setSellingPhonePrice] = useState<number | ''>('');

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<ValuationSettings | undefined>(undefined);

  // Load models on brand or user change
  const loadModels = async () => {
    try {
      const [models, st] = await Promise.all([
        tradeinService.getModels(selectedBrand, userId),
        tradeinService.getSettings(userId)
      ]);
      setAllModels(models);
      setSettings(st);
      // Keep model unselected when switching brand so lojista selects explicitly
      setSelectedModelId('');
      setAiEvaluated(false);
      setAiDetectedCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadModels();
    setSelectedFaults({});
  }, [selectedBrand, userId]);

  // Current active model object
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
    return allModels.find(m => m.id === selectedModelId) || null;
  }, [allModels, selectedModelId, isManualModel, customModelName, customBaseBuyPrice, selectedBrand]);

  // Presets específicos do fabricante atual (filtrados por modelo se necessário, ex: S Pen)
  const brandFaultDefinitions: FaultDefinition[] = useMemo(() => {
    return getBrandPresets(selectedBrand, currentModel?.model_name);
  }, [selectedBrand, currentModel?.model_name]);

  // Active faults list with dynamic pricing from current model or brand defaults
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

  // Base buy price
  const baseValue = currentModel ? currentModel.buy_price : 0;
  const tradeBonusAmount = willBuyFromStock ? (currentModel?.trade_bonus || settings?.default_trade_bonus || 50) : 0;

  // Final Valuation Calculation
  const finalValuation = useMemo(() => {
    if (!currentModel) return 0;
    const raw = baseValue - totalFaultsDiscount + tradeBonusAmount;
    return Math.max(Math.round(raw / 10) * 10, 50);
  }, [currentModel, baseValue, totalFaultsDiscount, tradeBonusAmount]);

  // Mini cálculo: Diferença a pagar se o lojista vender um celular
  const differenceToPay = useMemo(() => {
    if (!sellingPhonePrice || Number(sellingPhonePrice) <= 0 || !currentModel) return 0;
    return Math.max(Number(sellingPhonePrice) - finalValuation, 0);
  }, [sellingPhonePrice, finalValuation, currentModel]);

  // Toggle fault checkbox
  const toggleFault = (faultId: string) => {
    setSelectedFaults(prev => ({
      ...prev,
      [faultId]: !prev[faultId]
    }));
  };

  // Aplicar avarias detectadas pela IA
  const handleApplyDetectedFaults = (detectedIds: string[]) => {
    const newFaultsMap: Record<string, boolean> = {};
    detectedIds.forEach(id => {
      newFaultsMap[id] = true;
    });
    setSelectedFaults(newFaultsMap);
    setAiEvaluated(true);
    setAiDetectedCount(detectedIds.length);
  };

  // Confirm Save & Generate Term with Customer Data & IMEI
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

  return (
    <div className="h-full overflow-y-auto lg:overflow-hidden bg-[#050811] text-slate-100 p-2.5 sm:p-4 space-y-3 flex flex-col justify-start">
      {/* Top Bar with History & Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#080c17] p-3 rounded-2xl border border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white leading-tight">
              Avaliação de Aparelho <span className="text-blue-400">(Seminovos & Troca)</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Processo guiado: Selecione o modelo, fotografe com a IA e feche o contrato com precisão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="border-slate-800 bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 h-8 px-3"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            Histórico de Termos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdminModalOpen(true)}
            className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 h-8 px-3"
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            Editar Minha Tabela
          </Button>
        </div>
      </div>

      {/* Main Quotation Window Card */}
      <div className="bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Window Topbar */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-[#1e293b]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/90 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 inline-block"></span>
            </div>
            <span className="text-xs font-bold text-slate-200 ml-2">Mesa de Avaliação Trade-In</span>
          </div>

          <div className="text-[11px] text-slate-300 font-medium">
            {allModels.length} modelos cadastrados ({selectedBrand})
          </div>
        </div>

        {/* Content Container (Grid) */}
        <div className="p-3.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Device Selection & Faults List */}
          <div className="lg:col-span-7 flex flex-col space-y-2.5 min-h-0">
            {/* ETAPA 1: Marca & Modelo do Aparelho */}
            <div className="space-y-1.5 shrink-0 bg-[#141e33] p-3 rounded-2xl border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-500 text-white font-black text-[10px] flex items-center justify-center">1</span>
                  <label className="text-xs font-bold text-white">
                    Selecione a Marca e o Modelo do Aparelho
                  </label>
                </div>
                <button
                  onClick={() => setIsManualModel(!isManualModel)}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  {isManualModel ? '← Escolher da lista' : 'Outro modelo (manual)'}
                </button>
              </div>

              {/* Brand Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {BRANDS_LIST.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setIsManualModel(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedBrand === brand
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                        : 'bg-[#1e293b] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              {isManualModel ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <Input
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="Nome do modelo (Ex: Galaxy S24 Ultra 256GB)"
                    className="bg-[#0f172a] border-slate-700 text-xs text-white rounded-xl focus:border-blue-500 h-9"
                  />
                  <Input
                    type="number"
                    value={customBaseBuyPrice}
                    onChange={(e) => setCustomBaseBuyPrice(Number(e.target.value) || 0)}
                    placeholder="Valor base de compra (R$)"
                    className="bg-[#0f172a] border-slate-700 text-xs text-emerald-400 font-bold rounded-xl h-9"
                  />
                </div>
              ) : allModels.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#1e293b] border border-slate-700 text-center space-y-1.5">
                  <p className="text-xs text-slate-300">
                    Nenhum modelo cadastrado para <strong>{selectedBrand}</strong> ainda.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold h-7 rounded-lg"
                    >
                      + Cadastrar em Minha Tabela
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsManualModel(true)}
                      className="border-slate-600 text-slate-200 text-xs font-bold h-7 rounded-lg"
                    >
                      Digitar Manualmente
                    </Button>
                  </div>
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
                    className={`w-full bg-[#0f172a] border text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 text-white outline-none appearance-none pr-10 cursor-pointer h-10 shadow-sm transition-all ${
                      !selectedModelId ? 'border-amber-500/80 ring-2 ring-amber-500/20 text-slate-400' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  >
                    <option value="" disabled>
                      👉 Escolha o modelo ({selectedBrand})...
                    </option>
                    {allModels.map(m => (
                      <option key={m.id} value={m.id} className="text-white bg-slate-900">
                        {m.model_name} {m.storage} — Base: R$ {m.buy_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* ETAPA 2: BANNER HERO DE AVALIAÇÃO COM IA (ESSENCIAL) */}
            {currentModel ? (
              <div className={`p-3.5 rounded-2xl border transition-all shrink-0 ${
                aiEvaluated
                  ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40'
                  : 'bg-gradient-to-r from-indigo-950/70 via-blue-950/50 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Etapa Essencial: Fotos com IA
                      </span>
                      {aiEvaluated && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Laudo IA Concluído
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {aiEvaluated
                        ? `A IA analisou as fotos e detectou ${aiDetectedCount} avaria(s). Você pode revisar a lista abaixo.`
                        : `Escaneie as fotos (Frente, Traseira e Lateral) via QR Code no celular para identificar riscos, trincos e burn-in automaticamente.`}
                    </p>
                  </div>

                  <Button
                    size="default"
                    onClick={() => setIsAiModalOpen(true)}
                    className={`font-black text-xs h-10 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 shrink-0 transition-all ${
                      aiEvaluated
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600 hover:from-amber-300 hover:to-indigo-500 text-slate-950 font-black ring-2 ring-amber-400/50 scale-105 shadow-amber-500/20'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    {aiEvaluated ? 'Reavaliar com IA' : 'Abrir Câmera IA (QR Code)'}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#1e293b]/40 border border-dashed border-slate-700 text-center text-slate-400 text-xs">
                Selecione o modelo do aparelho no Passo 1 para desbloquear a Avaliação com IA e o checklist.
              </div>
            )}

            {/* ETAPA 3: Checklist de Avarias com Scroll Interno */}
            {currentModel && (
              <div className="flex flex-col flex-1 min-h-0 space-y-1.5">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-700 text-white font-black text-[10px] flex items-center justify-center">3</span>
                    <span className="text-xs font-bold text-slate-100 block">
                      Revisão de Avarias / Testes Funcionais ({selectedBrand})
                    </span>
                  </div>
                  
                  <span className="text-[11px] text-slate-400">
                    {activeFaultsList.length} avaria(s) marcada(s)
                  </span>
                </div>

                <div className="border border-slate-700 rounded-2xl bg-[#1e293b]/70 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                  {/* Scrollable list of faults only */}
                  <div className="overflow-y-auto max-h-[180px] sm:max-h-[220px] lg:max-h-none lg:flex-1 divide-y divide-slate-700/80 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-0.5">
                    {brandFaultDefinitions.map(fault => {
                      const isChecked = !!selectedFaults[fault.id];
                      const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                        ? currentModel.fault_discounts[fault.id]
                        : fault.defaultDiscount;

                      return (
                        <div
                          key={fault.id}
                          onClick={() => toggleFault(fault.id)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              toggleFault(fault.id);
                            }
                          }}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          className={`flex items-center justify-between py-2 px-3 sm:px-3.5 cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-red-950/40' : 'hover:bg-[#1e293b]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isChecked
                                ? 'bg-red-600 border-red-600 text-white'
                                : 'border-slate-600 bg-slate-800/90'
                            }`}>
                              {isChecked && (
                                <svg className="w-3 h-3 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${isChecked ? 'text-white font-semibold' : 'text-slate-200'}`}>
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

                  {/* Fixed Trade Bonus Row at bottom */}
                  <div
                    onClick={() => setWillBuyFromStock(prev => !prev)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setWillBuyFromStock(prev => !prev);
                      }
                    }}
                    role="checkbox"
                    aria-checked={willBuyFromStock}
                    tabIndex={0}
                    className={`flex items-center justify-between py-2.5 px-3 sm:px-3.5 cursor-pointer select-none transition-colors border-t border-slate-700 shrink-0 ${
                      willBuyFromStock ? 'bg-blue-950/50' : 'bg-[#182338]/90 hover:bg-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        willBuyFromStock
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-600 bg-slate-800/90'
                      }`}>
                        {willBuyFromStock && (
                          <svg className="w-3 h-3 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${willBuyFromStock ? 'text-blue-300 font-bold' : 'text-slate-200 font-medium'}`}>
                        Cliente vai levar outro seminovo (+ R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      + R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pricing Result & Mini Trade Calculation */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3 min-h-0">
            <div className="space-y-3">
              {/* Card "Valor a pagar" */}
              <div className="border border-slate-700 rounded-2xl bg-[#1e293b] p-4 space-y-3 shadow-xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Valor final de compra do aparelho
                    </span>
                    {currentModel && (
                      <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                        {currentModel.model_name}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight mt-0.5">
                    R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="space-y-1.5 text-xs border-t border-slate-700 pt-2.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Valor na compra / base</span>
                    <strong className="text-white font-bold">
                      R$ {baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {activeFaultsList.length > 0 && (
                    <div className="max-h-20 overflow-y-auto space-y-1 scrollbar-thin pr-1">
                      {activeFaultsList.map(f => (
                        <div key={f.id} className="flex justify-between text-red-400 font-medium">
                          <span className="truncate max-w-[200px]">{f.label}</span>
                          <strong className="font-bold shrink-0">– R$ {f.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {willBuyFromStock && tradeBonusAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Bônus na troca</span>
                      <strong className="font-bold">+ R$ {tradeBonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}

                  <div className="flex justify-between text-white font-black border-t border-slate-700 pt-2 text-xs sm:text-sm">
                    <span>Total Avaliado</span>
                    <span className="text-blue-400 font-black">
                      R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Cálculo: Vender celular da loja abatendo o seminovo */}
              <div className="border border-blue-500/40 rounded-2xl bg-gradient-to-b from-blue-950/40 to-[#1e293b] p-3 sm:p-3.5 space-y-2 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                    Simulação de Troca (Abatimento)
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-200 block">
                    Valor do celular que a loja vai vender (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                    <Input
                      type="number"
                      value={sellingPhonePrice}
                      onChange={(e) => setSellingPhonePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 4500"
                      className="bg-[#0f172a] border-slate-700 pl-9 text-xs sm:text-sm text-white font-bold rounded-xl focus:border-blue-500 h-9"
                    />
                  </div>
                </div>

                {sellingPhonePrice && Number(sellingPhonePrice) > 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1 text-xs animate-in fade-in duration-200">
                    <div className="flex justify-between text-slate-300">
                      <span>Aparelho vendido:</span>
                      <span>R$ {Number(sellingPhonePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>(-) Avaliação do usado:</span>
                      <span>- R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-white font-black border-t border-slate-700 pt-1 text-xs sm:text-sm">
                      <span className="text-blue-300">Cliente paga apenas:</span>
                      <span className="text-emerald-400 font-black">
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

            {/* Step 4 Action Button */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center gap-1.5 px-1">
                <span className="w-4 h-4 rounded bg-blue-500 text-white font-black text-[9px] flex items-center justify-center">4</span>
                <span className="text-[11px] font-bold text-slate-300">Fechamento do Negócio</span>
              </div>
              <Button
                disabled={!currentModel}
                onClick={() => setIsTermModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs sm:text-sm h-11 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <FileSignature className="w-4 h-4" />
                {currentModel ? 'Gerar Termo de Compra & Assinatura' : 'Selecione um Modelo Primeiro'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ResponsibilityTermModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        evaluation={{
          brand: selectedBrand,
          model_name: currentModel?.model_name || '',
          storage: currentModel?.storage || '',
          base_value: baseValue,
          total_faults_discount: totalFaultsDiscount,
          trade_bonus_applied: tradeBonusAmount,
          final_valuation: finalValuation,
          type: willBuyFromStock ? 'troca' : 'compra',
          exchange_target_price: sellingPhonePrice ? Number(sellingPhonePrice) : 0,
          exchange_difference_to_pay: differenceToPay
        }}
        settings={settings}
        onConfirmSave={handleSaveEvaluationWithCustomer}
      />

      <TradeInHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <TradeInAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onModelUpdated={loadModels}
      />

      <TradeInAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        userId={userId || 'guest'}
        currentModel={currentModel}
        brandPresets={brandFaultDefinitions}
        onApplyDetectedFaults={handleApplyDetectedFaults}
      />
    </div>
  );
};
