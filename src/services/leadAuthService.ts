import { supabase } from '@/integrations/supabase/client';

export interface UserAccount {
  id: string;
  companyName: string;
  ownerName: string;
  cnpj: string;
  email: string;
  password?: string;
  role: 'lead' | 'admin';
  status: 'ativo' | 'analise' | 'bloqueado';
  banReason?: string;
  createdAt: string;
}

const CURRENT_USER_KEY = 'aurus_current_user';

export const leadAuthService = {
  // Clear any old fake leads from localStorage
  cleanupLegacyFakeData() {
    localStorage.removeItem('aurus_user_accounts');
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
      ownerName: row.owner_name,
      cnpj: row.cnpj,
      email: row.email,
      password: row.password,
      role: row.role || 'lead',
      status: row.status || 'ativo',
      banReason: row.ban_reason || undefined,
      createdAt: row.created_at,
    }));
  },

  async registerAccount(data: {
    companyName: string;
    ownerName: string;
    cnpj: string;
    email: string;
    password: string;
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

    const { data: inserted, error } = await supabase
      .from('user_accounts')
      .insert({
        company_name: data.companyName.trim(),
        owner_name: data.ownerName.trim(),
        cnpj: data.cnpj.trim(),
        email: cleanEmail,
        password: data.password,
        role: 'lead',
        status: 'ativo',
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
      ownerName: inserted.owner_name,
      cnpj: inserted.cnpj,
      email: inserted.email,
      role: inserted.role || 'lead',
      status: inserted.status || 'ativo',
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
      ownerName: data.owner_name,
      cnpj: data.cnpj,
      email: data.email,
      role: data.role || 'lead',
      status: data.status || 'ativo',
      banReason: data.ban_reason || undefined,
      createdAt: data.created_at,
    };

    this.setCurrentUser(user);
    return { user };
  },

  async checkUserStatus(id: string): Promise<{ status: 'ativo' | 'analise' | 'bloqueado'; banReason?: string }> {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('status, ban_reason')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return { status: 'ativo' };
    }

    // Update local storage if ban status changed
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      if (current.status !== data.status || current.banReason !== data.ban_reason) {
        current.status = data.status;
        current.banReason = data.ban_reason;
        this.setCurrentUser(current);
      }
    }

    return {
      status: data.status,
      banReason: data.ban_reason,
    };
  },

  getCurrentUser(): UserAccount | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const user: UserAccount = JSON.parse(stored);
        // Sanitização automática: se o ID for resquício de mock antigo (ex: "usr-1"), substitui pelo UUID real
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || '');
        if (!isUuid) {
          if (user.email?.toLowerCase() === 'admin@auruspay.com') {
            user.id = '43c63d10-68ba-4a82-b7e3-4ba18db6c7a1';
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          }
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
          ownerName: data.owner_name,
          cnpj: data.cnpj,
          email: data.email,
          role: data.role || 'lead',
          status: data.status || 'ativo',
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
          ownerName: userByEmail.owner_name,
          cnpj: userByEmail.cnpj,
          email: userByEmail.email,
          role: userByEmail.role || 'lead',
          status: userByEmail.status || 'ativo',
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
    }
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
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

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.logout();
    }
    return true;
  },

  async updateStatus(id: string, status: 'ativo' | 'analise' | 'bloqueado', banReason?: string): Promise<boolean> {
    const updatePayload: any = { status };
    if (status === 'bloqueado') {
      updatePayload.ban_reason = banReason || 'Suspensão aplicada pela administração.';
    } else {
      updatePayload.ban_reason = null;
    }

    const { error } = await supabase
      .from('user_accounts')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('[leadAuthService] Erro ao atualizar status:', error);
      return false;
    }

    return true;
  }
};
