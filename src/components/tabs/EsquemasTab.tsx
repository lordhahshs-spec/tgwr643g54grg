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
  diodeValue: string; // Condução reversa (mV)
  x: number; // percentage on board
  y: number; // percentage on board
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
        probableComponent: 'Termistor TH3001 na placa do conector ou flex FPC',
        solution: 'Substituição do termistor NTC 100kΩ ou troca do sub-flex original.',
      },
      {
        symptom: 'Sem imagem na tela, mas vibra e toca sons',
        probableComponent: 'Diodo de backlight D4002 e bobina boost L4001',
        solution: 'Verificar se há 24V na linha do display com tela conectada.',
      },
      {
        symptom: 'Consumo travado em 80mA na fonte ao pressionar Power',
        probableComponent: 'Falha de solda no PMIC principal ou cristal oscilador 38.4MHz',
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
        symptom: 'Wi-Fi e Bluetooth não ativam (botão cinza)',
        probableComponent: 'CI de conectividade WCN3980',
        solution: 'Resolda leve a 330°C ou troca do módulo RF.',
      },
    ],
    testPoints: [
      { id: 'TP1', name: 'VBUS_USB_IN', line: 'VBUS 5V Entrada', normalVoltage: '5.1V', diodeValue: '560 mV', x: 20, y: 82, tip: 'Entrada direta da subplaca', status: 'normal' },
      { id: 'TP2', name: 'VDD_PX_MAIN', line: 'Malha Primária', normalVoltage: '4.0V', diodeValue: '460 mV', x: 42, y: 58, tip: 'Alimenta os estágios de chaveamento dos indutores', status: 'normal' },
      { id: 'TP3', name: 'VREG_S4_1.2V', line: 'RAM LPDDR4X', normalVoltage: '1.2V', diodeValue: '280 mV', x: 62, y: 44, tip: 'Tensão de alimentação da memória RAM', status: 'normal' },
      { id: 'TP4', name: 'MSM_PS_HOLD', line: 'Sinal de sustentação do power', normalVoltage: '1.8V', diodeValue: '620 mV', x: 70, y: 38, tip: 'Comprova se o processador aceitou o início do sistema', status: 'normal' },
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
      { id: 'TP3', name: 'VIO18_PMU', line: 'Barramento I/O 1.8V', normalVoltage: '1.8V', diodeValue: '410 mV', x: 60, y: 40, tip: 'Presente em sensores e display', status: 'normal' },
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
      { id: 'TP3', name: 'PP1V8_S2', line: 'Tensão 1.8V Always-On', normalVoltage: '1.8V', diodeValue: '480 mV', x: 64, y: 35, tip: 'Necessário para I2C e sensores', status: 'normal' },
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
    <div className="h-full overflow-y-auto bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1628] via-[#09152a] to-[#0d1628] border border-cyan-500/20 rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <Cpu className="w-3.5 h-3.5 mr-1" />
              Bancada Técnica & Laboratório
            </Badge>
            <span className="text-xs text-slate-400">Boardviews & Linhas de Tensão</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Esquemas Elétricos & <span className="text-cyan-400">Diagnóstico de Placas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Consulte diagramas esquemáticos, valores de condução reversa para multímetro e mapa de defeitos crônicos dos smartphones mais vendidos no Brasil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => alert(`Baixando pacote PDF completo do modelo: ${selectedSchematic.model}`)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Baixar PDF do Esquema
          </Button>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Device Selection */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
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
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-800/80'
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
                className="pl-8 h-8 text-xs bg-slate-950 border-slate-700 text-slate-100 rounded-lg"
              />
            </div>
          </div>

          {/* List of Models */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
              Aparelhos Disponíveis ({filteredSchematics.length})
            </div>
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
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-md'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{item.model}</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-700">
                      {item.brand}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 truncate">
                    {item.boardCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Boardview & Diagnostic Data */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Boardview Simulator */}
          <div className="bg-gradient-to-b from-[#0d1527] to-[#090e1a] border border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  PCB
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedSchematic.model}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Código: <strong className="text-cyan-300 font-mono">{selectedSchematic.boardCode}</strong></span>
                    <span>•</span>
                    <span>PMIC: <strong className="text-slate-200">{selectedSchematic.pmicModel}</strong></span>
                  </div>
                </div>
              </div>

              {/* View controls */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setBoardSide('top')}
                    className={`px-2.5 py-1 rounded font-medium ${boardSide === 'top' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Lado A (Top)
                  </button>
                  <button
                    onClick={() => setBoardSide('bottom')}
                    className={`px-2.5 py-1 rounded font-medium ${boardSide === 'bottom' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Lado B (Bottom)
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
                  className="h-7 w-7 p-0 bg-slate-900 border-slate-700 text-slate-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  className="h-7 w-7 p-0 bg-slate-900 border-slate-700 text-slate-300"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Interactive Blueprint Motherboard Area */}
            <div className="mt-4 relative min-h-[300px] sm:min-h-[360px] bg-[#050914] rounded-xl border border-cyan-500/20 overflow-hidden flex items-center justify-center p-4">
              {/* Circuit Grid Background */}
              <div 
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle, #06b6d4 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Motherboard Graphic Outline */}
              <div 
                className="relative w-full max-w-lg aspect-[16/9] border-2 border-cyan-500/40 rounded-xl bg-gradient-to-br from-emerald-950/20 via-slate-950/80 to-cyan-950/30 shadow-2xl p-4 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Circuit Traces Mockup */}
                <div className="absolute inset-3 border border-dashed border-cyan-500/20 rounded-lg pointer-events-none" />
                
                {/* Simulated CPU / SoC */}
                <div className="absolute top-[25%] left-[55%] w-24 h-24 rounded-lg bg-slate-900/90 border-2 border-cyan-400/50 flex flex-col items-center justify-center p-2 text-center shadow-lg">
                  <Cpu className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] font-mono text-cyan-200 font-bold leading-tight truncate w-full">
                    {selectedSchematic.cpuModel}
                  </span>
                  <span className="text-[8px] text-slate-400">AP / SOC</span>
                </div>

                {/* Simulated PMIC */}
                <div className="absolute top-[25%] left-[32%] w-16 h-16 rounded-lg bg-slate-900/90 border-2 border-amber-400/50 flex flex-col items-center justify-center p-1 text-center shadow-lg">
                  <Zap className="w-4 h-4 text-amber-400 mb-0.5" />
                  <span className="text-[9px] font-mono text-amber-200 font-bold truncate w-full">
                    PMIC
                  </span>
                </div>

                {/* Simulated Type-C Port */}
                <div className="absolute bottom-2 left-[18%] w-16 h-8 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center text-[9px] text-slate-300 font-mono">
                  Type-C FPC
                </div>

                {/* Test Points Overlay */}
                {selectedSchematic.testPoints.map((tp) => {
                  const isActive = activeTestPoint?.id === tp.id;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => setActiveTestPoint(tp)}
                      style={{ top: `${tp.y}%`, left: `${tp.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center z-10 transition-transform ${
                        isActive ? 'scale-125 z-20' : 'hover:scale-110'
                      }`}
                    >
                      <span className={`relative flex h-5 w-5 rounded-full items-center justify-center border-2 text-[9px] font-bold font-mono shadow-md ${
                        isActive
                          ? 'bg-cyan-500 border-white text-slate-950 ring-4 ring-cyan-500/40'
                          : 'bg-slate-900 border-cyan-400 text-cyan-300 hover:border-white'
                      }`}>
                        {tp.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instructions Pill */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clique em um Ponto de Teste (TP) para ver a voltagem e condução reversa</span>
              </div>
            </div>

            {/* Selected Test Point Details Panel */}
            {activeTestPoint && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyan-500 text-slate-950 font-mono font-bold text-xs">
                      {activeTestPoint.id}: {activeTestPoint.name}
                    </Badge>
                    <span className="text-xs text-slate-300 font-medium">{activeTestPoint.line}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    <strong className="text-cyan-300">Dica de Diagnóstico:</strong> {activeTestPoint.tip}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Tensão Normal</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">{activeTestPoint.normalVoltage}</div>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Condução Reversa</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">{activeTestPoint.diodeValue}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chronic Issues & Rapid Solutions Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Defeitos Crônicos Frequentes & Solução Rápida
              </h4>
              <span className="text-xs text-slate-400">Base técnica com validação de laboratório</span>
            </div>

            <div className="space-y-2.5">
              {selectedSchematic.chronicIssues.map((issue, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-semibold text-rose-300">Defeito: {issue.symptom}</span>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                      Componente: {issue.probableComponent}
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-emerald-400">Solução Recomendada:</strong> {issue.solution}
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
