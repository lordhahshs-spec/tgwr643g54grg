import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export const CalculadoraLucroTab: React.FC = () => {
  const [costPrice, setCostPrice] = useState<number>(1450);
  const [sellingPrice, setSellingPrice] = useState<number>(2190);
  const [accessoriesCost, setAccessoriesCost] = useState<number>(45); // capa + película
  const [cardFeePercent, setCardFeePercent] = useState<number>(4.5); // taxa maquina / financiamento
  const [commissionPercent, setCommissionPercent] = useState<number>(3.0); // comissão vendedor
  const [fixedExpenses, setFixedExpenses] = useState<number>(30); // frete / garantia reserva

  // Calculations
  const cardFeeAmount = (sellingPrice * cardFeePercent) / 100;
  const commissionAmount = (sellingPrice * commissionPercent) / 100;
  const totalCost = costPrice + accessoriesCost + cardFeeAmount + fixedExpenses;
  const netProfit = sellingPrice - totalCost - commissionAmount;
  const marginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markupPercent = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;

  const applyPreset = (type: 'pix' | 'cartao12x' | 'crediario') => {
    if (type === 'pix') {
      setCardFeePercent(0.99);
    } else if (type === 'cartao12x') {
      setCardFeePercent(8.9);
    } else if (type === 'crediario') {
      setCardFeePercent(4.0);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
            <Calculator className="w-3.5 h-3.5 mr-1" />
            Gestão Financeira
          </Badge>
          <span className="text-xs text-slate-400">Margem Líquida, Taxas e Comissão</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Calculadora de Margem <span className="text-[#00D287]">& Lucro por Aparelho</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Simule com precisão o lucro real em cada smartphone vendido, descontando taxas, brindes e comissão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00D287]">
                Parâmetros da Venda
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => applyPreset('pix')}
                  className="px-2.5 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                >
                  PIX (0.99%)
                </button>
                <button
                  onClick={() => applyPreset('cartao12x')}
                  className="px-2.5 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                >
                  Cartão 12x (8.9%)
                </button>
                <button
                  onClick={() => applyPreset('crediario')}
                  className="px-2.5 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                >
                  Crediário Digital (4%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Custo de Compra (R$):
                </label>
                <Input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-800 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Preço de Venda Final (R$):
                </label>
                <Input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-[#00D287]/40 text-[#00D287] font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Taxa da Maquininha (%):
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={cardFeePercent}
                  onChange={(e) => setCardFeePercent(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Taxa: R$ {cardFeeAmount.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Comissão do Vendedor (%):
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Comissão: R$ {commissionAmount.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Brindes (Capa + Película) R$:
                </label>
                <Input
                  type="number"
                  value={accessoriesCost}
                  onChange={(e) => setAccessoriesCost(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Fundo de Garantia (R$):
                </label>
                <Input
                  type="number"
                  value={fixedExpenses}
                  onChange={(e) => setFixedExpenses(Number(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-[#080c17] border border-[#00D287]/20 p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00D287]">
                Resultado Consolidado
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Demonstrativo por Aparelho
              </h3>
            </div>

            {/* Big Net Profit */}
            <div className="p-4 rounded-xl bg-slate-950 border border-white/5 text-center">
              <span className="text-xs text-slate-400">Lucro Líquido Real:</span>
              <div className={`text-3xl sm:text-4xl font-black mt-1 ${netProfit >= 0 ? 'text-[#00D287]' : 'text-rose-400'}`}>
                R$ {netProfit.toFixed(2)}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                <span className="text-[#00D287] font-semibold">
                  Margem: {marginPercent.toFixed(1)}%
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Markup: {markupPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Faturamento Bruto:</span>
                <span className="font-semibold text-white">R$ {sellingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">(-) Custo Aparelho:</span>
                <span className="text-rose-400">- R$ {costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">(-) Taxa Maquininha ({cardFeePercent}%):</span>
                <span className="text-rose-400">- R$ {cardFeeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">(-) Brindes:</span>
                <span className="text-rose-400">- R$ {accessoriesCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">(-) Fundo Reserva:</span>
                <span className="text-rose-400">- R$ {fixedExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">(-) Comissão Vendedor ({commissionPercent}%):</span>
                <span className="text-amber-400 font-medium">R$ {commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm text-[#00D287]">
                <span>(=) Lucro Líquido:</span>
                <span>R$ {netProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
