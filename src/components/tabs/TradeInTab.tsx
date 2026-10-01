import React, { useState, useEffect, useMemo } from 'react';
import { 
  Repeat, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Smartphone,
  ShieldCheck,
  History,
  Settings,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingDown,
  Gift,
  Search,
  DollarSign,
  Share2,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ValuationModel, 
  SelectedFault, 
  CustomerData, 
  TradeInEvaluation,
  ValuationSettings,
  DeviceBrand 
} from '@/types/tradein';
import { tradeinService, FAULT_DEFINITIONS, BRANDS_LIST } from '@/services/tradeinService';
import { ResponsibilityTermModal } from '@/components/tradein/ResponsibilityTermModal';
import { TradeInHistoryModal } from '@/components/tradein/TradeInHistoryModal';
import { TradeInAdminModal } from '@/components/tradein/TradeInAdminModal';
import { leadAuthService } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface TradeInTabProps {
  onGoToAurusSimulator?: () => void;
}

export const TradeInTab: React.FC<TradeInTabProps> = ({ onGoToAurusSimulator }) => {
  // Navigation & Data State
  const [brands] = useState<DeviceBrand[]>(BRANDS_LIST);
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('Apple');
  const [allModels, setAllModels] = useState<ValuationModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [imei, setImei] = useState<string>('');
  
  // Custom manual input fallback if model not in table
  const [isManualModel, setIsManualModel] = useState<boolean>(false);
  const [customModelName, setCustomModelName] = useState<string>('');
  const [customBaseBuyPrice, setCustomBaseBuyPrice] = useState<number>(1500);

  // Selected faults checklist
  const [selectedFaults, setSelectedFaults] = useState<Record<string, boolean>>({});
  const [faultCategoryTab, setFaultCategoryTab] = useState<'todos' | 'estetica' | 'tela' | 'bateria' | 'cameras_sensores' | 'placa_sistema'>('todos');

  // Operation Type: 'troca' or 'compra'
  const [operationType, setOperationType] = useState<'compra' | 'troca'>('troca');

  // Trade-In Exchange Target Phone (Aparelho da Loja)
  const [targetPhoneName, setTargetPhoneName] = useState<string>('iPhone 15 128GB Lacrado');
  const [targetPhonePrice, setTargetPhonePrice] = useState<number>(4799);

  // Custom adjustments (+/- R$)
  const [customAdjustment, setCustomAdjustment] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<ValuationSettings | undefined>(undefined);

  // UI helpers
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  // User role check
  const currentUser = leadAuthService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Load models on brand change
  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const [models, st] = await Promise.all([
        tradeinService.getModels(selectedBrand),
        tradeinService.getSettings()
      ]);
      setAllModels(models);
      setSettings(st);

      if (models.length > 0 && !isManualModel) {
        setSelectedModelId(models[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    loadModels();
    setSelectedFaults({});
  }, [selectedBrand]);

  // Current active model object
  const currentModel = useMemo(() => {
    if (isManualModel) {
      return {
        id: 'manual',
        brand: selectedBrand,
        model_name: customModelName || `Smartphone ${selectedBrand}`,
        storage: '128GB',
        base_price: customBaseBuyPrice * 1.3,
        buy_price: customBaseBuyPrice,
        trade_bonus: 100,
        fault_discounts: {},
        is_active: true,
        display_order: 0
      } as ValuationModel;
    }
    return allModels.find(m => m.id === selectedModelId) || allModels[0] || null;
  }, [allModels, selectedModelId, isManualModel, customModelName, customBaseBuyPrice, selectedBrand]);

  // Filter models for search dropdown
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return allModels;
    return allModels.filter(m => 
      m.model_name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.storage.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [allModels, modelSearch]);

  // Calculate Faults
  const activeFaultsList: SelectedFault[] = useMemo(() => {
    if (!currentModel) return [];
    const list: SelectedFault[] = [];

    FAULT_DEFINITIONS.forEach(def => {
      if (selectedFaults[def.id]) {
        // Model-specific discount or default
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
  }, [selectedFaults, currentModel]);

  const totalFaultsDiscount = useMemo(() => {
    return activeFaultsList.reduce((acc, f) => acc + f.discount, 0);
  }, [activeFaultsList]);

  // Base buy price
  const baseValue = currentModel ? currentModel.buy_price : 0;
  const tradeBonus = operationType === 'troca' ? (currentModel?.trade_bonus || settings?.default_trade_bonus || 100) : 0;

  // Final Valuation Calculation
  const finalValuation = useMemo(() => {
    const raw = baseValue - totalFaultsDiscount + tradeBonus + (Number(customAdjustment) || 0);
    return Math.max(Math.round(raw / 10) * 10, 100);
  }, [baseValue, totalFaultsDiscount, tradeBonus, customAdjustment]);

  // Exchange difference
  const exchangeDifferenceToPay = useMemo(() => {
    if (operationType !== 'troca') return 0;
    return Math.max(targetPhonePrice - finalValuation, 0);
  }, [operationType, targetPhonePrice, finalValuation]);

  // Toggle fault
  const toggleFault = (faultId: string) => {
    setSelectedFaults(prev => ({
      ...prev,
      [faultId]: !prev[faultId]
    }));
  };

  // Copy WhatsApp Proposal
  const handleCopyProposal = () => {
    if (!currentModel) return;

    let text = `📋 *AVALIAÇÃO OFICIAL DE APARELHO — ${settings?.store_name || 'CELLHUB'}*\n\n`;
    text += `📱 *Aparelho Avaliado:* ${currentModel.brand} ${currentModel.model_name} ${currentModel.storage}\n`;
    if (imei) text += `🔢 *IMEI:* ${imei}\n`;
    text += `💵 *Valor Base de Compra:* R$ ${baseValue.toLocaleString('pt-BR')}\n`;

    if (activeFaultsList.length > 0) {
      text += `\n🔍 *Avarias & Condições Assinaladas:*\n`;
      activeFaultsList.forEach(f => {
        text += ` • ${f.label}: - R$ ${f.discount.toLocaleString('pt-BR')}\n`;
      });
      text += `🔻 *Total Descontos:* - R$ ${totalFaultsDiscount.toLocaleString('pt-BR')}\n`;
    } else {
      text += `✨ *Condição:* 100% Impecável (Sem avarias)\n`;
    }

    if (operationType === 'troca' && tradeBonus > 0) {
      text += `🎁 *Bônus Especial de Troca na Loja:* + R$ ${tradeBonus.toLocaleString('pt-BR')}\n`;
    }

    if (customAdjustment !== 0) {
      text += `⚡ *Ajuste Comercial:* ${customAdjustment > 0 ? '+' : ''} R$ ${customAdjustment.toLocaleString('pt-BR')} ${adjustmentReason ? `(${adjustmentReason})` : ''}\n`;
    }

    text += `\n💰 *VALOR FINAL DA AVALIAÇÃO:* R$ ${finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;

    if (operationType === 'troca') {
      text += `\n🎯 *Aparelho Escolhido na Loja:* ${targetPhoneName} (R$ ${targetPhonePrice.toLocaleString('pt-BR')})\n`;
      text += `✨ *DIFERENÇA A PAGAR:* R$ ${exchangeDifferenceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      text += `*(Consulte opções de parcelamento no cartão em até 12x ou 18x!)*\n`;
    } else {
      text += `\n💵 *Pagamento Imediato via PIX na Compra do seu Usado.*\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedProposal(true);
    toast.success('Proposta formatada copiada para o WhatsApp!');
    setTimeout(() => setCopiedProposal(false), 2500);
  };

  // Confirm Save & Generate Term
  const handleSaveEvaluationWithCustomer = async (customerData: CustomerData, signatureData: string): Promise<TradeInEvaluation | null> => {
    if (!currentModel) return null;

    const res = await tradeinService.createEvaluation({
      type: operationType,
      brand: currentModel.brand,
      model_name: currentModel.model_name,
      storage: currentModel.storage,
      imei: imei || undefined,
      base_value: baseValue,
      faults_selected: activeFaultsList,
      total_faults_discount: totalFaultsDiscount,
      trade_bonus_applied: tradeBonus,
      custom_adjustment: customAdjustment,
      adjustment_reason: adjustmentReason,
      final_valuation: finalValuation,
      exchange_target_device: operationType === 'troca' ? targetPhoneName : undefined,
      exchange_target_price: operationType === 'troca' ? targetPhonePrice : 0,
      exchange_difference_to_pay: operationType === 'troca' ? exchangeDifferenceToPay : 0,
      customer_data: customerData,
      signature_data: signatureData,
      created_by_id: currentUser?.id,
      created_by_name: currentUser?.name || currentUser?.ownerName || 'Vendedor Balcão'
    });

    if (res.success && res.evaluation) {
      return res.evaluation;
    }
    return null;
  };

  // Quick save without term
  const handleQuickSaveEvaluation = async () => {
    if (!currentModel) return;
    try {
      const res = await tradeinService.createEvaluation({
        type: operationType,
        brand: currentModel.brand,
        model_name: currentModel.model_name,
        storage: currentModel.storage,
        imei: imei || undefined,
        base_value: baseValue,
        faults_selected: activeFaultsList,
        total_faults_discount: totalFaultsDiscount,
        trade_bonus_applied: tradeBonus,
        custom_adjustment: customAdjustment,
        adjustment_reason: adjustmentReason,
        final_valuation: finalValuation,
        exchange_target_device: operationType === 'troca' ? targetPhoneName : undefined,
        exchange_target_price: operationType === 'troca' ? targetPhonePrice : 0,
        exchange_difference_to_pay: operationType === 'troca' ? exchangeDifferenceToPay : 0,
        created_by_id: currentUser?.id,
        created_by_name: currentUser?.name || currentUser?.ownerName || 'Vendedor Balcão'
      });

      if (res.success) {
        toast.success(`Avaliação ${res.evaluation?.evaluation_code} registrada com sucesso no histórico!`);
      }
    } catch (err) {
      toast.error('Erro ao salvar avaliação.');
    }
  };

  // Filter fault definitions by category tab
  const displayedFaultDefinitions = useMemo(() => {
    if (faultCategoryTab === 'todos') return FAULT_DEFINITIONS;
    return FAULT_DEFINITIONS.filter(f => f.category === faultCategoryTab);
  }, [faultCategoryTab]);

  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-3 sm:p-6 space-y-6 pb-24 md:pb-8">
      {/* Top Header & Navigation Bar */}
      <div className="bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs font-bold">
              <Repeat className="w-3.5 h-3.5 mr-1" />
              Trade-In & Compra de Usados
            </Badge>
            <span className="text-xs text-slate-400">Tabela Parametrizada • iPhone & Android</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Avaliador Profissional de <span className="text-[#00D287]">Seminovos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Avaliação instantânea no balcão com cálculo automático de avarias, bônus de troca e emissão de termo de procedência com assinatura eletrônica.
          </p>
        </div>

        {/* Action Buttons: History & Admin */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsHistoryModalOpen(true)}
            className="border-slate-800 bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-blue-400" />
            Histórico
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAdminModalOpen(true)}
            className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            Tabela & Avarias (Admin)
          </Button>
        </div>
      </div>

      {/* Operation Type Switcher: Compra vs Troca */}
      <div className="grid grid-cols-2 gap-2 bg-[#080c17] p-1.5 rounded-2xl border border-slate-800 max-w-xl">
        <button
          onClick={() => setOperationType('troca')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
            operationType === 'troca'
              ? 'bg-[#00D287] text-slate-950 shadow-lg shadow-[#00D287]/20'
              : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Troca (Usado como Entrada)
        </button>

        <button
          onClick={() => setOperationType('compra')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
            operationType === 'compra'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Comprar Aparelho do Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Device Selection & Faults Checklist */}
        <div className="lg:col-span-7 space-y-5">
          {/* STEP 1: Brand & Model Selection */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#00D287]/20 text-[#00D287] flex items-center justify-center text-[10px] font-black">1</span>
                Selecione o Fabricante & Modelo
              </span>

              <button
                onClick={() => setIsManualModel(!isManualModel)}
                className="text-[11px] text-slate-400 hover:text-[#00D287] underline"
              >
                {isManualModel ? '← Escolher da Tabela Oficial' : 'Outro modelo não listado?'}
              </button>
            </div>

            {/* Brand Chips Bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setIsManualModel(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedBrand === brand
                      ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {brand === 'Apple' ? ' Apple' : brand}
                </button>
              ))}
            </div>

            {/* Model Selector / Dropdown or Manual */}
            {isManualModel ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Nome do Smartphone:</label>
                  <Input
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="Ex: Asus ROG Phone 7 256GB"
                    className="bg-slate-900 border-slate-800 text-xs text-white rounded-xl focus:border-[#00D287]"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Valor de Compra Base (R$):</label>
                  <Input
                    type="number"
                    value={customBaseBuyPrice}
                    onChange={(e) => setCustomBaseBuyPrice(Number(e.target.value) || 0)}
                    placeholder="1500"
                    className="bg-slate-900 border-slate-800 text-xs text-emerald-400 font-bold rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Modelo do Aparelho ({allModels.length} cadastrados):
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs font-bold rounded-xl p-2.5 text-white focus:border-[#00D287] outline-none"
                    >
                      {filteredModels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.model_name} • {m.storage} (Tabela: R$ {m.buy_price.toLocaleString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      IMEI do Aparelho (Opcional):
                    </label>
                    <Input
                      value={imei}
                      onChange={(e) => setImei(e.target.value)}
                      placeholder="Ex: 356789012345678"
                      maxLength={15}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono rounded-xl focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* Fast Model Badges / Quick selector */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allModels.slice(0, 8).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModelId(m.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        selectedModelId === m.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.model_name} ({m.storage})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Faults & Conditions Checklist */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#00D287]/20 text-[#00D287] flex items-center justify-center text-[10px] font-black">2</span>
                Marque as Avarias & Condições Físicas
              </span>

              {totalFaultsDiscount > 0 ? (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs font-bold">
                  {activeFaultsList.length} avaria(s) (- R$ {totalFaultsDiscount.toLocaleString('pt-BR')})
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                  100% Impecável (Sem avarias)
                </Badge>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
              {[
                { id: 'todos', label: 'Todas as Avarias' },
                { id: 'estetica', label: 'Estética / Carcaça' },
                { id: 'tela', label: 'Tela / Display' },
                { id: 'bateria', label: 'Bateria / Carga' },
                { id: 'cameras_sensores', label: 'Câmeras / Face ID' },
                { id: 'placa_sistema', label: 'Placa / Conexões' }
              ].map(tabItem => (
                <button
                  key={tabItem.id}
                  onClick={() => setFaultCategoryTab(tabItem.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    faultCategoryTab === tabItem.id
                      ? 'bg-slate-800 text-white font-bold'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            {/* Faults Matrix Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {displayedFaultDefinitions.map((fault) => {
                const isSelected = !!selectedFaults[fault.id];
                // Dynamic discount from current model or fallback
                const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                  ? currentModel.fault_discounts[fault.id]
                  : fault.defaultDiscount;

                return (
                  <div
                    key={fault.id}
                    onClick={() => toggleFault(fault.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-950/20 border-red-500/60 shadow-md shadow-red-950/30'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded accent-red-500 pointer-events-none"
                        />
                        <span className={`text-xs font-bold ${isSelected ? 'text-red-300' : 'text-slate-200'}`}>
                          {fault.label}
                        </span>
                      </div>
                      {fault.description && (
                        <p className="text-[10px] text-slate-400 pl-5 leading-tight">
                          {fault.description}
                        </p>
                      )}
                    </div>

                    <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                      - R$ {discount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Commercial Adjustments */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black">3</span>
              Ajuste Comercial Autorizado (Opcional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Ajuste no Valor Final (+/- R$):</label>
                <Input
                  type="number"
                  value={customAdjustment}
                  onChange={(e) => setCustomAdjustment(Number(e.target.value) || 0)}
                  placeholder="Ex: -50 ou +100"
                  className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Motivo / Observação do Ajuste:</label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ex: Cliente antigo / Acompanha fone original"
                  className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Result & Negotiation Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-4 rounded-2xl bg-[#080c17] border border-[#00D287]/20 p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Header Result */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00D287] flex items-center justify-between">
                <span>Resultado da Avaliação</span>
                <Badge className="bg-slate-900 border-slate-800 text-[10px] text-slate-300">
                  {operationType === 'troca' ? 'Operação de Troca' : 'Compra Direta'}
                </Badge>
              </div>

              <h3 className="text-lg font-black text-white mt-1">
                {currentModel?.brand} {currentModel?.model_name} {currentModel?.storage}
              </h3>
              {imei && <span className="text-[11px] font-mono text-slate-400">IMEI: {imei}</span>}
            </div>

            {/* Valuation Price Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-center">
              <span className="text-xs text-slate-400 font-medium">
                {operationType === 'troca' ? 'VALOR DO APARELHO NA TROCA:' : 'VALOR DE COMPRA SUGERIDO:'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#00D287] tracking-tight">
                R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {operationType === 'troca' && tradeBonus > 0 && (
                <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-semibold">
                  <Gift className="w-3.5 h-3.5" /> Inclui + R$ {tradeBonus} de bônus por levar aparelho da loja
                </div>
              )}
            </div>

            {/* Price Breakdown Details */}
            <div className="space-y-1.5 text-xs p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span>Preço Base de Tabela:</span>
                <strong>R$ {baseValue.toLocaleString('pt-BR')}</strong>
              </div>

              {totalFaultsDiscount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto de Avarias ({activeFaultsList.length}):</span>
                  <strong>- R$ {totalFaultsDiscount.toLocaleString('pt-BR')}</strong>
                </div>
              )}

              {operationType === 'troca' && tradeBonus > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Bônus de Troca:</span>
                  <strong>+ R$ {tradeBonus.toLocaleString('pt-BR')}</strong>
                </div>
              )}

              {customAdjustment !== 0 && (
                <div className="flex justify-between text-blue-400">
                  <span>Ajuste Manual:</span>
                  <strong>{customAdjustment > 0 ? '+' : ''} R$ {customAdjustment.toLocaleString('pt-BR')}</strong>
                </div>
              )}
            </div>

            {/* Exchange Section (If Trade-In is selected) */}
            {operationType === 'troca' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                  Aparelho Novo Desejado pelo Cliente
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Modelo Escolhido na Loja:</label>
                    <Input
                      value={targetPhoneName}
                      onChange={(e) => setTargetPhoneName(e.target.value)}
                      placeholder="Ex: iPhone 15 128GB"
                      className="bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Valor de Venda do Aparelho (R$):</label>
                    <Input
                      type="number"
                      value={targetPhonePrice}
                      onChange={(e) => setTargetPhonePrice(Number(e.target.value) || 0)}
                      className="bg-slate-900 border-slate-800 text-xs text-white font-bold rounded-xl"
                    />
                  </div>
                </div>

                {/* Difference to pay result */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Diferença a Pagar</span>
                    <span className="text-xl font-black text-white">
                      R$ {exchangeDifferenceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Badge className="bg-[#00D287]/10 text-[#00D287] border-[#00D287]/30 text-[11px]">
                    Até 12x ou 18x
                  </Badge>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Button
                onClick={() => setIsTermModalOpen(true)}
                className="w-full bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-[#00D287]/20 flex items-center justify-center gap-2"
              >
                <FileSignature className="w-4 h-4" />
                Gerar Termo & Assinatura Digital
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyProposal}
                  className="border-slate-800 text-slate-200 hover:text-white bg-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {copiedProposal ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
                  {copiedProposal ? 'Copiado!' : 'Copiar WhatsApp'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleQuickSaveEvaluation}
                  className="border-slate-800 text-slate-200 hover:text-white bg-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <History className="w-4 h-4 text-[#00D287]" />
                  Salvar Rápido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsibility Term & Digital Signature Modal */}
      <ResponsibilityTermModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        evaluation={{
          type: operationType,
          brand: currentModel?.brand || selectedBrand,
          model_name: currentModel?.model_name || '',
          storage: currentModel?.storage || '',
          imei: imei || undefined,
          base_value: baseValue,
          faults_selected: activeFaultsList,
          total_faults_discount: totalFaultsDiscount,
          trade_bonus_applied: tradeBonus,
          custom_adjustment: customAdjustment,
          adjustment_reason: adjustmentReason,
          final_valuation: finalValuation,
          exchange_target_device: operationType === 'troca' ? targetPhoneName : undefined,
          exchange_target_price: operationType === 'troca' ? targetPhonePrice : 0,
          exchange_difference_to_pay: operationType === 'troca' ? exchangeDifferenceToPay : 0
        }}
        settings={settings}
        onConfirmSave={handleSaveEvaluationWithCustomer}
      />

      {/* History Modal */}
      <TradeInHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Admin Price & Faults Manager Modal */}
      <TradeInAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onModelUpdated={loadModels}
      />
    </div>
  );
};
