import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PackageDimension {
  weight: number; // in kg
  width: number;  // in cm
  height: number; // in cm
  length: number; // in cm
  insurance_value?: number;
}

interface ShippingParty {
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  company_document?: string;
  postal_code: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hhqerjxkptknwudsnlgh.supabase.co";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey || "sb_publishable_64AtuXy469nIF-4h-oLvKQ_SV9o41Kl");

  try {
    const { action, ...payload } = await req.json();
    console.log(`[melhor-envio] Executing action: ${action}`);

    // Helper: Load current Melhor Envio integration settings & tokens
    const getIntegrationConfig = async () => {
      const { data, error } = await supabase
        .from("melhor_envio_integration")
        .select("*")
        .eq("id", "config")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[melhor-envio] Error fetching config:", error);
      }

      const isSandbox = data?.environment === "sandbox";
      const baseUrl = isSandbox 
        ? "https://sandbox.melhorenvio.com.br" 
        : "https://melhorenvio.com.br";

      return {
        config: data || {
          client_id: "30171",
          client_secret: "ix8FiZdsyWrc7D0adr7ow2uRRmM5CCBwYp9zPTIr",
          environment: "production",
          redirect_uri: "https://cellhub.shop/api/melhor-envio/callback",
        },
        baseUrl,
        isSandbox,
      };
    };

    // Helper: Refresh access token if expired
    const getValidToken = async () => {
      const { config, baseUrl } = await getIntegrationConfig();
      if (!config.access_token) {
        return { token: null, config, baseUrl };
      }

      const now = new Date();
      const expiresAt = config.token_expires_at ? new Date(config.token_expires_at) : null;

      // If token expires in less than 5 minutes and we have a refresh token, refresh it
      if (expiresAt && (expiresAt.getTime() - now.getTime() < 300000) && config.refresh_token) {
        console.log("[melhor-envio] Access token expiring, refreshing...");
        try {
          const res = await fetch(`${baseUrl}/oauth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              client_id: config.client_id,
              client_secret: config.client_secret,
              refresh_token: config.refresh_token,
            }),
          });

          if (res.ok) {
            const tokenData = await res.json();
            const newExpires = new Date(Date.now() + (tokenData.expires_in || 2592000) * 1000).toISOString();
            await supabase
              .from("melhor_envio_integration")
              .update({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || config.refresh_token,
                token_expires_at: newExpires,
                updated_at: new Date().toISOString(),
              })
              .eq("id", "config");

            console.log("[melhor-envio] Access token refreshed successfully");
            return { token: tokenData.access_token, config, baseUrl };
          } else {
            const errText = await res.text();
            console.error("[melhor-envio] Failed to refresh token:", errText);
          }
        } catch (err) {
          console.error("[melhor-envio] Error refreshing token:", err);
        }
      }

      return { token: config.access_token, config, baseUrl };
    };

    // ACTION: get_status
    if (action === "get_status") {
      const { config, baseUrl } = await getIntegrationConfig();
      const hasToken = Boolean(config.access_token);
      let accountInfo = null;

      if (hasToken) {
        try {
          const accRes = await fetch(`${baseUrl}/api/v2/me`, {
            headers: {
              "Authorization": `Bearer ${config.access_token}`,
              "Accept": "application/json",
              "User-Agent": "CellHub (lordhahshs@gmail.com)",
            },
          });

          if (accRes.ok) {
            accountInfo = await accRes.json();
            // Update balance in db
            if (accountInfo?.balance !== undefined) {
              await supabase
                .from("melhor_envio_integration")
                .update({
                  account_balance: accountInfo.balance,
                  account_email: accountInfo.email || config.account_email,
                  account_name: accountInfo.firstname ? `${accountInfo.firstname} ${accountInfo.lastname || ''}`.trim() : config.account_name,
                  is_connected: true,
                  last_sync_at: new Date().toISOString(),
                })
                .eq("id", "config");
            }
          }
        } catch (err) {
          console.error("[melhor-envio] Error fetching user account info:", err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          connected: hasToken && Boolean(config.is_connected),
          environment: config.environment || "production",
          client_id: config.client_id,
          redirect_uri: config.redirect_uri,
          account_name: accountInfo?.firstname ? `${accountInfo.firstname} ${accountInfo.lastname || ''}`.trim() : config.account_name,
          account_email: accountInfo?.email || config.account_email,
          balance: accountInfo?.balance ?? config.account_balance ?? 0,
          token_expires_at: config.token_expires_at,
          authorize_url: `${baseUrl}/oauth/authorize?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(config.redirect_uri)}&response_type=code&scope=shipping-calculate%20shipping-cancel%20shipping-checkout%20shipping-companies%20shipping-generate%20shipping-preview%20shipping-print%20shipping-share%20shipping-tracking%20cart-read%20cart-write%20companies-read%20companies-write%20orders-read%20transactions-read%20users-read`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: update_settings
    if (action === "update_settings") {
      const { environment, client_id, client_secret, redirect_uri, access_token } = payload;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (environment !== undefined) updates.environment = environment;
      if (client_id !== undefined) updates.client_id = client_id;
      if (client_secret !== undefined) updates.client_secret = client_secret;
      if (redirect_uri !== undefined) updates.redirect_uri = redirect_uri;
      if (access_token !== undefined) {
        const cleanTok = access_token.trim();
        updates.access_token = cleanTok || null;
        updates.is_connected = Boolean(cleanTok);
      }

      const { config } = await getIntegrationConfig();
      const targetEnv = environment || config.environment || "production";
      const effectiveBaseUrl = targetEnv === "sandbox"
        ? "https://sandbox.melhorenvio.com.br"
        : "https://melhorenvio.com.br";

      let tokenValidationSuccess = false;
      let accountName = "";
      let accountEmail = "";
      let balance = 0;

      // Se um access_token foi fornecido, valida diretamente na API oficial do Melhor Envio
      if (updates.access_token) {
        try {
          const accRes = await fetch(`${effectiveBaseUrl}/api/v2/me`, {
            headers: {
              "Authorization": `Bearer ${updates.access_token}`,
              "Accept": "application/json",
              "User-Agent": "CellHub (lordhahshs@gmail.com)",
            },
          });

          if (accRes.ok) {
            const accData = await accRes.json();
            accountName = accData.firstname ? `${accData.firstname} ${accData.lastname || ""}`.trim() : "";
            accountEmail = accData.email || "";
            balance = accData.balance || 0;
            updates.account_name = accountName;
            updates.account_email = accountEmail;
            updates.account_balance = balance;
            updates.is_connected = true;
            updates.last_sync_at = new Date().toISOString();
            tokenValidationSuccess = true;
          } else {
            console.warn(`[melhor-envio] Token validation status: ${accRes.status}`);
          }
        } catch (vErr) {
          console.error("[melhor-envio] Error validating token with Melhor Envio:", vErr);
        }
      }

      await supabase.from("melhor_envio_integration").upsert({ id: "config", ...updates });
      console.log("[melhor-envio] Settings updated");

      return new Response(
        JSON.stringify({
          success: true,
          token_valid: tokenValidationSuccess,
          account_name: accountName,
          account_email: accountEmail,
          balance: balance,
          message: tokenValidationSuccess
            ? `Conexão estabelecida com sucesso com o Melhor Envio! Titular: ${accountName || accountEmail}`
            : "Configurações salvas no sistema.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: exchange_oauth_code
    if (action === "exchange_oauth_code") {
      const { code } = payload;
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: "Código de autorização não fornecido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { config, baseUrl } = await getIntegrationConfig();
      console.log(`[melhor-envio] Exchanging OAuth code with ${baseUrl}/oauth/token`);

      const res = await fetch(`${baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: config.client_id,
          client_secret: config.client_secret,
          redirect_uri: config.redirect_uri,
          code: code,
        }),
      });

      const tokenData = await res.json();
      if (!res.ok) {
        console.error("[melhor-envio] Token exchange failed:", tokenData);
        return new Response(
          JSON.stringify({
            success: false,
            error: tokenData.error_description || tokenData.message || "Falha na troca do código OAuth.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 2592000) * 1000).toISOString();
      await supabase
        .from("melhor_envio_integration")
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          is_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "config");

      console.log("[melhor-envio] OAuth tokens stored successfully");
      return new Response(
        JSON.stringify({ success: true, message: "Autenticação realizada com sucesso!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: calculate_shipping
    if (action === "calculate_shipping") {
      const { from_postal_code, to_postal_code, package: pkg, products } = payload;

      const cleanFrom = (from_postal_code || "").replace(/\D/g, "");
      const cleanTo = (to_postal_code || "").replace(/\D/g, "");

      if (!cleanFrom || cleanFrom.length !== 8) {
        return new Response(
          JSON.stringify({ success: false, error: "CEP de origem inválido. O vendedor precisa cadastrar um CEP válido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!cleanTo || cleanTo.length !== 8) {
        return new Response(
          JSON.stringify({ success: false, error: "CEP de destino inválido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { token, baseUrl } = await getValidToken();

      // Official Melhor Envio calculation payload
      const calcBody: Record<string, any> = {
        from: { postal_code: cleanFrom },
        to: { postal_code: cleanTo },
      };

      if (pkg) {
        calcBody.package = {
          height: Number(pkg.height) || 8,
          width: Number(pkg.width) || 15,
          length: Number(pkg.length) || 20,
          weight: Number(pkg.weight) || 0.5,
        };
        if (pkg.insurance_value) {
          calcBody.options = {
            insurance_value: Number(pkg.insurance_value),
            receipt: false,
            own_hand: false,
          };
        }
      } else if (products && Array.isArray(products) && products.length > 0) {
        calcBody.products = products;
      } else {
        calcBody.package = { height: 8, width: 15, length: 20, weight: 0.5 };
      }

      console.log(`[melhor-envio] Calculating shipping: ${cleanFrom} -> ${cleanTo}`);

      // If token is missing, provide clear response
      if (!token) {
        console.warn("[melhor-envio] No access token configured yet. Returning guidance.");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Integração do Melhor Envio não autorizada. Acesse o Painel de Administração para conectar a conta CellHub.",
            needs_auth: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CellHub (lordhahshs@gmail.com)",
        },
        body: JSON.stringify(calcBody),
      });

      const data = await res.json();
      console.log(`[melhor-envio] Shipping calculate status: ${res.status}`);

      if (!res.ok) {
        console.error("[melhor-envio] Calculation API error:", data);
        return new Response(
          JSON.stringify({
            success: false,
            error: data.message || "Erro ao consultar transportadoras no Melhor Envio.",
            details: data,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter and format available services
      const availableQuotes = (Array.isArray(data) ? data : [])
        .filter((service: any) => !service.error && service.price)
        .map((service: any) => ({
          id: service.id,
          name: service.name,
          company: {
            id: service.company?.id,
            name: service.company?.name,
            picture: service.company?.picture,
          },
          price: parseFloat(service.custom_price || service.price || 0),
          original_price: parseFloat(service.price || 0),
          discount: parseFloat(service.discount || 0),
          delivery_time: service.custom_delivery_time || service.delivery_time,
          delivery_range: service.delivery_range,
          packages: service.packages,
          currency: service.currency || "R$",
        }));

      return new Response(
        JSON.stringify({
          success: true,
          from_postal_code: cleanFrom,
          to_postal_code: cleanTo,
          quotes: availableQuotes,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: create_and_purchase_label (Cart -> Checkout -> Generate -> Print)
    if (action === "create_and_purchase_label") {
      const { order_id } = payload;
      if (!order_id) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do pedido obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency: Retrieve order and check if shipment is already purchased
      const { data: order, error: orderErr } = await supabase
        .from("marketplace_orders")
        .select("*")
        .eq("id", order_id)
        .single();

      if (orderErr || !order) {
        return new Response(
          JSON.stringify({ success: false, error: "Pedido não encontrado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (order.melhor_envio_shipment_id && order.melhor_envio_print_url) {
        console.log(`[melhor-envio] Order ${order_id} already has label generated. Skipping duplicate purchase.`);
        return new Response(
          JSON.stringify({
            success: true,
            already_processed: true,
            shipment_id: order.melhor_envio_shipment_id,
            print_url: order.melhor_envio_print_url,
            tracking_code: order.tracking_code,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { token, baseUrl } = await getValidToken();
      if (!token) {
        console.warn(`[melhor-envio] Sem token do Melhor Envio configurado para compra de etiqueta do pedido ${order_id}`);
        await supabase.from("shipping_logs").insert({
          order_id,
          event: "label_failed",
          status: "error",
          message: "Tentativa de compra de etiqueta sem token do Melhor Envio conectado no sistema.",
        });

        return new Response(
          JSON.stringify({
            success: false,
            needs_auth: true,
            error: "Integração do Melhor Envio não autorizada. O Administrador precisa conectar o Token de Acesso no Painel Admin para gerar etiquetas oficiais.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const origin = order.shipping_origin_snapshot;
      const destination = order.shipping_destination_snapshot;
      const pkg = order.shipping_package_snapshot || { weight: 0.5, height: 8, width: 15, length: 20 };
      const quote = order.shipping_quote_snapshot;

      if (!origin || !destination) {
        return new Response(
          JSON.stringify({ success: false, error: "Snapshots de endereço de origem ou destino ausentes no pedido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const serviceId = quote?.id || 1; // Default PAC / selected service

      // Step 1: Add to Cart (POST /api/v2/me/cart)
      console.log(`[melhor-envio] Adding shipment to cart for order: ${order_id}`);
      const cartPayload = {
        service: serviceId,
        from: {
          name: origin.name || order.seller_company || "Vendedor CellHub",
          phone: origin.phone || "11999999999",
          email: origin.email || "vendedor@cellhub.shop",
          document: (origin.document || "").replace(/\D/g, "") || undefined,
          company_document: (origin.cnpj || "").replace(/\D/g, "") || undefined,
          address: origin.street,
          complement: origin.complement || "",
          number: origin.number || "S/N",
          district: origin.neighborhood || origin.district || "Centro",
          city: origin.city,
          state_abbr: origin.state,
          country_id: "BR",
          postal_code: origin.zipCode?.replace(/\D/g, "") || origin.postal_code?.replace(/\D/g, ""),
        },
        to: {
          name: destination.name || order.buyer_owner || order.buyer_company || "Comprador CellHub",
          phone: destination.phone || "11999999999",
          email: destination.email || order.buyer_email || "comprador@cellhub.shop",
          document: (destination.document || "").replace(/\D/g, "") || undefined,
          company_document: (order.buyer_cnpj || destination.cnpj || "").replace(/\D/g, "") || undefined,
          address: destination.street,
          complement: destination.complement || "",
          number: destination.number || "S/N",
          district: destination.neighborhood || destination.district || "Centro",
          city: destination.city,
          state_abbr: destination.state,
          country_id: "BR",
          postal_code: destination.zipCode?.replace(/\D/g, "") || destination.postal_code?.replace(/\D/g, ""),
        },
        products: [
          {
            name: order.product_title || "Produto CellHub",
            quantity: 1,
            unitary_value: Number(order.product_price || order.product_amount || 50),
          },
        ],
        volumes: [
          {
            height: Number(pkg.height || 8),
            width: Number(pkg.width || 15),
            length: Number(pkg.length || 20),
            weight: Number(pkg.weight || 0.5),
          },
        ],
        options: {
          insurance_value: Number(order.product_price || order.product_amount || 50),
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: true,
          platform: "CellHub",
        },
      };

      const cartRes = await fetch(`${baseUrl}/api/v2/me/cart`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CellHub (lordhahshs@gmail.com)",
        },
        body: JSON.stringify(cartPayload),
      });

      const cartData = await cartRes.json();
      if (!cartRes.ok || !cartData.id) {
        console.error("[melhor-envio] Add to cart error:", cartData);
        await supabase.from("shipping_logs").insert({
          order_id,
          event: "cart_failed",
          status: "error",
          message: "Erro ao inserir envio no carrinho do Melhor Envio",
          payload: cartData,
        });

        await supabase
          .from("marketplace_orders")
          .update({
            shipping_status: "erro_envio",
            shipping_error: cartData.message || "Erro ao criar envio no Melhor Envio",
          })
          .eq("id", order_id);

        return new Response(
          JSON.stringify({ success: false, error: cartData.message || "Erro ao adicionar ao carrinho." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cartItemId = cartData.id;
      console.log(`[melhor-envio] Cart item created: ${cartItemId}`);

      // Step 2: Checkout / Purchase using CellHub Wallet (POST /api/v2/me/shipment/checkout)
      console.log(`[melhor-envio] Checking out cart item ${cartItemId} with CellHub balance`);
      const checkoutRes = await fetch(`${baseUrl}/api/v2/me/shipment/checkout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CellHub (lordhahshs@gmail.com)",
        },
        body: JSON.stringify({
          orders: [cartItemId],
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        console.error("[melhor-envio] Checkout error:", checkoutData);
        await supabase.from("shipping_logs").insert({
          order_id,
          event: "checkout_failed",
          status: "error",
          message: "Erro ao realizar compra da etiqueta via saldo CellHub",
          payload: checkoutData,
        });

        await supabase
          .from("marketplace_orders")
          .update({
            melhor_envio_shipment_id: cartItemId,
            shipping_status: "etiqueta_aguardando_compra",
            shipping_error: checkoutData.message || "Saldo insuficiente ou pendência na carteira CellHub no Melhor Envio",
          })
          .eq("id", order_id);

        return new Response(
          JSON.stringify({
            success: false,
            error: checkoutData.message || "Erro no checkout do Melhor Envio (verifique o saldo da conta CellHub).",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 3: Generate label (POST /api/v2/me/shipment/generate)
      console.log(`[melhor-envio] Generating label for order ${cartItemId}`);
      await fetch(`${baseUrl}/api/v2/me/shipment/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CellHub (lordhahshs@gmail.com)",
        },
        body: JSON.stringify({ orders: [cartItemId] }),
      });

      // Step 4: Get print URL (POST /api/v2/me/shipment/print)
      console.log(`[melhor-envio] Getting print URL for order ${cartItemId}`);
      let printUrl = "";
      try {
        const printRes = await fetch(`${baseUrl}/api/v2/me/shipment/print`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CellHub (lordhahshs@gmail.com)",
          },
          body: JSON.stringify({
            mode: "public",
            orders: [cartItemId],
          }),
        });

        if (printRes.ok) {
          const printData = await printRes.json();
          printUrl = printData.url || "";
        }
      } catch (printErr) {
        console.warn("[melhor-envio] Warning getting print URL:", printErr);
      }

      // Step 5: Check tracking or details from Melhor Envio
      let trackingCode = "";
      let actualCost = parseFloat(cartData.price || quote?.price || 0);

      try {
        const detailRes = await fetch(`${baseUrl}/api/v2/me/orders/${cartItemId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          trackingCode = detailData.tracking || "";
          if (detailData.price) {
            actualCost = parseFloat(detailData.price);
          }
        }
      } catch (detailErr) {
        console.warn("[melhor-envio] Warning reading order details:", detailErr);
      }

      // Financial breakdown:
      const shippingAmountCharged = parseFloat(order.shipping_amount_charged || order.shipping_cost || 0);
      const isFreeShipping = shippingAmountCharged === 0;
      const sellerShippingCost = isFreeShipping ? actualCost : 0;
      const shippingDifference = shippingAmountCharged - actualCost;

      // Update Order in database
      await supabase
        .from("marketplace_orders")
        .update({
          melhor_envio_shipment_id: cartItemId,
          melhor_envio_print_url: printUrl,
          melhor_envio_label_url: printUrl,
          tracking_code: trackingCode || order.tracking_code,
          tracking_status: "etiqueta_gerada",
          shipping_status: "etiqueta_disponivel",
          actual_shipping_cost: actualCost,
          seller_shipping_cost: sellerShippingCost,
          shipping_difference: shippingDifference,
          shipping_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      await supabase.from("shipping_logs").insert({
        order_id,
        event: "label_created",
        status: "success",
        message: `Etiqueta gerada com sucesso! Custo real: R$ ${actualCost.toFixed(2)}`,
        payload: {
          shipment_id: cartItemId,
          print_url: printUrl,
          tracking_code: trackingCode,
          actual_cost: actualCost,
        },
      });

      console.log(`[melhor-envio] Label successfully purchased and saved for order: ${order_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          shipment_id: cartItemId,
          print_url: printUrl,
          tracking_code: trackingCode,
          actual_cost: actualCost,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: track_shipment
    if (action === "track_shipment") {
      const { shipment_id, order_id } = payload;
      if (!shipment_id && !order_id) {
        return new Response(
          JSON.stringify({ success: false, error: "Identificador de envio ou pedido não fornecido." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let targetShipmentId = shipment_id;
      if (!targetShipmentId && order_id) {
        const { data: o } = await supabase
          .from("marketplace_orders")
          .select("melhor_envio_shipment_id")
          .eq("id", order_id)
          .single();
        targetShipmentId = o?.melhor_envio_shipment_id;
      }

      if (!targetShipmentId) {
        return new Response(
          JSON.stringify({ success: false, error: "Envio ainda não gerado para este pedido." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { token, baseUrl } = await getValidToken();
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: "Token não configurado." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const trackRes = await fetch(`${baseUrl}/api/v2/me/shipment/tracking`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CellHub (lordhahshs@gmail.com)",
        },
        body: JSON.stringify({ orders: [targetShipmentId] }),
      });

      const trackData = await trackRes.json();
      console.log(`[melhor-envio] Tracking response for ${targetShipmentId}`);

      const shipmentInfo = trackData?.[targetShipmentId];
      if (shipmentInfo && order_id) {
        const trackingCode = shipmentInfo.tracking || "";
        const status = shipmentInfo.status || "";

        // Map status to order shipping status
        let nextShippingStatus = "etiqueta_disponivel";
        if (status === "posted") nextShippingStatus = "postado";
        else if (status === "delivered") nextShippingStatus = "entregue";
        else if (status === "canceled") nextShippingStatus = "cancelado";
        else if (status === "in_transit") nextShippingStatus = "em_transito";

        await supabase
          .from("marketplace_orders")
          .update({
            tracking_code: trackingCode || undefined,
            tracking_status: status,
            shipping_status: nextShippingStatus,
            tracking_history: shipmentInfo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);
      }

      return new Response(
        JSON.stringify({ success: true, tracking: shipmentInfo || trackData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Ação '${action}' desconhecida.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[melhor-envio] Uncaught handler error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
