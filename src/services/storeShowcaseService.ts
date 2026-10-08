import { supabase } from '@/integrations/supabase/client';
import { StoreShowcaseSettings, ShowcaseItem } from '@/types/showcase';
import { leadAuthService } from '@/services/leadAuthService';

const SHOWCASE_SETTINGS_KEY = 'cellhub_store_showcase_settings';
const SHOWCASE_ITEMS_KEY = 'cellhub_store_showcase_items';

export const storeShowcaseService = {
  // Helper para gerar slug a partir do nome da loja ou ID do usuário
  getStoreSlug(user?: any): string {
    const u = user || leadAuthService.getCurrentUser();
    if (!u) return 'loja-cellhub';
    const base = (u.tradeName || u.companyName || 'minha-loja')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = (u.id || u.cnpj || '00').toString().slice(-4).replace(/\D/g, '99');
    return `${base || 'loja'}-${suffix}`;
  },

  // Obter configurações da vitrine (Supabase + localStorage fallback)
  async getStoreShowcase(storeId: string): Promise<StoreShowcaseSettings | null> {
    try {
      const { data, error } = await supabase
        .from('store_showcases')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (data && !error) {
        const mapped: StoreShowcaseSettings = {
          storeId: data.store_id,
          userId: data.user_id,
          storeName: data.store_name,
          storeLogoUrl: data.store_logo_url || '',
          storeBio: data.store_bio || '',
          whatsapp: data.whatsapp || '',
          customMessageTemplate: data.custom_message_template || '',
          instagramUrl: data.instagram_url || '',
          address: data.address || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        localStorage.setItem(`${SHOWCASE_SETTINGS_KEY}_${storeId}`, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Erro ao carregar vitrine no Supabase, usando cache local:', e);
    }

    // Fallback localStorage
    const cached = localStorage.getItem(`${SHOWCASE_SETTINGS_KEY}_${storeId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    return null;
  },

  // Salvar configurações da vitrine
  async saveStoreShowcase(settings: StoreShowcaseSettings): Promise<StoreShowcaseSettings> {
    const payload = {
      store_id: settings.storeId,
      user_id: settings.userId || null,
      store_name: settings.storeName,
      store_logo_url: settings.storeLogoUrl,
      store_bio: settings.storeBio || null,
      whatsapp: settings.whatsapp,
      custom_message_template: settings.customMessageTemplate || null,
      instagram_url: settings.instagramUrl || null,
      address: settings.address || null,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(`${SHOWCASE_SETTINGS_KEY}_${settings.storeId}`, JSON.stringify(settings));

    try {
      const { data, error } = await supabase
        .from('store_showcases')
        .upsert(payload, { onConflict: 'store_id' })
        .select()
        .single();

      if (!error && data) {
        return {
          ...settings,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Erro ao salvar no Supabase, dados mantidos em cache local:', e);
    }

    return settings;
  },

  // Obter itens da vitrine da loja
  async getItems(storeId: string): Promise<ShowcaseItem[]> {
    try {
      const { data, error } = await supabase
        .from('showcase_items')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const items: ShowcaseItem[] = data.map((d: any) => ({
          id: d.id,
          storeId: d.store_id,
          title: d.title,
          brand: d.brand || 'Outros',
          category: d.category || 'Smartphones',
          condition: d.condition || 'Seminovo Impecável',
          images: Array.isArray(d.images) ? d.images : [],
          price: Number(d.price || 0),
          priceOnRequest: Boolean(d.price_on_request),
          batteryHealth: d.battery_health ? Number(d.battery_health) : undefined,
          storage: d.storage || '',
          color: d.color || '',
          includesAccessories: d.includes_accessories || '',
          warrantyDays: d.warranty_days ? Number(d.warranty_days) : 90,
          description: d.description || '',
          status: (d.status as any) || 'available',
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        localStorage.setItem(`${SHOWCASE_ITEMS_KEY}_${storeId}`, JSON.stringify(items));
        return items;
      }
    } catch (e) {
      console.warn('Erro ao carregar itens do Supabase, usando cache local:', e);
    }

    // Fallback localStorage
    const cached = localStorage.getItem(`${SHOWCASE_ITEMS_KEY}_${storeId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }

    return [];
  },

  // Salvar ou Atualizar Item na Vitrine
  async saveItem(item: Omit<ShowcaseItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ShowcaseItem> {
    const id = item.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const completeItem: ShowcaseItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Cache local imediato
    const currentList = await this.getItems(item.storeId);
    const existingIndex = currentList.findIndex((i) => i.id === id);
    let updatedList: ShowcaseItem[];
    if (existingIndex >= 0) {
      updatedList = [...currentList];
      updatedList[existingIndex] = completeItem;
    } else {
      updatedList = [completeItem, ...currentList];
    }
    localStorage.setItem(`${SHOWCASE_ITEMS_KEY}_${item.storeId}`, JSON.stringify(updatedList));

    // Supabase
    try {
      const payload = {
        id,
        store_id: item.storeId,
        title: item.title,
        brand: item.brand,
        category: item.category,
        condition: item.condition,
        images: item.images,
        price: item.price,
        price_on_request: item.priceOnRequest,
        battery_health: item.batteryHealth || null,
        storage: item.storage || null,
        color: item.color || null,
        includes_accessories: item.includesAccessories || null,
        warranty_days: item.warrantyDays || 90,
        description: item.description || null,
        status: item.status,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('showcase_items')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        return completeItem;
      }
    } catch (e) {
      console.warn('Erro ao salvar item no Supabase, salvo localmente:', e);
    }

    return completeItem;
  },

  // Excluir Item
  async deleteItem(itemId: string, storeId: string): Promise<void> {
    // Atualiza local
    const currentList = await this.getItems(storeId);
    const filtered = currentList.filter((i) => i.id !== itemId);
    localStorage.setItem(`${SHOWCASE_ITEMS_KEY}_${storeId}`, JSON.stringify(filtered));

    try {
      await supabase.from('showcase_items').delete().eq('id', itemId);
    } catch (e) {
      console.warn('Erro ao deletar no Supabase:', e);
    }
  },

  // Gerar link direto do WhatsApp com mensagem pronta do item
  generateWhatsAppLink(item: ShowcaseItem, settings: StoreShowcaseSettings): string {
    const rawNumber = (settings.whatsapp || '').replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;

    const priceText = item.priceOnRequest
      ? 'A combinar'
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price);

    let detailsText = '';
    if (item.storage) detailsText += ` (${item.storage})`;
    if (item.batteryHealth) detailsText += ` • Bateria ${item.batteryHealth}%`;
    if (item.color) detailsText += ` • Cor ${item.color}`;

    const text = `Olá! Vi na sua vitrine virtual e tenho interesse no aparelho:
📱 *${item.title}*${detailsText}
🏷️ *Condição:* ${item.condition}
💰 *Valor:* ${priceText}
${item.includesAccessories ? `📦 *Acompanha:* ${item.includesAccessories}\n` : ''}${item.warrantyDays ? `🛡️ *Garantia:* ${item.warrantyDays} dias\n` : ''}
Pode me passar mais informações ou confirmar se ainda está disponível?`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  },
};
