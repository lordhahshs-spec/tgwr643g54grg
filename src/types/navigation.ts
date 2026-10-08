export type TabId =
  | 'venda-android'
  | 'cell-shop'
  | 'super-ofertas'
  | 'esquemas'
  | 'trade-in'
  | 'vitrine-virtual';

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
    id: 'cell-shop',
    label: 'CellHub Shop',
    iconName: 'ShoppingBag',
    badge: 'Oficial',
  },
  {
    id: 'super-ofertas',
    label: 'Super Ofertas',
    iconName: 'Flame',
    badge: 'B2B Lojistas',
  },
  {
    id: 'esquemas',
    label: 'Esquemas Elétricos',
    iconName: 'Cpu',
  },
  {
    id: 'trade-in',
    label: 'Avaliação de Aparelho',
    iconName: 'Repeat',
  },
  {
    id: 'vitrine-virtual',
    label: 'Vitrine Virtual',
    iconName: 'Store',
    badge: 'LINK CLIENTE',
  },
];
