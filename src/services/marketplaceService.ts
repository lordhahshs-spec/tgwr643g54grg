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

const isUuid = (val?: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');
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

    const { data, error } = await query;
    if (error) {
      console.error('[marketplaceService] Erro ao carregar ofertas:', error);
      return [];
    }

    // Busca vendas reais registradas
    const { data: orders } = await supabase
      .from('marketplace_orders')
      .select('offer_id');

    const salesMap: Record<string, number> = {};
    (orders || []).forEach(o => {
      if (o.offer_id) salesMap[o.offer_id] = (salesMap[o.offer_id] || 0) + 1;
    });

    // Busca avaliações reais registradas
    const { data: reviews } = await supabase
      .from('marketplace_reviews')
      .select('offer_id, rating');

    const reviewsMap: Record<string, { total: number; count: number }> = {};
    (reviews || []).forEach(r => {
      if (r.offer_id) {
        if (!reviewsMap[r.offer_id]) reviewsMap[r.offer_id] = { total: 0, count: 0 };
        reviewsMap[r.offer_id].total += Number(r.rating || 0);
        reviewsMap[r.offer_id].count += 1;
      }
    });

    return (data || []).map(item => {
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

    // Busca vendas reais
    const { count: ordersCount } = await supabase
      .from('marketplace_orders')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', id);

    // Busca avaliações reais
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

  async createOffer(offerData: Omit<MarketplaceOffer, 'id' | 'views' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    let resolvedSellerId: string | null = isUuid(offerData.sellerId) ? offerData.sellerId! : null;

    // Se o sellerId não for um UUID válido, tenta localizar a conta real no Supabase
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

  // Gera ofertas de exemplo para demonstrar tanto o formato Stories (Ofertas Quentes) quanto o formato Horizontal
  async generateSampleOffers(currentUserId?: string): Promise<boolean> {
    // Localiza um UUID válido de vendedor
    let sellerId = isUuid(currentUserId) ? currentUserId! : null;
    if (!sellerId) {
      const { data } = await supabase.from('user_accounts').select('id').limit(1).maybeSingle();
      if (data?.id && isUuid(data.id)) {
        sellerId = data.id;
      }
    }

    const samples = [
      // OFERTAS QUENTES (com visualizações reais para aparecerem nos Stories 9:16)
      {
        seller_id: sellerId,
        seller_company: 'Global Peças & Distribuição SP',
        seller_owner: 'Carlos Eduardo',
        title: 'Lote 10x Telas OLED iPhone 13 Pro 120Hz Grade A+',
        category: 'Telas',
        subcategory: 'Apple iPhone',
        condition: 'Novo',
        description: 'Lote fechado com 10 unidades de telas OLED 120Hz sem dead pixels. Testadas em bancada com garantia de 90 dias para lojistas parceiros.',
        details: 'Part: OLED-IP13P-OEM. Acompanha vedação impermeável e kit de proteção para transporte seguro.',
        price: 2490.00,
        free_shipping: true,
        shipping_cost: 0,
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 84
      },
      {
        seller_id: sellerId,
        seller_company: 'TechLab Assistência Especializada',
        seller_owner: 'Rodrigo Ramos',
        title: 'Estação de Retrabalho e Solda Sugon 8620DX 1300W 220V',
        category: 'Ferramentas',
        subcategory: 'Estações de Solda',
        condition: 'Seminovo',
        description: 'Estação de ar quente profissional Sugon 8620DX original. Apenas 3 meses de uso em bancada limpa, completa com 4 bocais e sensor magnético.',
        details: 'Potência 1300W real, fluxo de ar com memória rápida de 4 canais. Ideal para reballing de CPU e memórias.',
        price: 1850.00,
        free_shipping: false,
        shipping_cost: 45.00,
        images: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 120
      },
      {
        seller_id: sellerId,
        seller_company: 'SmartCenter Distribuidora',
        seller_owner: 'Juliana Mendes',
        title: 'Placa Mãe Samsung Galaxy S22 Ultra 256GB Nacional 100% Testada',
        category: 'Componentes',
        subcategory: 'Placas Principais',
        condition: 'Usado',
        description: 'Placa nacional homologada pela Anatel, sem bloqueios de operadora ou IMEI. Face ID, biometria e câmeras testadas.',
        details: 'Sem conta vinculada, pronta para montagem imediata. 30 dias de garantia.',
        price: 1190.00,
        free_shipping: true,
        shipping_cost: 0,
        images: [
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 65
      },
      {
        seller_id: sellerId,
        seller_company: 'MaxPower Baterias Premium',
        seller_owner: 'Fernando Albuquerque',
        title: 'Kit 20x Baterias Linha iPhone (11, 12, 13, 14) 0 Ciclos TI Chip',
        category: 'Baterias',
        subcategory: 'iPhone',
        condition: 'Novo',
        description: 'Lote com 20 baterias novas de altíssima densidade com chip TI original. Sem mensagem de peça desconhecida quando programadas.',
        details: 'Composição: 5x iPhone 11, 5x iPhone 12, 5x iPhone 13, 5x iPhone 14. Inclui fita adesiva original.',
        price: 1480.00,
        free_shipping: true,
        shipping_cost: 0,
        images: [
          'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 95
      },

      // DEMAIS OFERTAS (Formato Horizontal Retangular)
      {
        seller_id: sellerId,
        seller_company: 'Bancada Express Ferramentas',
        seller_owner: 'Marcos Vinicius',
        title: 'Separadora de LCD com Bomba de Sucção a Vácuo Mechanic 968',
        category: 'Máquinas',
        subcategory: 'Separadoras',
        condition: 'Seminovo',
        description: 'Máquina separadora de touch e display com display digital de temperatura e vácuo integrado potente. Funcionamento perfeito.',
        details: 'Voltagem: 110V/220V Bi-volt. Superfície em liga de alumínio térmica.',
        price: 490.00,
        free_shipping: false,
        shipping_cost: 32.00,
        images: [
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 0
      },
      {
        seller_id: sellerId,
        seller_company: 'Mega Componentes Brasil',
        seller_owner: 'Luciano Silva',
        title: 'Pacote 50x Conectores de Carga Tipo-C SMD Universal Fita Reforçada',
        category: 'Conectores',
        subcategory: 'Tipo-C',
        condition: 'Novo',
        description: 'Lote de conectores USB Type-C padrão para reposição em bancada. Terminais com banho de ouro para soldagem perfeita.',
        details: 'Fita selada de fábrica. Compatível com dezenas de modelos Motorola, Xiaomi e Samsung.',
        price: 189.00,
        free_shipping: true,
        shipping_cost: 0,
        images: [
          'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 0
      },
      {
        seller_id: sellerId,
        seller_company: 'Micro Solda Lab Equipamentos',
        seller_owner: 'Gabriel Barbosa',
        title: 'Microscópio Óptico Trinocular Mechanic MC75T com Câmera 4K HDMI',
        category: 'Ferramentas',
        subcategory: 'Microscópios',
        condition: 'Novo',
        description: 'Microscópio trinocular profissional completo com braço articulado reforçado, lente Barlow 0.5x, iluminador LED 56 pontos e câmera 4K.',
        details: 'Zoom óptico contínuo 7X a 45X. Saída HDMI direta para monitor ou TV de bancada.',
        price: 2890.00,
        free_shipping: true,
        shipping_cost: 0,
        images: [
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 0
      },
      {
        seller_id: sellerId,
        seller_company: 'Centro Peças & Distribuição',
        seller_owner: 'Patrícia Rocha',
        title: 'Lote 5x Carcaças Completas iPhone 12 Original sem Riscos com Gaveta',
        category: 'Lotes',
        subcategory: 'Carcaças',
        condition: 'Seminovo',
        description: 'Lote com 5 carcaças retiradas de aparelhos vitrine sem marcas de queda. Acompanha botões laterais, flex de volume/power e gaveta de SIM.',
        details: 'Cores: 2x Azul, 2x Preto, 1x Branco. Originais Apple sem empenamento.',
        price: 950.00,
        free_shipping: false,
        shipping_cost: 28.00,
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80'
        ],
        status: 'publicada',
        views: 0
      }
    ];

    const { error } = await supabase.from('marketplace_offers').insert(samples);
    return !error;
  },

  async clearAllOffers(): Promise<boolean> {
    const { error } = await supabase.from('marketplace_offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
    if (order.offerId && isUuid(order.offerId)) {
      await supabase
        .from('marketplace_offers')
        .update({ status: 'vendida', updated_at: new Date().toISOString() })
        .eq('id', order.offerId);
    }

    return { success: true, orderId: data.id };
  },

  async getBuyerOrders(buyerId: string): Promise<MarketplaceOrder[]> {
    if (!buyerId || !isUuid(buyerId)) return [];
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapOrderRecord);
  },

  async getSellerOrders(sellerId: string): Promise<MarketplaceOrder[]> {
    if (!sellerId || !isUuid(sellerId)) return [];
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
