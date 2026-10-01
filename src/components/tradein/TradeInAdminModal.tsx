import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Smartphone, 
  ShieldCheck, 
  Check, 
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ValuationModel, ValuationSettings, DeviceBrand } from '@/types/tradein';
import { tradeinService, FAULT_DEFINITIONS, BRANDS_LIST } from '@/services/tradeinService';
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
  const [loading, setLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<ValuationModel> | null>(null);
  const [settings, setSettings] = useState<ValuationSettings>({
    store_name: '',
    store_cnpj: '',
    store_address: '',
    default_trade_bonus: 100,
    terms_text: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelsData, settingsData] = await Promise.all([
        tradeinService.getModels(selectedBrand, true),
        tradeinService.getSettings()
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
      const res = await tradeinService.saveModel(editingModel);
      if (res.success) {
        toast.success(`Modelo "${editingModel.model_name}" salvo com sucesso!`);
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
    if (!window.confirm(`Tem certeza que deseja remover o modelo "${name}"?`)) return;
    const ok = await tradeinService.deleteModel(id);
    if (ok) {
      toast.success('Modelo excluído com sucesso!');
      loadData();
      onModelUpdated();
    }
  };

  const handleSaveSettings = async () => {
    const ok = await tradeinService.saveSettings(settings);
    if (ok) {
      toast.success('Configurações salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações.');
    }
  };

  const openNewModel = () => {
    // Generate default fault discounts
    const defaultFaults: Record<string, number> = {};
    FAULT_DEFINITIONS.forEach(f => {
      defaultFaults[f.id] = f.defaultDiscount;
    });

    setEditingModel({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#080c17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Gestão da Tabela de Avaliações & Avarias (Admin)
              </h2>
              <p className="text-xs text-slate-400">
                Configure os valores de compra, bônus de troca e tabela de descontos de avarias por modelo
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

        {/* Tab Switcher */}
        <div className="px-4 pt-3 border-b border-slate-800 bg-slate-950/40 flex gap-2 shrink-0">
          <button
            onClick={() => { setTab('models'); setEditingModel(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'models'
                ? 'border-[#00D287] text-[#00D287]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Modelos & Avarias
          </button>
          <button
            onClick={() => { setTab('settings'); setEditingModel(null); }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'settings'
                ? 'border-[#00D287] text-[#00D287]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Termo & Configurações da Loja
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {tab === 'models' && (
            editingModel ? (
              /* EDIT / CREATE MODEL FORM */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {editingModel.id ? 'Editar Modelo de Avaliação' : 'Adicionar Novo Modelo à Tabela'}
                  </h3>
                  <button
                    onClick={() => setEditingModel(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Fabricante / Marca:</label>
                    <select
                      value={editingModel.brand}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, brand: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 text-white focus:border-[#00D287] outline-none"
                    >
                      {BRANDS_LIST.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Nome do Modelo:</label>
                    <Input
                      value={editingModel.model_name || ''}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, model_name: e.target.value }))}
                      placeholder="Ex: iPhone 15 Pro Max"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Armazenamento Padrão:</label>
                    <Input
                      value={editingModel.storage || '128GB'}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, storage: e.target.value }))}
                      placeholder="Ex: 128GB, 256GB"
                      className="bg-slate-950 border-slate-800 text-xs rounded-xl focus:border-[#00D287] text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Valor de Compra Base (R$):</label>
                    <Input
                      type="number"
                      value={editingModel.buy_price || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, buy_price: Number(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-xs rounded-xl text-emerald-400 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Valor máximo se aparelho estiver 100% perfeito</span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Bônus de Troca na Loja (R$):</label>
                    <Input
                      type="number"
                      value={editingModel.trade_bonus || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, trade_bonus: Number(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-xs rounded-xl text-emerald-400 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Crédito extra aplicado se o cliente levar outro aparelho</span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">Preço Base de Mercado (R$):</label>
                    <Input
                      type="number"
                      value={editingModel.base_price || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, base_price: Number(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-xs rounded-xl text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Referência de revenda da loja</span>
                  </div>
                </div>

                {/* Specific Faults Discount Matrix for this Model */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tabela de Descontos por Avaria para este Modelo
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Personalize quanto descontar para cada defeito neste modelo específico
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {FAULT_DEFINITIONS.map(fault => {
                      const currentVal = editingModel.fault_discounts?.[fault.id] !== undefined
                        ? editingModel.fault_discounts[fault.id]
                        : fault.defaultDiscount;

                      return (
                        <div key={fault.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[11px] font-medium text-slate-300 block leading-tight truncate">
                            {fault.label}
                          </span>
                          <div className="flex items-center gap-1.5">
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
                              className="bg-slate-900 border-slate-800 text-xs h-7 text-red-400 font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setEditingModel(null)}
                    className="border-slate-800 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveModel}
                    className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Salvar Modelo
                  </Button>
                </div>
              </div>
            ) : (
              /* MODELS LIST BY BRAND */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Brand Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {BRANDS_LIST.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedBrand === brand
                            ? 'bg-[#00D287] text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={openNewModel}
                    size="sm"
                    className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Modelo {selectedBrand}
                  </Button>
                </div>

                {/* Table / Cards */}
                {loading ? (
                  <div className="text-center py-8 text-slate-500 text-xs">Carregando modelos...</div>
                ) : models.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 space-y-2">
                    <Smartphone className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs">Nenhum modelo cadastrado para a marca <strong>{selectedBrand}</strong>.</p>
                    <Button onClick={openNewModel} size="sm" variant="outline" className="text-xs">
                      Cadastrar Primeiro Modelo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {models.map(m => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                            {m.brand === 'Apple' ? '' : m.brand.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-xs text-white block">{m.model_name}</strong>
                            <span className="text-[11px] text-slate-400">{m.storage} • {m.brand}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase">Compra Base</span>
                            <span className="font-bold text-[#00D287]">R$ {m.buy_price.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase">Bônus Troca</span>
                            <span className="font-bold text-emerald-400">+ R$ {m.trade_bonus.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingModel(m)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                              title="Editar modelo e avarias"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id, m.model_name)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 hover:border-red-800 transition-colors"
                              title="Excluir"
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
            /* STORE & LEGAL SETTINGS */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] block">
                  Identificação da Loja no Termo de Responsabilidade
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Nome Fantasia da Loja:</label>
                    <Input
                      value={settings.store_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="Ex: CellHub Loja Centro"
                      className="bg-slate-900 border-slate-800 text-xs rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">CNPJ / CPF do Lojista:</label>
                    <Input
                      value={settings.store_cnpj}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                      className="bg-slate-900 border-slate-800 text-xs rounded-xl text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 block mb-1">Endereço da Loja (Para o Cabeçalho):</label>
                    <Input
                      value={settings.store_address}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                      placeholder="Av. Paulista, 1000 - São Paulo/SP"
                      className="bg-slate-900 border-slate-800 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] block">
                  Cláusula do Termo Legal de Procedência & Responsabilidade
                </span>

                <Textarea
                  value={settings.terms_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, terms_text: e.target.value }))}
                  rows={4}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl text-slate-200 leading-relaxed"
                />
                <span className="text-[11px] text-slate-500 block">
                  Este texto é exibido no momento da assinatura eletrônica do cliente ao vender o smartphone usado para sua loja.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#00D287] hover:bg-[#00c07a] text-slate-950 font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Salvar Configurações
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
