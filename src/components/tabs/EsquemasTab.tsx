import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Zap, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TestPoint {
  id: string;
  name: string;
  line: string;
  normalVoltage: string;
  diodeValue: string;
  x: number;
  y: number;
  tip: string;
  status: 'normal' | 'alerta' | 'curto';
}

interface PhoneSchematic {
  id: string;
  brand: 'Samsung' | 'Motorola' | 'Xiaomi' | 'Apple';
  model: string;
  boardCode: string;
  releaseYear: number;
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  pmicModel: string;
  cpuModel: string;
  chronicIssues: {
    symptom: string;
    probableComponent: string;
    solution: string;
  }[];
  testPoints: TestPoint[];
}

const SCHEMATICS_DATA: PhoneSchematic[] = [
  {
    id: 'samsung-a54',
    brand: 'Samsung',
    model: 'Galaxy A54 5G (SM-A546)',
    boardCode: 'SM-A546B_MAIN_REV0.4',
    releaseYear: 2023,
    difficulty: 'Médio',
    pmicModel: 'S2MPB02 + Sub-PMIC',
    cpuModel: 'Exynos 1380 Octa',
    chronicIssues: [
      {
        symptom: 'Aparelho não carrega ou acusa temperatura baixa',
        probableComponent: 'Termistor TH3001 na subplaca ou flex FPC',
        solution: 'Substituição do termistor NTC 100kΩ ou troca do sub-flex original.',
      },
      {
        symptom: 'Sem imagem na tela, mas vibra e toca sons',
        probableComponent: 'Diodo de backlight D4002 e bobina boost L4001',
        solution: 'Verificar se há 24V na linha do display com tela conectada.',
      },
      {
        symptom: 'Consumo travado em 80mA na fonte ao pressionar Power',
        probableComponent: 'Falha de solda no PMIC principal ou cristal 38.4MHz',
        solution: 'Reflow controlado ou reballing do S2MPB02 com pasta 183°C.',
      },
    ],
    testPoints: [
      { id: 'TP1', name: 'VBUS_5V_IN', line: 'Entrada Carga Type-C', normalVoltage: '5.0V - 9.0V', diodeValue: '540 mV', x: 22, y: 78, tip: 'Se for 0V, verifique o conector fêmea ou o OVP U3001', status: 'normal' },
      { id: 'TP2', name: 'VBAT_MAIN', line: 'Alimentação Bateria', normalVoltage: '3.8V - 4.2V', diodeValue: '480 mV', x: 38, y: 65, tip: 'Se bipar para o terra, linha VBAT em curto total', status: 'normal' },
      { id: 'TP3', name: 'VCC_PMIC_1.8V', line: 'LDO Primário CPU/RAM', normalVoltage: '1.8V Estável', diodeValue: '390 mV', x: 54, y: 42, tip: 'Tensão crucial para inicialização do bootloader', status: 'normal' },
      { id: 'TP4', name: 'PMIC_RESET_N', line: 'Linha de Reset do Sistema', normalVoltage: '1.8V High', diodeValue: '610 mV', x: 68, y: 35, tip: 'Se estiver em nível lógico 0V, aparelho fica em bootloop', status: 'alerta' },
      { id: 'TP5', name: 'VREG_L12_0.8V', line: 'Alimentação Núcleo CPU', normalVoltage: '0.75V - 0.85V', diodeValue: '120 mV', x: 75, y: 55, tip: 'Baixa resistência normal para o core da CPU', status: 'normal' },
    ],
  },
  {
    id: 'moto-g84',
    brand: 'Motorola',
    model: 'Moto G84 5G (XT2347)',
    boardCode: 'XT2347-1_MAIN_BOARD',
    releaseYear: 2023,
    difficulty: 'Fácil',
    pmicModel: 'Qualcomm PM6150 / PM6150L',
    cpuModel: 'Snapdragon 695 5G',
    chronicIssues: [
      {
        symptom: 'Aparelho desliga ao tirar foto com flash',
        probableComponent: 'Bateria com alta resistência interna ou flex da bateria',
        solution: 'Substituir a célula da bateria original 5000mAh.',
      },
      {
        symptom: 'Wi-Fi e Bluetooth não ativam',
        probableComponent: 'CI de conectividade WCN3980',
        solution: 'Resolda leve a 330°C ou troca do módulo RF.',
      },
    ],
    testPoints: [
      { id: 'TP1', name: 'VBUS_USB_IN', line: 'VBUS 5V Entrada', normalVoltage: '5.1V', diodeValue: '560 mV', x: 20, y: 82, tip: 'Entrada direta da subplaca', status: 'normal' },
      { id: 'TP2', name: 'VDD_PX_MAIN', line: 'Malha Primária', normalVoltage: '4.0V', diodeValue: '460 mV', x: 42, y: 58, tip: 'Alimenta os estágios de chaveamento dos indutores', status: 'normal' },
      { id: 'TP3', name: 'VREG_S4_1.2V', line: 'RAM LPDDR4X', normalVoltage: '1.2V', diodeValue: '280 mV', x: 62, y: 44, tip: 'Tensão de alimentação da memória RAM', status: 'normal' },
    ],
  },
  {
    id: 'xiaomi-note13',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 4G / 5G',
    boardCode: 'SAPPHIRE_MB_V2',
    releaseYear: 2024,
    difficulty: 'Médio',
    pmicModel: 'MT6360 + MT6358',
    cpuModel: 'Snapdragon 685 / Dimensity 6080',
    chronicIssues: [
      {
        symptom: 'Travado em fastboot ou reiniciando no logo Redmi',
        probableComponent: 'Botão power em curto ou partição de boot corrompida',
        solution: 'Desconectar flex do botão e verificar linha de 1.8V PWR_KEY.',
      },
      {
        symptom: 'Não ativa microfone principal em ligações',
        probableComponent: 'Filtro ESD e microfone de bancada danificado',
        solution: 'Troca do microfone MEMS com proteção térmica.',
      },
    ],
    testPoints: [
      { id: 'TP1', name: 'CHG_VBUS', line: 'VBUS Carga Rápida', normalVoltage: '5V - 11V', diodeValue: '580 mV', x: 25, y: 80, tip: 'Compatível com Turbo Charge 33W', status: 'normal' },
      { id: 'TP2', name: 'SYS_4V', line: 'Linha do Sistema', normalVoltage: '3.9V', diodeValue: '440 mV', x: 45, y: 60, tip: 'Linha VSYS principal da placa', status: 'normal' },
    ],
  },
  {
    id: 'iphone-13',
    brand: 'Apple',
    model: 'iPhone 13 / 13 Pro',
    boardCode: 'APPLE_D16_SANDWICH_BOARD',
    releaseYear: 2021,
    difficulty: 'Avançado',
    pmicModel: 'Apple Custom PMIC 338S00616',
    cpuModel: 'Apple A15 Bionic (5nm)',
    chronicIssues: [
      {
        symptom: 'Tela verde ou tela branca súbita',
        probableComponent: 'Rompimento de trilha interna do display OLED',
        solution: 'Jumper de micro-fio na trilha de alimentação de tensão do display.',
      },
      {
        symptom: 'Placa não liga após queda (Consumo secundário oscilante)',
        probableComponent: 'Trincas nas soldas interposer entre placa A e placa B',
        solution: 'Separação na pré-aquecedora e reballing das camadas.',
      },
    ],
    testPoints: [
      { id: 'TP1', name: 'PP_BATT_VCC', line: 'Tensão da Bateria', normalVoltage: '3.8V - 4.35V', diodeValue: '450 mV', x: 28, y: 70, tip: 'Entrada direta do conector da bateria', status: 'normal' },
      { id: 'TP2', name: 'PP_VDD_MAIN', line: 'Barramento Principal', normalVoltage: '4.2V', diodeValue: '390 mV', x: 48, y: 52, tip: 'Alimenta quase todos os LDOs e bucks', status: 'normal' },
    ],
  },
];

export const EsquemasTab: React.FC = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchematic, setSelectedSchematic] = useState<PhoneSchematic>(SCHEMATICS_DATA[0]);
  const [activeTestPoint, setActiveTestPoint] = useState<TestPoint | null>(SCHEMATICS_DATA[0].testPoints[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [boardSide, setBoardSide] = useState<'top' | 'bottom'>('top');

  const filteredSchematics = SCHEMATICS_DATA.filter((item) => {
    const matchesBrand = selectedBrand === 'Todos' || item.brand === selectedBrand;
    const matchesSearch = 
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.boardCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
              <Cpu className="w-3.5 h-3.5 mr-1" />
              Laboratório Técnico
            </Badge>
            <span className="text-xs text-slate-400">Boardviews & Linhas de Tensão</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Esquemas Elétricos & <span className="text-[#00D287]">Diagnóstico</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Consulte diagramas esquemáticos e valores de condução reversa para multímetro.
          </p>
        </div>

        <Button
          onClick={() => alert(`Baixando PDF do esquema: ${selectedSchematic.model}`)}
          className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-[#00D287]/20"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Baixar PDF
        </Button>
      </div>

      {/* Model Selector Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Device Selection */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-[#080c17] border border-white/5 rounded-xl p-3 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fabricante
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Todos', 'Samsung', 'Motorola', 'Xiaomi', 'Apple'].map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrand === brand
                      ? 'bg-[#00D287] text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar modelo..."
                className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-lg"
              />
            </div>
          </div>

          {/* List of Models */}
          <div className="bg-[#080c17] border border-white/5 rounded-xl p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
            {filteredSchematics.map((item) => {
              const isSelected = selectedSchematic.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedSchematic(item);
                    setActiveTestPoint(item.testPoints[0]);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-[#00D287]/15 border-[#00D287]/40 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{item.model}</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-800">
                      {item.brand}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-[#00D287] truncate">
                    {item.boardCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Boardview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00D287]/15 border border-[#00D287]/30 flex items-center justify-center text-[#00D287] font-bold text-xs">
                  PCB
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedSchematic.model}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Código: <strong className="text-[#00D287] font-mono">{selectedSchematic.boardCode}</strong></span>
                    <span>•</span>
                    <span>PMIC: <strong className="text-slate-200">{selectedSchematic.pmicModel}</strong></span>
                  </div>
                </div>
              </div>

              {/* View controls */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setBoardSide('top')}
                    className={`px-2.5 py-1 rounded font-medium ${boardSide === 'top' ? 'bg-[#00D287] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => setBoardSide('bottom')}
                    className={`px-2.5 py-1 rounded font-medium ${boardSide === 'bottom' ? 'bg-[#00D287] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Bottom
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.4))}
                  className="h-7 w-7 p-0 bg-slate-900 border-slate-800 text-slate-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  className="h-7 w-7 p-0 bg-slate-900 border-slate-800 text-slate-300"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Motherboard Area */}
            <div className="mt-4 relative min-h-[280px] bg-[#050811] rounded-xl border border-white/5 overflow-hidden flex items-center justify-center p-4">
              <div 
                className="relative w-full max-w-md aspect-[16/9] border border-[#00D287]/40 rounded-xl bg-gradient-to-br from-emerald-950/20 via-slate-950 to-emerald-950/30 p-4 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Simulated CPU */}
                <div className="absolute top-[25%] left-[55%] w-20 h-20 rounded-lg bg-slate-900/90 border border-[#00D287]/40 flex flex-col items-center justify-center p-2 text-center shadow-lg">
                  <Cpu className="w-4 h-4 text-[#00D287] mb-1" />
                  <span className="text-[9px] font-mono text-[#00D287] font-bold truncate w-full">
                    {selectedSchematic.cpuModel}
                  </span>
                </div>

                {/* Simulated PMIC */}
                <div className="absolute top-[25%] left-[30%] w-14 h-14 rounded-lg bg-slate-900/90 border border-amber-400/40 flex flex-col items-center justify-center p-1 text-center shadow-lg">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                  <span className="text-[8px] font-mono text-amber-200 font-bold truncate w-full">
                    PMIC
                  </span>
                </div>

                {/* Test Points */}
                {selectedSchematic.testPoints.map((tp) => {
                  const isActive = activeTestPoint?.id === tp.id;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => setActiveTestPoint(tp)}
                      style={{ top: `${tp.y}%`, left: `${tp.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform ${
                        isActive ? 'scale-125 z-20' : 'hover:scale-110'
                      }`}
                    >
                      <span className={`flex h-5 w-5 rounded-full items-center justify-center border text-[9px] font-bold font-mono shadow-md ${
                        isActive
                          ? 'bg-[#00D287] border-white text-slate-950 ring-4 ring-[#00D287]/30'
                          : 'bg-slate-900 border-[#00D287] text-[#00D287]'
                      }`}>
                        {tp.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-white/5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-[#00D287]" />
                <span>Clique em um ponto de teste (TP)</span>
              </div>
            </div>

            {/* Test Point Info */}
            {activeTestPoint && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#00D287] text-slate-950 font-mono font-bold text-xs">
                      {activeTestPoint.id}: {activeTestPoint.name}
                    </Badge>
                    <span className="text-xs text-slate-300">{activeTestPoint.line}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    <strong className="text-[#00D287]">Dica:</strong> {activeTestPoint.tip}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-[#080c17] px-3.5 py-2 rounded-xl border border-white/5">
                  <div className="text-center">
                    <div className="text-[9px] uppercase text-slate-500 font-semibold">Tensão</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">{activeTestPoint.normalVoltage}</div>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-[9px] uppercase text-slate-500 font-semibold">Condução Reversa</div>
                    <div className="text-xs font-bold text-[#00D287] font-mono">{activeTestPoint.diodeValue}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chronic Issues */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Defeitos Crônicos Comuns
              </h4>
            </div>

            <div className="space-y-2">
              {selectedSchematic.chronicIssues.map((issue, idx) => (
                <div key={idx} className="bg-slate-950 border border-white/5 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-200 font-semibold">
                    <span className="text-rose-300">Falha: {issue.symptom}</span>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20">
                      {issue.probableComponent}
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-[#00D287]">Solução:</strong> {issue.solution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
