export type DeviceBrand = 
  | 'Apple'
  | 'Samsung'
  | 'Motorola'
  | 'Xiaomi'
  | 'Redmi'
  | 'POCO'
  | 'Realme'
  | 'Infinix'
  | 'Tecno'
  | 'Outros';

export interface FaultDefinition {
  id: string;
  category: 'estetica' | 'tela' | 'bateria' | 'cameras_sensores' | 'placa_sistema';
  label: string;
  description?: string;
  defaultDiscount: number;
}

export interface ValuationModel {
  id: string;
  user_id?: string | null;
  brand: string;
  model_name: string;
  storage: string;
  base_price: number;
  buy_price: number;
  trade_bonus: number;
  fault_discounts: Record<string, number>;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SelectedFault {
  id: string;
  label: string;
  category: string;
  discount: number;
}

export interface CustomerData {
  name: string;
  cpf: string;
  phone: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface TradeInEvaluation {
  id: string;
  user_id?: string | null;
  evaluation_code: string;
  created_by_id?: string;
  created_by_name?: string;
  type: 'compra' | 'troca';
  brand: string;
  model_name: string;
  storage: string;
  imei?: string;
  base_value: number;
  faults_selected: SelectedFault[];
  total_faults_discount: number;
  trade_bonus_applied: number;
  custom_adjustment: number;
  adjustment_reason?: string;
  final_valuation: number;
  exchange_target_device?: string;
  exchange_target_price?: number;
  exchange_difference_to_pay?: number;
  status: 'concluida' | 'pendente' | 'cancelada';
  customer_data?: CustomerData;
  signature_data?: string;
  created_at: string;
}

export interface ValuationSettings {
  id?: string;
  user_id?: string | null;
  store_name: string;
  store_cnpj: string;
  store_address: string;
  default_trade_bonus: number;
  terms_text: string;
  updated_at?: string;
}
