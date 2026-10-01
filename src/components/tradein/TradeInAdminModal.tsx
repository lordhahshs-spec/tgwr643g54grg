import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Smartphone, 
  Search,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ValuationModel, ValuationSettings, FaultDefinition } from '@/types/tradein';
import { tradeinService, getBrandPresets, BRANDS_LIST, DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
import { leadAuthService } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface TradeInAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUpdated: () => void;
  initialTab?: 'models' | 'settings';
}

export const TradeInAdminModal: React.FC<TradeInAdminModalProps> = ({
  isOpen,
  onClose,
  onModelUpdated,
  initialTab = 'models'
}) => {
  const [tab, setTab] = useState<'models' | 'settings'>(initialTab);
  const [models, setModels] = useState<ValuationModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple');
  const [searchModel, setSearchModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<ValuationModel> | null>(null);
  const [settings, setSettings] = useState<ValuationSettings>({
    store_name: '',
    store_cnpj: '',
    store_address: '',
    default_trade_bonus: 50,
    terms_text: DEFAULT_LEGAL_TERMS
  });

  const currentUser = leadAuthService.getCurrentUser();
  const userId = currentUser?.id;

  // Montar endereço formatado do perfil se disponível
  const profileAddress = useMemo(() => {
    if (!currentUser) return '';
    const parts = [
      currentUser.shippingStreet ? `${currentUser.shippingStreet}${currentUser.shippingNumber ? ', ' + currentUser.shippingNumber : ''}` : '',
      currentUser.shippingNeighborhood ? currentUser.shippingNeighborhood : '',
      currentUser.shippingCity ? `${currentUser.shippingCity}${currentUser.shippingState ? ' - ' + currentUser.shippingState : ''}` : ''
    ].filter(Boolean);
    return parts.join(' - ');
  }, [currentUser]);

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

      // Auto-preenchimento inteligente caso os dados da loja estejam vazios ou padrão
      const effectiveStoreName = (settingsData.store_name && settingsData.store_name !== 'Minha Loja de Celulares')
        ? settingsData.store_name
        : (currentUser?.tradeName || currentUser?.companyName || settingsData.store_name || '');

      const effectiveStoreCnpj = settingsData.store_cnpj || currentUser?.cnpj || '';
      const effectiveStoreAddress = settingsData.store_address || profileAddress || '';

      setSettings({
        ...settingsData,
        store_name: effectiveStoreName,
        store_cnpj: effectiveStoreCnpj,
        store_address: effectiveStoreAddress
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      loadData();
      setEditingModel(null);
    }
  }, [isOpen, initialTab, selectedBrand]);

  // Presets da marca do modelo em edição
  const editingBrandPresets: FaultDefinition[] = useMemo(() => {
    const brand = editingModel?.brand || selectedBrand;
    return getBrandPresets(brand, editingModel?.model_name);
  }, [editingModel?.brand, editingModel?.model_name, selectedBrand]);

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
      onModelUpdated();
    } else {
      toast.error('Erro ao salvar configurações.');
    }
  };

  const openNewModel = () => {
    const brandPresets = getBrandPresets(selectedBrand);
    const defaultFaults: Record<string, number> = {};
    brandPresets.forEach(f => {
      defaultFaults[f.id] = f.defaultDiscount;
    });

    setEditingModel({
      user_id: userId,
      brand: selectedBrand,
      model_name: '',
      storage: '128GB',
      base_price: 2000,
      buy_price: 1500,
      trade_bonus: 50,
      fault_discounts: defaultFaults,
      is_active: true,
      display_order: 0
    });
  };

  const filteredModels = models.filter(m => 
    !searchModel || m.model_name.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#1e293b]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Configuração da Tabela de Preços & Avarias
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Edite os valores de compra, adicione novos modelos e configure os dados do recibo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#0f172a] flex gap-2 shrink-0">
          <button
            onClick={() => { setTab('models'); setEditingModel(null); }}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'models'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Modelos & Preços da Loja
          </button>
          <button
            onClick={() => { setTab('settings'); setEditingModel(null); }}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Dados da Loja & Termo Legal
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin space-y-5">
          {tab === 'models' && (
            editingModel ? (
              /* FORM: ADD / EDIT MODEL */
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    {editingModel.id ? 'Editar Modelo na Minha Tabela' : 'Adicionar Novo Modelo'}
                  </h3>
                  <button
                    onClick={() => setEditingModel(null)}
                    className="text-xs text-blue-400 hover:underline font-medium"
                  >
                    ← Cancelar e Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Fabricante / Marca:</label>
                    <select
                      value={editingModel.brand}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, brand: e.target.value }))}
                      className="w-full bg-[#1e293b] border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl p-2.5 text-white focus:border-blue-500 outline-none"
                    >
                      {BRANDS_LIST.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Nome do Modelo:</label>
                    <Input
                      value={editingModel.model_name || ''}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, model_name: e.target.value }))}
                      placeholder="Ex: SPARK 20 ou Note 13"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Armazenamento:</label>
                    <Input
                      value={editingModel.storage || '128GB'}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, storage: e.target.value }))}
                      placeholder="Ex: 128GB, 256GB"
                      className="bg-[#1e293b] border-slate-700 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#1e293b] border border-slate-700">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-400 block">
                      Valor de Compra Base (R$):
                    </label>
                    <Input
                      type="number"
                      value={editingModel.buy_price || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, buy_price: Number(e.target.value) || 0 }))}
                      className="bg-[#0f172a] border-slate-700 text-sm text-emerald-400 font-bold rounded-xl h-10"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Valor pago pelo aparelho em estado 100% conservado (sem avarias).
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
                      className="bg-[#0f172a] border-slate-700 text-sm text-blue-400 font-bold rounded-xl h-10"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Crédito extra aplicado se o cliente comprar outro seminovo do estoque.
                    </span>
                  </div>
                </div>

                {/* Specific Faults Discount Table for this Model / Brand */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        Tabela de Descontos por Avaria ({editingModel.brand})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Personalize quanto descontar para cada defeito neste modelo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {editingBrandPresets.map(f => {
                      const currentDiscount = editingModel.fault_discounts?.[f.id] !== undefined
                        ? editingModel.fault_discounts[f.id]
                        : f.defaultDiscount;

                      return (
                        <div 
                          key={f.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e293b]/70 border border-slate-800 gap-3"
                        >
                          <span className="text-xs font-medium text-slate-300 truncate">
                            {f.label}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-red-400 font-bold">- R$</span>
                            <Input
                              type="number"
                              value={currentDiscount}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setEditingModel(prev => ({
                                  ...prev!,
                                  fault_discounts: {
                                    ...(prev?.fault_discounts || {}),
                                    [f.id]: val
                                  }
                                }));
                              }}
                              className="w-20 bg-[#0f172a] border-slate-700 text-xs font-bold text-right text-red-400 rounded-lg h-8"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setEditingModel(null)}
                    className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveModel}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 rounded-xl"
                  >
                    <Save className="w-4 h-4" /> Salvar Modelo
                  </Button>
                </div>
              </div>
            ) : (
              /* MODELS LIST */
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Brand Filter & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                    {BRANDS_LIST.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedBrand === brand
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-[#1e293b] text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={openNewModel}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 rounded-xl h-9"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Modelo
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchModel}
                    onChange={(e) => setSearchModel(e.target.value)}
                    placeholder={`Pesquisar modelo em ${selectedBrand}...`}
                    className="bg-[#1e293b] border-slate-700 pl-9 text-xs sm:text-sm rounded-xl focus:border-blue-500 text-white h-10"
                  />
                </div>

                {/* Table / List */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0f1d]">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Carregando catálogo...</div>
                  ) : filteredModels.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum modelo encontrado para <strong>{selectedBrand}</strong>.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {filteredModels.map((m) => (
                        <div 
                          key={m.id}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-white truncate">
                                {m.model_name}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                {m.storage}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Bônus de Troca: <span className="text-blue-400 font-bold">+R$ {m.trade_bonus}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Compra Base</span>
                              <span className="font-bold text-emerald-400 text-xs sm:text-sm">R$ {m.buy_price.toLocaleString('pt-BR')}</span>
                            </div>

                            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                              <button
                                onClick={() => {
                                  const brandPresets = getBrandPresets(m.brand, m.model_name);
                                  const mergedFaults: Record<string, number> = {};
                                  brandPresets.forEach(f => {
                                    mergedFaults[f.id] = m.fault_discounts?.[f.id] !== undefined 
                                      ? m.fault_discounts[f.id] 
                                      : f.defaultDiscount;
                                  });

                                  setEditingModel({
                                    ...m,
                                    fault_discounts: mergedFaults
                                  });
                                }}
                                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                title="Editar Modelo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {m.user_id && (
                                <button
                                  onClick={() => handleDeleteModel(m.id, m.model_name)}
                                  className="p-2 rounded-lg bg-slate-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                  title="Remover Modelo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {tab === 'settings' && (
            /* STORE & RECEIPT SETTINGS */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1e293b] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400">
                      Dados Cadastrais da Loja (Saem no Recibo / Termo)
                    </span>
                  </div>
                  {currentUser && (
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Sincronizado com seu perfil CellHub
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 block">Razão Social / Nome Fantasia:</label>
                      {currentUser?.tradeName && (
                        <span className="text-[10px] text-slate-400">Puxado do perfil</span>
                      )}
                    </div>
                    <Input
                      value={settings.store_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="Ex: Top Cell Imports & Acessórios"
                      className="bg-[#0f172a] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 block">CNPJ / CPF da Empresa:</label>
                      {currentUser?.cnpj && (
                        <span className="text-[10px] text-slate-400">Puxado do perfil</span>
                      )}
                    </div>
                    <Input
                      value={settings.store_cnpj}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_cnpj: e.target.value }))}
                      placeholder="Ex: 00.000.000/0001-00"
                      className="bg-[#0f172a] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 block">Endereço Completo da Loja:</label>
                      {profileAddress && (
                        <span className="text-[10px] text-slate-400">Puxado do endereço cadastrado</span>
                      )}
                    </div>
                    <Input
                      value={settings.store_address}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                      placeholder="Ex: Av. Paulista, 1000 - Loja 42 - Bela Vista, São Paulo - SP"
                      className="bg-[#0f172a] border-slate-700 text-xs sm:text-sm text-white rounded-xl h-10 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#1e293b] border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  Cláusulas do Termo de Compra e Procedência Legal
                </span>

                <Textarea
                  value={settings.terms_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, terms_text: e.target.value }))}
                  rows={8}
                  className="bg-[#0f172a] border-slate-700 text-xs sm:text-sm rounded-xl text-slate-200 leading-relaxed font-sans p-3.5 scrollbar-thin focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <Save className="w-4 h-4" /> Salvar Configurações da Loja
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
