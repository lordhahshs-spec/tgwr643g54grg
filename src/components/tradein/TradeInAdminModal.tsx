import React, { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ValuationModel, ValuationSettings, FaultDefinition } from '@/types/tradein';
import { tradeinService, getBrandPresets, BRANDS_LIST, DEFAULT_LEGAL_TERMS } from '@/services/tradeinService';
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
    default_trade_bonus: 50,
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
      <div className="relative w-full max-w-4xl bg-[#11161d] border border-[#252d37] rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header - Clean B2B style */}
        <div className="p-4 sm:p-6 border-b border-[#252d37] bg-[#171d25] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#16b981] shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#f3f5f7] tracking-tight">
                Configuração da Tabela de Preços & Avarias
              </h2>
              <p className="text-xs text-[#a3adb8] mt-0.5">
                Edite os valores de compra, adicione novos modelos e configure os dados do recibo
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

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-[#252d37] bg-[#11161d] flex gap-2 shrink-0">
          <button
            onClick={() => { setTab('models'); setEditingModel(null); }}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              tab === 'models'
                ? 'border-[#16b981] text-[#16b981]'
                : 'border-transparent text-[#a3adb8] hover:text-[#f3f5f7]'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Modelos & Preços da Loja
          </button>
          <button
            onClick={() => { setTab('settings'); setEditingModel(null); }}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              tab === 'settings'
                ? 'border-[#16b981] text-[#16b981]'
                : 'border-transparent text-[#a3adb8] hover:text-[#f3f5f7]'
            }`}
          >
            <Building2 className="w-4 h-4" /> Dados da Loja & Termo Legal
          </button>
        </div>

        {/* Content Body with scrollbar */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#252d37] scrollbar-track-[#11161d] space-y-5">
          {tab === 'models' && (
            editingModel ? (
              /* FORM: ADD / EDIT MODEL */
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#252d37]">
                  <h3 className="text-sm sm:text-base font-semibold text-[#f3f5f7] flex items-center gap-2">
                    {editingModel.id ? 'Editar Modelo na Minha Tabela' : 'Adicionar Novo Modelo'}
                  </h3>
                  <button
                    onClick={() => setEditingModel(null)}
                    className="text-xs text-[#a3adb8] hover:text-white underline font-medium"
                  >
                    ← Cancelar e Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#a3adb8] block">Fabricante / Marca:</label>
                    <select
                      value={editingModel.brand}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, brand: e.target.value }))}
                      className="w-full bg-[#171d25] border border-[#252d37] text-xs sm:text-sm font-medium rounded-lg p-2.5 text-[#f3f5f7] focus:border-[#16b981] outline-none"
                    >
                      {BRANDS_LIST.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#a3adb8] block">Nome do Modelo:</label>
                    <Input
                      value={editingModel.model_name || ''}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, model_name: e.target.value }))}
                      placeholder="Ex: Galaxy S24 Ultra"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm rounded-lg focus:border-[#16b981] text-[#f3f5f7] h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#a3adb8] block">Armazenamento:</label>
                    <Input
                      value={editingModel.storage || '128GB'}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, storage: e.target.value }))}
                      placeholder="Ex: 128GB, 256GB"
                      className="bg-[#171d25] border-[#252d37] text-xs sm:text-sm rounded-lg focus:border-[#16b981] text-[#f3f5f7] h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#171d25] border border-[#252d37]">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#16b981] block">
                      Valor de Compra Base (R$):
                    </label>
                    <Input
                      type="number"
                      value={editingModel.buy_price || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, buy_price: Number(e.target.value) || 0 }))}
                      className="bg-[#11161d] border-[#252d37] text-sm text-[#16b981] font-bold rounded-lg h-10"
                    />
                    <span className="text-[11px] text-[#737e8a] block">
                      Valor pago pelo aparelho em estado 100% conservado (sem avarias).
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#a3adb8] block">
                      Bônus de Troca na Loja (R$):
                    </label>
                    <Input
                      type="number"
                      value={editingModel.trade_bonus || 0}
                      onChange={(e) => setEditingModel(prev => ({ ...prev!, trade_bonus: Number(e.target.value) || 0 }))}
                      className="bg-[#11161d] border-[#252d37] text-sm text-[#f3f5f7] font-bold rounded-lg h-10"
                    />
                    <span className="text-[11px] text-[#737e8a] block">
                      Crédito extra aplicado se o cliente comprar outro seminovo do estoque.
                    </span>
                  </div>
                </div>

                {/* Specific Faults Discount Table for this Model / Brand */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-[#f3f5f7] block">
                        Tabela de Descontos por Avaria ({editingModel.brand})
                      </span>
                      <span className="text-[11px] text-[#737e8a]">
                        Personalize quanto descontar para cada defeito neste modelo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-[#252d37]">
                    {editingBrandPresets.map(fault => {
                      const currentVal = editingModel.fault_discounts?.[fault.id] !== undefined
                        ? editingModel.fault_discounts[fault.id]
                        : fault.defaultDiscount;

                      return (
                        <div key={fault.id} className="p-3 rounded-lg bg-[#171d25] border border-[#252d37] space-y-1.5">
                          <span className="text-xs font-medium text-[#f3f5f7] block truncate">
                            {fault.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rose-400 font-semibold">- R$</span>
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
                              className="bg-[#11161d] border-[#252d37] text-xs h-8 text-rose-400 font-semibold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#252d37]">
                  <Button
                    variant="outline"
                    onClick={() => setEditingModel(null)}
                    className="border-[#252d37] text-[#a3adb8] hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveModel}
                    className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold flex items-center gap-1.5"
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedBrand === brand
                            ? 'bg-[#16b981] text-white'
                            : 'bg-[#171d25] text-[#a3adb8] hover:text-[#f3f5f7] border border-[#252d37]'
                        }`}
                      >
                        {brand === 'Apple' ? ' Apple' : brand}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={openNewModel}
                    size="sm"
                    className="bg-[#16b981] hover:bg-[#10b981] text-white font-medium text-xs flex items-center gap-1.5 rounded-lg h-8"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo Modelo {selectedBrand}
                  </Button>
                </div>

                {/* Search Bar in Brand */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#737e8a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchModel}
                    onChange={(e) => setSearchModel(e.target.value)}
                    placeholder={`Pesquisar modelo de ${selectedBrand}...`}
                    className="bg-[#171d25] border-[#252d37] pl-10 text-xs sm:text-sm text-[#f3f5f7] rounded-lg h-9"
                  />
                </div>

                {/* Table / Cards List with scrollbar */}
                {loading ? (
                  <div className="text-center py-10 text-[#737e8a] text-xs">Carregando tabela de preços...</div>
                ) : filteredModels.length === 0 ? (
                  <div className="text-center py-12 bg-[#171d25]/40 rounded-xl border border-[#252d37] text-[#a3adb8] space-y-3">
                    <Smartphone className="w-8 h-8 mx-auto opacity-30 text-[#a3adb8]" />
                    <p className="text-xs sm:text-sm font-medium">Nenhum modelo encontrado para {selectedBrand}.</p>
                    <Button onClick={openNewModel} size="sm" variant="outline" className="text-xs border-[#252d37] text-[#f3f5f7]">
                      Cadastrar Primeiro Modelo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#252d37]">
                    {filteredModels.map(m => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-lg bg-[#171d25] border border-[#252d37] flex items-center justify-between gap-3 hover:border-[#333d4b] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#11161d] border border-[#252d37] flex items-center justify-center text-[#f3f5f7] font-semibold text-xs shrink-0">
                            {m.brand === 'Apple' ? '' : m.brand.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-xs sm:text-sm text-[#f3f5f7] block font-semibold">{m.model_name}</strong>
                            <span className="text-[11px] text-[#737e8a] font-normal">{m.storage} • {m.brand}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-[#737e8a] block uppercase font-medium">Compra Base</span>
                            <span className="font-semibold text-[#16b981] text-xs sm:text-sm">R$ {m.buy_price.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#737e8a] block uppercase font-medium">Bônus Troca</span>
                            <span className="font-semibold text-[#f3f5f7] text-xs sm:text-sm">+ R$ {m.trade_bonus.toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-2">
                            <button
                              onClick={() => setEditingModel(m)}
                              className="p-1.5 rounded-lg bg-[#11161d] border border-[#252d37] text-[#a3adb8] hover:text-white hover:border-[#16b981] transition-colors"
                              title="Editar modelo e valores"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id, m.model_name)}
                              className="p-1.5 rounded-lg bg-[#11161d] border border-[#252d37] text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
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
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-5 rounded-xl bg-[#171d25] border border-[#252d37] space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#16b981] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Identificação da Sua Loja no Recibo / Termo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#a3adb8] block">Nome Fantasia da Loja:</label>
                    <Input
                      value={settings.store_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="Ex: Cell Express Centro"
                      className="bg-[#11161d] border-[#252d37] text-xs sm:text-sm rounded-lg text-[#f3f5f7] h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#a3adb8] block">CNPJ / CPF do Lojista:</label>
                    <Input
                      value={settings.store_cnpj}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                      className="bg-[#11161d] border-[#252d37] text-xs sm:text-sm rounded-lg text-[#f3f5f7] h-10"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-[#a3adb8] block">Endereço da Loja (Para o Cabeçalho do Documento):</label>
                    <Input
                      value={settings.store_address}
                      onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                      placeholder="Rua / Avenida, Número - Bairro, Cidade/UF"
                      className="bg-[#11161d] border-[#252d37] text-xs sm:text-sm rounded-lg text-[#f3f5f7] h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#171d25] border border-[#252d37] space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#16b981] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Cláusulas Legais de Procedência & Responsabilidade Penal
                </span>

                <div className="relative">
                  <Textarea
                    value={settings.terms_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, terms_text: e.target.value }))}
                    rows={8}
                    className="bg-[#11161d] border-[#252d37] text-xs sm:text-sm rounded-lg text-[#f3f5f7] leading-relaxed font-sans p-3.5 scrollbar-thin scrollbar-thumb-[#252d37] focus:ring-1 focus:ring-[#16b981]"
                  />
                </div>
                <span className="text-xs text-[#737e8a] block">
                  Este texto é impresso e assinado pelo vendedor para assegurar a responsabilidade civil/penal e isentar a sua loja de problemas de receptação.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#16b981] hover:bg-[#10b981] text-white font-semibold h-10 px-5 rounded-lg flex items-center gap-2 shadow-sm"
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
