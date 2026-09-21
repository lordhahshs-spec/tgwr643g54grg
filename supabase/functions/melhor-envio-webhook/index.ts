import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-melhor-envio-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hhqerjxkptknwudsnlgh.supabase.co";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey || "sb_publishable_64AtuXy469nIF-4h-oLvKQ_SV9o41Kl");

  try {
    const rawBody = await req.text();
    console.log("[melhor-envio-webhook] Incoming webhook received:", rawBody.slice(0, 300));

    let payload: any = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    }

    const event = payload.event || payload.action || payload.type || "unknown";
    const data = payload.data || payload;
    const shipmentId = data.id || data.order_id || payload.order_id || payload.shipment_id;
    const trackingCode = data.tracking || payload.tracking || null;
    const status = data.status || payload.status || null;

    console.log(`[melhor-envio-webhook] Event: ${event} | Shipment ID: ${shipmentId} | Status: ${status}`);

    let orderId: string | null = null;

    // Localiza o pedido correspondente no banco pelo shipment_id ou tracking
    if (shipmentId) {
      const { data: order } = await supabase
        .from("marketplace_orders")
        .select("id, shipping_status, order_status")
        .eq("melhor_envio_shipment_id", String(shipmentId))
        .maybeSingle();

      if (order) {
        orderId = order.id;
      }
    }

    if (!orderId && trackingCode) {
      const { data: order } = await supabase
        .from("marketplace_orders")
        .select("id, shipping_status, order_status")
        .eq("tracking_code", String(trackingCode))
        .maybeSingle();

      if (order) {
        orderId = order.id;
      }
    }

    // Registra log do webhook para auditoria
    await supabase.from("shipping_logs").insert({
      order_id: orderId,
      event: `webhook_${event}`,
      status: "info",
      message: `Webhook Melhor Envio recebido: ${event} (Status: ${status || 'N/A'})`,
      payload: payload,
    });

    // Atualiza status do pedido de acordo com o evento
    if (orderId) {
      const orderUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (trackingCode) {
        orderUpdates.tracking_code = trackingCode;
      }

      // Mapeamento de status
      const lowerEvent = (event || "").toLowerCase();
      const lowerStatus = (status || "").toLowerCase();

      if (lowerEvent.includes("posted") || lowerStatus === "posted" || lowerStatus === "postado") {
        orderUpdates.shipping_status = "postado";
        orderUpdates.order_status = "enviado";
      } else if (lowerEvent.includes("delivered") || lowerStatus === "delivered" || lowerStatus === "entregue") {
        orderUpdates.shipping_status = "entregue";
        orderUpdates.order_status = "entregue";
      } else if (lowerEvent.includes("in_transit") || lowerStatus === "in_transit" || lowerStatus === "em_transito") {
        orderUpdates.shipping_status = "em_transito";
        orderUpdates.order_status = "em_transito";
      } else if (lowerEvent.includes("canceled") || lowerStatus === "canceled" || lowerStatus === "cancelado") {
        orderUpdates.shipping_status = "cancelado";
      } else if (lowerEvent.includes("released") || lowerStatus === "released" || lowerStatus === "liberado") {
        orderUpdates.shipping_status = "etiqueta_disponivel";
      }

      if (Object.keys(orderUpdates).length > 1) {
        await supabase
          .from("marketplace_orders")
          .update(orderUpdates)
          .eq("id", orderId);

        console.log(`[melhor-envio-webhook] Order ${orderId} updated with shipping status: ${orderUpdates.shipping_status || 'unchanged'}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[melhor-envio-webhook] Webhook processing error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erro no processamento" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
