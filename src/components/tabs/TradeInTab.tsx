import React, { useState, useEffect, useMemo } from 'react';
import { 
  Repeat, 
  Settings, 
  History, 
  ChevronDown, 
  Calculator, 
  FileSignature
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
import { leadAuthService } from '@/services/leadAuthService';

interface TradeInTabProps {
  onGoToAurusSimulator?: () => void;
}

export const TradeInTab: React.FC<TradeInTabProps> = () => {
  // Current user / lojista
  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  // Selected Brand & Models
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('Apple');
  const [allModels, setAllModels] = useState<ValuationModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Custom manual model fallback
  const [isManualModel, setIsManualModel] = useState<boolean>(false);
  const [customModelName, setCustomModelName] = useState<string>('');
  const [customBaseBuyPrice, setCustomBaseBuyPrice] = useState<number>(3040);

  // Selected faults checklist
  const [selectedFaults, setSelectedFaults] = useState<Record<string, boolean>>({});

  // Trade Bonus toggle ("Cliente vai levar outro seminovo do nosso estoque")
  const [willBuyFromStock, setWillBuyFromStock] = useState<boolean>(false);

  // Mini Calculo: Valor do celular que a loja vai vender (apenas a caixinha com o valor)
  const [sellingPhonePrice, setSellingPhonePrice] = useState<number | ''>('');

  // Modals
  const [isTermModalOpen, setIsTermModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
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

      if (models.length > 0 && !isManualModel) {
        setSelectedModelId(models[0].id);
      }
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
      return {
        id: 'manual',
        brand: selectedBrand,
        model_name: customModelName || `Smartphone ${selectedBrand}`,
        storage: '128GB',
        base_price: Number(customBaseBuyPrice) * 1.3,
        buy_price: Number(customBaseBuyPrice),
        trade_bonus: 50,
        fault_discounts: {},
        is_active: true,
        display_order: 0
      } as ValuationModel;
    }
    return allModels.find(m => m.id === selectedModelId) || allModels[0] || null;
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
    const raw = baseValue - totalFaultsDiscount + tradeBonusAmount;
    return Math.max(Math.round(raw / 10) * 10, 50);
  }, [baseValue, totalFaultsDiscount, tradeBonusAmount]);

  // Mini cálculo: Diferença a pagar se o lojista vender um celular
  const differenceToPay = useMemo(() => {
    if (!sellingPhonePrice || Number(sellingPhonePrice) <= 0) return 0;
    return Math.max(Number(sellingPhonePrice) - finalValuation, 0);
  }, [sellingPhonePrice, finalValuation]);

  // Toggle fault checkbox
  const toggleFault = (faultId: string) => {
    setSelectedFaults(prev => ({
      ...prev,
      [faultId]: !prev[faultId]
    }));
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
              Calcule o valor de compra do celular do cliente e abata na venda de outro aparelho
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
            <span className="text-xs font-bold text-slate-200 ml-2">Nova cotação</span>
          </div>

          <div className="text-[11px] text-slate-300 font-medium">
            {allModels.length} modelos na sua tabela ({selectedBrand})
          </div>
        </div>

        {/* Content Container (Grid) */}
        <div className="p-3.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Device Selection & Faults List */}
          <div className="lg:col-span-7 flex flex-col space-y-2.5 min-h-0">
            {/* 1. Device Selection Header & Brand Chips */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-100">
                  Modelo do aparelho
                </label>
                <button
                  onClick={() => setIsManualModel(!isManualModel)}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  {isManualModel ? '← Escolher da lista' : 'Digitar modelo manualmente'}
                </button>
              </div>

              {/* Brand Chips (Wrapping naturally without horizontal scrollbar) */}
              <div className="flex flex-wrap gap-1.5">
                {BRANDS_LIST.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setIsManualModel(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedBrand === brand
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-[#1e293b] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {brand === 'Apple' ? ' Apple' : brand}
                  </button>
                ))}
              </div>

              {isManualModel ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <Input
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="Nome do modelo (Ex: Galaxy S24 Ultra 256GB)"
                    className="bg-[#1e293b] border-slate-700 text-xs text-white rounded-xl focus:border-blue-500 h-9"
                  />
                  <Input
                    type="number"
                    value={customBaseBuyPrice}
                    onChange={(e) => setCustomBaseBuyPrice(Number(e.target.value) || 0)}
                    placeholder="Valor base de compra (R$)"
                    className="bg-[#1e293b] border-slate-700 text-xs text-emerald-400 font-bold rounded-xl h-9"
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
                <div className="relative">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none appearance-none pr-10 cursor-pointer h-10 shadow-sm"
                  >
                    {allModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.model_name} {m.storage}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* 2. Specific Brand Faults Checklist with Internal Dedicated Scrollbar */}
            <div className="flex flex-col flex-1 min-h-0 space-y-1.5">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-100 block">
                  Avarias / condições do aparelho ({selectedBrand})
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {brandFaultDefinitions.length} condições avaliadas
                </span>
              </div>

              <div className="border border-slate-700 rounded-2xl bg-[#1e293b]/70 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                {/* Scrollable list of faults only */}
                <div className="overflow-y-auto max-h-[220px] sm:max-h-[260px] lg:max-h-none lg:flex-1 divide-y divide-slate-700/80 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-0.5">
                  {brandFaultDefinitions.map(fault => {
                    const isChecked = !!selectedFaults[fault.id];
                    const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                      ? currentModel.fault_discounts[fault.id]
                      : fault.defaultDiscount;

                    return (
                      <label
                        key={fault.id}
                        onClick={() => toggleFault(fault.id)}
                        className={`flex items-center justify-between py-2 px-3 sm:px-3.5 cursor-pointer transition-colors ${
                          isChecked ? 'bg-red-950/30' : 'hover:bg-[#1e293b]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer pointer-events-none"
                          />
                          <span className={`text-xs font-medium ${isChecked ? 'text-white font-semibold' : 'text-slate-200'}`}>
                            {fault.label}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-red-400 shrink-0">
                          – R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Fixed Trade Bonus Row at bottom */}
                <label
                  onClick={() => setWillBuyFromStock(!willBuyFromStock)}
                  className={`flex items-center justify-between py-2.5 px-3 sm:px-3.5 cursor-pointer transition-colors border-t border-slate-700 shrink-0 ${
                    willBuyFromStock ? 'bg-blue-950/40' : 'bg-[#182338]/90 hover:bg-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={willBuyFromStock}
                      onChange={() => {}}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer pointer-events-none"
                    />
                    <span className={`text-xs ${willBuyFromStock ? 'text-blue-300 font-bold' : 'text-slate-200 font-medium'}`}>
                      Cliente vai levar outro seminovo (+ R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    + R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Result & Mini Trade Calculation */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3 min-h-0">
            <div className="space-y-3">
              {/* Card "Valor a pagar" */}
              <div className="border border-slate-700 rounded-2xl bg-[#1e293b] p-4 space-y-3 shadow-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Valor a pagar pelo aparelho do cliente
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight mt-0.5">
                    R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Breakdown Table with internal scroll if many faults */}
                <div className="space-y-1.5 text-xs border-t border-slate-700 pt-2.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Valor na compra / base ({selectedBrand})</span>
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
                    <span>Total</span>
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

            {/* Single Prominent Action Button */}
            <Button
              onClick={() => setIsTermModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm h-11 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shrink-0"
            >
              <FileSignature className="w-4 h-4" />
              Gerar Termo de Compra & Assinatura
            </Button>
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
    </div>
  );
};
