import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { VendaAndroidTab } from '@/components/tabs/VendaAndroidTab';
import { CursosTab } from '@/components/tabs/CursosTab';
import { EsquemasTab } from '@/components/tabs/EsquemasTab';
import { CatalogoTab } from '@/components/tabs/CatalogoTab';
import { TradeInTab } from '@/components/tabs/TradeInTab';
import { CalculadoraLucroTab } from '@/components/tabs/CalculadoraLucroTab';
import { SuperOfertasTab } from '@/components/tabs/SuperOfertasTab';
import { BannedScreen } from '@/components/BannedScreen';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { Menu } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('super-ofertas');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isBanned, setIsBanned] = useState<boolean>(false);

  useEffect(() => {
    // Initial user check & auto-sync real UUID with Supabase
    const initUser = async () => {
      const user = await leadAuthService.syncCurrentUserWithDatabase() || leadAuthService.getCurrentUser();
      if (!user) {
        navigate('/login');
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
      if (user?.id) {
        const { status, banReason } = await leadAuthService.checkUserStatus(user.id);
        if (status === 'bloqueado') {
          setIsBanned(true);
          setCurrentUser((prev) => prev ? { ...prev, status: 'bloqueado', banReason } : null);
        } else {
          setIsBanned(false);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    leadAuthService.logout();
    navigate('/login');
  };

  // If user is banned, FREEZE and lock the entire screen with BannedScreen
  if (isBanned && currentUser) {
    return <BannedScreen user={currentUser} onLogout={handleLogout} />;
  }

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
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden h-12 flex-shrink-0 bg-[#080c17] border-b border-white/5 px-4 flex items-center justify-between z-30">
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
          <header className="hidden lg:flex h-12 flex-shrink-0 bg-[#080c17]/90 border-b border-white/5 px-6 items-center justify-between backdrop-blur-md z-20">
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
          {activeTab === 'super-ofertas' && <SuperOfertasTab />}
          {activeTab === 'venda-android' && <VendaAndroidTab />}
          {activeTab === 'cursos' && <CursosTab />}
          {activeTab === 'esquemas' && <EsquemasTab />}
          {activeTab === 'catalogo' && (
            <CatalogoTab onGoToAurusSimulator={() => setActiveTab('venda-android')} />
          )}
          {activeTab === 'trade-in' && (
            <TradeInTab onGoToAurusSimulator={() => setActiveTab('venda-android')} />
          )}
          {activeTab === 'calculadora-lucro' && <CalculadoraLucroTab />}
        </main>
      </div>
    </div>
  );
};

export default Index;
