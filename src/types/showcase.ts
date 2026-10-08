export interface StoreShowcaseSettings {
  storeId: string; // Slug único para URL pública, ex: lojasp-123
  userId?: string;
  storeName: string;
  storeLogoUrl: string;
  storeBio?: string;
  whatsapp: string; // Ex: 11999999999
  customMessageTemplate?: string;
  instagramUrl?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShowcaseItem {
  id: string;
  storeId: string;
  title: string;
  brand: string;
  category: string;
  condition: string; // 'Novo Lacrado' | 'Seminovo Impecável' | 'Seminovo Bom' | 'Usado'
  images: string[];
  price: number;
  priceOnRequest: boolean; // Preço a combinar com o lojista
  batteryHealth?: number; // Saúde da bateria % (ex: 88)
  storage?: string; // 64GB, 128GB, 256GB, etc.
  color?: string;
  includesAccessories?: string; // Ex: Caixa original + Carregador
  warrantyDays?: number; // Ex: 90 dias
  description?: string;
  status: 'available' | 'reserved' | 'sold';
  createdAt?: string;
  updatedAt?: string;
}
