import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  Zap, 
  Battery, 
  HardDrive, 
  Cpu,
  Plus,
  PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { catalogService, CatalogDevice } from '@/services/catalogService';

interface CatalogoTabProps {
  onGoToAurusSimulator: () => void;
}

export const CatalogoTab: React.FC<CatalogoTabProps> = ({ onGoToAurusSimulator }) => {
  const [devices, setDevices] = useState<CatalogDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add real device modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newBrand, setNewBrand] = useState<string>('Samsung');
  const [newCondition, setNewCondition] = useState<string>('Novo Lacrado');
  const [newStorage, setNewStorage] = useState<string>('128GB');
  const [newRam, setNewRam] = useState<string>('6GB');
  const [newBattery, setNewBattery] = useState<string>('5000 mAh');
  const [newPrice, setNewPrice] = useState<number>(1499);
  const [newHighlight, setNewHighlight] = useState<string>('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    const data = await catalogService.getDevices();
    setDevices(data);
    setLoading(false);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    await catalogService.addDevice({
      name: newName,
      brand: newBrand,
      condition: newCondition,
      storage: newStorage,
      ram: newRam,
      battery: newBattery,
      price: newPrice,
      highlight: newHighlight,
    });

    setNewName('');
    setNewHighlight('');
    setIsAddModalOpen(false);
    loadDevices();
  };

  const filteredProducts = devices.filter((p) => {
    const matchesBrand = selectedBrand === 'Todas' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.highlight && p.highlight.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBrand && matchesSearch;
  });

  const handleWhatsAppContact = (product: CatalogDevice) => {
    const text = `Olá! Tenho interesse no smartphone ${product.name} (${product.storage}) por R$ ${product.price.toLocaleString('pt-BR')} anunciado no SmartTech Hub. Gostaria de simular as parcelas!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050811] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              Estoque da Loja
            </Badge>
            <span className="text-xs text-slate-400">Banco de Dados Supabase em Tempo Real</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Catálogo de Aparelhos <span className="text-[#00D287]">& Vendas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Aparelhos cadastrados no estoque para apresentação de propostas e parcelamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="bg-slate-900 border-white/10 hover:border-[#00D287]/40 text-slate-200 text-xs h-9 px-3 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#00D287]" />
            Cadastrar Aparelho
          </Button>

          <Button
            onClick={onGoToAurusSimulator}
            className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-extrabold text-xs h-9 px-4 rounded-xl shadow-lg shadow-[#00D287]/20"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Simulador Android
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080c17] border border-white/5 rounded-xl p-3">
        {/* Brand Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {['Todas', 'Samsung', 'Motorola', 'Xiaomi', 'Apple'].map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBrand === brand
                  ? 'bg-[#00D287] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar modelo cadastrado..."
            className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-lg focus:border-[#00D287]"
          />
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Carregando catálogo do Supabase...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-[#080c17] border border-white/5 p-12 text-center max-w-lg mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 mb-3">
            <PackageOpen className="w-7 h-7 text-[#00D287]" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum aparelho cadastrado no estoque</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Todos os dados fictícios foram removidos. Cadastre seus smartphones reais para compor o estoque.
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Cadastrar Primeiro Aparelho
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl bg-[#080c17] border border-white/5 hover:border-[#00D287]/40 p-4 flex flex-col justify-between transition-all hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <Badge variant="outline" className="text-[10px] bg-[#00D287]/10 text-[#00D287] border-[#00D287]/20">
                    {p.condition}
                  </Badge>
                  <span className="text-[11px] font-semibold text-slate-400">{p.brand}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#00D287] transition-colors">
                  {p.name}
                </h3>
                {p.highlight && (
                  <p className="text-[11px] text-[#00D287] font-medium mt-0.5">
                    {p.highlight}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-1.5 mt-3 text-[11px] text-slate-300">
                  <div className="bg-slate-950 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800">
                    <HardDrive className="w-3.5 h-3.5 text-[#00D287]" />
                    <span>{p.storage}</span>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-[#00D287]" />
                    <span>{p.ram || 'RAM N/A'}</span>
                  </div>
                  {p.battery && (
                    <div className="col-span-2 bg-slate-950 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800 truncate">
                      <Battery className="w-3.5 h-3.5 text-[#00D287] flex-shrink-0" />
                      <span className="truncate">{p.battery}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="text-[11px] text-slate-400">À vista:</div>
                <div className="text-xl font-black text-white tracking-tight">
                  R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                
                <div className="text-xs text-[#00D287] font-semibold mt-0.5">
                  ou até {p.installmentsCount}x de <span className="font-bold">R$ {p.installmentValue.toFixed(2)}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleWhatsAppContact(p)}
                    size="sm"
                    variant="outline"
                    className="bg-slate-900 border-slate-800 text-slate-200 hover:text-white text-xs h-8 px-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    WhatsApp
                  </Button>

                  <Button
                    onClick={onGoToAurusSimulator}
                    size="sm"
                    className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-2"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                    Simular
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Real Device Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#00D287]" />
              Cadastrar Aparelho no Supabase
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddDevice} className="space-y-3 mt-3 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Nome do Modelo:</label>
              <Input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Galaxy A54 5G 128GB"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Marca:</label>
                <select
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs outline-none"
                >
                  <option value="Samsung">Samsung</option>
                  <option value="Motorola">Motorola</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Apple">Apple</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Condição:</label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs outline-none"
                >
                  <option value="Novo Lacrado">Novo Lacrado</option>
                  <option value="Seminovo Premium">Seminovo Premium</option>
                  <option value="Recondicionado">Recondicionado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Armazenamento:</label>
                <Input
                  value={newStorage}
                  onChange={(e) => setNewStorage(e.target.value)}
                  placeholder="128GB"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Memória RAM:</label>
                <Input
                  value={newRam}
                  onChange={(e) => setNewRam(e.target.value)}
                  placeholder="6GB"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Bateria:</label>
                <Input
                  value={newBattery}
                  onChange={(e) => setNewBattery(e.target.value)}
                  placeholder="5000 mAh"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Preço À Vista (R$):</label>
              <Input
                type="number"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                placeholder="1499"
                className="bg-slate-950 border-[#00D287]/40 text-[#00D287] font-bold text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Destaque Promocional (Opcional):</label>
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Ex: Pronta Entrega + Película Grátis"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 rounded-xl"
              >
                Salvar no Supabase
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
