export type AiSessionStatus =
  | 'created'
  | 'waiting_for_phone'
  | 'phone_connected'
  | 'uploading'
  | 'photos_received'
  | 'analyzing'
  | 'completed'
  | 'error'
  | 'expired';

export interface AiEvaluationPhoto {
  type: 'front' | 'side' | 'back';
  url: string;
  name?: string;
}

export interface AiEvaluationSession {
  id: string;
  session_token: string;
  user_id: string;
  brand: string;
  model_name: string;
  storage: string;
  allowed_presets: { id: string; label: string; defaultDiscount?: number; category?: string }[];
  photos: AiEvaluationPhoto[];
  status: AiSessionStatus;
  detected_presets: string[];
  visual_summary: string[];
  confidence: 'high' | 'medium' | 'low';
  used_tier?: 'free' | 'paid';
  error_message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AiQuotaStatus {
  success: boolean;
  periodKey: string;
  periodType: 'daily' | 'monthly' | 'rolling';
  freeLimit: number;
  usedFree: number;
  remainingFree: number;
  hasPaidAccess: boolean;
  paidTierPrice: number;
  currentTierWillUse: 'free' | 'paid' | 'none';
}

export interface AiConfiguration {
  id: string;
  free_tier_active: boolean;
  free_tier_provider: string;
  free_tier_model: string;
  free_tier_limit: number;
  free_tier_period: 'daily' | 'monthly' | 'rolling';
  paid_tier_active: boolean;
  paid_tier_provider: string;
  paid_tier_model: string;
  paid_tier_monthly_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface AiUsageLog {
  id: string;
  user_id: string;
  session_id?: string;
  provider: string;
  api_tier: 'free' | 'paid';
  model: string;
  operation: string;
  status: 'success' | 'error' | 'blocked_quota' | 'blocked_unauthorized';
  tokens_input: number;
  tokens_output: number;
  estimated_cost: number;
  period_key: string;
  error_message?: string;
  created_at: string;
}

export interface AiSubscription {
  id: string;
  user_id: string;
  paid_ai_enabled: boolean;
  subscription_status: 'inactive' | 'pending' | 'active' | 'expired' | 'cancelled';
  subscription_started_at?: string;
  subscription_expires_at?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}
