import React from 'react';
import { TabId } from '@/types/navigation';
import { UserAccount } from '@/services/leadAuthService';
import { 
  Flame, 
  Smartphone, 
  Cpu, 
  Repeat, 
  User, 
  ShoppingBag
} from 'lucide-react';

interface InstagramMobileBottomBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#060a16]/95 backdrop-blur-xl border-t border-white/10 h-14 px-2 flex items-center justify-around shadow-2xl select-none">
      {/* 1. Super Ofertas (Vitrine) */}
      <button
        onClick={() => onSelectTab('super-ofertas')}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer ${
          activeTab === 'super-ofertas' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Flame className={`w-5 h-5 ${activeTab === 'super-ofertas' ? 'fill-[#00D287]' : ''}`} />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Ofertas</span>
      </button>

      {/* 2. Venda no Boleto (Crediário) */}
      <button
        onClick={() => onSelectTab('venda-android')}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer ${
          activeTab === 'venda-android' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Smartphone className={`w-5 h-5 ${activeTab === 'venda-android' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Boleto</span>
      </button>

      {/* 3. Esquemas Elétricos */}
      <button
        onClick={() => onSelectTab('esquemas')}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer ${
          activeTab === 'esquemas' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Cpu className={`w-5 h-5 ${activeTab === 'esquemas' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Esquemas</span>
      </button>

      {/* 4. Trade-In (Simulador) */}
      <button
        onClick={() => onSelectTab('trade-in')}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer ${
          activeTab === 'trade-in' ? 'text-[#00D287]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Repeat className={`w-5 h-5 ${activeTab === 'trade-in' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Trade-In</span>
      </button>

      {/* 5. Perfil do Lojista (Estilo Instagram Avatar) */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 cursor-pointer text-slate-400 hover:text-white"
      >
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-[#00D287]">
          <div className="w-5 h-5 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[9px] font-black text-white uppercase border border-black">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              (currentUser?.tradeName || currentUser?.companyName || 'CH').substring(0, 1)
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Perfil</span>
      </button>
    </nav>
  );
};
