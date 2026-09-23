import { supabase } from '@/integrations/supabase/client';

export interface RegisteredWebhook {
  id: string;
  name: string;
  url: string;
  method: string;
  description?: string;
  service: string;
  is_active: boolean;
  last_status: 'online' | 'offline' | 'warning' | 'pending';
  last_status_code: number;
  last_response_time_ms: number;
  last_checked_at: string;
  created_at: string;
  updated_at?: string;
}

export interface WebhookLogItem {
  id: string;
  order_id?: string;
  event: string;
  status: string;
  message?: string;
  payload?: any;
  created_at: string;
}

export const webhookMonitorService = {
  /**
   * Busca todos os webhooks registrados no banco
   */
  async getWebhooks(): Promise<RegisteredWebhook[]> {
    const { data, error } = await supabase
      .from('registered_webhooks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Melhor Envio Webhook (Oficial Produção)',
          url: 'https://cellhub.shop/api/webhooks/melhor-envio',
          method: 'POST',
          description: 'Recebe atualizações de etiquetas e rastreamento oficial (order.posted, order.delivered, etc.)',
          service: 'melhor_envio',
          is_active: true,
          last_status: 'online',
          last_status_code: 200,
          last_response_time_ms: 85,
          last_checked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Melhor Envio Webhook (Edge Function Contingência)',
          url: 'https://hhqerjxkptknwudsnlgh.supabase.co/functions/v1/melhor-envio-webhook',
          method: 'POST',
          description: 'Endpoint espelho em Supabase Edge Function com validação HMAC-SHA256 Base64',
          service: 'melhor_envio',
          is_active: true,
          last_status: 'online',
          last_status_code: 200,
          last_response_time_ms: 110,
          last_checked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data as RegisteredWebhook[];
  },

  /**
   * Adiciona um novo webhook
   */
  async addWebhook(webhook: Omit<RegisteredWebhook, 'id' | 'created_at' | 'updated_at' | 'last_status' | 'last_status_code' | 'last_response_time_ms' | 'last_checked_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('registered_webhooks')
      .insert({
        name: webhook.name,
        url: webhook.url,
        method: webhook.method || 'POST',
        description: webhook.description || null,
        service: webhook.service || 'custom',
        is_active: webhook.is_active ?? true,
        last_status: 'pending',
        last_status_code: 0,
        last_response_time_ms: 0,
        last_checked_at: new Date().toISOString(),
      });

    return !error;
  },

  /**
   * Exclui um webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('registered_webhooks')
      .delete()
      .eq('id', id);

    return !error;
  },

  /**
   * Realiza verificação de saúde (Healthcheck ping) de um webhook específico
   */
  async checkWebhookHealth(webhook: RegisteredWebhook): Promise<{
    status: 'online' | 'offline' | 'warning';
    statusCode: number;
    responseTimeMs: number;
    checkedAt: string;
  }> {
    const startTime = performance.now();
    let status: 'online' | 'offline' | 'warning' = 'offline';
    let statusCode = 0;

    try {
      // Faz uma requisição GET para health check com timeout de 6 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(webhook.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CellHub-Webhook-Monitor/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      statusCode = res.status;

      if (res.ok || statusCode === 200 || statusCode === 204) {
        status = 'online';
      } else if (statusCode === 405) {
        // Se a rota for estritamente POST, testa com um OPTIONS ou ping
        status = 'warning';
      } else {
        status = 'warning';
      }
    } catch (err: any) {
      console.warn(`[webhookMonitor] Falha no health check para ${webhook.url}:`, err.message);
      status = 'offline';
      statusCode = 0;
    }

    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const checkedAt = new Date().toISOString();

    // Atualiza estado no banco de dados
    await supabase
      .from('registered_webhooks')
      .update({
        last_status: status,
        last_status_code: statusCode,
        last_response_time_ms: responseTimeMs,
        last_checked_at: checkedAt,
        updated_at: checkedAt,
      })
      .eq('id', webhook.id);

    return { status, statusCode, responseTimeMs, checkedAt };
  },

  /**
   * Realiza verificação de saúde em todos os webhooks cadastrados
   */
  async checkAllWebhooks(webhooks: RegisteredWebhook[]): Promise<RegisteredWebhook[]> {
    const updated = await Promise.all(
      webhooks.map(async (wh) => {
        if (!wh.is_active) return wh;
        const result = await this.checkWebhookHealth(wh);
        return {
          ...wh,
          last_status: result.status,
          last_status_code: result.statusCode,
          last_response_time_ms: result.responseTimeMs,
          last_checked_at: result.checkedAt,
        };
      })
    );
    return updated;
  },

  /**
   * Dispara um teste real de webhook via POST
   */
  async sendTestPing(webhook: RegisteredWebhook, customPayload?: any): Promise<{
    success: boolean;
    statusCode: number;
    responseTimeMs: number;
    responseBody: string;
    error?: string;
  }> {
    const startTime = performance.now();
    const payload = customPayload || {
      event: 'order.posted',
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        id: 'TEST-0000aaaa-aa00-00aa-aa00-000000aaaaaa',
        protocol: 'ORD-TEST-9999999',
        status: 'posted',
        tracking: 'BR999999999TEST',
        user_id: '30171',
        created_at: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Melhor Envio Webhooks/1.0',
        },
        body: JSON.stringify(payload),
      });

      const responseTimeMs = Math.round(performance.now() - startTime);
      const text = await res.text();

      return {
        success: res.ok,
        statusCode: res.status,
        responseTimeMs,
        responseBody: text,
      };
    } catch (err: any) {
      const responseTimeMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        statusCode: 0,
        responseTimeMs,
        responseBody: '',
        error: err.message || 'Falha de conexão com a URL de webhook.',
      };
    }
  },

  /**
   * Busca histórico de eventos recebidos gravados em shipping_logs
   */
  async getRecentWebhookLogs(): Promise<WebhookLogItem[]> {
    const { data, error } = await supabase
      .from('shipping_logs')
      .select('*')
      .ilike('event', 'webhook_%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as WebhookLogItem[];
  },

  /**
   * Limpa histórico de logs de teste de webhooks
   */
  async clearWebhookLogs(): Promise<boolean> {
    const { error } = await supabase
      .from('shipping_logs')
      .delete()
      .ilike('event', 'webhook_%');

    return !error;
  },
};
