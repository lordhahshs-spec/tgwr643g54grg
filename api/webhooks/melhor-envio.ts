import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hhqerjxkptknwudsnlgh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_64AtuXy469nIF-4h-oLvKQ_SV9o41Kl';

// Fallback secret if not in environment
const DEFAULT_SECRET = 'ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper to read raw request stream
async function getRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Fetch configured client_secret from database or env
async function getSecret(): Promise<string> {
  if (process.env.MELHOR_ENVIO_CLIENT_SECRET) {
    return process.env.MELHOR_ENVIO_CLIENT_SECRET.trim();
  }
  try {
    const { data } = await supabase
      .from('melhor_envio_integration')
      .select('client_secret')
      .eq('id', 'config')
      .single();
    if (data?.client_secret) {
      return data.client_secret.trim();
    }
  } catch (err) {
    console.error('[webhook] Error loading secret from db:', err);
  }
  return DEFAULT_SECRET;
}

// Timing-safe HMAC verification
function verifyHmacSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const cleanSig = signature.trim().toLowerCase();
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')
      .toLowerCase();

    const sigBuf = Buffer.from(cleanSig, 'hex');
    const compBuf = Buffer.from(computed, 'hex');

    if (sigBuf.length !== compBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch (err) {
    console.error('[webhook] Error calculating HMAC signature:', err);
    return false;
  }
}

export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ME-Signature, x-me-signature, Authorization');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle GET for healthcheck / webhook test ping verification
  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'online',
      service: 'CellHub Melhor Envio Webhook',
      endpoint: '/api/webhooks/melhor-envio',
      methods: ['POST', 'GET'],
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Strictly enforce POST for incoming webhooks
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    res.end(JSON.stringify({
      error: 'Method Not Allowed',
      message: `O método ${req.method} não é suportado. Utilize POST.`,
    }));
    return;
  }

  try {
    const rawBody = await getRawBody(req);
    const signatureHeader = 
      (req.headers['x-me-signature'] as string) ||
      (req.headers['x-melhor-envio-signature'] as string) ||
      (req.headers['x-signature'] as string) ||
      '';

    const secret = await getSecret();

    // Validação de assinatura HMAC-SHA256 conforme documentação oficial
    if (signatureHeader) {
      const isValid = verifyHmacSignature(rawBody, signatureHeader, secret);
      if (!isValid) {
        console.warn('[webhook] Rejeitado: Assinatura X-ME-Signature inválida.');
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Unauthorized',
          message: 'Assinatura X-ME-Signature inválida.',
        }));
        return;
      }
    }

    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch (parseErr) {
        console.warn('[webhook] Não foi possível fazer parse do JSON:', parseErr);
        payload = { raw: rawBody };
      }
    }

    // Responder rapidamente com 200 OK para o Melhor Envio não dar timeout
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      received: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString(),
    }));

    // Processar o evento assincronamente sem prender a resposta HTTP
    (async () => {
      try {
        const event = (payload.event || payload.action || payload.type || 'ping').toString().toLowerCase();
        const data = payload.data || payload;
        const shipmentId = data.id || data.order_id || payload.order_id || payload.shipment_id || payload.id;
        const trackingCode = data.tracking || payload.tracking || null;
        const status = (data.status || payload.status || '').toString().toLowerCase();
        const protocol = data.protocol || payload.protocol || null;

        console.log(`[webhook] Processando evento: ${event} | Status: ${status} | Shipment: ${shipmentId}`);

        // Localizar o pedido correspondente por shipment_id, tracking ou protocolo
        let targetOrder: any = null;

        if (shipmentId) {
          const { data: ord } = await supabase
            .from('marketplace_orders')
            .select('id, shipping_status, order_status, tracking_code')
            .eq('melhor_envio_shipment_id', String(shipmentId))
            .maybeSingle();
          if (ord) targetOrder = ord;
        }

        if (!targetOrder && trackingCode) {
          const { data: ord } = await supabase
            .from('marketplace_orders')
            .select('id, shipping_status, order_status, tracking_code')
            .eq('tracking_code', String(trackingCode))
            .maybeSingle();
          if (ord) targetOrder = ord;
        }

        if (!targetOrder && protocol) {
          const { data: ord } = await supabase
            .from('marketplace_orders')
            .select('id, shipping_status, order_status, tracking_code')
            .eq('melhor_envio_protocol', String(protocol))
            .maybeSingle();
          if (ord) targetOrder = ord;
        }

        // Registrar log de auditoria
        await supabase.from('shipping_logs').insert({
          order_id: targetOrder?.id || null,
          event: `webhook_${event}`,
          status: targetOrder ? 'success' : 'not_found',
          message: `Evento recebido: ${event} (Status: ${status || 'N/A'})`,
          payload: payload,
        });

        // Atualizar pedido se encontrado
        if (targetOrder) {
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          if (trackingCode && !targetOrder.tracking_code) {
            updates.tracking_code = trackingCode;
          }

          // Mapeamento dos eventos oficiais do Melhor Envio:
          // order.created, order.pending, order.released, order.generated,
          // order.received, order.posted, order.delivered, order.cancelled,
          // order.undelivered, order.paused, order.suspended
          if (event === 'order.posted' || status === 'posted' || status === 'postado') {
            updates.shipping_status = 'postado';
            updates.order_status = 'enviado';
          } else if (event === 'order.delivered' || status === 'delivered' || status === 'entregue') {
            updates.shipping_status = 'entregue';
            updates.order_status = 'entregue';
          } else if (event === 'order.released' || event === 'order.generated' || status === 'released' || status === 'generated') {
            updates.shipping_status = 'etiqueta_disponivel';
          } else if (event === 'order.cancelled' || event === 'order.canceled' || status === 'cancelled' || status === 'canceled') {
            updates.shipping_status = 'cancelado';
          } else if (event === 'order.undelivered' || status === 'undelivered') {
            updates.shipping_status = 'erro_envio';
            updates.shipping_error = 'Tentativa de entrega sem sucesso / não entregue.';
          } else if (event === 'order.paused' || event === 'order.suspended') {
            updates.shipping_status = 'erro_envio';
            updates.shipping_error = `Envio ${event === 'order.paused' ? 'pausado' : 'suspenso'} na transportadora.`;
          } else if (status === 'in_transit' || status === 'em_transito') {
            updates.shipping_status = 'em_transito';
            updates.order_status = 'em_transito';
          }

          if (Object.keys(updates).length > 1) {
            await supabase
              .from('marketplace_orders')
              .update(updates)
              .eq('id', targetOrder.id);
            console.log(`[webhook] Pedido ${targetOrder.id} atualizado com sucesso.`);
          }
        }
      } catch (bgErr) {
        console.error('[webhook] Erro no processamento assíncrono do evento:', bgErr);
      }
    })();
  } catch (err: any) {
    console.error('[webhook] Erro crítico no handler do webhook:', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Erro interno ao processar requisição.',
      }));
    }
  }
}
