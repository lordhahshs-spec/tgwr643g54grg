import React, { useState } from 'react';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { VendaAndroidTab } from '@/components/tabs/VendaAndroidTab';
import { CursosTab } from '@/components/tabs/CursosTab';
import { EsquemasTab } from '@/components/tabs/EsquemasTab';
import { CatalogoTab } from '@/components/tabs/CatalogoTab';
import { TradeInTab } from '@/components/tabs/TradeInTab';
import { CalculadoraLucroTab } from '@/components/tabs/CalculadoraLucroTab';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { Menu } from 'lucide-react';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('venda-android');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
        {/* Mobile Header (only on small screens so user can open sidebar) */}
        <div className="lg:hidden h-12 flex-shrink-0 bg-[#080c17] border-b border-white/5 px-4 flex items-center justify-between z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-white">
            {currentTabConfig.label}
          </span>

          <div className="w-6" />
        </div>

        {/* Desktop Header for secondary tabs (hidden for Venda de Android so it takes 100% full screen) */}
        {activeTab !== 'venda-android' && (
          <header className="hidden lg:flex h-12 flex-shrink-0 bg-[#080c17]/90 border-b border-white/5 px-6 items-center justify-between backdrop-blur-md z-20">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D287]" />
              {currentTabConfig.label}
            </h1>
          </header>
        )}

        {/* Tab Content Display Area */}
        <main className="flex-1 h-full overflow-hidden relative">
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
