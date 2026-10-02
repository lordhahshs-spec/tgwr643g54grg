import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  MapPin,
  Tag,
  CheckCircle2,
  Copy,
  RefreshCw,
  X,
  Boxes,
  ArrowLeft
} from 'lucide-react';
import { MarketplaceSupplier, MarketplaceOffer } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { toast } from 'sonner';

interface CellHubSuppliersManagerProps {
  products?: MarketplaceOffer[];
}

export const CellHubSuppliersManager: React.FC<CellHubSuppliersManagerProps> = ({
  products = [],
}) => {
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<MarketplaceSupplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Minimal Form: Apenas Nome e CEP
  const [name, setName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [resolvedCity, setResolvedCity] = useState('');
  const [resolvedState, setResolvedState] = useState('');
  const [resolvedStreet, setResolvedStreet] = useState('');
  const [resolvedNeighborhood, setResolvedNeighborhood] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getSuppliers();
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
    setName('');
    setPostalCode('');
    setResolvedCity('');
    setResolvedState('');
    setResolvedStreet('');
    setResolvedNeighborhood('');
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: MarketplaceSupplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPostalCode(supplier.postalCode);
    setResolvedCity(supplier.city);
    setResolvedState(supplier.state);
    setResolvedStreet(supplier.street);
    setResolvedNeighborhood(supplier.neighborhood);
    setIsModalOpen(true);
  };

  const handleCepChange = async (val: string) => {
    setPostalCode(val);
    const cleanCep = val.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setResolvedCity(data.localidade || 'São Paulo');
          setResolvedState(data.uf || 'SP');
          setResolvedStreet(data.logradouro || 'Centro');
          setResolvedNeighborhood(data.bairro || 'Centro');
          toast.success(`${data.localidade} - ${data.uf} identificado!`);
        }
      } catch (e) {
        // silencioso
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do fornecedor.');
      return;
    }
    const cleanCep = postalCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setIsSaving(true);
    const cleanTag = `FORN-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}-${resolvedState || 'SP'}`;
    const formattedCep = cleanCep.replace(/^(\d{5})(\d{3})/, '$1-$2');

    const payload = {
      name: name.trim(),
      tag: cleanTag,
      postalCode: formattedCep,
      street: resolvedStreet || 'Endereço Comercial',
      number: 'S/N',
      neighborhood: resolvedNeighborhood || 'Centro',
      city: resolvedCity || 'São Paulo',
      state: (resolvedState || 'SP').toUpperCase(),
      status: 'ativo' as const,
    };

    try {
      if (editingSupplier) {
        const res = await marketplaceService.updateSupplier(editingSupplier.id, payload);
        if (res.success) {
          toast.success('Fornecedor atualizado!');
          setIsModalOpen(false);
          loadSuppliers();
        } else {
          toast.error(res.error || 'Erro ao atualizar.');
        }
      } else {
        const res = await marketplaceService.createSupplier(payload);
        if (res.success) {
          toast.success('Fornecedor cadastrado!');
          setIsModalOpen(false);
          loadSuppliers();
        } else {
          toast.error(res.error || 'Erro ao cadastrar.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar fornecedor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplier: MarketplaceSupplier) => {
    if (!window.confirm(`Deseja excluir o fornecedor "${supplier.name}"?`)) return;

    try {
      const res = await marketplaceService.deleteSupplier(supplier.id);
      if (res.success) {
        toast.success('Fornecedor removido!');
        loadSuppliers();
      } else {
        toast.error('Erro ao remover fornecedor.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover fornecedor.');
    }
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success('Tag copiada!');
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.postalCode.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Top Action Bar Minimalista */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080d19] border border-white/10 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou CEP..."
            className="w-full bg-[#050811] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Fornecedor</span>
          </button>

          <button
            onClick={loadSuppliers}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista Minimalista de Fornecedores */}
      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#00D287]" />
          <span className="text-xs">Carregando fornecedores...</span>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="py-10 text-center bg-[#090e1c] border border-white/10 rounded-2xl p-6 space-y-2">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">Nenhum fornecedor cadastrado</h4>
          <p className="text-xs text-slate-400">
            Cadastre o nome e o CEP do fornecedor para calcular o frete de origem.
          </p>
          <button
            onClick={openNewModal}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Fornecedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSuppliers.map((supplier) => {
            const linkedCount = products.filter(p => p.supplierId === supplier.id || p.supplierTag === supplier.tag).length;

            return (
              <div
                key={supplier.id}
                className="bg-[#090e1c] hover:bg-[#0c1428] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate">
                        {supplier.name}
                      </h3>
                      <button
                        onClick={() => copyTag(supplier.tag)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-[#00D287]/10 text-[#00D287] border border-[#00D287]/30 px-2 py-0.5 rounded-md hover:bg-[#00D287]/20 transition-colors cursor-pointer"
                        title="Clique para copiar"
                      >
                        <Tag className="w-3 h-3" />
                        {supplier.tag}
                        <Copy className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#050811] border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00D287]" />
                      {supplier.city ? `${supplier.city} - ${supplier.state}` : 'Origem'}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      CEP {supplier.postalCode}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{linkedCount} produto(s) vinculado(s)</span>
                  <span className="text-emerald-400 font-medium">● Ativo</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tela Cheia de Criação / Edição de Fornecedor (Estilo Mercado Livre / Enterprise) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header Superior Minimalista */}
          <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080c18] flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4 text-[#00D287]" />
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <div className="h-5 w-px bg-white/10" />

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-none">
                    {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                    Origem de expedição para cálculo no Melhor Envio
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Main Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="p-6 rounded-2xl bg-[#090e1d] border border-white/10 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#00D287]" /> Dados de Origem Logística
                  </span>
                  <span className="text-xs text-[#00D287] font-bold">Melhor Envio</span>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome do Fornecedor / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Fornecedor Boss SP"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      CEP de Origem (Expedição) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={postalCode}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00D287] transition-colors"
                      />
                      {isLoadingCep && (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00D287] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {resolvedCity && (
                      <span className="text-xs text-emerald-400 mt-1.5 block font-semibold">
                        ✓ Cidade detectada: {resolvedCity} - {resolvedState}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-black text-xs shadow-lg shadow-[#00D287]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSaving ? 'Salvando...' : 'Salvar Fornecedor'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
