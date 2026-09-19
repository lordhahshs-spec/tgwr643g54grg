import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  MessageCircle,
  Zap,
  Battery,
  HardDrive,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TabId } from '@/types/navigation';

interface Product {
  id: string;
  name: string;
  brand: 'Samsung' | 'Motorola' | 'Xiaomi' | 'Apple';
  condition: 'Novo Lacrado' | 'Seminovo Premium';
  storage: string;
  ram: string;
  battery: string;
  price: number;
  installmentsCount: number;
  installmentValue: number;
  highlight: string;
  color: string;
  inStock: boolean;
}

const PRODUCTS_DATA: Product[] = [
  {
    id: 'p1',
    name: 'Samsung Galaxy S24 Ultra 5G',
    brand: 'Samsung',
    condition: 'Novo Lacrado',
    storage: '512GB',
    ram: '12GB',
    battery: '5000 mAh',
    price: 6799,
    installmentsCount: 24,
    installmentValue: 349.90,
    highlight: 'Galaxy AI + Câmera 200MP',
    color: 'Titânio Cinza',
    inStock: true,
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy A55 5G',
    brand: 'Samsung',
    condition: 'Novo Lacrado',
    storage: '256GB',
    ram: '8GB',
    battery: '5000 mAh',
    price: 1999,
    installmentsCount: 18,
    installmentValue: 139.90,
    highlight: 'Campeão de Vendas com Super AMOLED',
    color: 'Azul Escuro',
    inStock: true,
  },
  {
    id: 'p3',
    name: 'Motorola Edge 50 Pro 5G',
    brand: 'Motorola',
    condition: 'Novo Lacrado',
    storage: '256GB',
    ram: '12GB',
    battery: '4500 mAh (Turbo 125W)',
    price: 2999,
    installmentsCount: 24,
    installmentValue: 169.90,
    highlight: 'Carga de 0 a 100% em 18 minutos',
    color: 'Black Beauty (Couro)',
    inStock: true,
  },
  {
    id: 'p4',
    name: 'Moto G84 5G',
    brand: 'Motorola',
    condition: 'Novo Lacrado',
    storage: '256GB',
    ram: '8GB',
    battery: '5000 mAh',
    price: 1399,
    installmentsCount: 12,
    installmentValue: 132.50,
    highlight: 'Melhor Custo-Benefício 5G',
    color: 'Viva Magenta',
    inStock: true,
  },
  {
    id: 'p5',
    name: 'Xiaomi Redmi Note 13 Pro 5G',
    brand: 'Xiaomi',
    condition: 'Novo Lacrado',
    storage: '256GB',
    ram: '8GB',
    battery: '5100 mAh (67W Turbo)',
    price: 1899,
    installmentsCount: 18,
    installmentValue: 134.90,
    highlight: 'Câmera 200MP OIS + Display 1.5K',
    color: 'Midnight Black',
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Xiaomi Poco X6 Pro 5G',
    brand: 'Xiaomi',
    condition: 'Novo Lacrado',
    storage: '512GB',
    ram: '12GB',
    battery: '5000 mAh',
    price: 2499,
    installmentsCount: 24,
    installmentValue: 145.00,
    highlight: 'Performance Gamer Dimensity 8300 Ultra',
    color: 'Poco Yellow',
    inStock: true,
  },
  {
    id: 'p7',
    name: 'Apple iPhone 15',
    brand: 'Apple',
    condition: 'Novo Lacrado',
    storage: '128GB',
    ram: '6GB',
    battery: '3349 mAh',
    price: 4999,
    installmentsCount: 24,
    installmentValue: 269.90,
    highlight: 'Dynamic Island + Câmera 48MP',
    color: 'Preto',
    inStock: true,
  },
  {
    id: 'p8',
    name: 'Apple iPhone 13 (Seminovo)',
    brand: 'Apple',
    condition: 'Seminovo Premium',
    storage: '128GB',
    ram: '4GB',
    battery: 'Saúde 92%',
    price: 2890,
    installmentsCount: 18,
    installmentValue: 195.00,
    highlight: 'Grade A+ Impecável com 6 meses de garantia',
    color: 'Estelar',
    inStock: true,
  },
];

interface CatalogoTabProps {
  onGoToAurusSimulator: () => void;
}

export const CatalogoTab: React.FC<CatalogoTabProps> = ({ onGoToAurusSimulator }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('todos');

  const filteredProducts = PRODUCTS_DATA.filter((p) => {
    const matchesBrand = selectedBrand === 'Todas' || p.brand === selectedBrand;
    const matchesCondition = conditionFilter === 'todos' || 
      (conditionFilter === 'novos' && p.condition === 'Novo Lacrado') ||
      (conditionFilter === 'seminovos' && p.condition === 'Seminovo Premium');
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.highlight.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesCondition && matchesSearch;
  });

  const handleWhatsAppContact = (product: Product) => {
    const text = `Olá! Tenho interesse no smartphone ${product.name} (${product.storage}) por R$ ${product.price.toLocaleString('pt-BR')} anunciado no SmartTech Hub. Gostaria de simular as parcelas!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with Quick Simulator Hook */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1628] via-[#09152a] to-[#0d1628] border border-cyan-500/25 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              Estoque Pronta Entrega
            </Badge>
            <span className="text-xs text-slate-400">Garantia Nacional & Parcelamento Facilitado</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Catálogo de Aparelhos <span className="text-cyan-400">& Venda Rápida</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Apresente as opções ideais para o seu cliente com especificações completas e cálculo prévio de parcelas no crediário ou cartão.
          </p>
        </div>

        <Button
          onClick={onGoToAurusSimulator}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-500/20"
        >
          <Zap className="w-4 h-4 mr-1.5 fill-current" />
          Simular no AurusSmart
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        {/* Brand Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {['Todas', 'Samsung', 'Motorola', 'Xiaomi', 'Apple'].map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBrand === brand
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/80'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Condition & Search */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setConditionFilter('todos')}
              className={`px-2 py-1 rounded text-xs ${conditionFilter === 'todos' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setConditionFilter('novos')}
              className={`px-2 py-1 rounded text-xs ${conditionFilter === 'novos' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
            >
              Novos
            </button>
            <button
              onClick={() => setConditionFilter('seminovos')}
              className={`px-2 py-1 rounded text-xs ${conditionFilter === 'seminovos' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
            >
              Seminovos
            </button>
          </div>

          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aparelho..."
              className="pl-8 h-8 text-xs bg-slate-950 border-slate-700 text-slate-100 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="group rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#090f1d] border border-slate-800 hover:border-cyan-500/50 p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30"
          >
            <div>
              {/* Status and brand badge */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <Badge variant="outline" className={`text-[10px] ${p.condition === 'Novo Lacrado' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-purple-950/60 text-purple-300 border-purple-500/40'}`}>
                  {p.condition}
                </Badge>
                <span className="text-[11px] font-semibold text-slate-400">{p.brand}</span>
              </div>

              {/* Product Name */}
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {p.name}
              </h3>
              <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                {p.highlight}
              </p>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 text-[11px] text-slate-300">
                <div className="bg-slate-900/90 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{p.storage}</span>
                </div>
                <div className="bg-slate-900/90 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{p.ram}</span>
                </div>
                <div className="col-span-2 bg-slate-900/90 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-800 truncate">
                  <Battery className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">{p.battery}</span>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">À vista com desconto:</div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                R$ {p.price.toLocaleString('pt-BR')}
              </div>
              
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                ou até {p.installmentsCount}x de <span className="font-bold">R$ {p.installmentValue.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleWhatsAppContact(p)}
                  size="sm"
                  variant="outline"
                  className="bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-emerald-500 text-xs h-8 px-2"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  WhatsApp
                </Button>

                <Button
                  onClick={onGoToAurusSimulator}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-8 px-2"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                  Simular
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
