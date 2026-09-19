import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Ban, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Zap, 
  ArrowLeft, 
  Building2, 
  Eye,
  AlertTriangle,
  ShoppingBag,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { catalogService, CatalogDevice } from '@/services/catalogService';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<'users' | 'catalog'>('users');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [devices, setDevices] = useState<CatalogDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modal Details & Create
  const [selectedAccountForModal, setSelectedAccountForModal] = useState<UserAccount | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Ban Confirmation Modal
  const [accountToBan, setAccountToBan] = useState<UserAccount | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<string>('Violação dos termos de conformidade e irregularidade cadastral.');

  // New Lead Form
  const [newCompany, setNewCompany] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [newCnpj, setNewCnpj] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const accs = await leadAuthService.getAccounts();
    setAccounts(accs);
    const devs = await catalogService.getDevices();
    setDevices(devs);
    setLoading(false);
  };

  const handleOpenBanModal = (account: UserAccount) => {
    setAccountToBan(account);
    setBanReasonInput('Irregularidade cadastral ou descumprimento das diretrizes da AurusPay.');
  };

  const handleConfirmBan = async () => {
    if (!accountToBan) return;
    await leadAuthService.updateStatus(accountToBan.id, 'bloqueado', banReasonInput);
    setAccountToBan(null);
    await loadAllData();
  };

  const handleUnban = async (id: string) => {
    await leadAuthService.updateStatus(id, 'ativo');
    await loadAllData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta permanentemente do Supabase?')) {
      await leadAuthService.deleteAccount(id);
      await loadAllData();
      if (selectedAccountForModal?.id === id) {
        setSelectedAccountForModal(null);
      }
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (confirm('Deseja excluir este aparelho do estoque?')) {
      await catalogService.deleteDevice(id);
      await loadAllData();
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newOwner.trim() || !newEmail.trim()) return;

    await leadAuthService.registerAccount({
      companyName: newCompany,
      ownerName: newOwner,
      cnpj: newCnpj || '00.000.000/0001-00',
      email: newEmail,
      password: newPassword || '123456',
    });

    setNewCompany('');
    setNewOwner('');
    setNewCnpj('');
    setNewEmail('');
    setNewPassword('');
    setIsCreateModalOpen(false);
    await loadAllData();
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesStatus = selectedStatusFilter === 'todos' || acc.status === selectedStatusFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      acc.companyName.toLowerCase().includes(query) ||
      acc.ownerName.toLowerCase().includes(query) ||
      acc.cnpj.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const totalAtivos = accounts.filter((a) => a.status === 'ativo').length;
  const totalBloqueados = accounts.filter((a) => a.status === 'bloqueado').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050811] text-slate-100 antialiased">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Admin Lateral Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-[#080c17] border-r border-[#00D287]/15 text-slate-200 transition-all duration-300 ease-in-out select-none overflow-hidden
          ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
        `}
      >
        <div>
          {/* Header */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#00D287] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#00D287]/20">
                <Zap className="w-5 h-5 fill-current text-slate-950" />
              </div>

              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white leading-tight">
                      Aurus<span className="text-[#00D287]">Admin</span>
                    </span>
                    <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-[9px] px-1 py-0">
                      SUPABASE
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Gestão em Tempo Real
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 hover:bg-[#00D287]/15 text-slate-400 hover:text-[#00D287] border border-white/5 transition-colors"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="p-3 space-y-1">
            {/* Gestão de Usuários */}
            <button
              onClick={() => setAdminTab('users')}
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${adminTab === 'users'
                  ? 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              {adminTab === 'users' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              )}
              <Users className="w-4 h-4 flex-shrink-0" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <span className="truncate">Gestão de Usuários</span>
              )}
            </button>

            {/* Catálogo de Aparelhos (Admin view) */}
            <button
              onClick={() => setAdminTab('catalog')}
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${adminTab === 'catalog'
                  ? 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              {adminTab === 'catalog' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              )}
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <span className="truncate">Estoque de Aparelhos ({devices.length})</span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <button
            onClick={() => navigate('/app')}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors
              ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'}
            `}
            title="Ir para a Plataforma da Loja"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D287] flex-shrink-0" />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <span className="truncate">Plataforma da Loja</span>
            )}
          </button>

          <div className="px-2 py-1 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Supabase Conectado</span>}
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div 
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        {/* Top Header */}
        <header className="h-14 flex-shrink-0 bg-[#080c17]/90 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              {adminTab === 'users' ? (
                <>
                  <Users className="w-4 h-4 text-[#00D287]" />
                  <span>Gestão de Contas Reais (Supabase)</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#00D287]" />
                  <span>Estoque Real de Celulares</span>
                </>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={loadAllData}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-white/10 text-slate-300 hover:text-white text-xs h-8 px-2.5 rounded-lg"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00D287]' : ''}`} />
            </Button>

            {adminTab === 'users' ? (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-[#00D287]/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Cadastrar Lead
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/app')}
                size="sm"
                className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm"
              >
                Ver na Plataforma
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#050811]">
          {adminTab === 'users' ? (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
                  <div className="text-slate-400 text-xs font-semibold">Total de Contas</div>
                  <div className="text-2xl font-black text-white mt-1">{accounts.length}</div>
                  <div className="text-[10px] text-[#00D287] mt-0.5">Gravadas no Supabase</div>
                </div>

                <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
                  <div className="text-slate-400 text-xs font-semibold">Contas Ativas</div>
                  <div className="text-2xl font-black text-[#00D287] mt-1">{totalAtivos}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Acesso Liberado</div>
                </div>

                <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
                  <div className="text-slate-400 text-xs font-semibold">Contas Bloqueadas</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{totalBloqueados}</div>
                  <div className="text-[10px] text-rose-400/80 mt-0.5">Tela travada no cliente</div>
                </div>

                <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
                  <div className="text-slate-400 text-xs font-semibold">Sistema de Banimento</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">ONLINE</div>
                  <div className="text-[10px] text-[#00D287] mt-0.5">Trava instantânea ativa</div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080c17] border border-white/5 rounded-xl p-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por Empresa, Dono, CNPJ ou E-mail..."
                    className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-lg focus:border-[#00D287]"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'ativo', label: 'Ativos' },
                    { id: 'bloqueado', label: 'Bloqueados' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedStatusFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedStatusFilter === filter.id
                          ? 'bg-[#00D287] text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white bg-slate-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accounts List Table */}
              <div className="bg-[#080c17] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Contas Cadastradas no Banco ({filteredAccounts.length})
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Carregando contas do Supabase...
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Nenhuma conta cadastrada no momento.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="p-3.5">Empresa / Loja</th>
                          <th className="p-3.5">Dono</th>
                          <th className="p-3.5">CNPJ</th>
                          <th className="p-3.5">E-mail</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Ações de Controle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredAccounts.map((account) => (
                          <tr key={account.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3.5 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                  account.status === 'bloqueado'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/25'
                                }`}>
                                  {account.companyName.charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[170px]">
                                  <div className="truncate">{account.companyName}</div>
                                  {account.banReason && (
                                    <div className="text-[10px] text-rose-400 truncate">
                                      Motivo: {account.banReason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-slate-200">
                              {account.ownerName}
                            </td>

                            <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                              {account.cnpj}
                            </td>

                            <td className="p-3.5 text-slate-300">
                              {account.email}
                            </td>

                            <td className="p-3.5">
                              {account.status === 'ativo' && (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                                  Ativo
                                </Badge>
                              )}
                              {account.status === 'bloqueado' && (
                                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[10px] font-bold">
                                  Bloqueado (Banido)
                                </Badge>
                              )}
                              {account.status === 'analise' && (
                                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                  Em Análise
                                </Badge>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Details */}
                                <button
                                  onClick={() => setSelectedAccountForModal(account)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                  title="Ver Dados Cadastrais"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#00D287]" />
                                </button>

                                {/* Ban / Unban Toggle with Real Lockout */}
                                {account.status === 'bloqueado' ? (
                                  <button
                                    onClick={() => handleUnban(account.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-[11px] font-bold transition-colors flex items-center gap-1"
                                    title="Desbloquear e liberar acesso"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Desbanir
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenBanModal(account)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 hover:bg-rose-900 text-[11px] font-bold transition-colors flex items-center gap-1"
                                    title="Banir conta e travar tela do usuário"
                                  >
                                    <Ban className="w-3 h-3 text-rose-400" />
                                    Banir / Travar
                                  </button>
                                )}

                                {/* Delete Account */}
                                <button
                                  onClick={() => handleDelete(account.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 transition-colors"
                                  title="Excluir Definitivamente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Catalog Devices Management Subtab */
            <div className="space-y-4">
              <div className="bg-[#080c17] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Estoque Cadastrado no Supabase</h3>
                  <p className="text-xs text-slate-400">Total de {devices.length} aparelhos reais disponíveis para venda.</p>
                </div>
                <Button
                  onClick={() => navigate('/app')}
                  className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Cadastrar Mais Aparelhos
                </Button>
              </div>

              {devices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-[#080c17] rounded-2xl border border-white/5">
                  Nenhum aparelho cadastrado no estoque ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {devices.map((d) => (
                    <div key={d.id} className="bg-[#080c17] border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{d.name}</div>
                        <div className="text-slate-400">{d.brand} • {d.storage}</div>
                        <div className="text-[#00D287] font-bold mt-1">R$ {d.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteDevice(d.id)}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400"
                        title="Remover do estoque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Ban Confirmation Modal */}
      <Dialog open={!!accountToBan} onOpenChange={(open) => !open && setAccountToBan(null)}>
        <DialogContent className="max-w-md bg-[#080c17] border border-rose-500/40 text-slate-100 rounded-2xl p-6">
          {accountToBan && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Confirmar Bloqueio / Banimento
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 pt-1 leading-relaxed">
                  A tela do usuário <strong>{accountToBan.ownerName}</strong> ({accountToBan.companyName}) será <strong>imediatamente congelada e travada</strong> com a mensagem que você definir abaixo.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Motivo exibido para o usuário na tela de bloqueio:
                  </label>
                  <textarea
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none"
                    placeholder="Digite o motivo do bloqueio..."
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={handleConfirmBan}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-xl"
                  >
                    Confirmar e Travar Acesso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAccountToBan(null)}
                    className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-10 rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account Details Modal */}
      <Dialog open={!!selectedAccountForModal} onOpenChange={(open) => !open && setSelectedAccountForModal(null)}>
        <DialogContent className="max-w-md bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          {selectedAccountForModal && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00D287]" />
                  Dados do Lead (Supabase)
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-3 bg-slate-950 p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Empresa:</span>
                  <span className="font-bold text-white text-sm">{selectedAccountForModal.companyName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Dono:</span>
                  <span className="text-slate-200">{selectedAccountForModal.ownerName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">CNPJ:</span>
                  <span className="text-[#00D287] font-mono">{selectedAccountForModal.cnpj}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">E-mail:</span>
                  <span className="text-slate-200">{selectedAccountForModal.email}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status:</span>
                  <span className={`font-bold capitalize ${selectedAccountForModal.status === 'bloqueado' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedAccountForModal.status}
                  </span>
                </div>

                {selectedAccountForModal.banReason && (
                  <div>
                    <span className="text-rose-400 block text-[10px] uppercase font-semibold">Motivo da Suspensão:</span>
                    <span className="text-rose-200">{selectedAccountForModal.banReason}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    leadAuthService.setCurrentUser(selectedAccountForModal);
                    navigate('/app');
                  }}
                  className="flex-1 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 rounded-xl"
                >
                  Entrar como Este Usuário
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAccountForModal(null)}
                  className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-9 rounded-xl"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00D287]" />
              Cadastrar Lead no Supabase
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Empresa:</label>
              <Input
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Ex: Alfa Cell Telecom"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Dono:</label>
              <Input
                required
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Ex: Marcos Souza"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">CNPJ:</label>
              <Input
                value={newCnpj}
                onChange={(e) => setNewCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail:</label>
              <Input
                required
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Senha de Acesso:</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="123456"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 rounded-xl"
              >
                Salvar no Supabase
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
