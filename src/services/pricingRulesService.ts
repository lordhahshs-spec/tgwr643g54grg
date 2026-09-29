export interface MarginRule {
  id: string;
  category: string;
  condition?: string; // Novo, Seminovo, Usado, etc.
  subname?: string;   // Ex: Tipo C, V8, iPhone, etc.
  marginPercent: number; // Ex: 20 -> 20%
  description?: string;
}

const DEFAULT_MARGIN_RULES: MarginRule[] = [
  { id: 'cel-novo', category: 'Celulares', condition: 'Novo', marginPercent: 15, description: 'Smartphones novos lacrados' },
  { id: 'cel-seminovo', category: 'Celulares', condition: 'Seminovo', marginPercent: 20, description: 'Smartphones seminovos grade A' },
  { id: 'cel-usado', category: 'Celulares', condition: 'Usado', marginPercent: 25, description: 'Smartphones usados revisados' },
  { id: 'carr-typec', category: 'Acessórios', subname: 'Carregador Tipo C', marginPercent: 40, description: 'Fontes e cabos USB Tipo-C Turbo' },
  { id: 'carr-v8', category: 'Acessórios', subname: 'Carregador V8', marginPercent: 50, description: 'Fontes e cabos Micro-USB V8' },
  { id: 'acess-novo', category: 'Acessórios', condition: 'Novo', marginPercent: 45, description: 'Capinhas, películas, fones e periféricos' },
  { id: 'telas-novo', category: 'Telas', condition: 'Novo', marginPercent: 30, description: 'Displays OLED, Incell e originais' },
  { id: 'baterias-novo', category: 'Baterias', condition: 'Novo', marginPercent: 35, description: 'Baterias premium e alta capacidade' },
  { id: 'pecas-novo', category: 'Peças', condition: 'Novo', marginPercent: 35, description: 'Câmeras, flex e periféricos' },
  { id: 'conect-novo', category: 'Conectores', condition: 'Novo', marginPercent: 50, description: 'Conectores de carga e solda' },
  { id: 'ferram-novo', category: 'Ferramentas', condition: 'Novo', marginPercent: 25, description: 'Chaves, microscópios e estações' },
  { id: 'maquinas-novo', category: 'Máquinas', condition: 'Novo', marginPercent: 20, description: 'Separadoras, laminadoras e lasers' },
  { id: 'eletro-novo', category: 'Eletrônicos', condition: 'Novo', marginPercent: 25, description: 'Smartwatches, caixas de som e gadgets' },
  { id: 'comp-novo', category: 'Componentes', condition: 'Novo', marginPercent: 35, description: 'ICs, resistores, capacitores e microcomponentes' },
  { id: 'lotes-geral', category: 'Lotes', marginPercent: 18, description: 'Lotes atacado fechados' },
  { id: 'outros-geral', category: 'Outros', marginPercent: 25, description: 'Produtos gerais diversos' },
];

const STORAGE_KEY = 'cellhub_shop_pricing_rules';

export const pricingRulesService = {
  getRules(): MarginRule[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler regras de precificação:', e);
    }
    return DEFAULT_MARGIN_RULES;
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

  updateRule(id: string, marginPercent: number): boolean {
    const rules = this.getRules();
    const idx = rules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      rules[idx].marginPercent = marginPercent;
      return this.saveRules(rules);
    }
    return false;
  },

  addRule(rule: Omit<MarginRule, 'id'>): MarginRule {
    const rules = this.getRules();
    const newRule: MarginRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  },

  deleteRule(id: string): boolean {
    const rules = this.getRules().filter((r) => r.id !== id);
    return this.saveRules(rules);
  },

  resetToDefaults(): MarginRule[] {
    this.saveRules(DEFAULT_MARGIN_RULES);
    return DEFAULT_MARGIN_RULES;
  },

  /**
   * Encontra a margem sugerida para um produto com base em categoria, condição ou título
   */
  getSuggestedMargin(category: string, condition?: string, title?: string): number {
    const rules = this.getRules();
    const lowerTitle = (title || '').toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    const lowerCond = (condition || '').toLowerCase();

    // 1. Regra específica por título/subnome (Ex: Tipo C, V8)
    if (lowerTitle.includes('tipo c') || lowerTitle.includes('tipo-c') || lowerTitle.includes('type c') || lowerTitle.includes('type-c')) {
      const match = rules.find((r) => (r.subname || '').toLowerCase().includes('tipo c'));
      if (match) return match.marginPercent;
    }

    if (lowerTitle.includes('v8') || lowerTitle.includes('micro-usb') || lowerTitle.includes('micro usb')) {
      const match = rules.find((r) => (r.subname || '').toLowerCase().includes('v8'));
      if (match) return match.marginPercent;
    }

    // 2. Regra por categoria + condição
    const matchCatCond = rules.find(
      (r) => r.category.toLowerCase() === lowerCat && (r.condition || '').toLowerCase() === lowerCond
    );
    if (matchCatCond) return matchCatCond.marginPercent;

    // 3. Regra por categoria apenas
    const matchCat = rules.find((r) => r.category.toLowerCase() === lowerCat);
    if (matchCat) return matchCat.marginPercent;

    // 4. Padrão geral
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
