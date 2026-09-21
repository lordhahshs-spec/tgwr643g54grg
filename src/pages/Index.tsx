import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { VendaAndroidTab } from '@/components/tabs/VendaAndroidTab';
import { EsquemasTab } from '@/components/tabs/EsquemasTab';
import { TradeInTab } from '@/components/tabs/TradeInTab';
import { SuperOfertasTab } from '@/components/tabs/SuperOfertasTab';
import { BannedScreen } from '@/components/BannedScreen';
import { UnlockPlatformModal } from '@/components/demo/UnlockPlatformModal';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { Menu, Sparkles, Lock } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('super-ofertas');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isBanned, setIsBanned] = useState<boolean>(false);

  // Demo Mode & Unlock Modal State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>('');

  useEffect(() => {
    // Initial user check & auto-sync real UUID with Supabase
    const initUser = async () => {
      const user = await leadAuthService.syncCurrentUserWithDatabase() || leadAuthService.getCurrentUser();
      if (!user) {
        // Visitante acessando a demonstração sem login prévio
        const guestDemoUser: UserAccount = {
          id: 'demo-guest-user',
          companyName: 'Lojista Visitante',
          ownerName: 'Modo Demonstração',
          cnpj: 'Acesso Degustação',
          email: '',
          role: 'lead',
          status: 'ativo',
          planStatus: 'demo',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(guestDemoUser);
        return;
      }
      setCurrentUser(user);
      if (user.status === 'bloqueado') {
        setIsBanned(true);
      }
    };

    initUser();

    // Real-time ban status check against Supabase
    const interval = setInterval(async () => {
      const user = leadAuthService.getCurrentUser();
      if (user?.id && user.id !== 'demo-guest-user') {
        const { status, banReason, planStatus } = await leadAuthService.checkUserStatus(user.id);
        if (status === 'bloqueado') {
          setIsBanned(true);
          setCurrentUser((prev) => prev ? { ...prev, status: 'bloqueado', banReason } : null);
        } else {
          setIsBanned(false);
          if (planStatus && currentUser?.planStatus !== planStatus) {
            setCurrentUser((prev) => prev ? { ...prev, planStatus } : null);
          }
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    leadAuthService.logout();
    navigate('/login');
  };

  const handleOpenUnlockModal = (reason?: string) => {
    setUnlockReason(reason || 'Desbloqueie o acesso vitalício à plataforma CellHub');
    setIsUnlockModalOpen(true);
  };

  // If user is banned, FREEZE and lock the entire screen with BannedScreen
  if (isBanned && currentUser) {
    return <BannedScreen user={currentUser} onLogout={handleLogout} />;
  }

  const isDemo = !currentUser || (currentUser.role !== 'admin' && currentUser.planStatus !== 'ativo');
  const currentTabConfig = NAVIGATION_TABS.find((t) => t.id === activeTab) || NAVIGATION_TABS[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050811] text-slate-100 antialiased">
      {/* Lateral Navigation Sidebar */}
      <SidebarNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onUnlockModal={() => handleOpenUnlockModal()}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        {/* Top Demo Mode Ribbon */}
        {isDemo && (
          <div className="h-10 bg-gradient-to-r from-emerald-950/80 via-[#0a1424] to-slate-950 border-b border-[#00D287]/30 px-3 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D287] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D287]" />
              </span>
              <span className="font-extrabold text-[#00D287] uppercase tracking-wider text-[11px]">
                Modo Demonstração
              </span>
              <span className="hidden md:inline text-slate-400 text-xs">
                • Você está navegando na versão de degustação da plataforma.
              </span>
            </div>

            <button
              onClick={() => handleOpenUnlockModal('Desbloqueie o acesso vitalício à plataforma CellHub')}
              className="px-3 py-1 rounded-lg bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm shadow-[#00D287]/20 transition-all cursor-pointer transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Desbloquear Acesso Vitalício</span>
            </button>
          </div>
        )}

        {/* Mobile Header */}
        <div className="lg:hidden h-12 flex-shrink-0 bg-[#080c17] border-b border-white/5 px-4 flex items-center justify-between z-20">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-white truncate max-w-[200px]">
            {currentTabConfig.label}
          </span>

          <div className="w-6" />
        </div>

        {/* Desktop Header for secondary tabs */}
        {activeTab !== 'venda-android' && activeTab !== 'super-ofertas' && (
          <header className="hidden lg:flex h-12 flex-shrink-0 bg-[#080c17]/90 border-b border-white/5 px-6 items-center justify-between backdrop-blur-md z-10">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D287]" />
              {currentTabConfig.label}
            </h1>

            {currentUser && (
              <div className="text-[11px] text-slate-400">
                Loja: <strong className="text-white">{currentUser.companyName}</strong> ({currentUser.ownerName})
              </div>
            )}
          </header>
        )}

        {/* Tab Content Display Area */}
        <main className="flex-1 h-full overflow-hidden relative">
          {activeTab === 'super-ofertas' && (
            <SuperOfertasTab isDemo={isDemo} onUnlock={handleOpenUnlockModal} />
          )}
          {activeTab === 'venda-android' && (
            <VendaAndroidTab isDemo={isDemo} onUnlock={() => handleOpenUnlockModal('Simulador de Vendas e Margem Android Bloqueado')} />
          )}
          {activeTab === 'esquemas' && (
            <EsquemasTab isDemo={isDemo} onUnlock={handleOpenUnlockModal} />
          )}
          {activeTab === 'trade-in' && (
            <TradeInTab onGoToAurusSimulator={() => setActiveTab('venda-android')} />
          )}
        </main>
      </div>

      {/* Checkout & Lifetime Unlock Modal */}
      <UnlockPlatformModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        currentUser={currentUser?.id === 'demo-guest-user' ? null : currentUser}
        initialReason={unlockReason}
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setIsUnlockModalOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
