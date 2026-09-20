import { supabase } from '@/integrations/supabase/client';
import { 
  MarketplaceOffer, 
  MarketplaceOrder, 
  MarketplaceFavorite, 
  MarketplaceReport, 
  MarketplaceFeeSettings,
  OfferCategory,
  OfferCondition,
  OfferStatus,
  OrderStatus
} from '@/types/marketplace';

export const marketplaceService = {
  // --- OFERTAS ---
  async getOffers(params?: {
    search?: string;
    category?: OfferCategory | 'Todas';
    condition?: OfferCondition | 'Todas';
    sellerId?: string;
    status?: OfferStatus | 'todas';
    sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'views';
  }): Promise<MarketplaceOffer[]> {
    let query = supabase.from('marketplace_offers').select('*');

    if (params?.sellerId) {
      query = query.eq('seller_id', params.sellerId);
    }

    if (params?.status && params.status !== 'todas') {
      query = query.eq('status', params.status);
    } else if (!params?.sellerId) {
      // Por padrão na vitrine pública mostra apenas publicadas
      query = query.eq('status', 'publicada');
    }

    if (params?.category && params.category !== 'Todas') {
      query = query.eq('category', params.category);
    }

    if (params?.condition && params.condition !== 'Todas') {
      query = query.eq('condition', params.condition);
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,subcategory.ilike.%${term}%`);
    }

    if (params?.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (params?.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (params?.sortBy === 'views') {
      query = query.order('views', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('[marketplaceService] Erro ao carregar ofertas:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      sellerId: item.seller_id,
      sellerCompany: item.seller_company,
      sellerOwner: item.seller_owner,
      title: item.title,
      category: item.category as OfferCategory,
      subcategory: item.subcategory,
      condition: item.condition as OfferCondition,
      description: item.description,
      details: item.details,
      price: Number(item.price),
      freeShipping: Boolean(item.free_shipping),
      shippingCost: Number(item.shipping_cost || 0),
      images: Array.isArray(item.images) ? item.images : [],
      status: item.status as OfferStatus,
      views: Number(item.views || 0),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },

  // Busca exclusivamente ofertas com interações REAIS no banco de dados (views, favoritos ou pedidos)
  async getHotOffers(): Promise<MarketplaceOffer[]> {
    // 1. Busca ofertas publicadas
    const allOffers = await this.getOffers({ status: 'publicada' });
    if (allOffers.length === 0) return [];

    // 2. Busca favoritos reais
    const { data: favs } = await supabase
      .from('marketplace_favorites')
      .select('offer_id');

    // 3. Busca pedidos reais
    const { data: orders } = await supabase
      .from('marketplace_orders')
      .select('offer_id');

    const favCounts: Record<string, number> = {};
    (favs || []).forEach(f => {
      if (f.offer_id) favCounts[f.offer_id] = (favCounts[f.offer_id] || 0) + 1;
    });

    const orderCounts: Record<string, number> = {};
    (orders || []).forEach(o => {
      if (o.offer_id) orderCounts[o.offer_id] = (orderCounts[o.offer_id] || 0) + 1;
    });

    // Calcula pontuação exclusivamente com dados reais existentes
    const scoredOffers = allOffers.map(offer => {
      const realFavorites = favCounts[offer.id] || 0;
      const realOrders = orderCounts[offer.id] || 0;
      const realViews = offer.views || 0;

      // Score puramente baseado em dados reais
      const score = (realOrders * 5) + (realFavorites * 2) + realViews;

      return {
        offer,
        score,
        hasRealInteraction: score > 0
      };
    });

    // Retorna apenas as ofertas que realmente possuem interação real registrada
    const hotList = scoredOffers
      .filter(item => item.hasRealInteraction)
      .sort((a, b) => b.score - a.score)
      .map(item => item.offer);

    return hotList;
  },

  async getOfferById(id: string): Promise<MarketplaceOffer | null> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Incrementa contador de visualizações
    await supabase.rpc('increment_offer_views', { offer_id: id }).catch(async () => {
      // Fallback se a procedure não existir
      await supabase.from('marketplace_offers').update({ views: (data.views || 0) + 1 }).eq('id', id);
    });

    return {
      id: data.id,
      sellerId: data.seller_id,
      sellerCompany: data.seller_company,
      sellerOwner: data.seller_owner,
      title: data.title,
      category: data.category as OfferCategory,
      subcategory: data.subcategory,
      condition: data.condition as OfferCondition,
      description: data.description,
      details: data.details,
      price: Number(data.price),
      freeShipping: Boolean(data.free_shipping),
      shippingCost: Number(data.shipping_cost || 0),
      images: Array.isArray(data.images) ? data.images : [],
      status: data.status as OfferStatus,
      views: Number(data.views || 0) + 1,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async createOffer(offerData: Omit<MarketplaceOffer, 'id' | 'views' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .insert({
        seller_id: offerData.sellerId,
        seller_company: offerData.sellerCompany,
        seller_owner: offerData.sellerOwner,
        title: offerData.title,
        category: offerData.category,
        subcategory: offerData.subcategory,
        condition: offerData.condition,
        description: offerData.description,
        details: offerData.details,
        price: offerData.price,
        free_shipping: offerData.freeShipping,
        shipping_cost: offerData.shippingCost || 0,
        images: offerData.images,
        status: offerData.status || 'publicada',
        views: 0
      })
      .select('id')
      .single();

    if (error) {
      console.error('[marketplaceService] Erro ao cadastrar oferta:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  },

  async updateOffer(id: string, updates: Partial<MarketplaceOffer>): Promise<boolean> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.subcategory !== undefined) payload.subcategory = updates.subcategory;
    if (updates.condition !== undefined) payload.condition = updates.condition;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.details !== undefined) payload.details = updates.details;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.freeShipping !== undefined) payload.free_shipping = updates.freeShipping;
    if (updates.shippingCost !== undefined) payload.shipping_cost = updates.shippingCost;
    if (updates.images !== undefined) payload.images = updates.images;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('marketplace_offers')
      .update(payload)
      .eq('id', id);

    return !error;
  },

  async deleteOffer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_offers')
      .delete()
      .eq('id', id);

    return !error;
  },

  // --- FAVORITOS ---
  async getFavorites(userId: string): Promise<string[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('marketplace_favorites')
      .select('offer_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map(item => item.offer_id);
  },

  async toggleFavorite(userId: string, offerId: string): Promise<boolean> {
    if (!userId || !offerId) return false;

    const { data } = await supabase
      .from('marketplace_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (data) {
      await supabase.from('marketplace_favorites').delete().eq('id', data.id);
      return false; // removido
    } else {
      await supabase.from('marketplace_favorites').insert({ user_id: userId, offer_id: offerId });
      return true; // adicionado
    }
  },

  // --- PEDIDOS / CHECKOUT B2B ---
  async createOrder(order: Omit<MarketplaceOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .insert({
        offer_id: order.offerId || null,
        buyer_id: order.buyerId,
        buyer_company: order.buyerCompany,
        buyer_owner: order.buyerOwner,
        buyer_email: order.buyerEmail,
        buyer_cnpj: order.buyerCnpj,
        seller_id: order.sellerId,
        seller_company: order.sellerCompany,
        product_title: order.productTitle,
        product_image: order.productImage,
        product_price: order.productPrice,
        shipping_cost: order.shippingCost,
        platform_fee_percent: order.platformFeePercent,
        platform_fee_amount: order.platformFeeAmount,
        seller_net_amount: order.sellerNetAmount,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        order_status: order.orderStatus,
        shipping_address: order.shippingAddress,
        tracking_code: order.trackingCode || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('[marketplaceService] Erro ao criar pedido:', error);
      return { success: false, error: error.message };
    }

    // Se o pedido foi concluído com sucesso e tinha uma oferta associada, marca a oferta como vendida
    if (order.offerId) {
      await supabase
        .from('marketplace_offers')
        .update({ status: 'vendida', updated_at: new Date().toISOString() })
        .eq('id', order.offerId);
    }

    return { success: true, orderId: data.id };
  },

  async getBuyerOrders(buyerId: string): Promise<MarketplaceOrder[]> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapOrderRecord);
  },

  async getSellerOrders(sellerId: string): Promise<MarketplaceOrder[]> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapOrderRecord);
  },

  async getAllOrders(): Promise<MarketplaceOrder[]> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapOrderRecord);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingCode?: string): Promise<boolean> {
    const payload: any = { order_status: status, updated_at: new Date().toISOString() };
    if (trackingCode !== undefined) {
      payload.tracking_code = trackingCode;
    }
    const { error } = await supabase
      .from('marketplace_orders')
      .update(payload)
      .eq('id', orderId);

    return !error;
  },

  // --- DENÚNCIAS & MODERAÇÃO ---
  async reportOffer(report: Omit<MarketplaceReport, 'id' | 'createdAt' | 'status'>): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_reports')
      .insert({
        offer_id: report.offerId,
        offer_title: report.offerTitle,
        reported_by_user_id: report.reportedByUserId,
        reported_by_company: report.reportedByCompany,
        reason: report.reason,
        details: report.details || null,
        status: 'pendente'
      });

    return !error;
  },

  async getReports(): Promise<MarketplaceReport[]> {
    const { data, error } = await supabase
      .from('marketplace_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(item => ({
      id: item.id,
      offerId: item.offer_id,
      offerTitle: item.offer_title,
      reportedByUserId: item.reported_by_user_id,
      reportedByCompany: item.reported_by_company,
      reason: item.reason,
      details: item.details,
      status: item.status,
      createdAt: item.created_at
    }));
  },

  async updateReportStatus(reportId: string, status: 'pendente' | 'resolvido' | 'descartado'): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_reports')
      .update({ status })
      .eq('id', reportId);

    return !error;
  },

  // --- CONFIGURAÇÕES DE TAXA DE PLATAFORMA ---
  async getFeeSettings(): Promise<MarketplaceFeeSettings> {
    const { data, error } = await supabase
      .from('marketplace_settings')
      .select('*')
      .eq('id', 'config')
      .maybeSingle();

    if (error || !data) {
      return { defaultFeePercent: 6.5, pixDiscountPercent: 0 };
    }

    return {
      defaultFeePercent: Number(data.default_fee_percent || 6.5),
      pixDiscountPercent: Number(data.pix_discount_percent || 0)
    };
  },

  async updateFeeSettings(settings: MarketplaceFeeSettings): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_settings')
      .upsert({
        id: 'config',
        default_fee_percent: settings.defaultFeePercent,
        pix_discount_percent: settings.pixDiscountPercent,
        updated_at: new Date().toISOString()
      });

    return !error;
  },

  mapOrderRecord(item: any): MarketplaceOrder {
    return {
      id: item.id,
      offerId: item.offer_id,
      buyerId: item.buyer_id,
      buyerCompany: item.buyer_company,
      buyerOwner: item.buyer_owner,
      buyerEmail: item.buyer_email,
      buyerCnpj: item.buyer_cnpj,
      sellerId: item.seller_id,
      sellerCompany: item.seller_company,
      productTitle: item.product_title,
      productImage: item.product_image,
      productPrice: Number(item.product_price),
      shippingCost: Number(item.shipping_cost || 0),
      platformFeePercent: Number(item.platform_fee_percent || 0),
      platformFeeAmount: Number(item.platform_fee_amount || 0),
      sellerNetAmount: Number(item.seller_net_amount || 0),
      totalAmount: Number(item.total_amount || 0),
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      shippingAddress: item.shipping_address,
      trackingCode: item.tracking_code,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }
};
