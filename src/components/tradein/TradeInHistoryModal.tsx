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
  User,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradeInEvaluation, ValuationSettings } from '@/types/tradein';
import { tradeinService, DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { leadAuthService } from '@/services/leadAuthService';

interface TradeInHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const TradeInHistoryModal: React.FC<TradeInHistoryModalProps> = ({ isOpen, onClose, userId: propUserId }) => {
  const [evaluations, setEvaluations] = useState<TradeInEvaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<TradeInEvaluation | null>(null);
  const [settings, setSettings] = useState<ValuationSettings | null>(null);

  const currentUser = leadAuthService.getCurrentUser();
  const targetUserId = propUserId || currentUser?.id;

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const [data, st] = await Promise.all([
        tradeinService.getEvaluations(targetUserId, searchQuery),
        tradeinService.getSettings(targetUserId)
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
  }, [isOpen, targetUserId]);

  if (!isOpen) return null;

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-5 bg-black/90 md:backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full h-[100dvh] md:h-auto md:max-h-[92vh] md:max-w-4xl bg-[#0f172a] md:border md:border-slate-700/90 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 print:border-none print:shadow-none print:bg-white print:max-h-none print:w-full print:m-0 pt-[max(env(safe-area-inset-top,0px),0px)] md:pt-0">
        
        {/* Header (Hidden on print) */}
        <div className="p-3.5 sm:p-6 border-b border-slate-800 bg-[#1e293b]/95 backdrop-blur-md flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Botão Voltar no Mobile */}
            <button
              onClick={selectedEvaluation ? () => setSelectedEvaluation(null) : onClose}
              className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs p-1.5 -ml-1 rounded-xl active:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Voltar</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 hidden sm:flex items-center justify-center text-blue-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-lg font-bold text-white tracking-tight">
                Histórico de Compras & Termos
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[240px] sm:max-w-none">
                Arquivo digital seguro para consultar e reimprimir termos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden md:flex w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar (Hidden on print) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-[#0f172a] flex flex-col sm:flex-row gap-2.5 shrink-0 print:hidden">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvaluations()}
              placeholder="Pesquisar por Código (REC-...), IMEI, Modelo ou CPF do cliente..."
              className="bg-[#1e293b] border-slate-700 pl-10 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-10"
            />
          </div>
          <Button
            onClick={loadEvaluations}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shrink-0 h-10 px-5 rounded-xl shadow-md shadow-blue-600/30"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 scrollbar-thin print:p-0 print:overflow-visible pb-24 md:pb-6">
          {selectedEvaluation ? (
            /* DETAILED VIEW & PRINTABLE DOCUMENT OF A PAST EVALUATION */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between print:hidden">
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-xs sm:text-sm text-blue-400 hover:underline flex items-center gap-1.5 font-bold"
                >
                  ← Voltar para a lista
                </button>
                <Button
                  onClick={handlePrintDocument}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 h-9 px-4 rounded-xl shadow-md shadow-blue-600/30"
                >
                  <Printer className="w-4 h-4" /> Imprimir Termo A4
                </Button>
              </div>

              {/* Printable Term Container (Black text on white paper) */}
              <div className="printable-term-document bg-white text-black p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 font-sans text-xs sm:text-sm leading-relaxed">
                
                {/* Store Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                      {settings?.store_name || 'CELLHUB — COMPRA & AVALIAÇÃO DE SEMINOVOS'}
                    </h1>
                    {settings?.store_cnpj && (
                      <p className="text-xs text-slate-600 font-semibold">
                        CNPJ/CPF: {settings.store_cnpj}
                      </p>
                    )}
                    {settings?.store_address && (
                      <p className="text-xs text-slate-600">
                        {settings.store_address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black uppercase bg-slate-900 text-white px-2.5 py-1 rounded">
                      {selectedEvaluation.type === 'troca' ? 'TROCA COM RETOMADA' : 'RECIBO DE COMPRA'}
                    </span>
                    <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                      Nº {selectedEvaluation.evaluation_code}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(selectedEvaluation.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedEvaluation.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Device & Value Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Aparelho Adquirido:</span>
                    <strong className="text-sm text-slate-900">{selectedEvaluation.brand} {selectedEvaluation.model_name} ({selectedEvaluation.storage})</strong>
                    {selectedEvaluation.imei && (
                      <p className="text-xs font-mono font-bold text-blue-800 mt-0.5">
                        IMEI: {selectedEvaluation.imei}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Valor Final Pago:</span>
                    <strong className="text-base sm:text-lg text-emerald-700 font-black">
                      R$ {selectedEvaluation.final_valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    {selectedEvaluation.total_faults_discount > 0 && (
                      <p className="text-[11px] text-red-600 font-medium">
                        (Avarias deduzidas: -R$ {selectedEvaluation.total_faults_discount})
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Data */}
                <div className="mb-4 p-3 border border-slate-300 rounded-lg bg-slate-50">
                  <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                    Qualificação do Vendedor (Cliente):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Nome:</span> <strong className="text-slate-900">{selectedEvaluation.customer_data?.name || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">CPF:</span> <strong className="text-slate-900 font-mono">{selectedEvaluation.customer_data?.cpf || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Telefone:</span> <strong className="text-slate-900">{selectedEvaluation.customer_data?.phone || 'Não informado'}</strong>
                    </div>
                    {selectedEvaluation.customer_data?.address && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-slate-500">Endereço:</span> <span className="text-slate-800">{selectedEvaluation.customer_data.address} - {selectedEvaluation.customer_data?.city}/{selectedEvaluation.customer_data?.state}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal Terms Clauses */}
                <div className="mb-4">
                  <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                    Cláusulas de Declaração de Procedência & Responsabilidade:
                  </span>
                  <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed text-justify">
                    {settings?.terms_text || DEFAULT_LEGAL_TERMS}
                  </p>
                </div>

                {/* Signature Box */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8">
                  <div className="text-center space-y-1.5">
                    <div className="h-14 border-b border-dashed border-slate-900 flex items-center justify-center">
                      {selectedEvaluation.signature_data && selectedEvaluation.signature_data.startsWith('data:image') ? (
                        <img
                          src={selectedEvaluation.signature_data}
                          alt="Assinatura do Vendedor"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : null}
                    </div>
                    <strong className="text-xs text-slate-900 block font-black uppercase">
                      {selectedEvaluation.customer_data?.name || 'Vendedor(a)'}
                    </strong>
                    <p className="text-[10px] text-slate-600 font-mono">
                      CPF: {selectedEvaluation.customer_data?.cpf || '---'}
                    </p>
                    <span className="text-[10px] text-slate-500 italic block">
                      Assinatura do Vendedor (Cliente)
                    </span>
                  </div>

                  <div className="text-center space-y-1.5">
                    <div className="h-14 border-b border-dashed border-slate-900 flex items-center justify-center">
                    </div>
                    <strong className="text-xs text-slate-900 block font-black uppercase">
                      {settings?.store_name || 'Loja / Comprador'}
                    </strong>
                    {settings?.store_cnpj && (
                      <p className="text-[10px] text-slate-600 font-mono">
                        CNPJ: {settings.store_cnpj}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-500 italic block">
                      Assinatura do Responsável da Loja
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* LIST OF EVALUATIONS */
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Carregando registros...
                </div>
              ) : evaluations.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Nenhum termo gerado ainda.</p>
                  <p className="text-xs text-slate-400">
                    Quando você concluir uma avaliação e colher a assinatura do cliente, o recibo ficará arquivado aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {evaluations.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEvaluation(item)}
                      className="p-3.5 sm:p-4 rounded-xl bg-[#1e293b]/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-400">
                              {item.evaluation_code}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              item.type === 'troca' 
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30' 
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {item.type === 'troca' ? 'Troca' : 'Compra'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                            {item.brand} {item.model_name} ({item.storage})
                          </h4>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                            {item.customer_data?.name && (
                              <span className="truncate">Cliente: {item.customer_data.name}</span>
                            )}
                            {item.imei && (
                              <span className="font-mono text-slate-300">IMEI: {item.imei}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor</span>
                          <span className="text-sm sm:text-base font-black text-emerald-400 block">
                            R$ {item.final_valuation.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
