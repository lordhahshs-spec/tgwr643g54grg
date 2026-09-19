import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  GraduationCap, 
  Cpu, 
  ShoppingBag, 
  Repeat, 
  Calculator, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Layers,
  Shield,
  LogOut
} from 'lucide-react';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';

interface SidebarNavigationProps {
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    setCurrentUser(leadAuthService.getCurrentUser());
  }, []);

  const getIcon = (iconName: string, active: boolean) => {
    const className = `w-4 h-4 transition-colors ${
      active ? 'text-[#00D287]' : 'text-slate-400 group-hover:text-white'
    }`;

    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Repeat':
        return <Repeat className={className} />;
      case 'Calculator':
        return <Calculator className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  const handleTabClick = (tabId: TabId) => {
    onSelectTab(tabId);
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container - Minimalist, Fixed, No Scrollbars */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-[#080c17] border-r border-[#00D287]/15 text-slate-200 transition-all duration-300 ease-in-out select-none overflow-hidden
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#00D287] flex items-center justify-center shadow-md shadow-[#00D287]/25 text-slate-950 font-black">
                <Zap className="w-5 h-5 text-slate-950 fill-current" />
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-white leading-tight">
                    Aurus<span className="text-[#00D287]">Pay</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
                    {currentUser?.companyName || 'Portal de Vendas'}
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 hover:bg-[#00D287]/15 text-slate-400 hover:text-[#00D287] border border-white/5 transition-colors"
              title={isCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* User Profile Mini Badge (When expanded) */}
          {(!isCollapsed || isMobileOpen) && currentUser && (
            <div className="px-3 pt-3 pb-1">
              <div className="bg-slate-950/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#00D287]/15 text-[#00D287] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {currentUser.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate leading-tight">
                      {currentUser.ownerName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {currentUser.cnpj || 'CNPJ Verificado'}
                    </span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00D287]" title="Conectado" />
              </div>
            </div>
          )}

          {/* Navigation Tabs - Clean, Compact, Zero Scrollbars */}
          <nav className="p-3 space-y-1 overflow-hidden">
            {NAVIGATION_TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              const buttonElement = (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full group relative flex items-center rounded-xl text-xs font-medium transition-all duration-150 outline-none
                    ${isCollapsed && !isMobileOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                    ${isActive 
                      ? 'bg-[#00D287]/15 text-white font-semibold border border-[#00D287]/30 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
                  )}

                  <div className="flex-shrink-0">
                    {getIcon(tab.iconName, isActive)}
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate tracking-tight">
                      {tab.label}
                    </span>
                  )}
                </button>
              );

              if (isCollapsed && !isMobileOpen) {
                return (
                  <Tooltip key={tab.id} delayDuration={100}>
                    <TooltipTrigger asChild>
                      {buttonElement}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#0b101f] text-slate-100 border-[#00D287]/20 text-xs px-2.5 py-1.5 font-medium">
                      {tab.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonElement;
            })}
          </nav>
        </div>

        {/* Minimal Bottom Status & Admin Links */}
        <div className="p-3 border-t border-white/5 space-y-1">
          {(!isCollapsed || isMobileOpen) ? (
            <>
              {/* Admin Panel Direct Shortcut */}
              <a
                href="/admin"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-[#00D287] hover:bg-white/[0.04] text-[11px] transition-colors font-medium"
                title="Acessar Gestão de Usuários e Painel Geral"
              >
                <Shield className="w-3.5 h-3.5 text-[#00D287]" />
                <span className="truncate">Painel Administrativo</span>
              </a>

              {/* Trocar de Conta */}
              <a
                href="/login"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] text-[11px] transition-colors"
                title="Cadastrar outra loja ou alternar conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="truncate">Trocar de Conta</span>
              </a>

              <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
                <span className="truncate">Sistema Conectado</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <a
                    href="/admin"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#00D287] hover:bg-white/[0.04]"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#0b101f] text-slate-100 border-[#00D287]/20 text-xs">
                  Painel Admin
                </TooltipContent>
              </Tooltip>

              <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" title="Conectado" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
