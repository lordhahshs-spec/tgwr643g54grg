import React, { useState } from 'react';
import { 
  Repeat, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TradeInOption {
  brand: string;
  models: {
    name: string;
    baseTradeValue: number;
  }[];
}

const TRADE_BRANDS: TradeInOption[] = [
  {
    brand: 'Samsung',
    models: [
      { name: 'Galaxy S23 Ultra (256GB)', baseTradeValue: 3200 },
      { name: 'Galaxy S23 (128GB)', baseTradeValue: 2100 },
      { name: 'Galaxy S22 (128GB)', baseTradeValue: 1500 },
      { name: 'Galaxy S21 FE (128GB)', baseTradeValue: 1100 },
      { name: 'Galaxy A54 (128GB)', baseTradeValue: 850 },
      { name: 'Galaxy A53 (128GB)', baseTradeValue: 650 },
      { name: 'Galaxy A34 (128GB)', baseTradeValue: 600 },
    ],
  },
  {
    brand: 'Apple',
    models: [
      { name: 'iPhone 14 Pro (128GB)', baseTradeValue: 3900 },
      { name: 'iPhone 14 (128GB)', baseTradeValue: 2800 },
      { name: 'iPhone 13 (128GB)', baseTradeValue: 2200 },
      { name: 'iPhone 12 (128GB)', baseTradeValue: 1650 },
      { name: 'iPhone 11 (128GB)', baseTradeValue: 1200 },
      { name: 'iPhone XR (64GB)', baseTradeValue: 750 },
    ],
  },
  {
    brand: 'Motorola',
    models: [
      { name: 'Edge 40 (256GB)', baseTradeValue: 1200 },
      { name: 'Moto G84 (256GB)', baseTradeValue: 750 },
      { name: 'Moto G73 (128GB)', baseTradeValue: 550 },
      { name: 'Moto G54 (128GB)', baseTradeValue: 480 },
    ],
  },
  {
    brand: 'Xiaomi',
    models: [
      { name: 'Poco F5 (256GB)', baseTradeValue: 1350 },
      { name: 'Redmi Note 12 Pro (256GB)', baseTradeValue: 900 },
      { name: 'Redmi Note 12 (128GB)', baseTradeValue: 600 },
      { name: 'Redmi 12 (128GB)', baseTradeValue: 450 },
    ],
  },
];

interface TradeInTabProps {
  onGoToAurusSimulator: () => void;
}

export const TradeInTab: React.FC<TradeInTabProps> = ({ onGoToAurusSimulator }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('Samsung');
  const [selectedModelName, setSelectedModelName] = useState<string>(TRADE_BRANDS[0].models[0].name);
  
  const [screenCondition, setScreenCondition] = useState<'perfeita' | 'riscos' | 'trincada'>('perfeita');
  const [housingCondition, setHousingCondition] = useState<'impecavel' | 'marcas' | 'amassado'>('impecavel');
  const [batteryHealthy, setBatteryHealthy] = useState<boolean>(true);
  const [camerasWorking, setCamerasWorking] = useState<boolean>(true);
  const [faceIdFingerprint, setFaceIdFingerprint] = useState<boolean>(true);
  const [hasChargerBox, setHasChargerBox] = useState<boolean>(true);

  const [desiredNewPhonePrice, setDesiredNewPhonePrice] = useState<number>(3499);
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);

  const currentBrandModels = TRADE_BRANDS.find((b) => b.brand === selectedBrand)?.models || [];
  const currentModel = currentBrandModels.find((m) => m.name === selectedModelName) || currentBrandModels[0];

  const calculateFinalValue = () => {
    if (!currentModel) return 0;
    let value = currentModel.baseTradeValue;

    if (screenCondition === 'riscos') value -= value * 0.12;
    if (screenCondition === 'trincada') value -= value * 0.40;

    if (housingCondition === 'marcas') value -= value * 0.08;
    if (housingCondition === 'amassado') value -= value * 0.20;

    if (!batteryHealthy) value -= 150;
    if (!camerasWorking) value -= 250;
    if (!faceIdFingerprint) value -= 180;
    if (hasChargerBox) value += 60;

    return Math.max(Math.round(value / 10) * 10, 150);
  };

  const calculatedValue = calculateFinalValue();
  const remainingDifference = Math.max(desiredNewPhonePrice - calculatedValue, 0);

  const handleCopyProposal = () => {
    const text = `📋 *AVALIAÇÃO DE TROCA (TRADE-IN)*\n\n` +
      `📱 *Aparelho do Cliente:* ${selectedModelName}\n` +
      `🔍 *Estado da Tela:* ${screenCondition === 'perfeita' ? 'Impecável' : screenCondition === 'riscos' ? 'Riscos Leves' : 'Trincada/Quebrada'}\n` +
      `🔋 *Bateria & Câmeras:* ${batteryHealthy && camerasWorking ? '100% Funcionando' : 'Atenção técnica'}\n` +
      `💰 *Valor de Avaliação do Usado:* R$ ${calculatedValue.toLocaleString('pt-BR')}\n\n` +
      `🎯 *Valor do Novo Aparelho:* R$ ${desiredNewPhonePrice.toLocaleString('pt-BR')}\n` +
      `✨ *Diferença a Pagar:* R$ ${remainingDifference.toLocaleString('pt-BR')}\n` +
      `*(Pode ser parcelado com condições especiais!)*`;

    navigator.clipboard.writeText(text);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 2500);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
            <Repeat className="w-3.5 h-3.5 mr-1" />
            Trade-In
          </Badge>
          <span className="text-xs text-slate-400">Avaliação de Usados como Entrada</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Simulador de Troca <span className="text-[#00D287]">(Usado como Entrada)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Calcule o valor justo do celular usado do cliente com base nas condições físicas e use o valor para abater a entrada no parcelamento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00D287]/20 text-[#00D287] flex items-center justify-center text-[10px]">1</span>
              Selecione o Aparelho Usado
            </span>

            {/* Brand Switcher */}
            <div className="flex gap-2">
              {TRADE_BRANDS.map((b) => (
                <button
                  key={b.brand}
                  onClick={() => {
                    setSelectedBrand(b.brand);
                    setSelectedModelName(b.models[0].name);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedBrand === b.brand
                      ? 'bg-[#00D287] text-slate-950 shadow-md shadow-[#00D287]/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {b.brand}
                </button>
              ))}
            </div>

            {/* Model Select */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Modelo específico:</label>
              <select
                value={selectedModelName}
                onChange={(e) => setSelectedModelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:border-[#00D287] outline-none"
              >
                {currentBrandModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} (Tabela base: R$ {m.baseTradeValue.toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition Checklist */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00D287]/20 text-[#00D287] flex items-center justify-center text-[10px]">2</span>
              Condições Físicas & Funcionais
            </span>

            {/* Screen */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                Estado da Tela / Display:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'perfeita', label: 'Perfeita / Sem riscos' },
                  { id: 'riscos', label: 'Riscos superficiais' },
                  { id: 'trincada', label: 'Vidro Trincado' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setScreenCondition(item.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      screenCondition === item.id
                        ? 'bg-[#00D287]/20 border-[#00D287] text-[#00D287] font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Housing */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                Laterais & Carcaça:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'impecavel', label: 'Impecável' },
                  { id: 'marcas', label: 'Marcas de uso' },
                  { id: 'amassado', label: 'Amassados / Desgaste' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setHousingCondition(item.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      housingCondition === item.id
                        ? 'bg-[#00D287]/20 border-[#00D287] text-[#00D287] font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Bateria Saudável (&gt;80%)</span>
                <input
                  type="checkbox"
                  checked={batteryHealthy}
                  onChange={(e) => setBatteryHealthy(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00D287]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Câmeras 100% OK</span>
                <input
                  type="checkbox"
                  checked={camerasWorking}
                  onChange={(e) => setCamerasWorking(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00D287]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Valuation Result */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-4 rounded-2xl bg-[#080c17] border border-[#00D287]/20 p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00D287]">
                Resultado da Avaliação
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedModelName}
              </h3>
            </div>

            {/* Valuation Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-white/5 text-center">
              <span className="text-xs text-slate-400">Valor de Avaliação para Troca:</span>
              <div className="text-3xl sm:text-4xl font-black text-[#00D287] mt-1">
                R$ {calculatedValue.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D287]" /> Abatimento imediato na troca
              </span>
            </div>

            {/* Desired Phone */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Valor do Smartphone Novo (R$):
              </label>
              <Input
                type="number"
                value={desiredNewPhonePrice}
                onChange={(e) => setDesiredNewPhonePrice(Number(e.target.value) || 0)}
                className="bg-slate-950 border-slate-800 text-slate-100 font-bold text-sm"
              />

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Novo Aparelho:</span>
                  <span>R$ {desiredNewPhonePrice.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-[#00D287] font-semibold">
                  <span>Abatimento do Usado:</span>
                  <span>- R$ {calculatedValue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                  <span>Saldo a Pagar:</span>
                  <span className="text-[#00D287]">R$ {remainingDifference.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleCopyProposal}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold text-xs h-9"
              >
                {copiedProposal ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-[#00D287]" />
                    Proposta Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    Copiar Resumo para Cliente
                  </>
                )}
              </Button>

              <Button
                onClick={onGoToAurusSimulator}
                className="w-full bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs h-9 shadow-md shadow-[#00D287]/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Simular Saldo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
