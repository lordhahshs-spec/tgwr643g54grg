import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Boxes,
  Layers
} from 'lucide-react';
import { MarketplaceSupplier, MarketplaceOffer } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { toast } from 'sonner';

interface CellHubSuppliersManagerProps {
  products?: MarketplaceOffer[];
  onSupplierSelected?: (supplier: MarketplaceSupplier) => void;
}

const DEFAULT_SUPPLIERS_PRESETS = [
  {
    name: 'Fornecedor Boss SP',
    tag: 'FORN-BOSS-SP',
    phone: '(11) 98765-4321',
    email: 'contato@bossdistribuidora.com.br',
    contactPerson: 'Eduardo Boss',
    postalCode: '01205-000',
    street: 'Rua Santa Ifigênia',
    number: '450',
    complement: 'Sala 12',
    neighborhood: 'Santa Ifigênia',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Distribuidor direto de iPhones lacrados e seminovos grade A+.',
    status: 'ativo' as const,
  },
  {
    name: 'TechDistribuidora Paulista',
    tag: 'TECH-PAULISTA-01',
    phone: '(11) 97654-3210',
    email: 'logistica@techpaulista.com',
    contactPerson: 'Renato Silva',
    postalCode: '01021-100',
    street: 'Rua 25 de Março',
    number: '1080',
    complement: 'Galpão 3',
    neighborhood: 'Centro Histórico',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Fornecedor de peças, telas OLED premium e baterias homologadas.',
    status: 'ativo' as const,
  },
  {
    name: 'Apple Prime Import',
    tag: 'APPLE-PRIME-PR',
    phone: '(41) 99123-4567',
    email: 'vendas@appleprimeimport.com',
    contactPerson: 'Carla Prado',
    postalCode: '80010-000',
    street: 'Rua XV de Novembro',
    number: '780',
    complement: 'Conjunto 502',
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    notes: 'Especialista em iPads, MacBooks e Apple Watches lacrados.',
    status: 'ativo' as const,
  }
];

export const CellHubSuppliersManager: React.FC<CellHubSuppliersManagerProps> = ({
  products = [],
}) => {
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<MarketplaceSupplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    phone: '',
    email: '',
    contactPerson: '',
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: '',
    status: 'ativo' as 'ativo' | 'inativo',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      let data = await marketplaceService.getSuppliers();
      
      // Se ainda não tiver nenhum fornecedor cadastrado, insere automaticamente os presets
      if (data.length === 0) {
        for (const preset of DEFAULT_SUPPLIERS_PRESETS) {
          await marketplaceService.createSupplier(preset);
        }
        data = await marketplaceService.getSuppliers();
      }
      
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar lista de fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openNewModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      tag: '',
      phone: '',
      email: '',
      contactPerson: '',
      postalCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      notes: '',
      status: 'ativo',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: MarketplaceSupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      tag: supplier.tag,
      phone: supplier.phone || '',
      email: supplier.email || '',
      contactPerson: supplier.contactPerson || '',
      postalCode: supplier.postalCode,
      street: supplier.street,
      number: supplier.number,
      complement: supplier.complement || '',
      neighborhood: supplier.neighborhood,
      city: supplier.city,
      state: supplier.state,
      notes: supplier.notes || '',
      status: supplier.status,
    });
    setIsModalOpen(true);
  };

  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          postalCode: cleanCep.replace(/^(\d{5})(\d{3})/, '$1-$2'),
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast.success(`Endereço encontrado: ${data.localidade} - ${data.uf}`);
      } else {
        toast.error('CEP não localizado no ViaCEP.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao consultar CEP automático.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const autoGenerateTag = (name: string, city: string, uf: string) => {
    if (!name.trim()) return '';
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const cleanUf = (uf || 'SP').trim().toUpperCase();
    return `FORN-${cleanName}-${cleanUf}`;
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => {
      const next = { ...prev, name: val };
      if (!editingSupplier && (!prev.tag || prev.tag.startsWith('FORN-'))) {
        next.tag = autoGenerateTag(val, prev.city, prev.state);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Informe o nome do fornecedor.');
      return;
    }
    if (!formData.tag.trim()) {
      toast.error('Informe a tag/código do fornecedor.');
      return;
    }
    if (!formData.postalCode.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast.error('Preencha o CEP, Cidade e Estado para cálculo correto do frete.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSupplier) {
        const res = await marketplaceService.updateSupplier(editingSupplier.id, formData);
        if (res.success) {
          toast.success('Fornecedor atualizado com sucesso!');
          setIsModalOpen(false);
          loadSuppliers();
        } else {
          toast.error(res.error || 'Erro ao atualizar fornecedor.');
        }
      } else {
        const res = await marketplaceService.createSupplier(formData);
        if (res.success) {
          toast.success('Fornecedor cadastrado com sucesso!');
          setIsModalOpen(false);
          loadSuppliers();
        } else {
          toast.error(res.error || 'Erro ao criar fornecedor.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao salvar o fornecedor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplier: MarketplaceSupplier) => {
    const linkedProducts = products.filter(p => p.supplierId === supplier.id || p.supplierTag === supplier.tag);
    
    if (linkedProducts.length > 0) {
      const confirmMsg = `Este fornecedor está vinculado a ${linkedProducts.length} produto(s) no catálogo. Deseja realmente excluí-lo?`;
      if (!window.confirm(confirmMsg)) return;
    } else {
      if (!window.confirm(`Deseja excluir o fornecedor "${supplier.name}"?`)) return;
    }

    try {
      const res = await marketplaceService.deleteSupplier(supplier.id);
      if (res.success) {
        toast.success('Fornecedor removido com sucesso!');
        loadSuppliers();
      } else {
        toast.error('Erro ao remover fornecedor.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover fornecedor.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Filtragem
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.postalCode.includes(searchQuery);

    const matchesState = stateFilter === 'todos' || s.state.toUpperCase() === stateFilter.toUpperCase();

    return matchesSearch && matchesState;
  });

  const uniqueStates = Array.from(new Set(suppliers.map(s => s.state.toUpperCase()))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Total Fornecedores</span>
            <span className="text-2xl font-black text-white">{suppliers.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00D287]/10 border border-[#00D287]/20 flex items-center justify-center text-[#00D287]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Origem de Frete Ativa</span>
            <span className="text-2xl font-black text-emerald-400">
              {suppliers.filter(s => s.status === 'ativo').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Estados / Polos</span>
            <span className="text-2xl font-black text-cyan-400">{uniqueStates.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Produtos Vinculados</span>
            <span className="text-2xl font-black text-purple-400">
              {products.filter(p => Boolean(p.supplierId || p.supplierTag)).length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0a1224] to-[#070d1a] border border-[#00D287]/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00D287]/20 text-[#00D287] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Logística Dropshipping & Cálculo de Frete pelo Melhor Envio
              <span className="text-[10px] bg-[#00D287]/20 text-[#00D287] px-2 py-0.5 rounded-md font-black uppercase">
                Origem Automática
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              Cada produto associado a uma <strong>Tag de Fornecedor</strong> utiliza o endereço base cadastrado aqui como <strong>CEP de Origem</strong> para o cálculo exato do frete no momento em que o cliente compra.
            </p>
          </div>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00D287]/20 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Fornecedor</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080d19] border border-white/10 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, tag, cidade, estado ou CEP..."
            className="w-full bg-[#050811] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#00D287]"
          >
            <option value="todos">Todos os Estados</option>
            {uniqueStates.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>

          <button
            onClick={loadSuppliers}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Suppliers */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00D287]" />
          <span className="text-xs font-medium">Carregando base de fornecedores...</span>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="py-12 text-center bg-[#090e1c] border border-white/10 rounded-2xl p-6 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Nenhum fornecedor encontrado</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cadastre os parceiros fornecedores para vincular aos produtos e automatizar o cálculo de frete de origem pelo Melhor Envio.
          </p>
          <button
            onClick={openNewModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Fornecedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const linkedProducts = products.filter(p => p.supplierId === supplier.id || p.supplierTag === supplier.tag);

            return (
              <div
                key={supplier.id}
                className="bg-[#090e1c] hover:bg-[#0c1428] border border-white/10 hover:border-white/20 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-xl group"
              >
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#00D287] transition-colors">
                          {supplier.name}
                        </h3>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          supplier.status === 'ativo'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {supplier.status}
                        </span>
                      </div>

                      {/* Tag Badge */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-[#00D287]/10 text-[#00D287] border border-[#00D287]/30 px-2 py-0.5 rounded-lg">
                          <Tag className="w-3 h-3" />
                          {supplier.tag}
                        </span>
                        <button
                          onClick={() => copyToClipboard(supplier.tag, 'Tag do fornecedor')}
                          className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copiar Tag"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Endereço de Origem (Para Melhor Envio) */}
                  <div className="bg-[#050811] border border-white/5 rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#00D287] flex-shrink-0" />
                      <span>Origem do Frete (Melhor Envio):</span>
                    </div>
                    <p className="text-slate-200 font-medium pl-5 truncate">
                      {supplier.street}, {supplier.number} {supplier.complement ? `(${supplier.complement})` : ''}
                    </p>
                    <p className="text-slate-400 text-[11px] pl-5 truncate">
                      {supplier.neighborhood} • <strong>{supplier.city} - {supplier.state}</strong> • CEP: <span className="font-mono text-emerald-400 font-bold">{supplier.postalCode}</span>
                    </p>
                  </div>

                  {/* Contato do Fornecedor */}
                  <div className="space-y-1 text-[11px] text-slate-400">
                    {supplier.contactPerson && (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Contato: <strong className="text-slate-300">{supplier.contactPerson}</strong></span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>WhatsApp/Tel: <strong className="text-slate-300">{supplier.phone}</strong></span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Observações / Notas */}
                  {supplier.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 bg-white/[0.02] p-2 rounded-lg border border-white/5 italic">
                      "{supplier.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Card */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-purple-400" />
                    <strong>{linkedProducts.length}</strong> produtos associados
                  </span>
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="text-xs text-[#00D287] hover:underline font-semibold"
                  >
                    Editar Origem →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-2xl bg-[#0a0f1d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070b16]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingSupplier ? 'Editar Fornecedor & Origem' : 'Novo Fornecedor de Origem'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o endereço base para cálculo do frete automático no Melhor Envio.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              
              {/* Seção 1: Dados Gerais e Tag */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Identificação do Fornecedor
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Fornecedor / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Fornecedor Boss SP"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tag Identificadora do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                      placeholder="Ex: FORN-BOSS-SP"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#00D287] placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Esta tag será exibida para seleção no cadastro e edição dos produtos.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pessoa de Contato
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail do Fornecedor
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Ex: vendas@fornecedor.com"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Endereço de Origem (Melhor Envio) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00D287] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Endereço Base de Origem (Cálculo de Frete)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    O CEP deste fornecedor será a origem do pacote.
                  </span>
                </div>

                {/* Linha CEP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CEP de Origem *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={formData.postalCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, postalCode: val }));
                          if (val.replace(/\D/g, '').length === 8) {
                            handleCepLookup(val);
                          }
                        }}
                        placeholder="00000-000"
                        className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                      />
                      {isLoadingCep && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D287] absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Logradouro (Rua / Av / Galpão) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Ex: Rua Santa Ifigênia"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* Linha Número, Complemento, Bairro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="Ex: 450"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Complemento (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                      placeholder="Ex: Sala 12, Bloco B"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Ex: Santa Ifigênia"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>

                {/* Linha Cidade & Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Ex: São Paulo"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      placeholder="SP"
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs uppercase font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Observações e Status */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Observações / Detalhes de Envio
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ex: Despacha no mesmo dia se aprovado até 14h. Envia por Jadlog e Sedex."
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status Operacional
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ativo' | 'inativo' }))}
                      className="w-full bg-[#050811] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D287]"
                    >
                      <option value="ativo">Ativo (Habilitado para Frete)</option>
                      <option value="inativo">Inativo (Pausado)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs shadow-lg shadow-[#00D287]/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingSupplier ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
