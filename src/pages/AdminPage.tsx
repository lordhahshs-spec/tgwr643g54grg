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
  RotateCw, 
  Cpu, 
  FileText,
  Edit,
  Upload,
  X,
  Flame,
  KeyRound,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { leadAuthService, UserAccount } from '@/services/leadAuthService';
import { catalogService, CatalogDevice } from '@/services/catalogService';
import { schematicService, ElectricSchematic } from '@/services/schematicService';
import { MarketplaceAdminSection } from '@/components/admin/MarketplaceAdminSection';
import { WebhooksAdminSection } from '@/components/admin/WebhooksAdminSection';
import { CellHubLogo } from '@/components/CellHubLogo';
import { supabase } from '@/integrations/supabase/client';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<'users' | 'schematics' | 'catalog' | 'marketplace' | 'webhooks'>('users');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [devices, setDevices] = useState<CatalogDevice[]>([]);
  const [schematics, setSchematics] = useState<ElectricSchematic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Users Modals
  const [selectedAccountForModal, setSelectedAccountForModal] = useState<UserAccount | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [accountToBan, setAccountToBan] = useState<UserAccount | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<string>('Violação dos termos de conformidade e irregularidade cadastral.');

  // New Lead Form
  const [newCompany, setNewCompany] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [newCnpj, setNewCnpj] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  // Schematics Modals & Form
  const [isAddSchematicModalOpen, setIsAddSchematicModalOpen] = useState<boolean>(false);
  const [editingSchematic, setEditingSchematic] = useState<ElectricSchematic | null>(null);
  const [previewSchematic, setPreviewSchematic] = useState<ElectricSchematic | null>(null);

  const [schematicTitle, setSchematicTitle] = useState<string>('');
  const [schematicBrand, setSchematicBrand] = useState<string>('Samsung');
  const [schematicModel, setSchematicModel] = useState<string>('');
  const [schematicDescription, setSchematicDescription] = useState<string>('');
  const [schematicPdfData, setSchematicPdfData] = useState<string>('');
  const [schematicFileName, setSchematicFileName] = useState<string>('');
  const [schematicFileSize, setSchematicFileSize] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Master Admin state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState<boolean>(false);
  const [adminEditEmail, setAdminEditEmail] = useState<string>('');
  const [adminEditPassword, setAdminEditPassword] = useState<string>('');
  const [adminEditOwner, setAdminEditOwner] = useState<string>('');
  const [adminEditCompany, setAdminEditCompany] = useState<string>('');
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);

  // Master Admin check
  const MASTER_ADMIN_EMAIL = 'lordhahshs@gmail.com';
  const isMasterAdmin = (currentUser?.email || '').toLowerCase().trim() === MASTER_ADMIN_EMAIL;

  // Create Admin modal state (exclusivo para lordhahshs@gmail.com)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState<boolean>(false);

  // Edit User modal state (exclusivo para o Master Admin)
  const [accountToEdit, setAccountToEdit] = useState<UserAccount | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    companyName: '',
    tradeName: '',
    ownerName: '',
    cnpj: '',
    email: '',
    whatsapp: '',
    password: '',
    status: 'ativo' as 'ativo' | 'analise' | 'bloqueado',
    planStatus: 'ativo' as 'demo' | 'ativo',
    role: 'lead' as 'lead' | 'admin',
    banReason: '',
    shippingZipCode: '',
    shippingStreet: '',
    shippingNumber: '',
    shippingComplement: '',
    shippingNeighborhood: '',
    shippingCity: '',
    shippingState: '',
    shippingPhone: '',
  });
  const [isSavingEditUser, setIsSavingEditUser] = useState<boolean>(false);

  useEffect(() => {
    const current = leadAuthService.getCurrentUser();
    if (!current || current.role !== 'admin') {
      toast.error('Acesso restrito apenas ao Administrador Geral.');
      navigate('/app');
      return;
    }
    setCurrentUser(current);
    setAdminEditEmail(current.email);
    setAdminEditOwner(current.ownerName);
    setAdminEditCompany(current.companyName);
    loadAllData();

    // Inscrição em tempo real para sincronizar status de banimento e alterações de contas instantaneamente
    const realtimeChannel = supabase
      .channel('admin-realtime-accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_accounts',
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedAccountData = {
              status: payload.new.status,
              banReason: payload.new.ban_reason,
              planStatus: payload.new.plan_status,
              role: payload.new.role,
              companyName: payload.new.company_name,
              ownerName: payload.new.owner_name,
              email: payload.new.email,
              tradeName: payload.new.trade_name,
              cnpj: payload.new.cnpj,
              whatsapp: payload.new.whatsapp,
              shippingZipCode: payload.new.shipping_zip_code || undefined,
              shippingStreet: payload.new.shipping_street || undefined,
              shippingNumber: payload.new.shipping_number || undefined,
              shippingComplement: payload.new.shipping_complement || undefined,
              shippingNeighborhood: payload.new.shipping_neighborhood || undefined,
              shippingCity: payload.new.shipping_city || undefined,
              shippingState: payload.new.shipping_state || undefined,
              shippingPhone: payload.new.shipping_phone || undefined,
              salesCancellationCount: payload.new.sales_cancellation_count || 0,
            };

            setAccounts((prev) =>
              prev.map((acc) =>
                acc.id === payload.new.id
                  ? {
                      ...acc,
                      ...updatedAccountData,
                    }
                  : acc
              )
            );

            // Mantém o modal de detalhes sincronizado instantaneamente
            setSelectedAccountForModal((prev) =>
              prev && prev.id === payload.new.id
                ? {
                    ...prev,
                    ...updatedAccountData,
                  }
                : prev
            );
          } else if (payload.eventType === 'INSERT') {
            loadAllData();
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setAccounts((prev) => prev.filter((acc) => acc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Sistema de Tick a cada 3 segundos: atualiza silenciosamente os dados de admin sem perder a posição do admin
    const tickInterval = setInterval(() => {
      loadAllData(true);
    }, 3000);

    return () => {
      supabase.removeChannel(realtimeChannel);
      clearInterval(tickInterval);
    };
  }, [navigate]);

  const loadAllData = async (silent = false) => {
    if (!silent && accounts.length === 0) {
      setLoading(true);
    }
    try {
      const [accs, devs, schs] = await Promise.all([
        leadAuthService.getAccounts(),
        catalogService.getDevices(),
        schematicService.getSchematics(),
      ]);
      setAccounts(accs);
      setDevices(devs);
      setSchematics(schs);
    } catch (e) {
      if (!silent) console.error(e);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditEmail.trim()) {
      toast.error('Informe um e-mail válido para a conta admin.');
      return;
    }
    setIsSavingAdmin(true);
    const res = await leadAuthService.updateAdminCredentials({
      adminId: currentUser?.id || '43c63d10-68ba-4a82-b7e3-4ba18db6c7a1',
      email: adminEditEmail.trim().toLowerCase(),
      password: adminEditPassword.trim() || undefined,
      ownerName: adminEditOwner.trim() || undefined,
      companyName: adminEditCompany.trim() || undefined,
    });
    setIsSavingAdmin(false);

    if (res.success) {
      toast.success('Credenciais do Administrador Master atualizadas com sucesso!');
      setIsEditAdminModalOpen(false);
      await loadAllData();
    } else {
      toast.error(res.error || 'Erro ao atualizar credenciais do admin.');
    }
  };

  // User methods
  const handleOpenEditUser = (acc: UserAccount) => {
    if (!isMasterAdmin) {
      toast.error('Apenas o Administrador Master tem permissão para editar contas.');
      return;
    }
    setAccountToEdit(acc);
    setEditUserForm({
      companyName: acc.companyName || '',
      tradeName: acc.tradeName || '',
      ownerName: acc.ownerName || '',
      cnpj: acc.cnpj || '',
      email: acc.email || '',
      whatsapp: acc.whatsapp || '',
      password: '',
      status: acc.status || 'ativo',
      planStatus: acc.planStatus || 'ativo',
      role: acc.role || 'lead',
      banReason: acc.banReason || '',
      shippingZipCode: acc.shippingZipCode || '',
      shippingStreet: acc.shippingStreet || '',
      shippingNumber: acc.shippingNumber || '',
      shippingComplement: acc.shippingComplement || '',
      shippingNeighborhood: acc.shippingNeighborhood || '',
      shippingCity: acc.shippingCity || '',
      shippingState: acc.shippingState || '',
      shippingPhone: acc.shippingPhone || '',
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) {
      toast.error('Permissão negada. Apenas o Administrador Master pode editar contas.');
      return;
    }
    if (!accountToEdit) return;
    if (!editUserForm.email.trim()) {
      toast.error('O e-mail da conta é obrigatório.');
      return;
    }

    setIsSavingEditUser(true);
    const res = await leadAuthService.updateAccountFull(accountToEdit.id, {
      companyName: editUserForm.companyName,
      tradeName: editUserForm.tradeName,
      ownerName: editUserForm.ownerName,
      cnpj: editUserForm.cnpj,
      email: editUserForm.email,
      whatsapp: editUserForm.whatsapp,
      password: editUserForm.password || undefined,
      status: editUserForm.status,
      planStatus: editUserForm.planStatus,
      role: editUserForm.role,
      banReason: editUserForm.status === 'bloqueado' ? editUserForm.banReason : undefined,
      shippingZipCode: editUserForm.shippingZipCode,
      shippingStreet: editUserForm.shippingStreet,
      shippingNumber: editUserForm.shippingNumber,
      shippingComplement: editUserForm.shippingComplement,
      shippingNeighborhood: editUserForm.shippingNeighborhood,
      shippingCity: editUserForm.shippingCity,
      shippingState: editUserForm.shippingState,
      shippingPhone: editUserForm.shippingPhone,
    });
    setIsSavingEditUser(false);

    if (res.success) {
      toast.success(`Conta de ${editUserForm.email} atualizada com sucesso no Supabase!`);
      setAccountToEdit(null);
      await loadAllData();
    } else {
      toast.error(res.error || 'Erro ao atualizar dados da conta.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) {
      toast.error('Apenas o Master Admin (lordhahshs@gmail.com) pode criar novos administradores.');
      return;
    }

    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast.error('Informe o e-mail e a senha do novo administrador.');
      return;
    }

    if (newAdminPassword.trim().length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsCreatingAdmin(true);
    const res = await leadAuthService.createAdminAccount(newAdminEmail, newAdminPassword);
    setIsCreatingAdmin(false);

    if (res.success) {
      toast.success(`Novo administrador (${newAdminEmail}) criado com sucesso no Supabase!`);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setIsCreateAdminModalOpen(false);
      await loadAllData();
    } else {
      toast.error(res.error || 'Erro ao criar conta de administrador.');
    }
  };

  const handleOpenBanModal = (account: UserAccount) => {
    if (account.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL) {
      toast.error('A conta do Administrador Master não pode ser banida.');
      return;
    }
    setAccountToBan(account);
    setBanReasonInput(account.banReason || 'Irregularidade cadastral ou descumprimento das diretrizes da CellHub.');
  };

  const handleConfirmBan = async () => {
    if (!accountToBan) return;
    const target = accountToBan;
    const reason = banReasonInput.trim() || 'Irregularidade cadastral ou descumprimento das diretrizes da CellHub.';

    // 1. Atualização otimista imediata na tabela do admin (o botão troca para Desbanir na mesma hora)
    setAccounts((prev) =>
      prev.map((a) => (a.id === target.id ? { ...a, status: 'bloqueado', banReason: reason } : a))
    );
    if (selectedAccountForModal?.id === target.id) {
      setSelectedAccountForModal((prev) => (prev ? { ...prev, status: 'bloqueado', banReason: reason } : null));
    }
    setAccountToBan(null);

    // 2. Feedback imediato em pop-up toast confirmando o banimento em tempo real
    toast.error(`Usuário ${target.ownerName} (${target.companyName}) foi BANIDO em tempo real!`, {
      description: `Motivo: "${reason}"`,
      duration: 6000,
    });

    // 3. Atualiza no Supabase (o evento WebSocket dispara para a tela do usuário ser congelada instantaneamente)
    await leadAuthService.updateStatus(target.id, 'bloqueado', reason);
  };

  const handleUnban = async (id: string) => {
    const acc = accounts.find((a) => a.id === id);

    // 1. Atualização otimista imediata na tabela do admin (o botão troca para Banir na mesma hora)
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ativo', banReason: undefined } : a))
    );
    if (selectedAccountForModal?.id === id) {
      setSelectedAccountForModal((prev) => (prev ? { ...prev, status: 'ativo', banReason: undefined } : null));
    }

    // 2. Feedback imediato em pop-up toast
    toast.success(`Usuário ${acc?.ownerName || ''} foi DESBANIDO com sucesso!`, {
      description: 'O acesso à plataforma foi liberado imediatamente em tempo real.',
      duration: 5000,
    });

    // 3. Atualiza no Supabase
    await leadAuthService.updateStatus(id, 'ativo');
  };

  const handleDelete = async (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (acc?.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL) {
      toast.error('A conta do Administrador Master não pode ser excluída.');
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta conta permanentemente do Supabase?')) {
      await leadAuthService.deleteAccount(id);
      await loadAllData();
      if (selectedAccountForModal?.id === id) {
        setSelectedAccountForModal(null);
      }
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

  // Schematics methods
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setSchematicFileName(file.name);

    // Format size
    const sizeInKb = Math.round(file.size / 1024);
    setSchematicFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSchematicPdfData(result);
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddSchematic = () => {
    setEditingSchematic(null);
    setSchematicTitle('');
    setSchematicBrand('Samsung');
    setSchematicModel('');
    setSchematicDescription('');
    setSchematicPdfData('');
    setSchematicFileName('');
    setSchematicFileSize('');
    setIsAddSchematicModalOpen(true);
  };

  const handleOpenEditSchematic = (schematic: ElectricSchematic) => {
    setEditingSchematic(schematic);
    setSchematicTitle(schematic.title);
    setSchematicBrand(schematic.brand);
    setSchematicModel(schematic.model);
    setSchematicDescription(schematic.description || '');
    setSchematicPdfData(schematic.pdfUrl);
    setSchematicFileName(schematic.fileName || 'esquema.pdf');
    setSchematicFileSize(schematic.fileSize || '');
    setIsAddSchematicModalOpen(true);
  };

  const handleSaveSchematic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schematicTitle.trim() || !schematicModel.trim() || !schematicPdfData) {
      alert('Por favor, preencha o título, o modelo e faça o upload do arquivo PDF.');
      return;
    }

    if (editingSchematic) {
      // Update
      await schematicService.updateSchematic(editingSchematic.id, {
        title: schematicTitle,
        brand: schematicBrand,
        model: schematicModel,
        description: schematicDescription,
        pdfUrl: schematicPdfData,
        fileName: schematicFileName,
        fileSize: schematicFileSize,
      });
    } else {
      // Add new
      await schematicService.addSchematic({
        title: schematicTitle,
        brand: schematicBrand,
        model: schematicModel,
        description: schematicDescription,
        pdfUrl: schematicPdfData,
        fileName: schematicFileName,
        fileSize: schematicFileSize,
      });
    }

    setIsAddSchematicModalOpen(false);
    setEditingSchematic(null);
    await loadAllData();
  };

  const handleDeleteSchematic = async (id: string) => {
    if (confirm('Deseja excluir este esquema elétrico permanentemente?')) {
      await schematicService.deleteSchematic(id);
      await loadAllData();
    }
  };

  // Filters
  const filteredAccounts = accounts.filter((acc) => {
    const matchesStatus = selectedStatusFilter === 'todos' || acc.status === selectedStatusFilter;
    const query = searchQuery.toLowerCase();
    return matchesStatus && (
      acc.companyName.toLowerCase().includes(query) ||
      acc.ownerName.toLowerCase().includes(query) ||
      acc.cnpj.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query)
    );
  });

  const filteredSchematics = schematics.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q)
    );
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
              <CellHubLogo size="sm" variant={isSidebarCollapsed && !isMobileSidebarOpen ? 'icon' : 'full'} />
              {(!isSidebarCollapsed || isMobileOpen) && (
                <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-[9px] px-1 py-0">
                  ADMIN
                </Badge>
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
              onClick={() => {
                setAdminTab('users');
                setSearchQuery('');
              }}
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

            {/* Controle de Esquemas Elétricos */}
            <button
              onClick={() => {
                setAdminTab('schematics');
                setSearchQuery('');
              }}
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${adminTab === 'schematics'
                  ? 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              {adminTab === 'schematics' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              )}
              <Cpu className="w-4 h-4 flex-shrink-0" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <span className="truncate">Controle de Esquemas Elétricos ({schematics.length})</span>
              )}
            </button>

            {/* Estoque de Celulares */}
            <button
              onClick={() => {
                setAdminTab('catalog');
                setSearchQuery('');
              }}
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

            {/* Marketplace B2B Super Ofertas */}
            <button
              onClick={() => {
                setAdminTab('marketplace');
                setSearchQuery('');
              }}
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${adminTab === 'marketplace'
                  ? 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              {adminTab === 'marketplace' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              )}
              <Flame className="w-4 h-4 text-[#00D287] flex-shrink-0" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Super Ofertas B2B</span>
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#00D287]/20 text-[#00D287]">B2B</span>
                </div>
              )}
            </button>

            {/* Webhooks & Monitor */}
            <button
              onClick={() => {
                setAdminTab('webhooks');
                setSearchQuery('');
              }}
              className={`w-full group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${adminTab === 'webhooks'
                  ? 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              {adminTab === 'webhooks' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D287] rounded-r-full shadow-sm shadow-[#00D287]" />
              )}
              <RotateCw className="w-4 h-4 text-[#00D287] flex-shrink-0 animate-spin-slow" />
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Webhooks do Sistema</span>
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#00D287]/20 text-[#00D287]">Live</span>
                </div>
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
              {adminTab === 'users' && (
                <>
                  <Users className="w-4 h-4 text-[#00D287]" />
                  <span>Gestão de Usuários & Contas Reais</span>
                </>
              )}
              {adminTab === 'schematics' && (
                <>
                  <Cpu className="w-4 h-4 text-[#00D287]" />
                  <span>Controle de Esquemas Elétricos (PDF)</span>
                </>
              )}
              {adminTab === 'catalog' && (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#00D287]" />
                  <span>Estoque Real de Celulares</span>
                </>
              )}
              {adminTab === 'marketplace' && (
                <>
                  <Flame className="w-4 h-4 text-[#00D287]" />
                  <span>Moderação Marketplace B2B (Super Ofertas)</span>
                </>
              )}
              {adminTab === 'webhooks' && (
                <>
                  <RotateCw className="w-4 h-4 text-[#00D287]" />
                  <span>Monitoramento de Webhooks & Integrações</span>
                </>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setAdminEditEmail(currentUser?.email || 'lordhahshs@gmail.com');
                setAdminEditOwner(currentUser?.ownerName || 'Administrador Master');
                setAdminEditCompany(currentUser?.companyName || 'CellHub Master Admin');
                setIsEditAdminModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="bg-purple-500/15 border-purple-500/30 text-purple-300 hover:text-white text-xs h-8 px-2.5 rounded-lg"
              title="Configurar credenciais do Administrador Master"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1 text-purple-400" />
              <span className="hidden sm:inline">Admin: {currentUser?.email || 'lordhahshs@gmail.com'}</span>
            </Button>

            <Button
              onClick={loadAllData}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-white/10 text-slate-300 hover:text-white text-xs h-8 px-2.5 rounded-lg"
              title="Recarregar dados"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00D287]' : ''}`} />
            </Button>

            {adminTab === 'users' && (
              <div className="flex items-center gap-2">
                {isMasterAdmin && (
                  <Button
                    onClick={() => setIsCreateAdminModalOpen(true)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-purple-600/30 flex items-center gap-1.5"
                    title="Adicionar Administrador (Apenas E-mail e Senha)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                    <span className="hidden sm:inline">Adicionar Admin</span>
                    <span className="sm:hidden">+ Admin</span>
                  </Button>
                )}
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  size="sm"
                  className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-[#00D287]/20 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Lead</span>
                </Button>
              </div>
            )}

            {adminTab === 'schematics' && (
              <Button
                onClick={handleOpenAddSchematic}
                size="sm"
                className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-sm shadow-[#00D287]/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar Esquema Elétrico (PDF)
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#050811]">
          {/* TAB 1: USERS */}
          {adminTab === 'users' && (
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

              {/* Accounts Table */}
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
                          <th className="p-3.5">Perfil</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Ações de Controle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredAccounts.map((account) => {
                          const isAccountMaster = account.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL;
                          return (
                            <tr key={account.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3.5 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                    isAccountMaster
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : account.status === 'bloqueado'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-[#00D287]/15 text-[#00D287] border border-[#00D287]/25'
                                  }`}>
                                    {account.companyName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate max-w-[170px]">
                                    <div className="truncate flex items-center gap-1.5">
                                      <span>{account.companyName}</span>
                                      {isAccountMaster && (
                                        <span className="text-[9px] bg-purple-500/25 text-purple-300 border border-purple-500/40 px-1 py-0.2 rounded font-black">
                                          MASTER
                                        </span>
                                      )}
                                    </div>
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
                                {isAccountMaster ? (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-black uppercase tracking-wider">
                                    Master Admin
                                  </Badge>
                                ) : account.role === 'admin' ? (
                                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] font-bold">
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-850 text-slate-400 border-slate-700/60 text-[10px]">
                                    Lojista (Lead)
                                  </Badge>
                                )}
                              </td>

                              <td className="p-3.5">
                                {account.status === 'ativo' && (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                                    Ativo
                                  </Badge>
                                )}
                                {account.status === 'bloqueado' && (
                                  <div className="space-y-1">
                                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[10px] font-bold flex items-center gap-1 w-fit">
                                      <Ban className="w-3 h-3 text-rose-400" />
                                      Bloqueado
                                    </Badge>
                                    <div className="text-[10px] text-rose-300 font-medium max-w-[200px] truncate" title={account.banReason || 'Irregularidade cadastral'}>
                                      Motivo: {account.banReason || 'Irregularidade cadastral'}
                                    </div>
                                  </div>
                                )}
                                {account.status === 'analise' && (
                                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                    Em Análise
                                  </Badge>
                                )}
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Ver Perfil (Todos os admins podem visualizar) */}
                                  <button
                                    onClick={() => setSelectedAccountForModal(account)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                    title="Ver Detalhes do Perfil"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#00D287]" />
                                  </button>

                                  {/* Editar Conta: APENAS o Master Admin (lordhahshs@gmail.com) tem permissão de editar */}
                                  {isMasterAdmin && (
                                    <button
                                      onClick={() => handleOpenEditUser(account)}
                                      className="p-1.5 rounded-lg bg-purple-950/70 border border-purple-500/40 hover:bg-purple-900 text-purple-300 hover:text-white transition-colors"
                                      title="Editar Conta (Exclusivo Master Admin)"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-purple-300" />
                                    </button>
                                  )}

                                  {/* Banir / Desbanir com troca dinâmica de botão em tempo real */}
                                  {!isAccountMaster && (
                                    account.status === 'bloqueado' ? (
                                      <button
                                        onClick={() => handleUnban(account.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 hover:border-emerald-400 text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm shadow-emerald-950/40"
                                        title="Desbanir conta e liberar acesso em tempo real"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Desbanir
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenBanModal(account)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/90 border border-rose-800/60 text-rose-300 hover:bg-rose-900 hover:border-rose-500 text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm shadow-rose-950/40"
                                        title="Banir conta e definir motivo em tempo real"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                                        Banir
                                      </button>
                                    )
                                  )}

                                  {/* Excluir (Não permite excluir a conta Master) */}
                                  {!isAccountMaster && (
                                    <button
                                      onClick={() => handleDelete(account.id)}
                                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 transition-colors"
                                      title="Excluir Definitivamente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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
            </>
          )}

          {/* TAB 2: SCHEMATICS MANAGEMENT (Controle de Esquemas Elétricos) */}
          {adminTab === 'schematics' && (
            <div className="space-y-4">
              {/* Header card */}
              <div className="bg-[#080c17] border border-[#00D287]/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[#00D287]/20 text-[#00D287] border-[#00D287]/30 text-xs">
                      Controle Central de Manuais
                    </Badge>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Esquemas Elétricos em PDF (Supabase)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Adicione, edite e remova diagramas e manuais de serviço técnico. O arquivo PDF é visualizado diretamente na aba de Esquemas da plataforma pelo cliente.
                  </p>
                </div>

                <Button
                  onClick={handleOpenAddSchematic}
                  className="bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-[#00D287]/20 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Novo Esquema (PDF)
                </Button>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por modelo, marca ou título..."
                  className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus:border-[#00D287]"
                />
              </div>

              {/* Schematics List */}
              <div className="bg-[#080c17] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Esquemas Elétricos Cadastrados ({filteredSchematics.length})
                  </h4>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Carregando esquemas do Supabase...
                  </div>
                ) : filteredSchematics.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-white font-bold">Nenhum esquema elétrico cadastrado ainda.</p>
                    <p className="text-slate-500 mt-1">Clique em "Novo Esquema (PDF)" para enviar o primeiro arquivo.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="p-3.5">Título do Esquema</th>
                          <th className="p-3.5">Marca</th>
                          <th className="p-3.5">Modelo</th>
                          <th className="p-3.5">Arquivo PDF</th>
                          <th className="p-3.5">Data Envio</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSchematics.map((s) => (
                          <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3.5 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#00D287]/15 text-[#00D287] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="truncate max-w-[220px]">
                                  <div className="truncate text-white font-bold">{s.title}</div>
                                  {s.description && (
                                    <div className="text-[10px] text-slate-400 truncate">{s.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <Badge variant="outline" className="text-[10px] border-white/10 bg-slate-900 text-slate-300">
                                {s.brand}
                              </Badge>
                            </td>

                            <td className="p-3.5 font-mono text-slate-200 text-[11px]">
                              {s.model}
                            </td>

                            <td className="p-3.5 text-slate-400 text-[11px]">
                              <span className="text-[#00D287] font-medium">{s.fileName || 'PDF Document'}</span>
                              {s.fileSize && <span className="text-slate-500 ml-1.5">({s.fileSize})</span>}
                            </td>

                            <td className="p-3.5 text-slate-400 text-[11px]">
                              {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Preview PDF */}
                                <button
                                  onClick={() => setPreviewSchematic(s)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                  title="Pré-visualizar PDF"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#00D287]" />
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => handleOpenEditSchematic(s)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                  title="Editar Esquema"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-400" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteSchematic(s.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 transition-colors"
                                  title="Excluir Esquema"
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
            </div>
          )}

          {/* TAB 3: CATALOG DEVICES */}
          {adminTab === 'catalog' && (
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MARKETPLACE B2B (SUPER OFERTAS) */}
          {adminTab === 'marketplace' && (
            <MarketplaceAdminSection />
          )}

          {/* TAB 5: WEBHOOKS DO SISTEMA & MONITOR */}
          {adminTab === 'webhooks' && (
            <WebhooksAdminSection />
          )}
        </main>
      </div>

      {/* ADD / EDIT SCHEMATIC MODAL */}
      <Dialog open={isAddSchematicModalOpen} onOpenChange={setIsAddSchematicModalOpen}>
        <DialogContent className="max-w-lg bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#00D287]" />
              {editingSchematic ? 'Editar Esquema Elétrico' : 'Adicionar Esquema Elétrico (PDF)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Informe a marca, modelo e envie o arquivo PDF do esquema elétrico para o banco de dados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSchematic} className="space-y-3.5 mt-3 text-xs">
            {/* Título do Esquema */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Título do Esquema Elétrico (Modelo + Marca):
              </label>
              <Input
                required
                value={schematicTitle}
                onChange={(e) => setSchematicTitle(e.target.value)}
                placeholder="Ex: Esquema Elétrico Samsung Galaxy S23 Ultra"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl focus:border-[#00D287]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Marca */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Marca:</label>
                <select
                  value={schematicBrand}
                  onChange={(e) => setSchematicBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs outline-none focus:border-[#00D287]"
                >
                  <option value="Samsung">Samsung</option>
                  <option value="Motorola">Motorola</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Apple">Apple</option>
                  <option value="LG">LG</option>
                  <option value="Realme">Realme</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Modelo */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Modelo / Código:</label>
                <Input
                  required
                  value={schematicModel}
                  onChange={(e) => setSchematicModel(e.target.value)}
                  placeholder="Ex: SM-S918B ou Moto G84"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl focus:border-[#00D287]"
                />
              </div>
            </div>

            {/* Descrição / Observações */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Descrição / Notas Técnicas (Opcional):</label>
              <Input
                value={schematicDescription}
                onChange={(e) => setSchematicDescription(e.target.value)}
                placeholder="Ex: Diagrama em blocos, linhas de tensão VCC e layout de componentes"
                className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl focus:border-[#00D287]"
              />
            </div>

            {/* PDF File Upload or URL */}
            <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl space-y-2">
              <label className="font-semibold text-slate-300 block">
                Arquivo do Esquema Elétrico em PDF:
              </label>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-[#00D287]/40 rounded-xl cursor-pointer hover:bg-[#00D287]/5 transition-colors">
                  <Upload className="w-6 h-6 text-[#00D287] mb-1.5" />
                  <span className="text-xs font-bold text-white">
                    {schematicFileName ? schematicFileName : 'Clique para selecionar o PDF do seu computador'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {schematicFileSize ? `Tamanho: ${schematicFileSize}` : 'Formato aceito: .pdf (Manuais, boardviews e diagramas)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="text-[11px] text-slate-500 text-center">ou insira a URL direta do arquivo PDF:</div>

                <Input
                  value={schematicPdfData.startsWith('data:') ? '' : schematicPdfData}
                  onChange={(e) => {
                    setSchematicPdfData(e.target.value);
                    if (!schematicFileName) setSchematicFileName('esquema_online.pdf');
                  }}
                  placeholder="https://exemplo.com/esquema_tecnico.pdf"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-100 rounded-xl focus:border-[#00D287]"
                />
              </div>

              {isProcessingFile && (
                <p className="text-[11px] text-[#00D287] animate-pulse">
                  Processando arquivo PDF...
                </p>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                disabled={isProcessingFile || !schematicPdfData}
                className="flex-1 bg-[#00D287] hover:bg-[#00B875] text-slate-950 font-bold text-xs h-10 rounded-xl disabled:opacity-50"
              >
                {editingSchematic ? 'Atualizar Esquema' : 'Salvar no Supabase'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSchematicModalOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-10 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PDF PREVIEW MODAL IN ADMIN */}
      <Dialog open={!!previewSchematic} onOpenChange={(open) => !open && setPreviewSchematic(null)}>
        <DialogContent className="max-w-5xl h-[88vh] bg-[#080c17] border border-[#00D287]/30 text-slate-100 rounded-2xl p-4 flex flex-col">
          {previewSchematic && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00D287]" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{previewSchematic.title}</h3>
                    <p className="text-xs text-slate-400">{previewSchematic.brand} • {previewSchematic.model}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewSchematic.pdfUrl}
                    download={previewSchematic.fileName || `${previewSchematic.model}_esquema.pdf`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 hover:text-white"
                  >
                    <span>Download PDF</span>
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewSchematic(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Embedded PDF Viewer */}
              <div className="flex-1 mt-3 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/5">
                <iframe
                  src={previewSchematic.pdfUrl}
                  title={previewSchematic.title}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Modal */}
      <Dialog open={!!accountToBan} onOpenChange={(open) => !open && setAccountToBan(null)}>
        <DialogContent className="max-w-md bg-[#080c17] border border-rose-500/40 text-slate-100 rounded-2xl p-6">
          {accountToBan && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                    Ação Imediata
                  </Badge>
                </div>
                <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Banir Usuário em Tempo Real
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 pt-1 leading-relaxed">
                  A conta de <strong>{accountToBan.ownerName}</strong> ({accountToBan.companyName}) será bloqueada imediatamente. A tela do lojista será <strong>congelada na mesma hora</strong> com o motivo abaixo.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3.5">
                {/* Dados da conta a ser banida */}
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>E-mail:</span>
                    <span className="text-slate-200 font-medium">{accountToBan.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CNPJ:</span>
                    <span className="text-slate-300 font-mono">{accountToBan.cnpj}</span>
                  </div>
                </div>

                {/* Caixa de Texto para Motivo do Banimento */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Motivo do Banimento (Exibido na tela do usuário):
                    </label>
                  </div>
                  <textarea
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-rose-500 outline-none leading-relaxed transition-colors"
                    placeholder="Digite o motivo do bloqueio do usuário..."
                  />

                  {/* Atalhos de motivos frequentes */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Irregularidade cadastral',
                      'Inadimplência financeira',
                      'Violação dos termos da plataforma',
                      'Suspeita de atividade fraudulenta'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBanReasonInput(preset)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={handleConfirmBan}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    Banir e Travar na Hora
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Perfil:</span>
                    <span className="font-bold text-white uppercase text-xs">
                      {selectedAccountForModal.email?.toLowerCase().trim() === MASTER_ADMIN_EMAIL
                        ? 'Master Admin'
                        : selectedAccountForModal.role === 'admin'
                        ? 'Administrador'
                        : 'Lojista (Lead)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Plano:</span>
                    <span className="font-bold text-white capitalize text-xs">
                      {selectedAccountForModal.planStatus === 'ativo' ? 'Ativo (Vitalício)' : 'Demonstração (Demo)'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status:</span>
                  <span className={`font-bold capitalize ${selectedAccountForModal.status === 'bloqueado' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedAccountForModal.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Cancelamentos de Vendas:</span>
                    <span className={`font-bold text-xs ${(selectedAccountForModal.salesCancellationCount || 0) >= 3 ? 'text-rose-400 font-black' : 'text-amber-300'}`}>
                      {selectedAccountForModal.salesCancellationCount || 0} de 3 utilizados
                    </span>
                  </div>
                </div>

                {selectedAccountForModal.banReason && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40">
                    <span className="text-rose-400 block text-[10px] uppercase font-semibold mb-0.5">Motivo do Bloqueio:</span>
                    <span className="text-rose-200 font-medium">{selectedAccountForModal.banReason}</span>
                  </div>
                )}

                {/* Endereço de Entrega / Envio do Lead */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[#00D287] block text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00D287]" />
                    Endereço de Entrega Cadastrado:
                  </span>
                  {selectedAccountForModal.shippingZipCode ? (
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-200 space-y-0.5">
                      <div className="font-semibold text-white">
                        {selectedAccountForModal.shippingStreet}, {selectedAccountForModal.shippingNumber || 'S/N'}
                        {selectedAccountForModal.shippingComplement ? ` - ${selectedAccountForModal.shippingComplement}` : ''}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {selectedAccountForModal.shippingNeighborhood ? `${selectedAccountForModal.shippingNeighborhood} • ` : ''}
                        {selectedAccountForModal.shippingCity}/{selectedAccountForModal.shippingState}
                      </div>
                      <div className="text-[11px] font-mono text-[#00D287] pt-0.5">
                        CEP: {selectedAccountForModal.shippingZipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
                        {selectedAccountForModal.shippingPhone && (
                          <span className="text-slate-400 ml-2">Tel: {selectedAccountForModal.shippingPhone}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic p-2.5 bg-slate-900/40 rounded-xl border border-white/5">
                      Nenhum endereço digitado ou cadastrado ainda.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Botão de Banir / Desbanir direto no modal de detalhes */}
                {selectedAccountForModal.email?.toLowerCase().trim() !== MASTER_ADMIN_EMAIL && (
                  selectedAccountForModal.status === 'bloqueado' ? (
                    <Button
                      onClick={() => handleUnban(selectedAccountForModal.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Desbanir Usuário
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        const target = selectedAccountForModal;
                        setSelectedAccountForModal(null);
                        handleOpenBanModal(target);
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Banir Usuário
                    </Button>
                  )
                )}

                {isMasterAdmin && (
                  <Button
                    onClick={() => {
                      const target = selectedAccountForModal;
                      setSelectedAccountForModal(null);
                      handleOpenEditUser(target);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar Conta
                  </Button>
                )}
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

      {/* Edit Master Admin Credentials Modal */}
      <Dialog open={isEditAdminModalOpen} onOpenChange={setIsEditAdminModalOpen}>
        <DialogContent className="max-w-md bg-[#080c17] border border-purple-500/40 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
              Configurar Conta Master Administrador
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1 leading-relaxed">
              Esta conta tem acesso irrestrito ao painel administrativo e funções de gestão. Apenas este e-mail pode gerenciar o sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdminCredentials} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                E-mail do Administrador Master *
              </label>
              <Input
                type="email"
                required
                value={adminEditEmail}
                onChange={(e) => setAdminEditEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                placeholder="lordhahshs@gmail.com"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nome do Responsável
              </label>
              <Input
                value={adminEditOwner}
                onChange={(e) => setAdminEditOwner(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                placeholder="Administrador Master"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nova Senha de Acesso (deixe em branco para manter a atual)
              </label>
              <Input
                type="password"
                value={adminEditPassword}
                onChange={(e) => setAdminEditPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                placeholder="Nova senha segura..."
              />
            </div>

            <div className="pt-3 flex gap-2">
              <Button
                type="submit"
                disabled={isSavingAdmin}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-purple-600/20"
              >
                {isSavingAdmin ? 'Salvando...' : 'Salvar Dados do Admin'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditAdminModalOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-10 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Account Modal (Exclusivo Master Admin: lordhahshs@gmail.com) */}
      <Dialog open={!!accountToEdit} onOpenChange={(open) => !open && setAccountToEdit(null)}>
        <DialogContent className="max-w-lg bg-[#080c17] border border-purple-500/40 text-slate-100 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          {accountToEdit && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold">
                    Acesso Exclusivo Master Admin
                  </Badge>
                  {accountToEdit.role === 'admin' ? (
                    <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">
                      Conta Administrador
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      Conta Lead Lojista
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-base font-black text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-purple-400" />
                  Editar Conta de Usuário
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 pt-0.5">
                  Atualize os dados e privilégios de acesso de <strong>{accountToEdit.ownerName}</strong> ({accountToEdit.email}).
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveEditUser} className="space-y-3.5 mt-4 text-xs">
                {/* Tipo de Perfil e Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Tipo de Conta (Role):
                    </label>
                    <select
                      value={editUserForm.role}
                      onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as 'lead' | 'admin' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs outline-none focus:border-purple-500"
                    >
                      <option value="lead">Lojista (Lead)</option>
                      <option value="admin">Administrador (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Status da Conta:
                    </label>
                    <select
                      value={editUserForm.status}
                      onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as 'ativo' | 'analise' | 'bloqueado' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs outline-none focus:border-purple-500"
                    >
                      <option value="ativo">Ativo (Liberado)</option>
                      <option value="bloqueado">Bloqueado (Banido)</option>
                      <option value="analise">Em Análise</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Plano / Licença:
                    </label>
                    <select
                      value={editUserForm.planStatus}
                      onChange={(e) => setEditUserForm({ ...editUserForm, planStatus: e.target.value as 'demo' | 'ativo' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs outline-none focus:border-purple-500"
                    >
                      <option value="ativo">Ativo (Acesso Total)</option>
                      <option value="demo">Demonstração (Demo)</option>
                    </select>
                  </div>
                </div>

                {/* Motivo do Bloqueio (se bloqueado) */}
                {editUserForm.status === 'bloqueado' && (
                  <div className="bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-xl">
                    <label className="text-[11px] font-semibold text-rose-300 block mb-1">
                      Motivo do Bloqueio (visível ao usuário):
                    </label>
                    <Input
                      value={editUserForm.banReason}
                      onChange={(e) => setEditUserForm({ ...editUserForm, banReason: e.target.value })}
                      placeholder="Ex: Irregularidade cadastral ou descumprimento de termos"
                      className="bg-slate-950 border-rose-500/40 text-slate-100 text-xs rounded-xl"
                    />
                  </div>
                )}

                {/* Empresa e Dono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Empresa / Loja:
                    </label>
                    <Input
                      value={editUserForm.companyName}
                      onChange={(e) => setEditUserForm({ ...editUserForm, companyName: e.target.value })}
                      placeholder="Nome da Loja"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome do Responsável / Dono:
                    </label>
                    <Input
                      value={editUserForm.ownerName}
                      onChange={(e) => setEditUserForm({ ...editUserForm, ownerName: e.target.value })}
                      placeholder="Nome do Dono"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Nome Fantasia e CNPJ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome Fantasia (Opcional):
                    </label>
                    <Input
                      value={editUserForm.tradeName}
                      onChange={(e) => setEditUserForm({ ...editUserForm, tradeName: e.target.value })}
                      placeholder="Nome Fantasia"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      CNPJ:
                    </label>
                    <Input
                      value={editUserForm.cnpj}
                      onChange={(e) => setEditUserForm({ ...editUserForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl font-mono focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* E-mail e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      E-mail de Login *:
                    </label>
                    <Input
                      required
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      placeholder="email@empresa.com"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      WhatsApp / Telefone:
                    </label>
                    <Input
                      value={editUserForm.whatsapp}
                      onChange={(e) => setEditUserForm({ ...editUserForm, whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Redefinir Senha de Acesso:
                  </label>
                  <Input
                    type="password"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Preencha este campo apenas se desejar redefinir a senha desta conta.
                  </span>
                </div>

                {/* Endereço de Entrega / Logística */}
                <div className="pt-3 border-t border-white/5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D287]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Endereço de Entrega Cadastrado (Padrão)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        CEP:
                      </label>
                      <Input
                        value={editUserForm.shippingZipCode}
                        onChange={(e) => setEditUserForm({ ...editUserForm, shippingZipCode: e.target.value })}
                        placeholder="00000-000"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl font-mono focus:border-purple-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Rua / Logradouro:
                      </label>
                      <Input
                        value={editUserForm.shippingStreet}
                        onChange={(e) => setEditUserForm({ ...editUserForm, shippingStreet: e.target.value })}
                        placeholder="Ex: Av. Paulista"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Número:
                      </label>
                      <Input
                        value={editUserForm.shippingNumber}
                        onChange={(e) => setEditUserForm({ ...editUserForm, shippingNumber: e.target.value })}
                        placeholder="1000"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Complemento:
                      </label>
                      <Input
                        value={editUserForm.shippingComplement}
                        onChange={(e) => setEditUserForm({ ...editUserForm, shippingComplement: e.target.value })}
                        placeholder="Sala 12"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Bairro:
                      </label>
                      <Input
                        value={editUserForm.shippingNeighborhood}
                        onChange={(e) => setEditUserForm({ ...editUserForm, shippingNeighborhood: e.target.value })}
                        placeholder="Centro"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Cidade / UF:
                      </label>
                      <div className="flex gap-1">
                        <Input
                          value={editUserForm.shippingCity}
                          onChange={(e) => setEditUserForm({ ...editUserForm, shippingCity: e.target.value })}
                          placeholder="São Paulo"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500 w-2/3"
                        />
                        <Input
                          maxLength={2}
                          value={editUserForm.shippingState}
                          onChange={(e) => setEditUserForm({ ...editUserForm, shippingState: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500 w-1/3 text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSavingEditUser}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    {isSavingEditUser ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAccountToEdit(null)}
                    className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-10 rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Admin Modal (Exclusivo Master Admin: lordhahshs@gmail.com) */}
      <Dialog open={isCreateAdminModalOpen} onOpenChange={setIsCreateAdminModalOpen}>
        <DialogContent className="max-w-md bg-[#080c17] border border-purple-500/40 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-black uppercase">
                Acesso Master Exclusivo
              </Badge>
            </div>
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Adicionar Novo Administrador
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1 leading-relaxed">
              Crie uma nova conta com privilégios de administrador. O cadastro requer apenas o e-mail e a senha de acesso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-3.5 mt-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                E-mail do Administrador *:
              </label>
              <Input
                required
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="exemplo.admin@cellhub.shop"
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Senha de Acesso *:
              </label>
              <Input
                required
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Este administrador terá acesso ao painel para moderar ofertas, gerenciar esquemas elétricos, ver detalhes de usuários e banir/excluir contas (não poderá editar contas nem criar novos admins).
              </span>
            </div>

            <div className="pt-3 flex gap-2">
              <Button
                type="submit"
                disabled={isCreatingAdmin}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-purple-600/20"
              >
                {isCreatingAdmin ? 'Criando Administrador...' : 'Criar Administrador'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateAdminModalOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs h-10 rounded-xl"
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
