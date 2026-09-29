import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  Edit,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Truck,
  RefreshCw,
  Zap,
  Sparkles,
  ExternalLink,
  Percent,
  Calculator,
  Box,
  X
} from 'lucide-react';
import { MarketplaceOffer, OfferCategory, OfferCondition, ShippingPolicy } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { UserAccount } from '@/services/leadAuthService';
import { CreateOfficialOfferModal } from '@/components/marketplace/CreateOfficialOfferModal';
import { toast } from 'sonner';

interface CellHubShopAdminSectionProps {
  currentUser: UserAccount | null;
}

const CATEGORIES: OfferCategory[] = [
  'Celulares',
  'Peças',
  'Telas',
  'Baterias',
  'Conectores',
  'Acessórios',
  'Ferramentas',
  'Máquinas',
  'Eletrônicos',
  'Componentes',
  'Lotes',
  'Outros'
];

const CONDITIONS: OfferCondition[] = [
  'Novo',
  'Seminovo',
  'Usado',
  'Recondicionado',
  'Com avaria',
  'Para retirada de peças',
  'Outro'
];

export const CellHubShopAdminSection: React.FC<CellHubShopAdminSectionProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceOffer | null>(null);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<OfferCategory>('Celulares');
  const [editCondition, setEditCondition] = useState<OfferCondition>('Novo');
  const [editPrice, setEditPrice] = useState('');
  const [editSupplierCost, setEditSupplierCost] = useState('');
  const [editWarrantyDays, setEditWarrantyDays] = useState<number>(90);
  const [editDescription, setEditDescription] = useState('');
  const [editShippingPolicy, setEditShippingPolicy] = useState<ShippingPolicy>('comprador_paga');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await marketplaceService.getOffers({
        isOfficial: true,
        status: 'todas',
      });
      setProducts(data);
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Erro ao carregar catálogo da CellHub Shop.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Metrics calculation
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'publicada').length;
  const pausedProducts = products.filter((p) => p.status === 'pausada').length;
  
  const totalCatalogValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalSupplierCost = products.reduce((acc, p) => acc + (p.supplierCost || 0), 0);
  const totalEstimatedProfit = Math.max(totalCatalogValue - totalSupplierCost, 0);
  const averageMarginPercent = totalCatalogValue > 0 
    ? Math.round((totalEstimatedProfit / totalCatalogValue) * 100) 
    : 0;

  // Actions
  const handleToggleStatus = async (product: MarketplaceOffer) => {
    const nextStatus = product.status === 'publicada' ? 'pausada' : 'publicada';
    const success = await marketplaceService.updateOfferStatus(product.id, nextStatus);
    if (success) {
      toast.success(`Produto ${nextStatus === 'publicada' ? 'ativado na vitrine' : 'pausado'}.`);
      loadData(true);
    } else {
      toast.error('Erro ao atualizar status do produto.');
    }
  };

  const handleDeleteProduct = async (product: MarketplaceOffer) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.title}" do catálogo oficial?`)) {
      const success = await marketplaceService.deleteOffer(product.id);
      if (success) {
        toast.success('Produto excluído com sucesso.');
        loadData(true);
      } else {
        toast.error('Erro ao excluir produto.');
      }
    }
  };

  const handleOpenEdit = (product: MarketplaceOffer) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditCondition(product.condition);
    setEditPrice(String(product.price));
    setEditSupplierCost(String(product.supplierCost || ''));
    setEditWarrantyDays(product.warrantyDays || 90);
    setEditDescription(product.description || '');
    setEditShippingPolicy(product.shippingPolicy || (product.freeShipping ? 'frete_gratis' : 'comprador_paga'));
    setEditImages(product.images || []);
    setEditImageUrlInput('');
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    if (!editTitle.trim()) {
      toast.error('Informe o título do produto.');
      return;
    }
    const parsedPrice = parseFloat(editPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const parsedCost = parseFloat(editSupplierCost.replace(/\./g, '').replace(',', '.')) || 0;

    if (parsedPrice <= 0) {
      toast.error('Informe um preço de venda válido.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const success = await marketplaceService.updateOffer(editingProduct.id, {
        title: editTitle.trim(),
        category: editCategory,
        condition: editCondition,
        price: parsedPrice,
        supplierCost: parsedCost,
        warrantyDays: editWarrantyDays,
        description: editDescription.trim(),
        shippingPolicy: editShippingPolicy,
        freeShipping: editShippingPolicy === 'frete_gratis',
        images: editImages,
      });

      if (success) {
        toast.success('Produto oficial atualizado com sucesso!');
        setEditingProduct(null);
        loadData(true);
      } else {
        toast.error('Erro ao salvar alterações do produto.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao comunicar com o servidor.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddEditImage = () => {
    if (!editImageUrlInput.trim()) return;
    setEditImages([...editImages, editImageUrlInput.trim()]);
    setEditImageUrlInput('');
  };

  const handleRemoveEditImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'todos' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === 'todos' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FINANCIAL STATS DASHBOARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#090e1c] via-[#0d162d] to-[#090e1c] border border-[#00D287]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#00D287] tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" /> Gestão Oficial da Loja
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Dashboard CellHub Shop
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 font-bold uppercase tracking-wider">
              Oficial
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle total de estoque próprio, custos de fornecedores, margens de lucro e produtos cadastrados.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00D287]' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00B875] text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-[#00D287]/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Produto Oficial</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Total do Catálogo */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Valor em Catálogo</span>
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatBRL(totalCatalogValue)}
          </div>
          <p className="text-[11px] text-slate-500">
            Soma dos preços de venda cadastrados
          </p>
        </div>

        {/* Card 2: Lucro Bruto Estimado */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Margem de Lucro Estimada</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatBRL(totalEstimatedProfit)}
          </div>
          <p className="text-[11px] text-emerald-300 font-medium">
            Margem média de {averageMarginPercent}% sobre custo
          </p>
        </div>

        {/* Card 3: Custo de Fornecedores */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Custo de Fornecedores</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-300">
            {formatBRL(totalSupplierCost)}
          </div>
          <p className="text-[11px] text-slate-500">
            Custo total de aquisição dos produtos
          </p>
        </div>

        {/* Card 4: Status do Catálogo */}
        <div className="p-5 rounded-2xl bg-[#080c17] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Produtos no Catálogo</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-2">
            {totalProducts}
            <span className="text-xs font-normal text-slate-400">
              ({activeProducts} ativos • {pausedProducts} pausados)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Garantia oficial de 90 dias em todos os itens
          </p>
        </div>
      </div>

      {/* 3. FILTROS & BUSCA DE PRODUTOS */}
      <div className="p-4 rounded-2xl bg-[#080c17] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, categoria ou modelo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D287]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#00D287]"
          >
            <option value="todos">Todas as Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#00D287]"
          >
            <option value="todos">Todos os Status</option>
            <option value="publicada">Ativos (Publicados)</option>
            <option value="pausada">Pausados</option>
          </select>
        </div>
      </div>

      {/* 4. TABELA DE PRODUTOS CADASTRADOS NA CELLHUB SHOP */}
      <div className="rounded-2xl bg-[#080c17] border border-white/10 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#00D287]" />
            Catálogo Oficial CellHub Shop ({filteredProducts.length})
          </h3>
          <span className="text-xs text-slate-400">
            Produtos vendidos e enviados diretamente pela CellHub
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-[#00D287] animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhum produto oficial encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Clique no botão abaixo para adicionar seu primeiro produto com margem de lucro e fotos.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#00D287]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Adicionar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#050811] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria / Condição</th>
                  <th className="px-4 py-3">Preço Venda</th>
                  <th className="px-4 py-3">Custo Fornecedor</th>
                  <th className="px-4 py-3">Margem / Lucro</th>
                  <th className="px-4 py-3">Garantia</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredProducts.map((product) => {
                  const cost = product.supplierCost || 0;
                  const profit = product.price - cost;
                  const marginPct = product.price > 0 ? Math.round((profit / product.price) * 100) : 0;
                  const isPublished = product.status === 'publicada';

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Foto e Título */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#040711] border border-white/10 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Box className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-white block truncate hover:text-[#00D287]">
                              {product.title}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate block">
                              ID: {product.id.substring(0, 8)}... • Envio Direto CellHub
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria / Condição */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-slate-200 font-bold block">{product.category}</span>
                        <span className="text-[10px] text-slate-400">{product.condition}</span>
                      </td>

                      {/* Preço de Venda */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-white font-black text-sm block">
                          {formatBRL(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-400">12x de {formatBRL(product.price / 12)}</span>
                      </td>

                      {/* Custo do Fornecedor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-slate-300 font-bold block">
                          {cost > 0 ? formatBRL(cost) : 'Não informado'}
                        </span>
                        <span className="text-[10px] text-slate-500">Custo direto</span>
                      </td>

                      {/* Margem e Lucro */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            profit > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            +{formatBRL(profit)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({marginPct}%)
                          </span>
                        </div>
                      </td>

                      {/* Garantia */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00D287] bg-[#00D287]/10 px-2 py-0.5 rounded border border-[#00D287]/20">
                          <ShieldCheck className="w-3 h-3" />
                          {product.warrantyDays || 90} dias
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isPublished
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isPublished ? '● Ativo' : '○ Pausado'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Pausar / Ativar */}
                          <button
                            onClick={() => handleToggleStatus(product)}
                            title={isPublished ? 'Pausar anúncio' : 'Ativar anúncio'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isPublished
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isPublished ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={() => handleOpenEdit(product)}
                            title="Editar produto"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            title="Excluir produto"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL DE CRIAÇÃO DE PRODUTO OFICIAL */}
      {isCreateModalOpen && currentUser && (
        <CreateOfficialOfferModal
          isOpen={isCreateModalOpen}
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onOfferCreated={() => {
            loadData(true);
          }}
        />
      )}

      {/* 6. MODAL DE EDIÇÃO DE PRODUTO OFICIAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[92vh] bg-[#070b16] border border-[#00D287]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#080c17]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-none">
                    Editar Produto Oficial CellHub
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Atualize os preços, margem, fotos e detalhes do produto
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Título */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Título do Produto</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                />
              </div>

              {/* Categoria & Condição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as OfferCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Condição</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as OfferCondition)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preço de Venda & Custo do Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Preço de Venda (R$)</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Ex: 2899,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-[#00D287]/30 text-white font-bold text-sm focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Custo do Fornecedor (R$)</label>
                  <input
                    type="text"
                    value={editSupplierCost}
                    onChange={(e) => setEditSupplierCost(e.target.value)}
                    placeholder="Ex: 2100,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#00D287]"
                  />
                </div>
              </div>

              {/* Garantia Técnica & Política de Frete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Garantia Técnica (Dias)</label>
                  <input
                    type="number"
                    value={editWarrantyDays}
                    onChange={(e) => setEditWarrantyDays(Number(e.target.value) || 90)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Política de Frete</label>
                  <select
                    value={editShippingPolicy}
                    onChange={(e) => setEditShippingPolicy(e.target.value as ShippingPolicy)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                  >
                    <option value="comprador_paga">Comprador Paga (Calculado no Checkout)</option>
                    <option value="frete_gratis">Frete Grátis (Oficial CellHub assume o frete)</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição do Produto</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                />
              </div>

              {/* Fotos do Produto */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">Fotos do Produto ({editImages.length})</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editImageUrlInput}
                    onChange={(e) => setEditImageUrlInput(e.target.value)}
                    placeholder="Cole o link da imagem (URL https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#00D287]"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditImage}
                    className="px-3 py-2 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs"
                  >
                    Adicionar Foto
                  </button>
                </div>

                {editImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
                        <img src={img} alt="" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(idx)}
                          className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#080c17]">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 text-xs font-black shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
