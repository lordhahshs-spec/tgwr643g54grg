import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { VendaAndroidTab } from '@/components/tabs/VendaAndroidTab';
import { EsquemasTab } from '@/components/tabs/EsquemasTab';
import { TradeInTab } from '@/components/tabs/TradeInTab';
import { SuperOfertasTab } from '@/components/tabs/SuperOfertasTab';
import { BannedScreen } from '@/components/BannedScreen';
import { UnlockPlatformModal } from '@/components/demo/UnlockPlatformModal';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { InstagramMobileBottomBar } from '@/components/mobile/InstagramMobileBottomBar';
import { MobileAppInstallBanner } from '@/components/mobile/MobileAppInstallBanner';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { Menu, Sparkles, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let channel: any = null;

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

      // Conexão WebSocket em tempo real para detectar banimento/desbanimento instantâneo
      if (user.id) {
        channel = supabase
          .channel(`user-account-realtime-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_accounts',
              filter: `id=eq.${user.id}`,
            },
            (payload: any) => {
              const newRecord = payload.new;
              if (newRecord.status === 'bloqueado') {
                setIsBanned(true);
                setCurrentUser((prev) =>
                  prev ? { ...prev, status: 'bloqueado', banReason: newRecord.ban_reason } : null
                );
                toast.error(
                  `Seu acesso foi suspenso pela administração. Motivo: ${newRecord.ban_reason || 'Irregularidade cadastral'}`,
                  { duration: 8000 }
                );
              } else if (newRecord.status === 'ativo') {
                setIsBanned(false);
                setCurrentUser((prev) =>
                  prev ? { ...prev, status: 'ativo', banReason: undefined, planStatus: newRecord.plan_status } : null
                );
                toast.success('Seu acesso à plataforma CellHub foi restabelecido com sucesso!');
              }
            }
          )
          .subscribe();
      }
    };

    initUser();

    // Sincronização de usuário
    const handleUserUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('cellhub_user_updated', handleUserUpdate);

    // Verificação periódica de contingência em 2 segundos
    const interval = setInterval(async () => {
      const user = leadAuthService.getCurrentUser();
      if (user?.id) {
        const { status, banReason, planStatus } = await leadAuthService.checkUserStatus(user.id);
        if (status === 'bloqueado') {
          setIsBanned(true);
          setCurrentUser((prev) => (prev ? { ...prev, status: 'bloqueado', banReason } : null));
        } else {
          setIsBanned(false);
          if (planStatus && currentUser?.planStatus !== planStatus) {
            setCurrentUser((prev) => (prev ? { ...prev, planStatus } : null));
          }
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cellhub_user_updated', handleUserUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
    <div className="flex h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-[#050811] text-slate-100 antialiased touch-manipulation">
      {/* Lateral Navigation Sidebar */}
      <SidebarNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onUnlockModal={() => handleOpenUnlockModal()}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden transition-all duration-300 ease-in-out pt-[env(safe-area-inset-top,0px)] lg:pt-0
          ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        {/* Top Demo Mode Ribbon */}
        {isDemo && (
          <div className="h-9 bg-gradient-to-r from-emerald-950/90 via-[#0a1424] to-slate-950 border-b border-[#00D287]/30 px-3 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D287] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D287]" />
              </span>
              <span className="font-extrabold text-[#00D287] uppercase tracking-wider text-[10px] sm:text-[11px]">
                Modo Demonstração
              </span>
              <span className="hidden md:inline text-slate-400 text-xs">
                • Você está navegando na versão de degustação da plataforma.
              </span>
            </div>

            <button
              onClick={() => handleOpenUnlockModal('Desbloqueie o acesso vitalício à plataforma CellHub')}
              className="px-2.5 py-1 rounded-lg bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-sm shadow-[#00D287]/20 transition-all cursor-pointer transform active:scale-95"
            >
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Desbloquear Acesso</span>
            </button>
          </div>
        )}

        {/* Desktop Header for secondary tabs */}
        {activeTab !== 'venda-android' && activeTab !== 'super-ofertas' && (
          <header className="hidden lg:flex h-12 flex-shrink-0 bg-[#080c17]/90 border-b border-white/5 px-6 items-center justify-between backdrop-blur-md z-10">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D287]" />
              {currentTabConfig.label}
            </h1>

            {currentUser && (
              <div
                onClick={() => setIsProfileModalOpen(true)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Ver/Editar perfil"
              >
                <span>Loja: <strong className="text-white">{currentUser.tradeName || currentUser.companyName}</strong></span>
              </div>
            )}
          </header>
        )}

        {/* Tab Content Display Area com rolagem touch fluida (iOS & Android) */}
        <main className="flex-1 h-full min-h-0 overflow-hidden relative flex flex-col pb-[calc(50px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <div className={activeTab === 'super-ofertas' ? 'w-full h-full min-h-0 flex-1 flex flex-col overflow-y-auto touch-scroll-area' : 'hidden'}>
            <SuperOfertasTab isDemo={isDemo} onUnlock={handleOpenUnlockModal} />
          </div>
          <div className={activeTab === 'venda-android' ? 'w-full h-full min-h-0 flex-1 flex flex-col overflow-y-auto touch-scroll-area' : 'hidden'}>
            <VendaAndroidTab isDemo={isDemo} onUnlock={() => handleOpenUnlockModal('Venda no Boleto (Crediário Próprio) Bloqueada')} />
          </div>
          <div className={activeTab === 'esquemas' ? 'w-full h-full min-h-0 flex-1 flex flex-col overflow-y-auto touch-scroll-area' : 'hidden'}>
            <EsquemasTab isDemo={isDemo} onUnlock={handleOpenUnlockModal} />
          </div>
          <div className={activeTab === 'trade-in' ? 'w-full h-full min-h-0 flex-1 flex flex-col overflow-y-auto touch-scroll-area' : 'hidden'}>
            <TradeInTab onGoToAurusSimulator={() => setActiveTab('venda-android')} />
          </div>
        </main>
      </div>

      {/* Instagram-Style Mobile Bottom Navigation */}
      <InstagramMobileBottomBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Banner Flutuante de Instalação Mobile (Android & iOS) */}
      <MobileAppInstallBanner />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
        onUnlockModal={() => handleOpenUnlockModal('Desbloqueie o acesso vitalício à plataforma CellHub')}
      />

      {/* Checkout & Lifetime Unlock Modal */}
      <UnlockPlatformModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        currentUser={currentUser}
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
