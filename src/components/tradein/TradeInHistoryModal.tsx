import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  X, 
  Smartphone, 
  FileText, 
  Printer, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Lock, 
  User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradeInEvaluation, ValuationSettings } from '@/types/tradein';
import { tradeinService, DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { leadAuthService } from '@/services/leadAuthService';

interface TradeInHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeInHistoryModal: React.FC<TradeInHistoryModalProps> = ({ isOpen, onClose }) => {
  const [evaluations, setEvaluations] = useState<TradeInEvaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<TradeInEvaluation | null>(null);
  const [settings, setSettings] = useState<ValuationSettings | null>(null);

  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const [data, st] = await Promise.all([
        tradeinService.getEvaluations(userId, searchQuery),
        tradeinService.getSettings(userId)
      ]);
      setEvaluations(data);
      setSettings(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvaluations();
      setSelectedEvaluation(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#11161d] border border-[#252d37] rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0">
        
        {/* Header (Hidden on print) */}
        <div className="p-4 sm:p-6 border-b border-[#252d37] bg-[#171d25] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#16b981] shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#f3f5f7] tracking-tight">
                Histórico de Compras & Termos de Procedência
              </h2>
              <p className="text-xs text-[#a3adb8] mt-0.5">
                Arquivo digital seguro para consultar e reimprimir termos a qualquer momento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#11161d] border border-[#252d37] text-[#a3adb8] hover:text-white hover:bg-[#252d37] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar (Hidden on print) */}
        <div className="p-4 border-b border-[#252d37] bg-[#11161d] flex flex-col sm:flex-row gap-2.5 shrink-0 print:hidden">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737e8a] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvaluations()}
              placeholder="Pesquisar por Código (REC-...), IMEI, Modelo ou CPF do cliente..."
              className="bg-[#171d25] border-[#252d37] pl-10 text-xs sm:text-sm rounded-lg focus:border-[#16b981] text-[#f3f5f7] h-10"
            />
          </div>
          <Button
            onClick={loadEvaluations}
            disabled={loading}
            className="bg-[#16b981] hover:bg-[#10b981] text-white text-xs sm:text-sm font-medium shrink-0 h-10 px-5 rounded-lg"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Content Body with scrollbar */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#252d37] print:p-0 print:overflow-visible">
          {selectedEvaluation ? (
            /* DETAILED VIEW & PRINTABLE DOCUMENT OF A PAST EVALUATION */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between print:hidden">
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-xs sm:text-sm text-[#16b981] hover:underline flex items-center gap-1.5 font-medium"
                >
                  ← Voltar para a lista de termos
                </button>

                <Button
                  size="sm"
                  onClick={handlePrintDocument}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-medium text-xs sm:text-sm flex items-center gap-2 h-9 px-4 rounded-lg"
                >
                  <Printer className="w-4 h-4" /> Re-imprimir Recibo Oficial
                </Button>
              </div>

              {/* Printable Official Contract */}
              <div className="p-6 rounded-xl bg-white text-slate-900 border border-slate-300 shadow-sm space-y-4 text-xs font-sans print:shadow-none print:border-none print:p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                      {settings?.store_name || 'Minha Loja de Celulares'}
                    </h1>
                    {settings?.store_cnpj && <p className="text-[10px] text-slate-600 font-mono font-bold">CNPJ/CPF: {settings.store_cnpj}</p>}
                    {settings?.store_address && <p className="text-[10px] text-slate-600">{settings.store_address}</p>}
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                      {selectedEvaluation.evaluation_code}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Data: {new Date(selectedEvaluation.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedEvaluation.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Document Subtitle */}
                <div className="text-center py-1 bg-slate-100 rounded border border-slate-200 font-bold uppercase text-[11px] text-slate-800">
                  Comprovante de Aquisição de Smartphone & Termo de Procedência
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Aparelho Adquirido</span>
                    <strong className="text-xs text-slate-950">{selectedEvaluation.brand} {selectedEvaluation.model_name} {selectedEvaluation.storage}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Número do IMEI</span>
                    <strong className="text-xs text-slate-950 font-mono font-bold">{selectedEvaluation.imei || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Operação</span>
                    <span className="font-semibold text-slate-800">
                      {selectedEvaluation.type === 'troca' ? 'Troca / Abatimento na Venda' : 'Compra Direta pela Loja'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Valor Pago / Creditado</span>
                    <strong className="text-sm font-black text-emerald-700">
                      R$ {selectedEvaluation.final_valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedEvaluation.customer_data?.name && (
                  <div className="border border-slate-200 bg-slate-50/60 p-3 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Qualificação do Vendedor (Cliente)</span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-800">
                      <div><strong>Nome:</strong> {selectedEvaluation.customer_data.name}</div>
                      <div><strong>CPF:</strong> {selectedEvaluation.customer_data.cpf}</div>
                      <div><strong>Telefone:</strong> {selectedEvaluation.customer_data.phone}</div>
                      <div><strong>Cidade/UF:</strong> {selectedEvaluation.customer_data.city || 'Não informado'}</div>
                    </div>
                  </div>
                )}

                {/* Faults breakdown */}
                {selectedEvaluation.faults_selected?.length > 0 && (
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Condições e Avarias Registradas</span>
                    <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                      {selectedEvaluation.faults_selected.map((f, i) => (
                        <div key={i} className="flex justify-between text-slate-700 pr-2">
                          <span>• {f.label}</span>
                          <span className="text-red-700 font-bold">- R$ {f.discount.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Clause */}
                <div className="border-t border-slate-200 pt-2 text-[9.5px] text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                  {settings?.terms_text || DEFAULT_LEGAL_TERMS}
                </div>

                {/* Signatures Footer */}
                <div className="border-t-2 border-slate-300 pt-3 flex items-end justify-between">
                  <div className="text-center w-60">
                    {selectedEvaluation.signature_data ? (
                      <img src={selectedEvaluation.signature_data} alt="Assinatura" className="h-12 mx-auto object-contain" />
                    ) : (
                      <div className="h-12 border-b border-slate-400" />
                    )}
                    <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-900">
                      {selectedEvaluation.customer_data?.name || 'Assinatura do Vendedor'}
                    </div>
                    <span className="text-[8.5px] text-slate-500 uppercase">Assinatura do Vendedor / Proprietário</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 rounded border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`https://cellhub.app/verificar/${selectedEvaluation.evaluation_code}`)}`}
                      alt="QR Code"
                      className="w-12 h-12"
                    />
                    <span className="text-[8px] text-slate-500 mt-0.5 font-mono font-bold">{selectedEvaluation.evaluation_code}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LIST OF EVALUATIONS */
            evaluations.length === 0 ? (
              <div className="text-center py-14 text-[#a3adb8]">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#a3adb8]" />
                <p className="text-sm font-semibold text-[#f3f5f7]">Nenhum termo de compra encontrado</p>
                <p className="text-xs text-[#737e8a] mt-1">Ao gerar termos de compra no balcão, eles ficarão salvos com segurança aqui.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#252d37]">
                {evaluations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvaluation(item)}
                    className="p-3.5 rounded-lg bg-[#171d25] border border-[#252d37] hover:border-[#333d4b] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#a3adb8] group-hover:text-[#16b981] transition-colors shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#11161d] text-[#f3f5f7] font-mono text-[10px] border border-[#252d37]">
                            {item.evaluation_code}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-[#f3f5f7]">
                            {item.brand} {item.model_name} {item.storage}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737e8a] mt-0.5">
                          {item.customer_data?.name && (
                            <span>Cliente: <strong className="text-[#a3adb8] font-normal">{item.customer_data.name}</strong></span>
                          )}
                          {item.imei && (
                            <span className="font-mono text-[#16b981]">IMEI: {item.imei}</span>
                          )}
                          <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-sm sm:text-base font-bold text-[#16b981] block">
                          R$ {item.final_valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-[#737e8a] uppercase font-medium">
                          {item.type === 'troca' ? 'Troca' : 'Compra'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#737e8a] group-hover:text-[#f3f5f7] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
