import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-me-signature, x-melhor-envio-signature",
};

const DEFAULT_SECRET = "ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr";

// Helper: HMAC-SHA256 verification using Web Crypto API in Deno (Base64)
async function verifyHmacBase64(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature) return true;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret.trim());
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(rawBody)
    );

    // Converte para Base64 (formato oficial do Melhor Envio)
    let binary = "";
    const bytes = new Uint8Array(signatureBytes);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const computedBase64 = btoa(binary);

    const cleanSig = signature.trim();
    if (cleanSig === computedBase64) return true;

    // Base64 em trimmed body
    const sigBytesTrim = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(rawBody.trim())
    );
    let binaryTrim = "";
    const bytesTrim = new Uint8Array(sigBytesTrim);
    for (let i = 0; i < bytesTrim.byteLength; i++) {
      binaryTrim += String.fromCharCode(bytesTrim[i]);
    }
    if (cleanSig === btoa(binaryTrim)) return true;

    // Hex fallback
    const computedHex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase();

    return cleanSig.toLowerCase() === computedHex;
  } catch (err) {
    console.error("[melhor-envio-webhook] Error verifying HMAC:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check via GET
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "online",
        service: "CellHub Melhor Envio Edge Webhook",
        methods: ["POST", "GET"],
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed", message: `Método ${req.method} não suportado.` }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "POST, GET, OPTIONS" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hhqerjxkptknwudsnlgh.supabase.co";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey || "sb_publishable_64AtuXy469nIF-4h-oLvKQ_SV9o41Kl");

  try {
    const rawBody = await req.text();
    console.log("[melhor-envio-webhook] Payload received:", rawBody.slice(0, 300));

    // Assinatura enviada no header
    const signature = 
      req.headers.get("x-me-signature") || 
      req.headers.get("x-melhor-envio-signature") || 
      req.headers.get("x-signature") || 
      "";

    let secret = Deno.env.get("MELHOR_ENVIO_CLIENT_SECRET") || DEFAULT_SECRET;
    try {
      const { data: config } = await supabase
        .from("melhor_envio_integration")
        .select("client_secret")
        .eq("id", "config")
        .single();
      if (config?.client_secret) {
        secret = config.client_secret.trim();
      }
    } catch {
      // fallback
    }

    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    }

    const event = (payload.event || payload.action || payload.type || "").toString().toLowerCase();
    const isTestPing = 
      event === "ping" || 
      event === "test" || 
      payload.test === true || 
      !rawBody.trim() || 
      (req.headers.get("user-agent") || "").includes("Melhor Envio Webhooks");

    if (signature) {
      const valid = await verifyHmacBase64(rawBody, signature, secret);
      if (!valid && !isTestPing) {
        console.warn("[melhor-envio-webhook] Rejeitado 401: Assinatura inválida.");
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Assinatura X-ME-Signature inválida." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const data = payload.data || payload;
    const shipmentId = data.id || data.order_id || payload.order_id || payload.shipment_id || payload.id;
    const trackingCode = data.tracking || payload.tracking || null;
    const status = (data.status || payload.status || "").toString().toLowerCase();
    const protocol = data.protocol || payload.protocol || null;

    console.log(`[melhor-envio-webhook] Event: ${event || 'ping'} | Status: ${status} | Shipment: ${shipmentId}`);

    let orderId: string | null = null;

    if (shipmentId) {
      const { data: ord } = await supabase
        .from("marketplace_orders")
        .select("id")
        .eq("melhor_envio_shipment_id", String(shipmentId))
        .maybeSingle();
      if (ord) orderId = ord.id;
    }

    if (!orderId && trackingCode) {
      const { data: ord } = await supabase
        .from("marketplace_orders")
        .select("id")
        .eq("tracking_code", String(trackingCode))
        .maybeSingle();
      if (ord) orderId = ord.id;
    }

    if (!orderId && protocol) {
      const { data: ord } = await supabase
        .from("marketplace_orders")
        .select("id")
        .eq("melhor_envio_protocol", String(protocol))
        .maybeSingle();
      if (ord) orderId = ord.id;
    }

    // Auditoria em shipping_logs
    await supabase.from("shipping_logs").insert({
      order_id: orderId,
      event: `webhook_${event || 'ping'}`,
      status: orderId ? "success" : "processed",
      message: `Evento: ${event || 'ping'} (Status: ${status || 'N/A'})`,
      payload: payload,
    });

    if (orderId) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (trackingCode) updates.tracking_code = trackingCode;

      if (event === "order.posted" || status === "posted" || status === "postado") {
        updates.shipping_status = "postado";
        updates.order_status = "enviado";
      } else if (event === "order.delivered" || status === "delivered" || status === "entregue") {
        updates.shipping_status = "entregue";
        updates.order_status = "entregue";
      } else if (event === "order.released" || event === "order.generated" || status === "released" || status === "generated") {
        updates.shipping_status = "etiqueta_disponivel";
      } else if (event === "order.cancelled" || event === "order.canceled" || status === "cancelled" || status === "canceled") {
        updates.shipping_status = "cancelado";
      } else if (event === "order.undelivered" || status === "undelivered") {
        updates.shipping_status = "erro_envio";
        updates.shipping_error = "Tentativa de entrega sem sucesso.";
      } else if (event === "order.paused" || event === "order.suspended") {
        updates.shipping_status = "erro_envio";
        updates.shipping_error = `Envio ${event === "order.paused" ? "pausado" : "suspenso"}.`;
      } else if (status === "in_transit" || status === "em_transito") {
        updates.shipping_status = "em_transito";
        updates.order_status = "em_transito";
      }

      if (Object.keys(updates).length > 1) {
        await supabase.from("marketplace_orders").update(updates).eq("id", orderId);
        console.log(`[melhor-envio-webhook] Order ${orderId} updated.`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, received: true, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[melhor-envio-webhook] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erro no processamento" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
