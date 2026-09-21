import { supabase } from '@/integrations/supabase/client';

export interface UserAccount {
  id: string;
  companyName: string; // Nome da loja
  tradeName?: string; // Nome fantasia da loja
  ownerName: string; // Nome do responsável
  cnpj: string;
  email: string;
  whatsapp?: string; // WhatsApp do lojista
  avatarUrl?: string; // Imagem/logo da loja
  password?: string;
  role: 'lead' | 'admin';
  status: 'ativo' | 'analise' | 'bloqueado';
  planStatus: 'demo' | 'ativo'; // 'demo' = bloqueado/não pagante; 'ativo' = vitalício liberado
  banReason?: string;
  shippingZipCode?: string;
  shippingStreet?: string;
  shippingNumber?: string;
  shippingComplement?: string;
  shippingNeighborhood?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPhone?: string;
  createdAt: string;
}

const CURRENT_USER_KEY = 'cellhub_current_user';

export const leadAuthService = {
  // Clear any old fake leads from localStorage
  cleanupLegacyFakeData() {
    localStorage.removeItem('aurus_user_accounts');
    localStorage.removeItem('aurus_current_user');
  },

  isDemoMode(user: UserAccount | null): boolean {
    if (!user) return true;
    if (user.role === 'admin') return false;
    return user.planStatus !== 'ativo';
  },

  async getAccounts(): Promise<UserAccount[]> {
    this.cleanupLegacyFakeData();
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[leadAuthService] Erro ao buscar contas:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      companyName: row.company_name,
      tradeName: row.trade_name || undefined,
      ownerName: row.owner_name || row.trade_name || row.company_name,
      cnpj: row.cnpj,
      email: row.email,
      whatsapp: row.whatsapp || undefined,
      avatarUrl: row.avatar_url || undefined,
      password: row.password,
      role: row.role || 'lead',
      status: row.status || 'ativo',
      planStatus: (row.plan_status as 'demo' | 'ativo') || (row.role === 'admin' ? 'ativo' : 'demo'),
      banReason: row.ban_reason || undefined,
      shippingZipCode: row.shipping_zip_code || undefined,
      shippingStreet: row.shipping_street || undefined,
      shippingNumber: row.shipping_number || undefined,
      shippingComplement: row.shipping_complement || undefined,
      shippingNeighborhood: row.shipping_neighborhood || undefined,
      shippingCity: row.shipping_city || undefined,
      shippingState: row.shipping_state || undefined,
      shippingPhone: row.shipping_phone || undefined,
      createdAt: row.created_at,
    }));
  },

  async registerAccount(data: {
    companyName: string;
    tradeName?: string;
    ownerName?: string;
    cnpj: string;
    email: string;
    whatsapp?: string;
    avatarUrl?: string;
    password: string;
    initialPlanStatus?: 'demo' | 'ativo';
  }): Promise<{ user?: UserAccount; error?: string }> {
    this.cleanupLegacyFakeData();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { error: 'Este e-mail já está cadastrado. Por favor faça login.' };
    }

    const assignedPlan = data.initialPlanStatus || 'demo';
    const ownerName = data.ownerName?.trim() || data.tradeName?.trim() || data.companyName.trim();

    const { data: inserted, error } = await supabase
      .from('user_accounts')
      .insert({
        company_name: data.companyName.trim(),
        trade_name: data.tradeName?.trim() || null,
        owner_name: ownerName,
        cnpj: data.cnpj.trim(),
        email: cleanEmail,
        whatsapp: data.whatsapp?.trim() || null,
        avatar_url: data.avatarUrl || null,
        password: data.password,
        role: 'lead',
        status: 'ativo',
        plan_status: assignedPlan,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('[leadAuthService] Erro ao cadastrar:', error);
      return { error: 'Não foi possível cadastrar a conta. Verifique os dados.' };
    }

    const user: UserAccount = {
      id: inserted.id,
      companyName: inserted.company_name,
      tradeName: inserted.trade_name || undefined,
      ownerName: inserted.owner_name,
      cnpj: inserted.cnpj,
      email: inserted.email,
      whatsapp: inserted.whatsapp || undefined,
      avatarUrl: inserted.avatar_url || undefined,
      role: inserted.role || 'lead',
      status: inserted.status || 'ativo',
      planStatus: (inserted.plan_status as 'demo' | 'ativo') || assignedPlan,
      createdAt: inserted.created_at,
    };

    this.setCurrentUser(user);
    return { user };
  },

  async login(email: string, password?: string): Promise<{ user?: UserAccount; error?: string }> {
    this.cleanupLegacyFakeData();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      return { error: 'Conta não encontrada. Verifique o e-mail digitado ou cadastre-se.' };
    }

    if (password && data.password && data.password !== password) {
      return { error: 'Senha incorreta. Tente novamente.' };
    }

    const user: UserAccount = {
      id: data.id,
      companyName: data.company_name,
      tradeName: data.trade_name || undefined,
      ownerName: data.owner_name || data.trade_name || data.company_name,
      cnpj: data.cnpj,
      email: data.email,
      whatsapp: data.whatsapp || undefined,
      avatarUrl: data.avatar_url || undefined,
      role: data.role || 'lead',
      status: data.status || 'ativo',
      planStatus: (data.plan_status as 'demo' | 'ativo') || (data.role === 'admin' ? 'ativo' : 'demo'),
      banReason: data.ban_reason || undefined,
      shippingZipCode: data.shipping_zip_code || undefined,
      shippingStreet: data.shipping_street || undefined,
      shippingNumber: data.shipping_number || undefined,
      shippingComplement: data.shipping_complement || undefined,
      shippingNeighborhood: data.shipping_neighborhood || undefined,
      shippingCity: data.shipping_city || undefined,
      shippingState: data.shipping_state || undefined,
      shippingPhone: data.shipping_phone || undefined,
      createdAt: data.created_at,
    };

    this.setCurrentUser(user);
    return { user };
  },

  async activateLifetimePlan(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_accounts')
      .update({ plan_status: 'ativo', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[leadAuthService] Erro ao ativar plano vitalício:', error);
      return false;
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.planStatus = 'ativo';
      this.setCurrentUser(current);
    }
    return true;
  },

  async checkUserStatus(id: string): Promise<{ status: 'ativo' | 'analise' | 'bloqueado'; banReason?: string; planStatus?: 'demo' | 'ativo' }> {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('status, ban_reason, plan_status, role')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return { status: 'ativo', planStatus: 'demo' };
    }

    const planStatus = (data.plan_status as 'demo' | 'ativo') || (data.role === 'admin' ? 'ativo' : 'demo');

    // Update local storage if ban status or plan changed
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      let changed = false;
      if (current.status !== data.status || current.banReason !== data.ban_reason) {
        current.status = data.status;
        current.banReason = data.ban_reason;
        changed = true;
      }
      if (current.planStatus !== planStatus) {
        current.planStatus = planStatus;
        changed = true;
      }
      if (changed) {
        this.setCurrentUser(current);
      }
    }

    return {
      status: data.status,
      banReason: data.ban_reason,
      planStatus,
    };
  },

  getCurrentUser(): UserAccount | null {
    try {
      let stored = localStorage.getItem(CURRENT_USER_KEY);
      if (!stored) {
        // Fallback for legacy key
        stored = localStorage.getItem('aurus_current_user');
      }
      if (stored) {
        const user: UserAccount = JSON.parse(stored);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || '');
        if (!isUuid) {
          if (user.email?.toLowerCase() === 'lordhahshs@gmail.com') {
            user.id = '43c63d10-68ba-4a82-b7e3-4ba18db6c7a1';
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          }
        }
        if (!user.planStatus) {
          user.planStatus = user.role === 'admin' ? 'ativo' : 'demo';
        }
        return user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async syncCurrentUserWithDatabase(): Promise<UserAccount | null> {
    const current = this.getCurrentUser();
    if (!current) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current.id || '');
    
    // Se o ID já é um UUID válido, valida se a conta existe
    if (isUuid) {
      const { data } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('id', current.id)
        .maybeSingle();

      if (data) {
        const synced: UserAccount = {
          id: data.id,
          companyName: data.company_name,
          tradeName: data.trade_name || undefined,
          ownerName: data.owner_name || data.trade_name || data.company_name,
          cnpj: data.cnpj,
          email: data.email,
          whatsapp: data.whatsapp || undefined,
          avatarUrl: data.avatar_url || undefined,
          role: data.role || 'lead',
          status: data.status || 'ativo',
          planStatus: (data.plan_status as 'demo' | 'ativo') || (data.role === 'admin' ? 'ativo' : 'demo'),
          banReason: data.ban_reason || undefined,
          createdAt: data.created_at,
        };
        this.setCurrentUser(synced);
        return synced;
      }
    }

    // Se o ID não for UUID válido ou não foi encontrado por ID, busca por e-mail
    if (current.email) {
      const { data: userByEmail } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', current.email.toLowerCase().trim())
        .maybeSingle();

      if (userByEmail) {
        const synced: UserAccount = {
          id: userByEmail.id,
          companyName: userByEmail.company_name,
          tradeName: userByEmail.trade_name || undefined,
          ownerName: userByEmail.owner_name || userByEmail.trade_name || userByEmail.company_name,
          cnpj: userByEmail.cnpj,
          email: userByEmail.email,
          whatsapp: userByEmail.whatsapp || undefined,
          avatarUrl: userByEmail.avatar_url || undefined,
          role: userByEmail.role || 'lead',
          status: userByEmail.status || 'ativo',
          planStatus: (userByEmail.plan_status as 'demo' | 'ativo') || (userByEmail.role === 'admin' ? 'ativo' : 'demo'),
          banReason: userByEmail.ban_reason || undefined,
          createdAt: userByEmail.created_at,
        };
        this.setCurrentUser(synced);
        return synced;
      }
    }

    return current;
  },

  setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('aurus_current_user');
    }
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('aurus_current_user');
  },

  async deleteAccount(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[leadAuthService] Erro ao deletar conta:', error);
      return false;
    }
    return true;
  },

  async updateAccountStatus(
    id: string,
    status: 'ativo' | 'analise' | 'bloqueado',
    banReason?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_accounts')
      .update({
        status,
        ban_reason: banReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[leadAuthService] Erro ao atualizar status:', error);
      return false;
    }

    // If updating current user
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      current.status = status;
      current.banReason = banReason;
      this.setCurrentUser(current);
    }

    return true;
  },

  async updateStatus(
    id: string,
    status: 'ativo' | 'analise' | 'bloqueado',
    banReason?: string
  ): Promise<boolean> {
    return this.updateAccountStatus(id, status, banReason);
  },

  async updateAccountPlan(id: string, planStatus: 'demo' | 'ativo'): Promise<boolean> {
    const { error } = await supabase
      .from('user_accounts')
      .update({
        plan_status: planStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[leadAuthService] Erro ao atualizar plano:', error);
      return false;
    }

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      current.planStatus = planStatus;
      this.setCurrentUser(current);
    }

    return true;
  },

  async updateAdminCredentials(data: {
    adminId: string;
    email: string;
    password?: string;
    ownerName?: string;
    companyName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const payload: any = {
      email: cleanEmail,
      updated_at: new Date().toISOString(),
    };
    if (data.password && data.password.trim()) {
      payload.password = data.password.trim();
    }
    if (data.ownerName) payload.owner_name = data.ownerName.trim();
    if (data.companyName) payload.company_name = data.companyName.trim();

    const { error } = await supabase
      .from('user_accounts')
      .update(payload)
      .eq('id', data.adminId);

    if (error) {
      return { success: false, error: error.message };
    }

    const current = this.getCurrentUser();
    if (current && current.id === data.adminId) {
      current.email = cleanEmail;
      if (data.ownerName) current.ownerName = data.ownerName.trim();
      if (data.companyName) current.companyName = data.companyName.trim();
      this.setCurrentUser(current);
    }

    return { success: true };
  }
};
