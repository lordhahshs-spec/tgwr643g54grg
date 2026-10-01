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

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_64AtuXy469nIF-4h-oLvKQ_SV9o41Kl";
const EDGE_FUNCTION_URL = 'https://hhqerjxkptknwudsnlgh.supabase.co/functions/v1/cellhub-ai-router';

// Helper seguro de invocação da Edge Function
async function invokeEdgeFunction(body: Record<string, any>): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('cellhub-ai-router', {
      body
    });

    if (data && typeof data === 'object') {
      return data;
    }

    if (error) {
      console.warn('[tradeinAiService] supabase.functions.invoke retornou erro, verificando payload...', error);
      if ((error as any)?.context && typeof (error as any).context.json === 'function') {
        const errorJson = await (error as any).context.json().catch(() => null);
        if (errorJson) return errorJson;
      }
    }
  } catch (err) {
    console.warn('[tradeinAiService] supabase.functions.invoke exceção, tentando fallback direto com apikey...', err);
  }

  // Fallback com cabeçalhos autorizados completos
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify(body)
    });

    const resJson = await response.json().catch(() => null);
    if (resJson) return resJson;
    return { success: false, message: `Erro HTTP ${response.status} na Edge Function.` };
  } catch (fetchErr: any) {
    console.error('[tradeinAiService] Falha na chamada HTTP:', fetchErr);
    return { success: false, message: 'Falha de conexão com a Edge Function: ' + (fetchErr?.message || '') };
  }
}

export const tradeinAiService = {
  // 1. Criar sessão temporária e estritamente individual por lojista
  async createSession(params: {
    userId: string;
    brand: string;
    modelName: string;
    storage: string;
    allowedPresets: FaultDefinition[];
  }): Promise<{ success: boolean; session?: AiEvaluationSession; error?: string }> {
    try {
      // Token único isolado por usuário e timestamp
      const sanitizedUserPrefix = (params.userId || 'usr').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
      const sessionToken = `ses_${sanitizedUserPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos

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

  // 3. Atualizar status da sessão
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

  // 4. Cancelar sessão
  async cancelSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_evaluation_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return !error;
    } catch (err) {
      console.error('Erro ao cancelar sessão:', err);
      return false;
    }
  },

  // 4.1 Reabrir sessão existente para nova captura no celular sem gerar novo QR Code
  async resetSessionForRetry(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_evaluation_sessions')
        .update({
          status: 'phone_connected',
          photos: [],
          detected_presets: [],
          visual_summary: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      return !error;
    } catch (err) {
      console.error('Erro ao reabrir sessão para retentativa:', err);
      return false;
    }
  },

  // 5. Upload paralelo e otimizado de fotos
  async uploadPhotosForSession(
    sessionId: string, 
    photos: { type: 'front' | 'side' | 'back'; file: Blob | File }[]
  ): Promise<{ success: boolean; photos?: AiEvaluationPhoto[]; error?: string }> {
    try {
      const uploadPromises = photos.map(async (item) => {
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
          return null;
        }

        const { data: publicUrlData } = supabase.storage
          .from('tradein-photos')
          .getPublicUrl(uploadData.path);

        return {
          type: item.type,
          url: publicUrlData.publicUrl,
          name: fileName
        } as AiEvaluationPhoto;
      });

      const results = await Promise.all(uploadPromises);
      const uploadedPhotos = results.filter(Boolean) as AiEvaluationPhoto[];

      if (uploadedPhotos.length === 0) {
        return { success: false, error: 'Falha no envio das fotografias.' };
      }

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

  // 6. Acionar o roteamento seguro de IA no backend
  async triggerEvaluation(params: {
    sessionId?: string;
    userId: string;
    brand?: string;
    modelName?: string;
    allowedPresets?: FaultDefinition[];
    photos?: { type: string; url?: string; base64?: string }[];
  }): Promise<{
    success: boolean;
    isValidSmartphone?: boolean;
    detectedObjectDescription?: string;
    rejectionReason?: string;
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
      const data = await invokeEdgeFunction({
        action: params.sessionId ? 'evaluate_session' : 'manual_evaluate',
        sessionId: params.sessionId,
        userId: params.userId,
        brand: params.brand,
        modelName: params.modelName,
        allowedPresets: params.allowedPresets,
        photos: params.photos
      });

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'ai_evaluation_failed',
          message: data?.message || 'Não foi possível concluir a análise de IA.',
          requiresUpgrade: Boolean(data?.requires_upgrade),
          remainingFree: data?.remainingFree
        };
      }

      return {
        success: true,
        isValidSmartphone: data.isValidSmartphone !== false,
        detectedObjectDescription: data.detectedObjectDescription,
        rejectionReason: data.rejectionReason,
        tierUsed: data.tierUsed,
        detectedPresetIds: data.detectedPresetIds || [],
        visualSummary: data.visualSummary || [],
        confidence: data.confidence || 'high',
        remainingFree: data.remainingFree
      };
    } catch (err: any) {
      console.error('Erro ao acionar avaliação de IA:', err);
      return { success: false, error: 'connection_error', message: 'Instabilidade de rede com o servidor de IA.' };
    }
  },

  // 7. Consultar cotas de forma resiliente
  async checkQuota(userId: string): Promise<AiQuotaStatus> {
    try {
      const data = await invokeEdgeFunction({ action: 'check_quota', userId });
      if (data && data.success) {
        return data as AiQuotaStatus;
      }
    } catch (err) {
      console.warn('[tradeinAiService] Aviso ao consultar cota (usando fallback local):', err);
    }

    // Fallback gracioso para a interface nunca quebrar ou alertar falso positivo
    return {
      success: true,
      periodKey: new Date().toISOString().slice(0, 10),
      periodType: 'daily',
      freeLimit: 20,
      usedFree: 0,
      remainingFree: 20,
      hasPaidAccess: false,
      paidTierPrice: 9.90,
      currentTierWillUse: 'free'
    };
  },

  // 8. Obter configurações administrativas
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

  // 9. Salvar configurações administrativas
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

  // 10. Obter logs de uso
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

  // 11. Alternar acesso pago de teste
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
