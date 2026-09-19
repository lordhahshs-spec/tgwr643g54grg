import React, { useState } from 'react';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { VendaAndroidTab } from '@/components/tabs/VendaAndroidTab';
import { CursosTab } from '@/components/tabs/CursosTab';
import { EsquemasTab } from '@/components/tabs/EsquemasTab';
import { CatalogoTab } from '@/components/tabs/CatalogoTab';
import { TradeInTab } from '@/components/tabs/TradeInTab';
import { CalculadoraLucroTab } from '@/components/tabs/CalculadoraLucroTab';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { Menu, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('venda-android');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const currentTabConfig = NAVIGATION_TABS.find((t) => t.id === activeTab) || NAVIGATION_TABS[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 antialiased">
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
          ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
        `}
      >
        {/* Top Navbar Header (Visible especially on mobile and compact screens) */}
        <header className="h-14 flex-shrink-0 bg-[#0b1120]/90 border-b border-cyan-500/15 px-4 flex items-center justify-between backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Abrir Menu de Navegação"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active Tab Info */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">Módulo:</span>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {currentTabConfig.label}
              </span>
              {currentTabConfig.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentTabConfig.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {currentTabConfig.badge}
                </span>
              )}
            </div>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center gap-2.5">
            {activeTab !== 'venda-android' && (
              <Button
                onClick={() => setActiveTab('venda-android')}
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-cyan-500/20"
              >
                <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                <span>Simulador Aurus</span>
              </Button>
            )}

            <a
              href="https://aurussmart.com.br/#simulador"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-cyan-500/30 transition-colors"
              title="Abrir aurussmart.com.br em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Tab Content Display Area */}
        <main className="flex-1 h-[calc(100vh-3.5rem)] overflow-hidden relative">
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
