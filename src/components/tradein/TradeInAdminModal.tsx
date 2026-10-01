import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Smartphone, 
  FileText,
  Search,
  Building2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ValuationModel, ValuationSettings } from '@/types/tradein';
import { tradeinService, FAULT_DEFINITIONS, BRANDS_LIST, DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { leadAuthService } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface TradeInAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUpdated: () => void;
}

export const TradeInAdminModal: React.FC<TradeInAdminModalProps> = ({
  isOpen,
  onClose,
  onModelUpdated
}) => {
  const [tab, setTab] = useState<'models' | 'settings'>('models');
  const [models, setModels] = useState<ValuationModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple');
  const [searchModel, setSearchModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<ValuationModel> | null>(null);
  const [settings, setSettings] = useState<ValuationSettings>({
    store_name: '',
    store_cnpj: '',
    store_address: '',
    default_trade_bonus: 100,
    terms_text: DEFAULT_LEGAL_TERMS
  });

  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  const loadData = async () => {
    setLoading(true);
    try {
      if (userId) {
        await tradeinService.initializeCustomCatalogForUser(userId);
      }

      const [modelsData, settingsData] = await Promise.all([
        tradeinService.getModels(selectedBrand, userId, true),
        tradeinService.getSettings(userId)
      ]);
      setModels(modelsData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setEditingModel(null);
    }
  }, [isOpen, selectedBrand]);

  if (!isOpen) return null;

  const handleSaveModel = async () => {
    if (!editingModel?.brand || !editingModel?.model_name || !editingModel?.buy_price) {
      toast.error('Preencha Marca, Nome do Modelo e Valor de Compra Base.');
      return;
    }

    try {
      const res = await tradeinService.saveModel(editingModel, userId);
      if (res.success) {
        toast.success(`Modelo "${editingModel.model_name}" salvo na sua tabela!`);
        setEditingModel(null);
        loadData();
        onModelUpdated();
      } else {
        toast.error('Erro ao salvar modelo: ' + res.error);
      }
    } catch (err) {
      toast.error('Erro ao salvar modelo.');
    }
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover "${name}" da sua tabela de preços?`)) return;
    const ok = await tradeinService.deleteModel(id);
    if (ok) {
      toast.success('Modelo excluído da sua tabela!');
      loadData();
      onModelUpdated();
    }
  };

  const handleSaveSettings = async () => {
    const ok = await tradeinService.saveSettings(settings, userId);
    if (ok) {
      toast.success('Dados e regras da sua loja salvos com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações.');
    }
  };

  const openNewModel = () => {
    const defaultFaults: Record<string, number> = {};
    FAULT_DEFINITIONS.forEach(f => {
      defaultFaults[f.id] = f.defaultDiscount;
    });

    setEditingModel({
      user_id: userId,
      brand: selectedBrand,
      model_name: '',
      storage: '128GB',
      base_price: 2500,
      buy_price: 1800,
      trade_bonus: 100,
      fault_discounts: defaultFaults,
      is_active: true,
      display_order: 0
    });
  };

  const filteredModels = models.filter(m => 
    !searchModel || m.model_name.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#1e293b]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Configuração da Tabela de Preços & Avarias
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Edite os valores de compra, adicione novos modelos e configure os dados impressos no recibo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#0f172a] flex gap-2 shrink-0">
          <button
            onClick={() => { setTab('models'); setEditingModel(null); }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'models'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Modelos & Preços da Loja
          </button>
          <button
            onClick={() => { setTab('settings'); setEditingModel(null); }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'settings'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Dados da Loja & Termo Legal
          </button>
        </div>

        {/* Content Body with customized smooth scrollbar */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40 space-y-5">
          {tab === 'models' && (
            editingModel ? (
              /* FORM: ADD / EDIT MODEL */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    {editingModel.id ? '✏️ Editar Modelo na Minha Tabela' : '➕ Adicionar Novo Modelo'}
                  </h3>
                  <button
                    onClick={() => setEditingModel(null)}
                    className="text-xs text-slate-400 hover:text-white underline font-medium"
                  >
                    ← Cancelar e Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">Fabricante / Marca:</label>
                    <select
                      value={editingModel.brand}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, brand: e.target.value }))}
                      className="w-full bg-[#1e293b] border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {BRANDS_LIST.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">Nome do Modelo:</label>
                    <Input
                      value={editingModel.model_name || ''}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, model_name: e.target.value }))}
                      placeholder="Ex: iPhone 15 Pro Max"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-11"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">Armazenamento:</label>
                    <Input
                      value={editingModel.storage || '128GB'}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, storage: e.target.value }))}
                      placeholder="Ex: 128GB, 256GB"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#1e293b]/70 border border-slate-700">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-400 block">
                      Valor de Compra Base (R$):
                    </label>
                    <Input
                      type="number"
                      value={editingModel.buy_price || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, buy_price: Number(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-sm text-emerald-400 font-black rounded-xl h-11"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Valor pago pelo aparelho se estiver 100% impecável (sem avarias).
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-400 block">
                      Bônus de Troca na Loja (R$):
                    </label>
                    <Input
                      type="number"
                      value={editingModel.trade_bonus || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, trade_bonus: Number(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-sm text-blue-400 font-black rounded-xl h-11"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Crédito extra concedido se o cliente levar outro smartphone do seu estoque.
                    </span>
                  </div>
                </div>

                {/* Specific Faults Discount Table for this Model */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-100 block">
                        Tabela de Descontos por Avaria
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Personalize quanto descontar para cada defeito neste modelo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {FAULT_DEFINITIONS.map(fault => {
                      const currentVal = editingModel.fault_discounts?.[fault.id] !== undefined
                        ? editingModel.fault_discounts[fault.id]
                        : fault.defaultDiscount;

                      return (
                        <div key={fault.id} className="p-3 rounded-xl bg-[#1e293b]/80 border border-slate-700 space-y-1.5">
                          <span className="text-xs font-medium text-slate-200 block truncate">
                            {fault.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400 font-bold">- R$</span>
                            <Input
                              type="number"
                              value={currentVal}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setEditingModel(prev => ({
                                  ...prev!,
                                  fault_discounts: {
                                    ...(prev?.fault_discounts || {}),
                                    [fault.id]: val
                                  }
                                }));
                              }}
                              className="bg-slate-900 border-slate-700 text-xs h-8 text-red-400 font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setEditingModel(null)}
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveModel}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Salvar Modelo
                  </Button>
                </div>
              </div>
            ) : (
              /* MODELS LIST */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Brand Filter & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                    {BRANDS_LIST.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedBrand === brand
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-[#1e293b] text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {brand === 'Apple' ? ' Apple' : brand}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={openNewModel}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 rounded-xl h-9"
                  >
                    <Plus className="w-4 h-4" /> Novo Modelo {selectedBrand}
                  </Button>
                </div>

                {/* Search Bar in Brand */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchModel}
                    onChange={(e) => setSearchModel(e.target.value)}
                    placeholder={`Pesquisar modelo de ${selectedBrand}...`}
                    className="bg-[#1e293b] border-slate-700 pl-10 text-xs sm:text-sm text-white rounded-xl h-10"
                  />
                </div>

                {/* Table / Cards List with clear scrollbar */}
                {loading ? (
                  <div className="text-center py-10 text-slate-400 text-xs">Carregando tabela de preços...</div>
                ) : filteredModels.length === 0 ? (
                  <div className="text-center py-12 bg-[#1e293b]/40 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
                    <Smartphone className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                    <p className="text-xs sm:text-sm font-medium">Nenhum modelo encontrado para {selectedBrand}.</p>
                    <Button onClick={openNewModel} size="sm" variant="outline" className="text-xs border-slate-700 text-slate-200">
                      Cadastrar Primeiro Modelo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredModels.map(m => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-[#1e293b] border border-slate-700/80 flex items-center justify-between gap-3 hover:border-slate-500 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                            {m.brand === 'Apple' ? '' : m.brand.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-xs sm:text-sm text-white block font-bold">{m.model_name}</strong>
                            <span className="text-[11px] text-slate-400 font-medium">{m.storage} • {m.brand}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Compra Base</span>
                            <span className="font-bold text-emerald-400 text-xs sm:text-sm">R$ {m.buy_price.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Bônus Troca</span>
                            <span className="font-bold text-blue-400 text-xs sm:text-sm">+ R$ {m.trade_bonus.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-2">
                            <button
                              onClick={() => setEditingModel(m)}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-800 transition-colors"
                              title="Editar modelo e valores"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id, m.model_name)}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                              title="Excluir da minha tabela"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {tab === 'settings' && (
            /* STORE SETTINGS & LEGAL TERM */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-[#1e293b] border border-slate-700 space-y-4">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Identificação da Sua Loja no Recibo / Termo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">Nome Fantasia da Loja:</label>
                    <Input
                      value={settings.store_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="Ex: Cell Express Centro"
                      className="bg-slate-900 border-slate-700 text-xs sm:text-sm rounded-xl text-white h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">CNPJ / CPF do Lojista:</label>
                    <Input
                      value={settings.store_cnpj}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                      className="bg-slate-900 border-slate-700 text-xs sm:text-sm rounded-xl text-white h-11"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">Endereço da Loja (Para o Cabeçalho do Documento):</label>
                    <Input
                      value={settings.store_address}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                      placeholder="Rua / Avenida, Número - Bairro, Cidade/UF"
                      className="bg-slate-900 border-slate-700 text-xs sm:text-sm rounded-xl text-white h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#1e293b] border border-slate-700 space-y-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Cláusulas Legais de Procedência & Responsabilidade Penal
                </span>

                <div className="relative">
                  <Textarea
                    value={settings.terms_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, terms_text: e.target.value }))}
                    rows={8}
                    className="bg-slate-900 border-slate-700 text-xs sm:text-sm rounded-xl text-slate-100 leading-relaxed font-sans p-4 scrollbar-thin scrollbar-thumb-slate-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-400 block">
                  Este texto é impresso e assinado pelo vendedor para assegurar a responsabilidade civil/penal e isentar a sua loja de problemas de receptação.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" /> Salvar Dados da Loja
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
