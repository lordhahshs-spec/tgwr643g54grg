import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  Search, 
  Download, 
  ArrowLeft, 
  FileText,
  RotateCw,
  Plus,
  PackageOpen,
  X,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { schematicService, ElectricSchematic } from '@/services/schematicService';

interface EsquemasTabProps {
  isDemo?: boolean;
  onUnlock?: (reason?: string) => void;
}

export const EsquemasTab: React.FC<EsquemasTabProps> = ({ isDemo = false, onUnlock }) => {
  const navigate = useNavigate();
  const [schematics, setSchematics] = useState<ElectricSchematic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchematic, setSelectedSchematic] = useState<ElectricSchematic | null>(null);

  useEffect(() => {
    loadSchematics();

    // Sistema de Tick a cada 3 segundos: atualiza silenciosamente sem reiniciar scroll nem PDF viewer
    const tickInterval = setInterval(() => {
      loadSchematics(true);
    }, 3000);

    return () => clearInterval(tickInterval);
  }, []);

  const loadSchematics = async (silent = false) => {
    if (!silent && schematics.length === 0) {
      setLoading(true);
    }
    try {
      const data = await schematicService.getSchematics();
      setSchematics(data);
      if (selectedSchematic) {
        const found = data.find((s) => s.id === selectedSchematic.id);
        if (found) setSelectedSchematic(found);
      }
    } catch (e) {
      if (!silent) console.error(e);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const filteredSchematics = schematics.filter((s) => {
    const matchesBrand = selectedBrand === 'Todas' || s.brand.toLowerCase() === selectedBrand.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      s.title.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q));
    return matchesBrand && matchesQuery;
  });

  // VIEW 1: PDF VIEWER INSIDE THE TAB (When a schematic is selected)
  if (selectedSchematic) {
    return (
      <div className="flex flex-col h-full bg-[#050811] text-slate-100 overflow-hidden">
        {/* Top Control Bar of PDF Viewer */}
        <div className="flex-shrink-0 bg-[#080c17] border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back Button */}
            <Button
              onClick={() => setSelectedSchematic(null)}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-white/10 hover:border-[#00D287]/40 text-slate-200 hover:text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00D287]" />
              <span className="font-semibold">Voltar para Lista</span>
            </Button>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Schematic Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                  {selectedSchematic.title}
                </span>
                <Badge className="bg-[#00D287]/15 text-[#00D287] border-[#00D287]/30 text-[10px] hidden sm:inline-flex">
                  {selectedSchematic.brand}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-slate-400 text-[10px] hidden md:inline-flex">
                  Modelo: {selectedSchematic.model}
                </Badge>
              </div>
              {selectedSchematic.description && (
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  {selectedSchematic.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={selectedSchematic.pdfUrl}
              download={selectedSchematic.fileName || `${selectedSchematic.model}_esquema.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-200 hover:text-white transition-colors"
              title="Baixar cópia em PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#00D287]" />
              <span className="hidden md:inline">Baixar PDF</span>
            </a>

            <Button
              onClick={() => setSelectedSchematic(null)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              title="Fechar leitor"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Embedded Multi-Page PDF Viewer Area */}
        <div className="flex-1 w-full h-full bg-[#050811] relative overflow-hidden">
          <iframe
            src={`${selectedSchematic.pdfUrl}#toolbar=1&navpanes=1`}
            title={selectedSchematic.title}
            className="w-full h-full border-0 bg-slate-900"
          />
        </div>
      </div>
    );
  }

  // VIEW 2: SCHEMATICS LIST & SEARCH (When no schematic is open)
  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
              <Cpu className="w-3.5 h-3.5 mr-1" />
              Laboratório & Bancada
            </Badge>
            <span className="text-xs text-slate-400">Esquemas Elétricos Oficiais em PDF</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Esquemas Elétricos & <span className="text-[#00D287]">Manuais Técnicos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Selecione qualquer esquema cadastrado para abrir e navegar nas páginas do PDF diretamente na plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadSchematics}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-white/10 text-slate-300 hover:text-white text-xs h-9 px-3 rounded-xl"
            title="Atualizar lista"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-[#00D287]' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={() => navigate('/admin')}
            size="sm"
            className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-[#00D287]/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar via Admin
          </Button>
        </div>
      </div>

      {/* Search & Brand Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080c17] border border-white/5 rounded-xl p-3">
        {/* Brand Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {['Todas', 'Samsung', 'Motorola', 'Xiaomi', 'Apple', 'LG', 'Outros'].map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBrand === brand
                  ? 'bg-[#00D287] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por modelo ou marca..."
            className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-lg focus:border-[#00D287]"
          />
        </div>
      </div>

      {/* Schematics Grid or Empty State */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Carregando esquemas elétricos do Supabase...
        </div>
      ) : filteredSchematics.length === 0 ? (
        <div className="rounded-2xl bg-[#080c17] border border-white/5 p-12 text-center max-w-lg mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 mb-3">
            <PackageOpen className="w-7 h-7 text-[#00D287]" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum esquema elétrico encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {searchQuery 
              ? 'Nenhum resultado para a busca. Tente outro modelo ou marca.'
              : 'Cadastre seus manuais de serviço e esquemas elétricos em formato PDF através do Painel de Administração.'}
          </p>
          <Button
            onClick={() => navigate('/admin')}
            className="mt-4 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Cadastrar Esquema no Admin
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchematics.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                if (isDemo) {
                  onUnlock?.('A visualização e download de esquemas elétricos em PDF é exclusiva para membros com licença vitalícia.');
                  return;
                }
                setSelectedSchematic(s);
              }}
              className="group cursor-pointer rounded-2xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/50 p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-[#00D287]/10"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <Badge className="bg-[#00D287]/15 text-[#00D287] border-[#00D287]/30 text-[10px] font-bold">
                    {s.brand}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">
                    Mod: {s.model}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-[#00D287] transition-colors line-clamp-2">
                  {s.title}
                </h3>

                {/* Description */}
                {s.description && (
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <FileText className="w-3.5 h-3.5 text-[#00D287]" />
                  <span className="truncate max-w-[140px] text-[11px] font-mono">
                    {s.fileName || 'Documento PDF'}
                  </span>
                </div>

                <span className="text-xs font-bold text-[#00D287] flex items-center gap-1 group-hover:underline">
                  {isDemo ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#00D287]" />
                      <span>Desbloquear PDF</span>
                    </>
                  ) : (
                    <>
                      <span>Abrir PDF</span>
                      <span>→</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
