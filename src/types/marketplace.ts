export type OfferCategory =
  | 'Celulares'
  | 'Peças'
  | 'Telas'
  | 'Baterias'
  | 'Conectores'
  | 'Acessórios'
  | 'Ferramentas'
  | 'Máquinas'
  | 'Eletrônicos'
  | 'Componentes'
  | 'Lotes'
  | 'Outros';

export type OfferCondition =
  | 'Novo'
  | 'Seminovo'
  | 'Usado'
  | 'Recondicionado'
  | 'Com avaria'
  | 'Para retirada de peças'
  | 'Outro';

export type OfferStatus =
  | 'publicada'
  | 'pausada'
  | 'vendida'
  | 'encerrada'
  | 'rascunho';

export type PaymentStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'recusado'
  | 'cancelado';

export type OrderStatus =
  | 'aguardando_envio'
  | 'enviado'
  | 'em_transito'
  | 'entregue'
  | 'finalizado'
  | 'cancelado';

export interface MarketplaceOffer {
  id: string;
  sellerId: string;
  sellerCompany: string;
  sellerOwner: string;
  sellerEmail?: string;
  sellerCnpj?: string;
  title: string;
  category: OfferCategory;
  subcategory?: string;
  condition: OfferCondition;
  description: string;
  details?: string;
  price: number;
  freeShipping: boolean;
  shippingCost?: number;
  images: string[];
  status: OfferStatus;
  views: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceOrder {
  id: string;
  offerId?: string;
  buyerId: string;
  buyerCompany: string;
  buyerOwner: string;
  buyerEmail: string;
  buyerCnpj?: string;
  sellerId: string;
  sellerCompany: string;
  productTitle: string;
  productImage?: string;
  productPrice: number;
  shippingCost: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  sellerNetAmount: number;
  totalAmount: number;
  paymentMethod: 'PIX' | 'Cartao';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceFavorite {
  id: string;
  userId: string;
  offerId: string;
  offer?: MarketplaceOffer;
  createdAt: string;
}

export interface MarketplaceReport {
  id: string;
  offerId: string;
  offerTitle: string;
  reportedByUserId: string;
  reportedByCompany: string;
  reason: 'produto_proibido' | 'fraude' | 'informacao_falsa' | 'preco_enganoso' | 'conteudo_inadequado' | 'outro';
  details?: string;
  status: 'pendente' | 'resolvido' | 'descartado';
  createdAt: string;
}

export interface MarketplaceFeeSettings {
  defaultFeePercent: number;
  pixDiscountPercent: number;
}
