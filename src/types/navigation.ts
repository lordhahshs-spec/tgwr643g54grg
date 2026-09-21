export type TabId =
  | 'venda-android'
  | 'super-ofertas'
  | 'esquemas'
  | 'trade-in';

export interface TabItem {
  id: TabId;
  label: string;
  iconName: string;
  badge?: string;
}

export const NAVIGATION_TABS: TabItem[] = [
  {
    id: 'venda-android',
    label: 'Venda no Boleto',
    iconName: 'Smartphone',
    badge: 'Crediário',
  },
  {
    id: 'super-ofertas',
    label: 'Super Ofertas',
    iconName: 'Flame',
    badge: 'B2B',
  },
  {
    id: 'esquemas',
    label: 'Esquemas Elétricos',
    iconName: 'Cpu',
  },
  {
    id: 'trade-in',
    label: 'Simulador de Troca',
    iconName: 'Repeat',
  },
];
