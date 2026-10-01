import React from 'react';
import { TabId } from '@/types/navigation';
import { UserAccount } from '@/services/leadAuthService';
import {
  Flame,
  Smartphone,
  ShoppingBag,
  Cpu,
  Repeat
} from 'lucide-react';

interface InstagramMobileBottomBarProps {
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
  currentUser: UserAccount | null;
  onOpenProfile: () => void;
}

export const InstagramMobileBottomBar: React.FC<InstagramMobileBottomBarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenProfile,
}) => {
  const avatarUrl = currentUser?.avatarUrl;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060a16] border-t border-white/10 h-13 px-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.7)] select-none touch-manipulation m-0">
      {/* 1. Venda no Boleto (Crediário Próprio) */}
      <button
        type="button"
        onClick={() => onSelectTab('venda-android')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'venda-android' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Smartphone className={`w-5 h-5 transition-transform ${activeTab === 'venda-android' ? 'stroke-[2.5] scale-105 text-[#00D287]' : 'opacity-75'}`} />
        <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${activeTab === 'venda-android' ? 'text-[#00D287]' : 'text-slate-400'}`}>
          Boleto
        </span>
      </button>

      {/* 2. CellHub Shop (Loja Oficial CellHub) */}
      <button
        type="button"
        onClick={() => onSelectTab('cell-shop')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer relative ${
          activeTab === 'cell-shop' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <ShoppingBag className={`w-5 h-5 transition-transform ${activeTab === 'cell-shop' ? 'stroke-[2.5] scale-105 text-[#00D287]' : 'opacity-75'}`} />
        <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${activeTab === 'cell-shop' ? 'text-[#00D287]' : 'text-slate-400'}`}>
          Cell Shop
        </span>
        <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#00D287] animate-pulse" />
      </button>

      {/* 3. Super Ofertas (Marketplace B2B entre Lojistas) */}
      <button
        type="button"
        onClick={() => onSelectTab('super-ofertas')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'super-ofertas' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Flame className={`w-5 h-5 transition-transform ${activeTab === 'super-ofertas' ? 'fill-[#00D287] scale-105' : 'opacity-75'}`} />
        <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${activeTab === 'super-ofertas' ? 'text-[#00D287]' : 'text-slate-400'}`}>
          Ofertas B2B
        </span>
      </button>

      {/* 4. Esquemas Elétricos */}
      <button
        type="button"
        onClick={() => onSelectTab('esquemas')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'esquemas' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Cpu className={`w-5 h-5 transition-transform ${activeTab === 'esquemas' ? 'stroke-[2.5] scale-105 text-[#00D287]' : 'opacity-75'}`} />
        <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${activeTab === 'esquemas' ? 'text-[#00D287]' : 'text-slate-400'}`}>
          Esquemas
        </span>
      </button>

      {/* 5. Avaliação de Aparelho */}
      <button
        type="button"
        onClick={() => onSelectTab('trade-in')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'trade-in' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Repeat className={`w-5 h-5 transition-transform ${activeTab === 'trade-in' ? 'stroke-[2.5] scale-105 text-[#00D287]' : 'opacity-75'}`} />
        <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${activeTab === 'trade-in' ? 'text-[#00D287]' : 'text-slate-400'}`}>
          Avaliação
        </span>
      </button>

      {/* 6. Perfil do Lojista */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 cursor-pointer text-slate-400 hover:text-white"
      >
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287]">
          <div className="w-[18px] h-[18px] rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[8.5px] font-black text-white uppercase border border-black">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              (currentUser?.tradeName || currentUser?.companyName || 'CH').substring(0, 1)
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-tight text-slate-400">
          Perfil
        </span>
      </button>
    </nav>
  );
};
