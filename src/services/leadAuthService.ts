export interface UserAccount {
  id: string;
  companyName: string;
  ownerName: string;
  cnpj: string;
  email: string;
  password?: string;
  role: 'lead' | 'admin';
  status: 'ativo' | 'analise' | 'bloqueado';
  createdAt: string;
}

const STORAGE_KEY = 'aurus_user_accounts';
const CURRENT_USER_KEY = 'aurus_current_user';

const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-1',
    companyName: 'TechCell Soluções & Vendas',
    ownerName: 'Rafael Mendonça',
    cnpj: '42.891.203/0001-92',
    email: 'rafael@techcell.com.br',
    role: 'lead',
    status: 'ativo',
    createdAt: '2025-02-18T14:32:00Z',
  },
  {
    id: 'usr-2',
    companyName: 'SmartPhone Express',
    ownerName: 'Camila Duarte',
    cnpj: '35.112.980/0001-44',
    email: 'camila@smartphonexpress.com',
    role: 'lead',
    status: 'ativo',
    createdAt: '2025-02-21T09:15:00Z',
  },
  {
    id: 'usr-3',
    companyName: 'Bancada Android Pro',
    ownerName: 'Lucas Vinícius',
    cnpj: '28.441.602/0001-18',
    email: 'lucas@bancadapro.com.br',
    role: 'lead',
    status: 'ativo',
    createdAt: '2025-02-23T16:45:00Z',
  },
  {
    id: 'usr-4',
    companyName: 'MegaCell Assistência & Acessórios',
    ownerName: 'Guilherme Santos',
    cnpj: '19.330.405/0001-09',
    email: 'contato@megacell.com.br',
    role: 'lead',
    status: 'analise',
    createdAt: '2025-02-24T11:20:00Z',
  },
  {
    id: 'usr-admin',
    companyName: 'AurusPay Master Central',
    ownerName: 'Administrador Geral',
    cnpj: '00.000.000/0001-00',
    email: 'admin@auruspay.com',
    password: 'admin',
    role: 'admin',
    status: 'ativo',
    createdAt: '2025-01-01T00:00:00Z',
  }
];

export const leadAuthService = {
  getAccounts(): UserAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ACCOUNTS));
        return SEED_ACCOUNTS;
      }
      return JSON.parse(stored);
    } catch {
      return SEED_ACCOUNTS;
    }
  },

  registerAccount(data: {
    companyName: string;
    ownerName: string;
    cnpj: string;
    email: string;
    password: string;
  }): UserAccount {
    const accounts = this.getAccounts();
    const newAccount: UserAccount = {
      id: `usr-${Date.now()}`,
      companyName: data.companyName.trim(),
      ownerName: data.ownerName.trim(),
      cnpj: data.cnpj.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: 'lead',
      status: 'ativo',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAccount, ...accounts];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    this.setCurrentUser(newAccount);
    return newAccount;
  },

  login(email: string, password?: string): UserAccount | null {
    const accounts = this.getAccounts();
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  },

  getCurrentUser(): UserAccount | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Return first active account as fallback default if available
      const accounts = this.getAccounts();
      const defaultUser = accounts.find((a) => a.role === 'lead') || accounts[0];
      if (defaultUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
        return defaultUser;
      }
      return null;
    } catch {
      return null;
    }
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

  deleteAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.logout();
    }
  },

  updateStatus(id: string, status: 'ativo' | 'analise' | 'bloqueado'): void {
    const accounts = this.getAccounts().map((a) => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
};
