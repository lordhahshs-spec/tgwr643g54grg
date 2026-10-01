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
    // Limpar seleções de avaria ao trocar de fabricante para evitar misturar regras de marcas diferentes
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
    <div className="h-full overflow-y-auto bg-[#0b0f14] text-[#f3f5f7] p-3.5 sm:p-6 space-y-4 pb-24 md:pb-8">
      {/* Top Bar with History & Admin Actions - Clean B2B style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-[#11161d] p-4 rounded-xl border border-[#252d37]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#171d25] border border-[#252d37] flex items-center justify-center text-[#16b981]">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-[#f3f5f7] tracking-tight">
              Avaliação de Aparelho <span className="text-[#16b981] font-normal text-sm sm:text-base">(Seminovos & Troca)</span>
            </h1>
            <p className="text-xs text-[#a3adb8]">
              Calcule o valor de compra do celular do cliente e abata na venda de outro aparelho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="border-[#252d37] bg-[#171d25] text-[#f3f5f7] hover:text-white hover:bg-[#252d37] text-xs font-medium rounded-lg flex items-center gap-1.5 h-9"
          >
            <History className="w-3.5 h-3.5 text-[#16b981]" />
            Histórico de Termos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdminModalOpen(true)}
            className="border-[#252d37] bg-[#171d25] text-[#f3f5f7] hover:text-white hover:bg-[#252d37] text-xs font-medium rounded-lg flex items-center gap-1.5 h-9"
          >
            <Settings className="w-3.5 h-3.5 text-[#a3adb8]" />
            Editar Minha Tabela
          </Button>
        </div>
      </div>

      {/* Main Quotation Window Card */}
      <div className="bg-[#11161d] border border-[#252d37] rounded-xl shadow-md overflow-hidden">
        {/* Window Topbar */}
        <div className="px-5 py-3 border-b border-[#252d37] bg-[#171d25] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#f3f5f7]">Nova Cotação</span>
          </div>

          <div className="text-xs text-[#a3adb8] font-medium">
            {allModels.length} modelos na sua tabela ({selectedBrand})
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Device Selection & Faults List */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Device Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-[#f3f5f7]">
                  Fabricante & Modelo
                </label>
                <button
                  onClick={() => setIsManualModel(!isManualModel)}
                  className="text-xs text-[#16b981] hover:underline font-medium"
                >
                  {isManualModel ? '← Escolher da lista' : 'Digitar modelo manualmente'}
                </button>
              </div>

              {/* Brand Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {BRANDS_LIST.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setIsManualModel(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedBrand === brand
                        ? 'bg-[#16b981] text-white'
                        : 'bg-[#171d25] text-[#a3adb8] hover:text-[#f3f5f7] border border-[#252d37]'
                    }`}
                  >
                    {brand === 'Apple' ? ' Apple' : brand}
                  </button>
                ))}
              </div>

              {isManualModel ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <Input
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="Nome do modelo (Ex: Galaxy S24 Ultra 256GB)"
                    className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#f3f5f7] rounded-lg focus:border-[#16b981] h-10"
                  />
                  <Input
                    type="number"
                    value={customBaseBuyPrice}
                    onChange={(e) => setCustomBaseBuyPrice(Number(e.target.value) || 0)}
                    placeholder="Valor base de compra (R$)"
                    className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm text-[#16b981] font-semibold rounded-lg h-10"
                  />
                </div>
              ) : allModels.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#171d25] border border-[#252d37] text-center space-y-2">
                  <p className="text-xs text-[#a3adb8]">
                    Nenhum modelo cadastrado para <strong>{selectedBrand}</strong> ainda.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="bg-[#16b981] hover:bg-[#10b981] text-white text-xs font-medium h-8 rounded-lg"
                    >
                      + Cadastrar em Minha Tabela
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsManualModel(true)}
                      className="border-[#252d37] text-[#f3f5f7] text-xs font-medium h-8 rounded-lg"
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
                    className="w-full bg-[#171d25] border border-[#252d37] text-xs sm:text-sm font-medium rounded-lg p-3 text-[#f3f5f7] focus:border-[#16b981] outline-none appearance-none pr-10 cursor-pointer h-11"
                  >
                    {allModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.model_name} {m.storage}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#a3adb8] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* 2. Specific Brand Faults Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-[#f3f5f7]">
                  Avarias / condições do aparelho ({selectedBrand})
                </span>
                <span className="text-[11px] text-[#737e8a]">
                  {brandFaultDefinitions.length} condições avaliadas
                </span>
              </div>

              <div className="border border-[#252d37] rounded-xl bg-[#171d25]/60 divide-y divide-[#252d37]/80 overflow-hidden">
                {brandFaultDefinitions.map(fault => {
                  const isChecked = !!selectedFaults[fault.id];
                  const discount = currentModel?.fault_discounts?.[fault.id] !== undefined
                    ? currentModel.fault_discounts[fault.id]
                    : fault.defaultDiscount;

                  return (
                    <label
                      key={fault.id}
                      onClick={() => toggleFault(fault.id)}
                      className={`flex items-center justify-between p-3 sm:py-2.5 sm:px-4 cursor-pointer transition-colors ${
                        isChecked ? 'bg-red-950/20 text-white' : 'hover:bg-[#171d25]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded accent-[#16b981] cursor-pointer pointer-events-none"
                        />
                        <span className={`text-xs sm:text-sm ${isChecked ? 'text-white font-medium' : 'text-[#a3adb8]'}`}>
                          {fault.label}
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm font-semibold text-rose-400 shrink-0">
                        – R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  );
                })}

                {/* Trade Bonus Row */}
                <label
                  onClick={() => setWillBuyFromStock(!willBuyFromStock)}
                  className={`flex items-center justify-between p-3 sm:py-3 sm:px-4 cursor-pointer transition-colors border-t border-[#252d37] ${
                    willBuyFromStock ? 'bg-emerald-950/25' : 'hover:bg-[#171d25]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={willBuyFromStock}
                      onChange={() => {}}
                      className="w-4 h-4 rounded accent-[#16b981] cursor-pointer pointer-events-none"
                    />
                    <span className={`text-xs sm:text-sm ${willBuyFromStock ? 'text-[#16b981] font-semibold' : 'text-[#f3f5f7] font-medium'}`}>
                      Cliente vai levar outro seminovo do nosso estoque (+ R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm font-semibold text-[#16b981] shrink-0">
                    + R$ {(currentModel?.trade_bonus || 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Result & Mini Trade Calculation */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card "Valor a pagar" */}
            <div className="border border-[#252d37] rounded-xl bg-[#171d25] p-5 space-y-4 shadow-sm">
              <div>
                <span className="text-xs font-semibold text-[#a3adb8] block uppercase tracking-wider">
                  Valor de Compra Avaliado
                </span>
                <div className="text-3xl sm:text-4xl font-bold text-[#16b981] tracking-tight mt-1">
                  R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="space-y-2 text-xs sm:text-sm border-t border-[#252d37] pt-3.5">
                <div className="flex justify-between text-[#a3adb8]">
                  <span>Valor na compra / base ({selectedBrand})</span>
                  <strong className="text-[#f3f5f7] font-semibold">
                    R$ {baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                {activeFaultsList.map(f => (
                  <div key={f.id} className="flex justify-between text-rose-400 font-medium">
                    <span>{f.label}</span>
                    <strong className="font-semibold">– R$ {f.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                ))}

                {willBuyFromStock && tradeBonusAmount > 0 && (
                  <div className="flex justify-between text-[#16b981] font-medium">
                    <span>Bônus na troca</span>
                    <strong className="font-semibold">+ R$ {tradeBonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="flex justify-between text-[#f3f5f7] font-bold border-t border-[#252d37] pt-2.5 text-sm sm:text-base">
                  <span>Total</span>
                  <span className="text-[#16b981] font-bold">
                    R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Cálculo: Vender celular da loja abatendo o seminovo */}
            <div className="border border-[#252d37] rounded-xl bg-[#171d25] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#16b981]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f3f5f7]">
                  Simulação de Troca (Abatimento)
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#a3adb8] block">
                  Valor do celular que a loja vai vender (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#737e8a] font-bold">R$</span>
                  <Input
                    type="number"
                    value={sellingPhonePrice}
                    onChange={(e) => setSellingPhonePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 4500"
                    className="bg-[#11161d] border-[#252d37] pl-10 text-xs sm:text-sm text-[#f3f5f7] font-semibold rounded-lg focus:border-[#16b981] h-10"
                  />
                </div>
              </div>

              {sellingPhonePrice && Number(sellingPhonePrice) > 0 ? (
                <div className="p-3.5 rounded-lg bg-[#11161d] border border-[#252d37] space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#a3adb8]">
                    <span>Aparelho vendido:</span>
                    <span>R$ {Number(sellingPhonePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[#16b981] font-medium">
                    <span>(-) Avaliação do usado:</span>
                    <span>- R$ {finalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[#f3f5f7] font-bold border-t border-[#252d37] pt-2 text-sm sm:text-base">
                    <span>Cliente paga apenas:</span>
                    <span className="text-[#16b981] font-bold">
                      R$ {differenceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#737e8a] italic">
                  Digite o valor do celular da loja para calcular automaticamente o saldo a pagar pelo cliente.
                </p>
              )}
            </div>

            {/* Single Prominent Action Button */}
            <Button
              onClick={() => setIsTermModalOpen(true)}
              className="w-full bg-[#16b981] hover:bg-[#10b981] text-white font-semibold text-sm sm:text-base h-11 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99]"
            >
              <FileSignature className="w-4 h-4" />
              Gerar Termo de Compra & Assinatura
            </Button>
          </div>
        </div>
      </div>

      {/* Responsibility Term & Digital Signature Modal */}
      <ResponsibilityTermModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        evaluation={{
          type: willBuyFromStock ? 'troca' : 'compra',
          brand: currentModel?.brand || selectedBrand,
          model_name: currentModel?.model_name || '',
          storage: currentModel?.storage || '',
          base_value: baseValue,
          faults_selected: activeFaultsList,
          total_faults_discount: totalFaultsDiscount,
          trade_bonus_applied: tradeBonusAmount,
          final_valuation: finalValuation,
          exchange_target_price: sellingPhonePrice ? Number(sellingPhonePrice) : 0,
          exchange_difference_to_pay: differenceToPay
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
