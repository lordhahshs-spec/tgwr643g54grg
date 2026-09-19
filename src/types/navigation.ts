export type TabId = 
  | 'venda-android'
  | 'cursos'
  | 'esquemas'
  | 'catalogo'
  | 'trade-in'
  | 'calculadora-lucro';

export interface TabItem {
  id: TabId;
  label: string;
  shortLabel?: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  iconName: string;
  category: 'principal' | 'vendas' | 'tecnico';
}

export const NAVIGATION_TABS: TabItem[] = [
  {
    id: 'venda-android',
    label: 'Venda de Android',
    shortLabel: 'Android',
    badge: 'Aurus Simulador',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Simulador oficial AurusSmart integrado em tempo real',
    iconName: 'Smartphone',
    category: 'principal',
  },
  {
    id: 'cursos',
    label: 'Cursos & Treinamentos',
    shortLabel: 'Cursos',
    badge: 'Capacitação',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    description: 'Aulas práticas de manutenção, troca de vidro e vendas',
    iconName: 'GraduationCap',
    category: 'tecnico',
  },
  {
    id: 'esquemas',
    label: 'Esquemas Elétricos',
    shortLabel: 'Esquemas',
    badge: 'Técnico',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Manuais de serviço, diagramas de placa e linhas de tensão',
    iconName: 'Cpu',
    category: 'tecnico',
  },
  {
    id: 'catalogo',
    label: 'Catálogo de Aparelhos',
    shortLabel: 'Catálogo',
    badge: 'Pronta Entrega',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Smartphones Android e iPhones com garantia e parcelas',
    iconName: 'ShoppingBag',
    category: 'vendas',
  },
  {
    id: 'trade-in',
    label: 'Simulador de Troca (Trade-In)',
    shortLabel: 'Trade-In',
    badge: 'Avaliação',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Calcule o valor do aparelho usado do cliente na troca',
    iconName: 'Repeat',
    category: 'vendas',
  },
  {
    id: 'calculadora-lucro',
    label: 'Calculadora de Margem',
    shortLabel: 'Margem',
    description: 'Simulação de lucro, taxa de cartão e comissão por aparelho',
    iconName: 'Calculator',
    category: 'vendas',
  },
];
