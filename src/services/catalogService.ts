import { supabase } from '@/integrations/supabase/client';

export interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  condition: string;
  storage: string;
  ram?: string;
  battery?: string;
  price: number;
  installmentsCount: number;
  installmentValue: number;
  highlight?: string;
  inStock: boolean;
  createdAt: string;
}

export const catalogService = {
  async getDevices(): Promise<CatalogDevice[]> {
    const { data, error } = await supabase
      .from('catalog_devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[catalogService] Erro ao buscar aparelhos:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      condition: row.condition,
      storage: row.storage,
      ram: row.ram || '',
      battery: row.battery || '',
      price: Number(row.price) || 0,
      installmentsCount: Number(row.installments_count) || 12,
      installmentValue: Number(row.installment_value) || (Number(row.price) ? Number(row.price) / (Number(row.installments_count) || 12) : 0),
      highlight: row.highlight || '',
      inStock: row.in_stock ?? true,
      createdAt: row.created_at,
    }));
  },

  async addDevice(device: {
    name: string;
    brand: string;
    condition: string;
    storage: string;
    ram?: string;
    battery?: string;
    price: number;
    installmentsCount?: number;
    highlight?: string;
  }): Promise<CatalogDevice | null> {
    const installments = device.installmentsCount || 12;
    const installmentVal = device.price > 0 ? device.price / installments : 0;

    const { data, error } = await supabase
      .from('catalog_devices')
      .insert({
        name: device.name.trim(),
        brand: device.brand.trim(),
        condition: device.condition.trim(),
        storage: device.storage.trim(),
        ram: device.ram?.trim() || null,
        battery: device.battery?.trim() || null,
        price: device.price,
        installments_count: installments,
        installment_value: installmentVal,
        highlight: device.highlight?.trim() || null,
        in_stock: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[catalogService] Erro ao adicionar aparelho:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      brand: data.brand,
      condition: data.condition,
      storage: data.storage,
      ram: data.ram || '',
      battery: data.battery || '',
      price: Number(data.price),
      installmentsCount: data.installments_count,
      installmentValue: Number(data.installment_value),
      highlight: data.highlight || '',
      inStock: data.in_stock,
      createdAt: data.created_at,
    };
  },

  async deleteDevice(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('catalog_devices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[catalogService] Erro ao deletar aparelho:', error);
      return false;
    }
    return true;
  }
};
