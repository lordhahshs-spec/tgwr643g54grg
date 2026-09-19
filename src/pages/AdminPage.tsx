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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modal Details & Create
  const [selectedAccountForModal, setSelectedAccountForModal] = useState<UserAccount | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Lead Form
  const [newCompany, setNewCompany] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [newCnpj, setNewCnpj] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setAccounts(leadAuthService.getAccounts());
  };

  const handleStatusChange = (id: string, newStatus: 'ativo' | 'analise' | 'bloqueado') => {
    leadAuthService.updateStatus(id, newStatus);
    loadAccounts();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      leadAuthService.deleteAccount(id);
      loadAccounts();
      if (selectedAccountForModal?.id === id) {
        setSelectedAccountForModal(null);
      }
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newOwner.trim() || !newEmail.trim()) return;

    leadAuthService.registerAccount({
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
    loadAccounts();
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
  const totalAnalise = accounts.filter((a) => a.status === 'analise').length;

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
                      MASTER
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Gestão Geral
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
            {/* Gestão de Usuários (Current Active Tab) */}
            <button
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm
              `}
            >
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              <Users className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <span className="truncate">Gestão de Usuários</span>
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
            title="Abrir Plataforma da Loja"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D287] flex-shrink-0" />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <span className="truncate">Plataforma da Loja</span>
            )}
          </button>

          <div className="px-2 py-1 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D287]" />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Painel Administrativo Ativo</span>}
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
              <Users className="w-4 h-4 text-[#00D287]" />
              Gestão de Usuários & Contas Criadas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-[#00D287]/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Lead / Usuário
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#050811]">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
              <div className="text-slate-400 text-xs font-semibold">Total de Contas</div>
              <div className="text-2xl font-black text-white mt-1">{accounts.length}</div>
              <div className="text-[10px] text-[#00D287] mt-0.5">Leads cadastrados</div>
            </div>

            <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
              <div className="text-slate-400 text-xs font-semibold">Contas Ativas</div>
              <div className="text-2xl font-black text-[#00D287] mt-1">{totalAtivos}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Acesso liberado</div>
            </div>

            <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
              <div className="text-slate-400 text-xs font-semibold">Em Análise</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{totalAnalise}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Aguardando validação</div>
            </div>

            <div className="bg-[#080c17] border border-white/5 rounded-2xl p-4">
              <div className="text-slate-400 text-xs font-semibold">Plataforma</div>
              <div className="text-2xl font-black text-white mt-1">100%</div>
              <div className="text-[10px] text-[#00D287] mt-0.5">Sincronizada</div>
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
                { id: 'analise', label: 'Em Análise' },
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

          {/* Accounts List Table / Cards */}
          <div className="bg-[#080c17] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lista de Usuários Cadastrados ({filteredAccounts.length})
              </h3>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum usuário encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3.5">Empresa / Loja</th>
                      <th className="p-3.5">Dono / Responsável</th>
                      <th className="p-3.5">CNPJ</th>
                      <th className="p-3.5">E-mail</th>
                      <th className="p-3.5">Cadastro</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAccounts.map((account) => {
                      const formattedDate = new Date(account.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });

                      return (
                        <tr key={account.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#00D287]/10 border border-[#00D287]/20 flex items-center justify-center text-[#00D287] font-black text-xs flex-shrink-0">
                                {account.companyName.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[180px]">{account.companyName}</span>
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

                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {formattedDate}
                          </td>

                          <td className="p-3.5">
                            {account.status === 'ativo' && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                                Ativo
                              </Badge>
                            )}
                            {account.status === 'analise' && (
                              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                Em Análise
                              </Badge>
                            )}
                            {account.status === 'bloqueado' && (
                              <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-semibold">
                                Bloqueado
                              </Badge>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setSelectedAccountForModal(account)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#00D287]" />
                              </button>

                              {/* Toggle Status */}
                              {account.status === 'ativo' ? (
                                <button
                                  onClick={() => handleStatusChange(account.id, 'bloqueado')}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Bloquear Acesso"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(account.id, 'ativo')}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 transition-colors"
                                  title="Ativar Acesso"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 transition-colors"
                                title="Excluir Conta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Account Details Modal */}
      <Dialog open={!!selectedAccountForModal} onOpenChange={(open) => !open && setSelectedAccountForModal(null)}>
        <DialogContent className="max-w-md bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          {selectedAccountForModal && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#00D287]" />
                  Detalhes da Conta
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Informações completas do lead registradas no cadastro.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3 bg-slate-950 p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nome da Empresa:</span>
                  <span className="font-bold text-white text-sm">{selectedAccountForModal.companyName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nome do Dono:</span>
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
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status Atual:</span>
                  <span className="capitalize font-bold text-emerald-400">{selectedAccountForModal.status}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Data de Inscrição:</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(selectedAccountForModal.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
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
              Cadastrar Novo Usuário / Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Adicione uma nova conta manualmente no sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Empresa:</label>
              <Input
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Ex: TopSmart Manutenção"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Dono:</label>
              <Input
                required
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Ex: Bruno Ferreira"
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Senha Provisória:</label>
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
                Cadastrar Usuário
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
