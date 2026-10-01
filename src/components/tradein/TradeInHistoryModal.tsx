import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  X, 
  Eye, 
  Smartphone, 
  CheckCircle2, 
  Calendar, 
  FileText,
  User,
  ShieldCheck,
  Printer,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TradeInEvaluation } from '@/types/tradein';
import { tradeinService } from '@/services/tradeinService';

interface TradeInHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeInHistoryModal: React.FC<TradeInHistoryModalProps> = ({ isOpen, onClose }) => {
  const [evaluations, setEvaluations] = useState<TradeInEvaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<TradeInEvaluation | null>(null);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const data = await tradeinService.getEvaluations(searchQuery);
      setEvaluations(data);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#080c17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Histórico de Avaliações & Compras de Usados
              </h2>
              <p className="text-xs text-slate-400">
                Consulte avaliações realizadas, dados registrados e termos assinados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvaluations()}
              placeholder="Pesquisar por Código (AV-...), Modelo, IMEI, Nome ou CPF do cliente..."
              className="bg-slate-950 border-slate-800 pl-9 text-xs rounded-xl focus:border-[#00D287] text-white"
            />
          </div>
          <Button
            onClick={loadEvaluations}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shrink-0"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {selectedEvaluation ? (
            /* Detailed View of an evaluation */
            <div className="space-y-4 animate-in fade-in duration-200">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="text-xs text-[#00D287] hover:underline flex items-center gap-1 font-bold"
              >
                ← Voltar para a lista
              </button>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-xs">
                      {selectedEvaluation.evaluation_code}
                    </Badge>
                    <h3 className="text-lg font-black text-white mt-1">
                      {selectedEvaluation.brand} {selectedEvaluation.model_name} {selectedEvaluation.storage}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Registrado</span>
                    <span className="text-xl font-black text-[#00D287]">
                      R$ {selectedEvaluation.final_valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Operation Data */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                      Detalhes da Avaliação
                    </span>
                    <div className="flex justify-between text-slate-300">
                      <span>Tipo de Operação:</span>
                      <strong className="text-white capitalize">{selectedEvaluation.type === 'troca' ? 'Troca / Trade-In' : 'Compra Direta'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Valor Base Cadastrado:</span>
                      <strong className="text-white">R$ {selectedEvaluation.base_value.toLocaleString('pt-BR')}</strong>
                    </div>
                    {selectedEvaluation.total_faults_discount > 0 && (
                      <div className="flex justify-between text-red-400">
                        <span>Descontos de Avarias:</span>
                        <strong>- R$ {selectedEvaluation.total_faults_discount.toLocaleString('pt-BR')}</strong>
                      </div>
                    )}
                    {selectedEvaluation.trade_bonus_applied > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Bônus de Troca da Loja:</span>
                        <strong>+ R$ {selectedEvaluation.trade_bonus_applied.toLocaleString('pt-BR')}</strong>
                      </div>
                    )}
                    {selectedEvaluation.custom_adjustment !== 0 && (
                      <div className="flex justify-between text-blue-400">
                        <span>Ajuste Manual:</span>
                        <strong>
                          {selectedEvaluation.custom_adjustment > 0 ? '+' : ''} R$ {selectedEvaluation.custom_adjustment.toLocaleString('pt-BR')}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>IMEI:</span>
                      <strong className="text-white font-mono">{selectedEvaluation.imei || 'Não informado'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Data/Hora:</span>
                      <strong className="text-white">{new Date(selectedEvaluation.created_at).toLocaleString('pt-BR')}</strong>
                    </div>
                  </div>

                  {/* Customer Data */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                      Dados do Cliente / Vendedor
                    </span>
                    {selectedEvaluation.customer_data?.name ? (
                      <>
                        <div className="text-slate-300">
                          <span className="text-slate-400 block">Nome:</span>
                          <strong className="text-white">{selectedEvaluation.customer_data.name}</strong>
                        </div>
                        <div className="text-slate-300">
                          <span className="text-slate-400 block">CPF:</span>
                          <strong className="text-white font-mono">{selectedEvaluation.customer_data.cpf}</strong>
                        </div>
                        <div className="text-slate-300">
                          <span className="text-slate-400 block">WhatsApp:</span>
                          <strong className="text-white">{selectedEvaluation.customer_data.phone}</strong>
                        </div>
                        {selectedEvaluation.customer_data.city && (
                          <div className="text-slate-300">
                            <span className="text-slate-400 block">Cidade / Endereço:</span>
                            <span className="text-slate-200">{selectedEvaluation.customer_data.address || ''} {selectedEvaluation.customer_data.city}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-500 italic">Termo sem qualificação de cliente registrada.</p>
                    )}
                  </div>
                </div>

                {/* Faults List */}
                {selectedEvaluation.faults_selected?.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                      Avarias & Condições Assinaladas
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedEvaluation.faults_selected.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                          <span className="text-slate-300">{f.label}</span>
                          <span className="text-red-400 font-bold">- R$ {f.discount.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature registered */}
                {selectedEvaluation.signature_data && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-bold text-slate-300 block uppercase tracking-wider text-[10px] mb-1">
                      Assinatura Eletrônica Registrada
                    </span>
                    <div className="p-2 bg-white rounded-lg inline-block border border-slate-300">
                      <img src={selectedEvaluation.signature_data} alt="Assinatura" className="h-12 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List of Evaluations */
            evaluations.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhuma avaliação encontrada</p>
                <p className="text-xs text-slate-600 mt-1">Realize avaliações no balcão para consultar o histórico aqui.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {evaluations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvaluation(item)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-[#00D287]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-[#00D287] transition-colors shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-900 text-slate-300 font-mono text-[10px] border-slate-800">
                            {item.evaluation_code}
                          </Badge>
                          <span className="text-xs font-bold text-white">
                            {item.brand} {item.model_name} {item.storage}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>{item.type === 'troca' ? 'Troca / Trade-In' : 'Compra de Usado'}</span>
                          {item.customer_data?.name && (
                            <span>• Cliente: <strong className="text-slate-300">{item.customer_data.name}</strong></span>
                          )}
                          {item.imei && (
                            <span className="font-mono">• IMEI: {item.imei}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-sm font-black text-[#00D287]">
                          R$ {item.final_valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
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
