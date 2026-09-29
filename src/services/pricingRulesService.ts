import { OfferCategory } from '@/types/marketplace';

export interface MarginRule {
  id: string;
  category: string;
  marginPercent: number; // Ex: 20 -> 20%
  description?: string;
}

export const INITIAL_DEFAULT_MARGIN_RULES: MarginRule[] = [
  { id: 'cat-celulares', category: 'Celulares', marginPercent: 20, description: 'Smartphones novos, seminovos e usados' },
  { id: 'cat-pecas', category: 'Peças', marginPercent: 35, description: 'Câmeras, carcaças, flex e periféricos' },
  { id: 'cat-telas', category: 'Telas', marginPercent: 30, description: 'Displays OLED, Incell e originais' },
  { id: 'cat-baterias', category: 'Baterias', marginPercent: 35, description: 'Baterias homologadas de alta capacidade' },
  { id: 'cat-conectores', category: 'Conectores', marginPercent: 50, description: 'Conectores de carga, solda e placas sub' },
  { id: 'cat-acessorios', category: 'Acessórios', marginPercent: 40, description: 'Carregadores Tipo C, V8, cabos e capas' },
  { id: 'cat-ferramentas', category: 'Ferramentas', marginPercent: 25, description: 'Chaves de precisão, microscópios e estações' },
  { id: 'cat-maquinas', category: 'Máquinas', marginPercent: 20, description: 'Separadoras LCD, laminadoras e lasers' },
  { id: 'cat-eletronicos', category: 'Eletrônicos', marginPercent: 25, description: 'Smartwatches, caixas de som e fones Bluetooth' },
  { id: 'cat-componentes', category: 'Componentes', marginPercent: 35, description: 'ICs de carga, resistores e microcomponentes' },
  { id: 'cat-lotes', category: 'Lotes', marginPercent: 18, description: 'Lotes fechados para atacado e revenda' },
  { id: 'cat-outros', category: 'Outros', marginPercent: 25, description: 'Produtos gerais diversos' },
];

export const OFFICIAL_CATEGORIES: string[] = INITIAL_DEFAULT_MARGIN_RULES.map((r) => r.category);

const STORAGE_KEY = 'cellhub_shop_pricing_rules_v3';

export const pricingRulesService = {
  getRules(): MarginRule[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler regras de precificação:', e);
    }
    return INITIAL_DEFAULT_MARGIN_RULES;
  },

  getCategories(): string[] {
    const rules = this.getRules();
    if (rules.length === 0) {
      return OFFICIAL_CATEGORIES;
    }
    return rules.map((r) => r.category);
  },

  saveRules(rules: MarginRule[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      return true;
    } catch (e) {
      console.error('Erro ao salvar regras de precificação:', e);
      return false;
    }
  },

  updateRule(category: string, marginPercent: number): boolean {
    const rules = this.getRules();
    const idx = rules.findIndex((r) => r.category.toLowerCase() === category.toLowerCase());
    if (idx !== -1) {
      rules[idx].marginPercent = marginPercent;
      return this.saveRules(rules);
    }
    return false;
  },

  addRule(category: string, marginPercent: number, description?: string): boolean {
    const rules = this.getRules();
    const cleanCat = category.trim();
    if (!cleanCat) return false;

    const existingIdx = rules.findIndex((r) => r.category.toLowerCase() === cleanCat.toLowerCase());
    if (existingIdx !== -1) {
      rules[existingIdx].marginPercent = marginPercent;
      if (description) rules[existingIdx].description = description;
      return this.saveRules(rules);
    }

    rules.push({
      id: `cat-${cleanCat.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      category: cleanCat,
      marginPercent,
      description: description || `Produtos da categoria ${cleanCat}`,
    });
    return this.saveRules(rules);
  },

  deleteRule(category: string): boolean {
    const rules = this.getRules();
    const filtered = rules.filter((r) => r.category.toLowerCase() !== category.toLowerCase());
    return this.saveRules(filtered);
  },

  resetToDefaults(): MarginRule[] {
    this.saveRules(INITIAL_DEFAULT_MARGIN_RULES);
    return INITIAL_DEFAULT_MARGIN_RULES;
  },

  getSuggestedMargin(category: string): number {
    const rules = this.getRules();
    const match = rules.find((r) => r.category.toLowerCase() === (category || '').toLowerCase());
    if (match && typeof match.marginPercent === 'number') {
      return match.marginPercent;
    }
    return 20;
  },

  calculatePriceFromCost(cost: number, marginPercent: number): number {
    if (isNaN(cost) || cost <= 0) return 0;
    const finalPrice = cost * (1 + marginPercent / 100);
    return Math.round(finalPrice * 100) / 100;
  },

  calculateCostFromPrice(price: number, marginPercent: number): number {
    if (isNaN(price) || price <= 0) return 0;
    const cost = price / (1 + marginPercent / 100);
    return Math.round(cost * 100) / 100;
  },
};
