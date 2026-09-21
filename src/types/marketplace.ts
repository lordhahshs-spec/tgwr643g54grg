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

export type ShippingPolicy = 'frete_gratis' | 'comprador_paga';

export type ShippingStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'aguardando_criacao_envio'
  | 'envio_criado'
  | 'etiqueta_aguardando_compra'
  | 'etiqueta_disponivel'
  | 'aguardando_postagem'
  | 'postado'
  | 'em_transito'
  | 'entregue'
  | 'erro_envio'
  | 'cancelado';

export interface ShippingAddress {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  name?: string;
  phone?: string;
  email?: string;
  document?: string;
  cnpj?: string;
}

export interface ShippingPackage {
  weight: number; // em kg
  height: number; // em cm
  width: number;  // em cm
  length: number; // em cm
  insuranceValue?: number;
}

export interface ShippingQuote {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture?: string;
  };
  price: number;
  original_price?: number;
  discount?: number;
  delivery_time: number;
  delivery_range?: {
    min: number;
    max: number;
  };
  packages?: any[];
  currency?: string;
}

export interface CategoryPackageDefault {
  id: string;
  category: OfferCategory | string;
  default_weight: number;
  default_height: number;
  default_width: number;
  default_length: number;
  description?: string;
}

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
  shippingPolicy?: ShippingPolicy;
  packageWeight?: number;
  packageHeight?: number;
  packageWidth?: number;
  packageLength?: number;
  originZipCode?: string;
  originStreet?: string;
  originNumber?: string;
  originComplement?: string;
  originNeighborhood?: string;
  originCity?: string;
  originState?: string;
  images: string[];
  status: OfferStatus;
  views: number;
  salesCount?: number;
  rating?: number | null;
  reviewsCount?: number;
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
  
  // Financial breakdown
  productAmount?: number;
  shippingAmountCharged?: number;
  actualShippingCost?: number;
  sellerShippingCost?: number;
  shippingDifference?: number;

  // Snapshots & Shipping
  shippingAddress?: ShippingAddress;
  shippingOriginSnapshot?: ShippingAddress;
  shippingDestinationSnapshot?: ShippingAddress;
  shippingPackageSnapshot?: ShippingPackage;
  shippingQuoteSnapshot?: ShippingQuote;
  
  // Melhor Envio details
  melhorEnvioShipmentId?: string;
  melhorEnvioProtocol?: string;
  melhorEnvioLabelUrl?: string;
  melhorEnvioPrintUrl?: string;
  trackingCode?: string;
  trackingStatus?: string;
  trackingHistory?: any;
  shippingStatus?: ShippingStatus;
  shippingError?: string;

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
  status: 'pendente' | 'analisado' | 'descartado';
  createdAt: string;
}

export interface MarketplaceReview {
  id: string;
  orderId: string;
  offerId: string;
  sellerId: string;
  buyerId: string;
  buyerCompany: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface MarketplaceFeeSettings {
  defaultFeePercent: number;
  pixDiscountPercent: number;
}
