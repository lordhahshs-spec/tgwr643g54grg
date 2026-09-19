import React from 'react';
import { 
  Smartphone, 
  GraduationCap, 
  Cpu, 
  ShoppingBag, 
  Repeat, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { TabId, NAVIGATION_TABS } from '@/types/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const getIcon = (iconName: string, active: boolean) => {
    const className = `w-5 h-5 transition-transform duration-200 ${
      active ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-300'
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b1120]/95 backdrop-blur-xl border-r border-cyan-500/15 text-slate-200 transition-all duration-300 ease-in-out select-none
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-cyan-500/15 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-lg ring-1 ring-cyan-300/40">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0b1120]" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-sans">
                    SmartTech<span className="text-cyan-400">Hub</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-cyan-500/30 text-cyan-400 bg-cyan-950/40">
                    PRO
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  Gestão & Vendas de Celulares
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Status indicator */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 pt-3">
            <div className="bg-slate-900/90 border border-cyan-500/20 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">AurusSmart Online</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 rounded px-1.5 py-0.5">
                v2.4 Live
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            {(!isCollapsed || isMobileOpen) ? 'Módulos do Sistema' : '•••'}
          </div>

          {NAVIGATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            const buttonContent = (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full group relative flex items-center rounded-xl font-medium transition-all duration-200 outline-none text-left
                  ${isCollapsed && !isMobileOpen ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/40 text-white shadow-lg shadow-cyan-950/40' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/60 border border-transparent hover:border-slate-800'
                  }
                `}
              >
                {/* Active left indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full shadow-sm shadow-cyan-400" />
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                  {getIcon(tab.iconName, isActive)}
                </div>

                {/* Label and badge when expanded */}
                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-sm tracking-tight truncate ${isActive ? 'font-bold text-cyan-200' : 'font-medium'}`}>
                        {tab.label}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate group-hover:text-slate-300">
                        {tab.description}
                      </span>
                    </div>

                    {tab.badge && (
                      <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );

            if (isCollapsed && !isMobileOpen) {
              return (
                <Tooltip key={tab.id} delayDuration={100}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#0f172a] text-slate-100 border-cyan-500/30 px-3 py-2">
                    <div className="font-semibold text-cyan-300">{tab.label}</div>
                    <div className="text-xs text-slate-400">{tab.description}</div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </div>

        {/* Aurus Direct Launcher footer card */}
        {(!isCollapsed || isMobileOpen) ? (
          <div className="p-3 border-t border-cyan-500/15">
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-[#0d1527] border border-cyan-500/20 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Simulador Oficial Aurus
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Integração direta com o motor de simulação de financiamento e vendas Android.
              </p>
              <a
                href="https://aurussmart.com.br/#simulador"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors"
              >
                <span>Abrir Aurus no Navegador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-cyan-500/15 flex justify-center">
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <a
                  href="https://aurussmart.com.br/#simulador"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#0f172a] text-slate-100 border-cyan-500/30">
                Abrir AurusSmart.com.br em nova aba
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </>
  );
};
