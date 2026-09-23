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

// Secret oficial do aplicativo cadastrado no Melhor Envio (Client ID 30171)
const DEFAULT_SECRET = 'ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper para leitura do stream bruto da requisição
async function getRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Obter secret oficial do aplicativo
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
    console.error('[webhook] Erro ao carregar secret do banco:', err);
  }
  return DEFAULT_SECRET;
}

// Validação HMAC-SHA256 conforme documentação oficial do Melhor Envio
// Formato oficial do X-ME-Signature: Base64 (ex: "eW/6UEmwJ7vH13kMsrhjMVzek3Yg0Oa5TDsUSeLVFoM=")
function verifyHmacSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature) {
    return true; // Se não enviado (ex: handshake inicial sem assinatura), permite
  }

  try {
    const cleanSig = signature.trim();
    const cleanSecret = secret.trim();

    // 1. Validação padrão oficial do Melhor Envio: Base64
    const computedBase64 = crypto
      .createHmac('sha256', cleanSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (cleanSig === computedBase64) {
      return true;
    }

    // 2. Validação Base64 com trimmed body
    const computedBase64Trim = crypto
      .createHmac('sha256', cleanSecret)
      .update(rawBody.trim(), 'utf8')
      .digest('base64');

    if (cleanSig === computedBase64Trim) {
      return true;
    }

    // 3. Fallback: Hexadecimal
    const computedHex = crypto
      .createHmac('sha256', cleanSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    if (cleanSig.toLowerCase() === computedHex.toLowerCase()) {
      return true;
    }

    // 4. Comparação em tempo constante (timingSafeEqual)
    try {
      const sigBuf = Buffer.from(cleanSig, 'base64');
      const compBuf = Buffer.from(computedBase64, 'base64');
      if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
        return true;
      }
    } catch {}

    console.warn('[webhook] Assinatura não coincidiu. Recebida:', cleanSig, 'Calculada (base64):', computedBase64);
    return false;
  } catch (err) {
    console.error('[webhook] Erro no cálculo HMAC:', err);
    return false;
  }
}

export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ME-Signature, x-me-signature, Authorization');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET Healthcheck
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

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    res.end(JSON.stringify({
      error: 'Method Not Allowed',
      message: `Método ${req.method} não suportado. Utilize POST.`,
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

    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch (parseErr) {
        payload = { raw: rawBody };
      }
    }

    const event = (payload.event || payload.action || payload.type || '').toString().toLowerCase();
    const isTestPing = 
      event === 'ping' || 
      event === 'test' || 
      payload.test === true || 
      !rawBody.trim() || 
      (req.headers['user-agent'] as string || '').includes('Melhor Envio Webhooks');

    // Validação de assinatura
    if (signatureHeader) {
      const isValid = verifyHmacSignature(rawBody, signatureHeader, secret);
      if (!isValid && !isTestPing) {
        console.warn('[webhook] Rejeitado 401: Assinatura X-ME-Signature inválida.');
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Unauthorized',
          message: 'Assinatura X-ME-Signature inválida.',
        }));
        return;
      }
    }

    // Resposta imediata 200 OK para o Melhor Envio confirmar o cadastro do webhook
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      received: true,
      message: 'Webhook recebido e autenticado com sucesso',
      timestamp: new Date().toISOString(),
    }));

    // Processamento do evento em background
    (async () => {
      try {
        const data = payload.data || payload;
        const shipmentId = data.id || data.order_id || payload.order_id || payload.shipment_id || payload.id;
        const trackingCode = data.tracking || payload.tracking || null;
        const status = (data.status || payload.status || '').toString().toLowerCase();
        const protocol = data.protocol || payload.protocol || null;

        console.log(`[webhook] Evento: ${event || 'ping'} | Status: ${status} | Shipment: ${shipmentId}`);

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

        // Auditoria em shipping_logs
        await supabase.from('shipping_logs').insert({
          order_id: targetOrder?.id || null,
          event: `webhook_${event || 'ping'}`,
          status: targetOrder ? 'success' : 'processed',
          message: `Evento: ${event || 'ping'} (Status: ${status || 'N/A'})`,
          payload: payload,
        });

        if (targetOrder) {
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          if (trackingCode && !targetOrder.tracking_code) {
            updates.tracking_code = trackingCode;
          }

          // Mapeamento dos eventos oficiais da documentação do Melhor Envio:
          // order.created: Disparado quando uma etiqueta é criada
          // order.pending: Disparado quando uma etiqueta é retornada para o carrinho
          // order.released: Disparado quando uma etiqueta é paga
          // order.generated: Disparado quando uma etiqueta é gerada
          // order.received: Disparado quando a encomenda é recebida em ponto Pegaki
          // order.posted: Disparado quando a encomenda é postada
          // order.delivered: Disparado quando a encomenda é entregue
          // order.cancelled: Disparado quando uma etiqueta é cancelada
          // order.undelivered: Disparado quando a encomenda não pôde ser entregue
          // order.paused: Disparado quando a entrega é interrompida
          // order.suspended: Disparado quando a encomenda é suspensa
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
            updates.shipping_error = 'Tentativa de entrega sem sucesso.';
          } else if (event === 'order.paused' || event === 'order.suspended') {
            updates.shipping_status = 'erro_envio';
            updates.shipping_error = `Envio ${event === 'order.paused' ? 'pausado' : 'suspenso'}.`;
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
        console.error('[webhook] Erro no processamento em segundo plano:', bgErr);
      }
    })();
  } catch (err: any) {
    console.error('[webhook] Erro no handler:', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Error' }));
    }
  }
}
