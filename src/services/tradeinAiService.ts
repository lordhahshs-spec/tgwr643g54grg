import { supabase } from '@/integrations/supabase/client';
import { 
  AiEvaluationSession, 
  AiQuotaStatus, 
  AiConfiguration, 
  AiUsageLog, 
  AiSubscription,
  AiEvaluationPhoto 
} from '@/types/tradeinAi';
import { FaultDefinition } from '@/types/tradein';

const EDGE_FUNCTION_URL = 'https://hhqerjxkptknwudsnlgh.supabase.co/functions/v1/cellhub-ai-router';

export const tradeinAiService = {
  // 1. Criar sessão temporária para leitura via QR Code
  async createSession(params: {
    userId: string;
    brand: string;
    modelName: string;
    storage: string;
    allowedPresets: FaultDefinition[];
  }): Promise<{ success: boolean; session?: AiEvaluationSession; error?: string }> {
    try {
      const sessionToken = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos de validade

      const payload = {
        session_token: sessionToken,
        user_id: params.userId,
        brand: params.brand,
        model_name: params.modelName,
        storage: params.storage,
        allowed_presets: params.allowedPresets.map(p => ({
          id: p.id,
          label: p.label,
          defaultDiscount: p.defaultDiscount,
          category: p.category
        })),
        photos: [],
        status: 'waiting_for_phone',
        detected_presets: [],
        visual_summary: [],
        confidence: 'medium',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_evaluation_sessions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, session: data as AiEvaluationSession };
    } catch (err: any) {
      console.error('Erro ao criar sessão de IA:', err);
      return { success: false, error: err.message };
    }
  },

  // 2. Buscar sessão pelo token ou ID
  async getSession(tokenOrId: string): Promise<AiEvaluationSession | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);
      
      let query = supabase.from('ai_evaluation_sessions').select('*');
      if (isUuid) {
        query = query.eq('id', tokenOrId);
      } else {
        query = query.eq('session_token', tokenOrId);
      }

      const { data, error } = await query.single();
      if (error) return null;
      return data as AiEvaluationSession;
    } catch (err) {
      console.error('Erro ao obter sessão:', err);
      return null;
    }
  },

  // 3. Atualizar status da sessão (ex: quando celular conecta)
  async updateSessionStatus(sessionId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_evaluation_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return !error;
    } catch (err) {
      console.error('Erro ao atualizar status da sessão:', err);
      return false;
    }
  },

  // 4. Upload de fotos do celular para o Supabase Storage e registro na sessão
  async uploadPhotosForSession(
    sessionId: string, 
    photos: { type: 'front' | 'side' | 'back'; file: Blob | File }[]
  ): Promise<{ success: boolean; photos?: AiEvaluationPhoto[]; error?: string }> {
    try {
      const uploadedPhotos: AiEvaluationPhoto[] = [];

      for (const item of photos) {
        const fileExt = 'jpg';
        const fileName = `${sessionId}/${item.type}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('tradein-photos')
          .upload(fileName, item.file, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadErr) {
          console.error(`Erro ao subir foto ${item.type}:`, uploadErr);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('tradein-photos')
          .getPublicUrl(uploadData.path);

        uploadedPhotos.push({
          type: item.type,
          url: publicUrlData.publicUrl,
          name: fileName
        });
      }

      if (uploadedPhotos.length === 0) {
        return { success: false, error: 'Falha no upload das fotografias.' };
      }

      // Atualizar sessão com as fotos enviadas
      const { error: updateErr } = await supabase
        .from('ai_evaluation_sessions')
        .update({
          photos: uploadedPhotos,
          status: 'photos_received',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateErr) throw updateErr;

      return { success: true, photos: uploadedPhotos };
    } catch (err: any) {
      console.error('Erro em uploadPhotosForSession:', err);
      return { success: false, error: err.message };
    }
  },

  // 5. Acionar o roteamento seguro de IA no backend
  async triggerEvaluation(params: {
    sessionId?: string;
    userId: string;
    brand?: string;
    modelName?: string;
    allowedPresets?: FaultDefinition[];
    photos?: { type: string; url?: string; base64?: string }[];
  }): Promise<{
    success: boolean;
    tierUsed?: 'free' | 'paid';
    detectedPresetIds?: string[];
    visualSummary?: string[];
    confidence?: string;
    error?: string;
    message?: string;
    requiresUpgrade?: boolean;
    remainingFree?: number;
  }> {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: params.sessionId ? 'evaluate_session' : 'manual_evaluate',
          sessionId: params.sessionId,
          userId: params.userId,
          brand: params.brand,
          modelName: params.modelName,
          allowedPresets: params.allowedPresets,
          photos: params.photos
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'ai_evaluation_failed',
          message: data.message || 'Não foi possível concluir a análise de IA.',
          requiresUpgrade: Boolean(data.requires_upgrade),
          remainingFree: data.remainingFree
        };
      }

      return {
        success: true,
        tierUsed: data.tierUsed,
        detectedPresetIds: data.detectedPresetIds || [],
        visualSummary: data.visualSummary || [],
        confidence: data.confidence || 'high',
        remainingFree: data.remainingFree
      };
    } catch (err: any) {
      console.error('Erro ao acionar avaliação de IA:', err);
      return { success: false, error: 'connection_error', message: 'Erro de conexão com o servidor de IA.' };
    }
  },

  // 6. Consultar cotas e status atual da franquia do lojista
  async checkQuota(userId: string): Promise<AiQuotaStatus | null> {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_quota', userId })
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error('Erro ao consultar cota:', err);
      return null;
    }
  },

  // 7. Obter configurações administrativas (para Master Admin)
  async getAdminConfig(): Promise<AiConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('id', 'default_config')
        .single();

      if (error) return null;
      return data as AiConfiguration;
    } catch (err) {
      console.error('Erro ao carregar ai_configurations:', err);
      return null;
    }
  },

  // 8. Salvar configurações administrativas
  async saveAdminConfig(config: Partial<AiConfiguration>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default_config');

      return !error;
    } catch (err) {
      console.error('Erro ao salvar ai_configurations:', err);
      return false;
    }
  },

  // 9. Obter logs de uso para o Master Admin
  async getUsageLogs(limit = 100): Promise<AiUsageLog[]> {
    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data as AiUsageLog[];
    } catch (err) {
      console.error('Erro ao obter logs de IA:', err);
      return [];
    }
  },

  // 10. Obter ou alternar assinatura paga de teste do lojista (Master Admin)
  async toggleUserPaidAccess(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_subscriptions')
        .upsert({
          user_id: userId,
          paid_ai_enabled: enabled,
          subscription_status: enabled ? 'active' : 'inactive',
          subscription_started_at: enabled ? new Date().toISOString() : null,
          payment_status: enabled ? 'active_trial' : 'none',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      return !error;
    } catch (err) {
      console.error('Erro ao alterar acesso pago do usuário:', err);
      return false;
    }
  }
};
