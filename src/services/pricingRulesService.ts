import { OfferCategory } from '@/types/marketplace';

export interface MarginRule {
  id: string;
  category: OfferCategory;
  marginPercent: number; // Ex: 20 -> 20%
  description?: string;
}

export const OFFICIAL_CATEGORIES: OfferCategory[] = [
  'Celulares',
  'Peças',
  'Telas',
  'Baterias',
  'Conectores',
  'Acessórios',
  'Ferramentas',
  'Máquinas',
  'Eletrônicos',
  'Componentes',
  'Lotes',
  'Outros'
];

export const DEFAULT_MARGIN_RULES: MarginRule[] = [
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

const STORAGE_KEY = 'cellhub_shop_pricing_rules_v2';

export const pricingRulesService = {
  getRules(): MarginRule[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantir que todas as 12 categorias oficiais estejam presentes na ordem correta
          const merged = OFFICIAL_CATEGORIES.map((cat) => {
            const found = parsed.find((p: any) => p.category?.toLowerCase() === cat.toLowerCase());
            if (found && typeof found.marginPercent === 'number') {
              return {
                id: `cat-${cat.toLowerCase()}`,
                category: cat,
                marginPercent: found.marginPercent,
                description: found.description || DEFAULT_MARGIN_RULES.find(d => d.category === cat)?.description,
              };
            }
            return DEFAULT_MARGIN_RULES.find(d => d.category === cat)!;
          });
          return merged;
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

  updateRule(category: OfferCategory, marginPercent: number): boolean {
    const rules = this.getRules();
    const idx = rules.findIndex((r) => r.category.toLowerCase() === category.toLowerCase());
    if (idx !== -1) {
      rules[idx].marginPercent = marginPercent;
      return this.saveRules(rules);
    }
    return false;
  },

  resetToDefaults(): MarginRule[] {
    this.saveRules(DEFAULT_MARGIN_RULES);
    return DEFAULT_MARGIN_RULES;
  },

  /**
   * Retorna a porcentagem configurada diretamente para a categoria selecionada
   */
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
