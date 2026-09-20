export type TabId = 
  | 'super-ofertas'
  | 'venda-android'
  | 'cursos'
  | 'esquemas'
  | 'catalogo'
  | 'trade-in'
  | 'calculadora-lucro';

export interface TabItem {
  id: TabId;
  label: string;
  iconName: string;
  badge?: string;
}

export const NAVIGATION_TABS: TabItem[] = [
  {
    id: 'super-ofertas',
    label: 'Super Ofertas',
    iconName: 'Flame',
    badge: 'B2B',
  },
  {
    id: 'venda-android',
    label: 'Venda de Android',
    iconName: 'Smartphone',
  },
  {
    id: 'cursos',
    label: 'Cursos',
    iconName: 'GraduationCap',
  },
  {
    id: 'esquemas',
    label: 'Esquemas Elétricos',
    iconName: 'Cpu',
  },
  {
    id: 'catalogo',
    label: 'Catálogo de Celulares',
    iconName: 'ShoppingBag',
  },
  {
    id: 'trade-in',
    label: 'Simulador de Troca',
    iconName: 'Repeat',
  },
  {
    id: 'calculadora-lucro',
    label: 'Calculadora de Margem',
    iconName: 'Calculator',
  },
];
