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
  OrderStatus,
  ShippingAddress,
  ShippingPackage,
  ShippingQuote,
  ShippingStatus,
  ShippingPolicy
} from '@/types/marketplace';

const isUuid = (val?: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');
};

// Cache ultra-rápido em memória e localStorage para resposta instantânea (0ms)
const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 3000; // 3 segundos

const getCached = <T>(key: string): T | null => {
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.timestamp < CACHE_TTL_MS) {
    return hit.data as T;
  }
  // Fallback para localStorage persistente
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.set(key, { timestamp: Date.now(), data: parsed });
        return parsed as T;
      }
    }
  } catch (e) {
    // ignora erro de parse
  }
  return null;
};

const setCached = (key: string, data: any) => {
  memoryCache.set(key, { timestamp: Date.now(), data });
  try {
    if (data && (Array.isArray(data) ? data.length > 0 : true)) {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    }
  } catch (e) {
    // quota exceeded safety
  }
};

export const clearMarketplaceCache = () => {
  memoryCache.clear();
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_')) localStorage.removeItem(k);
    });
  } catch (e) {}
};

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
    const cacheKey = `offers_${JSON.stringify(params || {})}`;
    const cached = getCached<MarketplaceOffer[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let query = supabase.from('marketplace_offers').select('*');

    if (params?.sellerId && isUuid(params.sellerId)) {
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

    const offersRes = await query;

    if (offersRes.error) {
      console.error('[marketplaceService] Erro ao carregar ofertas:', offersRes.error);
      return [];
    }

    const data = offersRes.data || [];
    if (data.length === 0) {
      setCached(cacheKey, []);
      return [];
    }

    const offerIds = data.map(item => item.id);

    // Se a busca for específica de um vendedor (ex: Painel Minhas Ofertas),
    // pula requisições de métricas extras para resposta instantânea (<20ms)
    let salesMap: Record<string, number> = {};
    let reviewsMap: Record<string, { total: number; count: number }> = {};

    if (!params?.sellerId && offerIds.length > 0) {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          supabase.from('marketplace_orders').select('offer_id').in('offer_id', offerIds),
          supabase.from('marketplace_reviews').select('offer_id, rating').in('offer_id', offerIds)
        ]);

        const orders = ordersRes.data || [];
        const reviews = reviewsRes.data || [];

        orders.forEach(o => {
          if (o.offer_id) salesMap[o.offer_id] = (salesMap[o.offer_id] || 0) + 1;
        });

        reviews.forEach(r => {
          if (r.offer_id) {
            if (!reviewsMap[r.offer_id]) reviewsMap[r.offer_id] = { total: 0, count: 0 };
            reviewsMap[r.offer_id].total += Number(r.rating || 0);
            reviewsMap[r.offer_id].count += 1;
          }
        });
      } catch (err) {
        console.warn('[marketplaceService] Aviso ao carregar métricas secundárias:', err);
      }
    }

    const mappedOffers: MarketplaceOffer[] = (data || []).map(item => {
      const revData = reviewsMap[item.id];
      const avgRating = revData && revData.count > 0
        ? Number((revData.total / revData.count).toFixed(1))
        : null;

      return {
        id: item.id,
        sellerId: item.seller_id,
        sellerCompany: item.seller_company,
        sellerOwner: item.seller_owner,
        sellerEmail: item.seller_email || undefined,
        sellerCnpj: item.seller_cnpj || undefined,
        title: item.title,
        category: item.category as OfferCategory,
        subcategory: item.subcategory,
        condition: item.condition as OfferCondition,
        description: item.description,
        details: item.details,
        price: Number(item.price),
        freeShipping: Boolean(item.free_shipping),
        shippingCost: Number(item.shipping_cost || 0),
        shippingPolicy: (item.shipping_policy as ShippingPolicy) || (item.free_shipping ? 'frete_gratis' : 'comprador_paga'),
        packageWeight: Number(item.package_weight || 0.5),
        packageHeight: Number(item.package_height || 8),
        packageWidth: Number(item.package_width || 15),
        packageLength: Number(item.package_length || 20),
        originZipCode: item.origin_zip_code || undefined,
        originStreet: item.origin_street || undefined,
        originNumber: item.origin_number || undefined,
        originComplement: item.origin_complement || undefined,
        originNeighborhood: item.origin_neighborhood || undefined,
        originCity: item.origin_city || undefined,
        originState: item.origin_state || undefined,
        images: Array.isArray(item.images) ? item.images : [],
        status: item.status as OfferStatus,
        views: Number(item.views || 0),
        salesCount: salesMap[item.id] || 0,
        rating: avgRating,
        reviewsCount: revData?.count || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    setCached(cacheKey, mappedOffers);
    return mappedOffers;
  },

  async getHotOffers(): Promise<MarketplaceOffer[]> {
    const allOffers = await this.getOffers({ status: 'publicada' });
    if (allOffers.length === 0) return [];

    const { data: favs } = await supabase.from('marketplace_favorites').select('offer_id');
    const { data: orders } = await supabase.from('marketplace_orders').select('offer_id');

    const favCounts: Record<string, number> = {};
    (favs || []).forEach(f => {
      if (f.offer_id) favCounts[f.offer_id] = (favCounts[f.offer_id] || 0) + 1;
    });

    const orderCounts: Record<string, number> = {};
    (orders || []).forEach(o => {
      if (o.offer_id) orderCounts[o.offer_id] = (orderCounts[o.offer_id] || 0) + 1;
    });

    const scoredOffers = allOffers.map(offer => {
      const realFavorites = favCounts[offer.id] || 0;
      const realOrders = orderCounts[offer.id] || 0;
      const realViews = offer.views || 0;
      const score = (realOrders * 5) + (realFavorites * 2) + realViews;

      return { offer, score, hasRealInteraction: score > 0 };
    });

    return scoredOffers
      .filter(item => item.hasRealInteraction)
      .sort((a, b) => b.score - a.score)
      .map(item => item.offer);
  },

  async getOfferById(id: string): Promise<MarketplaceOffer | null> {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    await supabase.from('marketplace_offers').update({ views: (data.views || 0) + 1 }).eq('id', id);

    const { count: ordersCount } = await supabase
      .from('marketplace_orders')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', id);

    const { data: revList } = await supabase
      .from('marketplace_reviews')
      .select('rating')
      .eq('offer_id', id);

    const revTotal = (revList || []).reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
    const revCount = (revList || []).length;
    const avgRating = revCount > 0 ? Number((revTotal / revCount).toFixed(1)) : null;

    return {
      id: data.id,
      sellerId: data.seller_id,
      sellerCompany: data.seller_company,
      sellerOwner: data.seller_owner,
      sellerEmail: data.seller_email || undefined,
      sellerCnpj: data.seller_cnpj || undefined,
      title: data.title,
      category: data.category as OfferCategory,
      subcategory: data.subcategory,
      condition: data.condition as OfferCondition,
      description: data.description,
      details: data.details,
      price: Number(data.price),
      freeShipping: Boolean(data.free_shipping),
      shippingCost: Number(data.shipping_cost || 0),
      shippingPolicy: (data.shipping_policy as ShippingPolicy) || (data.free_shipping ? 'frete_gratis' : 'comprador_paga'),
      packageWeight: Number(data.package_weight || 0.5),
      packageHeight: Number(data.package_height || 8),
      packageWidth: Number(data.package_width || 15),
      packageLength: Number(data.package_length || 20),
      originZipCode: data.origin_zip_code || undefined,
      originStreet: data.origin_street || undefined,
      originNumber: data.origin_number || undefined,
      originComplement: data.origin_complement || undefined,
      originNeighborhood: data.origin_neighborhood || undefined,
      originCity: data.origin_city || undefined,
      originState: data.origin_state || undefined,
      images: Array.isArray(data.images) ? data.images : [],
      status: data.status as OfferStatus,
      views: Number(data.views || 0) + 1,
      salesCount: ordersCount || 0,
      rating: avgRating,
      reviewsCount: revCount,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  mapOfferRaw(item: any): MarketplaceOffer {
    return {
      id: item.id,
      sellerId: item.seller_id,
      sellerCompany: item.seller_company,
      sellerOwner: item.seller_owner,
      sellerEmail: item.seller_email || undefined,
      sellerCnpj: item.seller_cnpj || undefined,
      title: item.title,
      category: item.category as OfferCategory,
      subcategory: item.subcategory,
      condition: item.condition as OfferCondition,
      description: item.description,
      details: item.details,
      price: Number(item.price),
      freeShipping: Boolean(item.free_shipping),
      shippingCost: Number(item.shipping_cost || 0),
      shippingPolicy: (item.shipping_policy as ShippingPolicy) || (item.free_shipping ? 'frete_gratis' : 'comprador_paga'),
      packageWeight: Number(item.package_weight || 0.5),
      packageHeight: Number(item.package_height || 8),
      packageWidth: Number(item.package_width || 15),
      packageLength: Number(item.package_length || 20),
      originZipCode: item.origin_zip_code || undefined,
      originStreet: item.origin_street || undefined,
      originNumber: item.origin_number || undefined,
      originComplement: item.origin_complement || undefined,
      originNeighborhood: item.origin_neighborhood || undefined,
      originCity: item.origin_city || undefined,
      originState: item.origin_state || undefined,
      images: Array.isArray(item.images) ? item.images : [],
      status: item.status as OfferStatus,
      views: Number(item.views || 0),
      salesCount: 0,
      rating: null,
      reviewsCount: 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  },

  async getOffersByIds(ids: string[]): Promise<MarketplaceOffer[]> {
    if (!ids || ids.length === 0) return [];
    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) return [];

    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('*')
      .in('id', validIds);

    if (error || !data) return [];
    return data.map(item => this.mapOfferRaw(item));
  },

  async createOffer(offerData: Omit<MarketplaceOffer, 'id' | 'views' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    let resolvedSellerId: string | null = isUuid(offerData.sellerId) ? offerData.sellerId! : null;

    if (!resolvedSellerId) {
      const { data: userAccounts } = await supabase
        .from('user_accounts')
        .select('id, email')
        .limit(10);

      const found = (userAccounts || []).find(u =>
        offerData.sellerCompany && u.email && isUuid(u.id)
      );
      if (found) {
        resolvedSellerId = found.id;
      }
    }

    const { data, error } = await supabase
      .from('marketplace_offers')
      .insert({
        seller_id: resolvedSellerId,
        seller_company: offerData.sellerCompany,
        seller_owner: offerData.sellerOwner,
        seller_email: offerData.sellerEmail || null,
        seller_cnpj: offerData.sellerCnpj || null,
        title: offerData.title,
        category: offerData.category,
        subcategory: offerData.subcategory,
        condition: offerData.condition,
        description: offerData.description,
        details: offerData.details,
        price: offerData.price,
        free_shipping: offerData.freeShipping,
        shipping_cost: offerData.shippingCost || 0,
        shipping_policy: offerData.shippingPolicy || (offerData.freeShipping ? 'frete_gratis' : 'comprador_paga'),
        package_weight: offerData.packageWeight || 0.5,
        package_height: offerData.packageHeight || 8,
        package_width: offerData.packageWidth || 15,
        package_length: offerData.packageLength || 20,
        origin_zip_code: offerData.originZipCode || null,
        origin_street: offerData.originStreet || null,
        origin_number: offerData.originNumber || null,
        origin_complement: offerData.originComplement || null,
        origin_neighborhood: offerData.originNeighborhood || null,
        origin_city: offerData.originCity || null,
        origin_state: offerData.originState || null,
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

    clearMarketplaceCache();
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
    if (updates.shippingPolicy !== undefined) payload.shipping_policy = updates.shippingPolicy;
    if (updates.packageWeight !== undefined) payload.package_weight = updates.packageWeight;
    if (updates.packageHeight !== undefined) payload.package_height = updates.packageHeight;
    if (updates.packageWidth !== undefined) payload.package_width = updates.packageWidth;
    if (updates.packageLength !== undefined) payload.package_length = updates.packageLength;
    if (updates.originZipCode !== undefined) payload.origin_zip_code = updates.originZipCode;
    if (updates.originStreet !== undefined) payload.origin_street = updates.originStreet;
    if (updates.originNumber !== undefined) payload.origin_number = updates.originNumber;
    if (updates.originComplement !== undefined) payload.origin_complement = updates.originComplement;
    if (updates.originNeighborhood !== undefined) payload.origin_neighborhood = updates.originNeighborhood;
    if (updates.originCity !== undefined) payload.origin_city = updates.originCity;
    if (updates.originState !== undefined) payload.origin_state = updates.originState;
    if (updates.images !== undefined) payload.images = updates.images;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('marketplace_offers')
      .update(payload)
      .eq('id', id);

    if (!error) clearMarketplaceCache();
    return !error;
  },

  async deleteOffer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_offers')
      .delete()
      .eq('id', id);

    if (!error) clearMarketplaceCache();
    return !error;
  },

  // --- SELLER SHIPPING ADDRESS (ORIGIN) ---
  async getSellerOriginAddress(userId: string): Promise<ShippingAddress | null> {
    if (!userId || !isUuid(userId)) return null;

    const { data } = await supabase
      .from('user_accounts')
      .select('shipping_zip_code, shipping_street, shipping_number, shipping_complement, shipping_neighborhood, shipping_city, shipping_state, shipping_phone, company_name, owner_name, email, cnpj')
      .eq('id', userId)
      .maybeSingle();

    if (!data || !data.shipping_zip_code) return null;

    return {
      zipCode: data.shipping_zip_code,
      street: data.shipping_street || '',
      number: data.shipping_number || '',
      complement: data.shipping_complement || '',
      neighborhood: data.shipping_neighborhood || '',
      city: data.shipping_city || '',
      state: data.shipping_state || '',
      phone: data.shipping_phone || '',
      name: data.owner_name || data.company_name || '',
      email: data.email || '',
      cnpj: data.cnpj || '',
    };
  },

  async saveSellerOriginAddress(userId: string, address: ShippingAddress): Promise<boolean> {
    if (!userId || !isUuid(userId)) return false;

    const { error } = await supabase
      .from('user_accounts')
      .update({
        shipping_zip_code: address.zipCode,
        shipping_street: address.street,
        shipping_number: address.number,
        shipping_complement: address.complement || null,
        shipping_neighborhood: address.neighborhood,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_phone: address.phone || null,
      })
      .eq('id', userId);

    return !error;
  },

  // --- FAVORITOS ---
  async getFavorites(userId: string): Promise<string[]> {
    if (!userId || !isUuid(userId)) return [];
    const { data, error } = await supabase
      .from('marketplace_favorites')
      .select('offer_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map(item => item.offer_id);
  },

  async toggleFavorite(userId: string, offerId: string): Promise<boolean> {
    if (!userId || !offerId || !isUuid(userId) || !isUuid(offerId)) return false;

    const { data } = await supabase
      .from('marketplace_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (data) {
      await supabase.from('marketplace_favorites').delete().eq('id', data.id);
      return false;
    } else {
      await supabase.from('marketplace_favorites').insert({ user_id: userId, offer_id: offerId });
      return true;
    }
  },

  // --- PEDIDOS / CHECKOUT B2B COM SEPARAÇÃO FINANCEIRA E SNAPSHOTS ---
  async createOrder(order: Omit<MarketplaceOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const productAmount = Number(order.productAmount ?? order.productPrice);
    const shippingCharged = Number(order.shippingAmountCharged ?? order.shippingCost ?? 0);
    const actualCost = Number(order.actualShippingCost ?? 0);
    const sellerShippingCost = Number(order.sellerShippingCost ?? 0);
    const shippingDiff = shippingCharged - actualCost;

    const { data, error } = await supabase
      .from('marketplace_orders')
      .insert({
        offer_id: isUuid(order.offerId) ? order.offerId : null,
        buyer_id: isUuid(order.buyerId) ? order.buyerId : null,
        buyer_company: order.buyerCompany,
        buyer_owner: order.buyerOwner,
        buyer_email: order.buyerEmail,
        buyer_cnpj: order.buyerCnpj,
        seller_id: isUuid(order.sellerId) ? order.sellerId : null,
        seller_company: order.sellerCompany,
        product_title: order.productTitle,
        product_image: order.productImage,
        product_price: productAmount,
        shipping_cost: shippingCharged,
        platform_fee_percent: order.platformFeePercent,
        platform_fee_amount: order.platformFeeAmount,
        seller_net_amount: order.sellerNetAmount,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        order_status: order.orderStatus,
        shipping_address: order.shippingAddress,

        // Campos financeiros separados e auditados
        product_amount: productAmount,
        shipping_amount_charged: shippingCharged,
        actual_shipping_cost: actualCost,
        seller_shipping_cost: sellerShippingCost,
        shipping_difference: shippingDiff,

        // Snapshots imutáveis de endereço e cotação
        shipping_origin_snapshot: order.shippingOriginSnapshot || null,
        shipping_destination_snapshot: order.shippingDestinationSnapshot || order.shippingAddress || null,
        shipping_package_snapshot: order.shippingPackageSnapshot || null,
        shipping_quote_snapshot: order.shippingQuoteSnapshot || null,
        
        // Identificadores de logística
        melhor_envio_shipment_id: order.melhorEnvioShipmentId || null,
        melhor_envio_protocol: order.melhorEnvioProtocol || null,
        melhor_envio_label_url: order.melhorEnvioLabelUrl || null,
        melhor_envio_print_url: order.melhorEnvioPrintUrl || null,
        tracking_code: order.trackingCode || null,
        tracking_status: order.trackingStatus || null,
        shipping_status: order.shippingStatus || 'aguardando_pagamento',
        shipping_error: order.shippingError || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[marketplaceService] Erro ao criar pedido:', error);
      return { success: false, error: error.message };
    }

    // Se o pedido teve sucesso e oferta associada, marca a oferta como vendida
    if (order.offerId && isUuid(order.offerId)) {
      await supabase
        .from('marketplace_offers')
        .update({ status: 'vendida', updated_at: new Date().toISOString() })
        .eq('id', order.offerId);
    }

    // Registra log inicial de pedido
    await supabase.from('shipping_logs').insert({
      order_id: data.id,
      event: 'order_created',
      status: 'info',
      message: `Pedido criado com sucesso. Frete cobrado: R$ ${shippingCharged.toFixed(2)}`,
      payload: {
        product_amount: productAmount,
        shipping_charged: shippingCharged,
        payment_method: order.paymentMethod,
      },
    });

    clearMarketplaceCache();
    return { success: true, orderId: data.id };
  },

  async getBuyerOrders(buyerId: string): Promise<MarketplaceOrder[]> {
    if (!buyerId || !isUuid(buyerId)) return [];
    const cacheKey = `buyer_orders_${buyerId}`;
    const cached = getCached<MarketplaceOrder[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    const mapped = data.map(this.mapOrderRecord);
    setCached(cacheKey, mapped);
    return mapped;
  },

  async getSellerOrders(sellerId: string): Promise<MarketplaceOrder[]> {
    if (!sellerId || !isUuid(sellerId)) return [];
    const cacheKey = `seller_orders_${sellerId}`;
    const cached = getCached<MarketplaceOrder[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    const mapped = data.map(this.mapOrderRecord);
    setCached(cacheKey, mapped);
    return mapped;
  },

  async getAllOrders(): Promise<MarketplaceOrder[]> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapOrderRecord);
  },

  async getOrderById(orderId: string): Promise<MarketplaceOrder | null> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) return null;
    return this.mapOrderRecord(data);
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

    if (!error) clearMarketplaceCache();
    return !error;
  },

  async updateOrderShipping(orderId: string, shippingUpdates: Partial<MarketplaceOrder>): Promise<boolean> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (shippingUpdates.shippingStatus !== undefined) payload.shipping_status = shippingUpdates.shippingStatus;
    if (shippingUpdates.trackingCode !== undefined) payload.tracking_code = shippingUpdates.trackingCode;
    if (shippingUpdates.trackingStatus !== undefined) payload.tracking_status = shippingUpdates.trackingStatus;
    if (shippingUpdates.melhorEnvioPrintUrl !== undefined) payload.melhor_envio_print_url = shippingUpdates.melhorEnvioPrintUrl;
    if (shippingUpdates.melhorEnvioLabelUrl !== undefined) payload.melhor_envio_label_url = shippingUpdates.melhorEnvioLabelUrl;
    if (shippingUpdates.melhorEnvioShipmentId !== undefined) payload.melhor_envio_shipment_id = shippingUpdates.melhorEnvioShipmentId;
    if (shippingUpdates.actualShippingCost !== undefined) payload.actual_shipping_cost = shippingUpdates.actualShippingCost;
    if (shippingUpdates.shippingError !== undefined) payload.shipping_error = shippingUpdates.shippingError;

    const { error } = await supabase
      .from('marketplace_orders')
      .update(payload)
      .eq('id', orderId);

    if (!error) clearMarketplaceCache();
    return !error;
  },

  /**
   * Cancela a venda realizada pelo lojista vendedor:
   * 1. Valida se o lojista não ultrapassou o limite de 3 cancelamentos
   * 2. Altera o status do pedido para 'cancelado'
   * 3. Altera o status da oferta associada de volta para 'publicada'
   * 4. Incrementa o contador de cancelamentos do vendedor (sales_cancellation_count)
   */
  async cancelSale(params: {
    orderId: string;
    sellerId: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; remainingCancellations?: number; cancellationsCount?: number }> {
    const isUuid = (val?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');

    // 1. Busca os dados do vendedor e valida o limite de 3 cancelamentos
    const { data: sellerData } = await supabase
      .from('user_accounts')
      .select('id, sales_cancellation_count')
      .eq('id', params.sellerId)
      .maybeSingle();

    const currentCount = sellerData?.sales_cancellation_count || 0;
    if (currentCount >= 3) {
      return {
        success: false,
        error: 'Você atingiu o limite máximo de 3 cancelamentos de vendas permitidos para a sua conta.',
        cancellationsCount: currentCount,
        remainingCancellations: 0,
      };
    }

    // 2. Busca o pedido para resgatar a oferta associada
    const { data: orderData, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('id, offer_id, order_status')
      .eq('id', params.orderId)
      .single();

    if (orderError || !orderData) {
      return { success: false, error: 'Pedido não encontrado.' };
    }

    if (orderData.order_status === 'cancelado') {
      return { success: false, error: 'Este pedido já foi cancelado anteriormente.' };
    }

    // 3. Atualiza o pedido para cancelado
    const { error: cancelOrderError } = await supabase
      .from('marketplace_orders')
      .update({
        order_status: 'cancelado',
        shipping_status: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.orderId);

    if (cancelOrderError) {
      return { success: false, error: 'Erro ao cancelar o pedido.' };
    }

    // 4. Se houver oferta associada, coloca ela de volta na vitrine pública do marketplace imediatamente
    if (orderData.offer_id && isUuid(orderData.offer_id)) {
      await supabase
        .from('marketplace_offers')
        .update({
          status: 'publicada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderData.offer_id);
    }

    // 5. Incrementa o contador de cancelamentos do vendedor
    const nextCount = currentCount + 1;
    await supabase
      .from('user_accounts')
      .update({
        sales_cancellation_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.sellerId);

    // Atualiza a sessão local do usuário
    const current = leadAuthService.getCurrentUser();
    if (current && current.id === params.sellerId) {
      current.salesCancellationCount = nextCount;
      leadAuthService.setCurrentUser(current);
    }

    // Registra log do cancelamento
    await supabase.from('shipping_logs').insert({
      order_id: params.orderId,
      event: 'sale_cancelled_by_seller',
      status: 'warning',
      message: `Venda cancelada pelo vendedor. Cancelamento ${nextCount}/3. Oferta retornada para a vitrine do marketplace.`,
      payload: { reason: params.reason || 'Cancelamento solicitado pelo lojista vendedor' },
    });

    clearMarketplaceCache();

    return {
      success: true,
      cancellationsCount: nextCount,
      remainingCancellations: Math.max(0, 3 - nextCount),
    };
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
      
      // Detalhes financeiros segregados
      productAmount: Number(item.product_amount || item.product_price),
      shippingAmountCharged: Number(item.shipping_amount_charged ?? item.shipping_cost ?? 0),
      actualShippingCost: Number(item.actual_shipping_cost || 0),
      sellerShippingCost: Number(item.seller_shipping_cost || 0),
      shippingDifference: Number(item.shipping_difference || 0),

      // Snapshots
      shippingOriginSnapshot: item.shipping_origin_snapshot,
      shippingDestinationSnapshot: item.shipping_destination_snapshot,
      shippingPackageSnapshot: item.shipping_package_snapshot,
      shippingQuoteSnapshot: item.shipping_quote_snapshot,

      // Logística & Melhor Envio
      melhorEnvioShipmentId: item.melhor_envio_shipment_id,
      melhorEnvioProtocol: item.melhor_envio_protocol,
      melhorEnvioLabelUrl: item.melhor_envio_label_url,
      melhorEnvioPrintUrl: item.melhor_envio_print_url,
      trackingCode: item.tracking_code,
      trackingStatus: item.tracking_status,
      trackingHistory: item.tracking_history,
      shippingStatus: (item.shipping_status as ShippingStatus) || 'aguardando_pagamento',
      shippingError: item.shipping_error,

      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  },

  // --- GERAÇÃO DE EXEMPLOS (MOCK / DEMO DATA) ---
  async generateSampleOffers(preferredSellerId?: string): Promise<boolean> {
    try {
      // 1. Resolve um ID de vendedor válido ou null
      let targetSellerId: string | null = null;
      let targetCompany = 'CellHub Distribuidora Oficial';
      let targetOwner = 'Central de Atacado B2B';

      if (preferredSellerId && isUuid(preferredSellerId)) {
        const { data: user } = await supabase
          .from('user_accounts')
          .select('id, company_name, trade_name, owner_name')
          .eq('id', preferredSellerId)
          .maybeSingle();

        if (user) {
          targetSellerId = user.id;
          targetCompany = user.trade_name || user.company_name || targetCompany;
          targetOwner = user.owner_name || targetOwner;
        }
      }

      if (!targetSellerId) {
        const { data: firstUser } = await supabase
          .from('user_accounts')
          .select('id, company_name, trade_name, owner_name')
          .limit(1)
          .maybeSingle();

        if (firstUser && isUuid(firstUser.id)) {
          targetSellerId = firstUser.id;
          targetCompany = firstUser.trade_name || firstUser.company_name || targetCompany;
          targetOwner = firstUser.owner_name || targetOwner;
        }
      }

      const sampleData = [
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'iPhone 15 Pro Max 256GB Titânio Natural - Lacrado',
          category: 'Smartphones',
          subcategory: 'Apple',
          condition: 'Novo Lacrado',
          description: 'Aparelho 100% novo lacrado de fábrica, homologado Anatel com 1 ano de garantia mundial Apple. Pronta entrega com envio imediato no mesmo dia útil.',
          details: 'Cor: Titânio Natural\nArmazenamento: 256GB\nSaúde da Bateria: 100%\nGarantia: 12 meses Apple Brasil',
          price: 6890,
          free_shipping: true,
          shipping_cost: 0,
          shipping_policy: 'frete_gratis',
          package_weight: 0.55,
          package_height: 6,
          package_width: 14,
          package_length: 19,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1695048133036-11b4e8760207?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 34,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'Samsung Galaxy S24 Ultra 512GB Titanium Black',
          category: 'Smartphones',
          subcategory: 'Samsung',
          condition: 'Novo Lacrado',
          description: 'Lote fechado para lojistas parceiros. Acompanha S-Pen integrada, Galaxy AI nativo, tela antirreflexo Dynamic AMOLED 2X 120Hz.',
          details: 'Cor: Titanium Black\nArmazenamento: 512GB\nRAM: 12GB\nProcessador: Snapdragon 8 Gen 3 for Galaxy',
          price: 6199,
          free_shipping: true,
          shipping_cost: 0,
          shipping_policy: 'frete_gratis',
          package_weight: 0.6,
          package_height: 7,
          package_width: 15,
          package_length: 20,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 28,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'iPhone 13 128GB Estelar - Grade A+ Impecável',
          category: 'Smartphones',
          subcategory: 'Apple',
          condition: 'Excelente',
          description: 'Aparelho seminovo em estado de novo. Sem nenhum risco ou marca. Bateria original em 94%. Testado 100% em 32 etapas de bancada técnica.',
          details: 'Bateria: 94% Original\nCor: Estelar (Branco)\nArmazenamento: 128GB\nGarantia da loja: 90 dias com termo B2B',
          price: 2650,
          free_shipping: false,
          shipping_cost: 32.5,
          shipping_policy: 'comprador_paga',
          package_weight: 0.5,
          package_height: 5,
          package_width: 12,
          package_length: 18,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 45,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'Xiaomi 13 Pro 5G 256GB Ceramic Black (Leica)',
          category: 'Smartphones',
          subcategory: 'Xiaomi',
          condition: 'Excelente',
          description: 'Aparelho top de linha com conjunto de câmeras certificado Leica de 1 polegada. Carregador hiper-rápido de 120W incluso na caixa.',
          details: 'Versão Global oficial\nCor: Ceramic Black\nCarregador: 120W original incluso\nBateria: 100%',
          price: 3200,
          free_shipping: true,
          shipping_cost: 0,
          shipping_policy: 'frete_gratis',
          package_weight: 0.65,
          package_height: 8,
          package_width: 15,
          package_length: 22,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 19,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'iPad Pro 11 M2 128GB Wi-Fi Space Gray Lacrado',
          category: 'Tablets',
          subcategory: 'Apple',
          condition: 'Novo Lacrado',
          description: 'Tablet de alta performance com chip Apple Silicon M2, suporte ao Apple Pencil de 2ª geração e tela Liquid Retina com ProMotion de 120Hz.',
          details: 'Cor: Cinza-Espacial\nArmazenamento: 128GB\nConectividade: Wi-Fi 6E\nGarantia oficial: 12 meses Apple Brasil',
          price: 4890,
          free_shipping: true,
          shipping_cost: 0,
          shipping_policy: 'frete_gratis',
          package_weight: 0.85,
          package_height: 6,
          package_width: 22,
          package_length: 28,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 22,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'Apple Watch Ultra 2 Titânio 49mm Pulseira Ocean',
          category: 'Smartwatches',
          subcategory: 'Apple',
          condition: 'Novo Lacrado',
          description: 'Relógio inteligente de alta resistência em titânio aeroespacial. GPS de dupla frequência, tela de até 3000 nits e sirene de emergência de 86dB.',
          details: 'Tamanho: 49mm\nCaixa: Titânio Natural\nPulseira: Ocean Azul-Marinho\nHomologado Anatel',
          price: 4490,
          free_shipping: true,
          shipping_cost: 0,
          shipping_policy: 'frete_gratis',
          package_weight: 0.45,
          package_height: 5,
          package_width: 12,
          package_length: 24,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 31,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'Lote 10x Telas OLED iPhone 11 ao 14 Pro Max (Qualidade Incell Premium)',
          category: 'Peças e Telas',
          subcategory: 'Apple',
          condition: 'Novo Lacrado',
          description: 'Kit de reposição para oficinas de assistência técnica com taxa de retorno zero. Touch 3D sensível, cores vívidas e CI transferível.',
          details: 'Conteúdo do lote:\n- 2x Tela iPhone 11\n- 2x Tela iPhone 12\n- 3x Tela iPhone 13\n- 3x Tela iPhone 14 Pro Max',
          price: 1980,
          free_shipping: false,
          shipping_cost: 38.0,
          shipping_policy: 'comprador_paga',
          package_weight: 0.9,
          package_height: 12,
          package_width: 18,
          package_length: 26,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 52,
        },
        {
          seller_id: targetSellerId,
          seller_company: targetCompany,
          seller_owner: targetOwner,
          title: 'Estação de Retrabalho e Solda Yaxun 881D+ Digital Dupla',
          category: 'Ferramentas',
          subcategory: 'Bancada',
          condition: 'Novo Lacrado',
          description: 'Equipamento essencial para bancada de reparos avançados em placas SMD e BGA. Bivolt automática com visor digital LCD e fluxo de ar ajustável.',
          details: 'Tensão: Bivolt (110V/220V)\nPotência: 750W\nItens: 3 Bocais + Suporte + Ponta fina de solda\nTemperatura: 100°C a 480°C',
          price: 750,
          free_shipping: false,
          shipping_cost: 45.0,
          shipping_policy: 'comprador_paga',
          package_weight: 2.8,
          package_height: 18,
          package_width: 25,
          package_length: 32,
          origin_zip_code: '01001-000',
          origin_street: 'Praça da Sé',
          origin_number: '100',
          origin_neighborhood: 'Sé',
          origin_city: 'São Paulo',
          origin_state: 'SP',
          images: [
            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80',
          ],
          status: 'publicada',
          views: 16,
        },
      ];

      const { error } = await supabase.from('marketplace_offers').insert(sampleData);
      if (error) {
        console.error('[marketplaceService] Erro ao inserir ofertas de exemplo:', error);
        return false;
      }

      clearMarketplaceCache();
      return true;
    } catch (e) {
      console.error('[marketplaceService] Falha geral em generateSampleOffers:', e);
      return false;
    }
  },

  async clearAllOffers(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marketplace_offers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('[marketplaceService] Erro ao limpar ofertas:', error);
        return false;
      }

      clearMarketplaceCache();
      return true;
    } catch (e) {
      console.error('[marketplaceService] Erro em clearAllOffers:', e);
      return false;
    }
  }
};
