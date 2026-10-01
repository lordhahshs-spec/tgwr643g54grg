import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluationRequest {
  action: "evaluate_session" | "check_quota" | "manual_evaluate" | "cancel_session";
  sessionId?: string;
  userId: string;
  brand?: string;
  modelName?: string;
  allowedPresets?: { id: string; label: string; defaultDiscount?: number; category?: string }[];
  photos?: { type: string; url?: string; name?: string; base64?: string }[];
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Lista ordenada por velocidade de resposta e suporte multimodal nativo
const FAST_MODELS_CASCADE = [
  { ver: "v1beta", model: "gemini-2.0-flash" },
  { ver: "v1beta", model: "gemini-1.5-flash-8b" },
  { ver: "v1beta", model: "gemini-1.5-flash" },
  { ver: "v1", model: "gemini-1.5-flash" },
  { ver: "v1beta", model: "gemini-2.0-flash-exp" },
  { ver: "v1beta", model: "gemini-1.5-pro" }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hhqerjxkptknwudsnlgh.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: EvaluationRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_json", message: "Corpo da requisição inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, sessionId, userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId_required", message: "Identificação do lojista ausente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cellhub-ai-router] Ação recebida: ${action} para usuário: ${userId}, sessão: ${sessionId || "n/a"}`);

    if (action === "cancel_session" && sessionId) {
      await supabase
        .from("ai_evaluation_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ success: true, message: "Sessão cancelada." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Obter configurações de IA
    const { data: configRow, error: configError } = await supabase
      .from("ai_configurations")
      .select("*")
      .eq("id", "default_config")
      .single();

    if (configError || !configRow) {
      console.error("[cellhub-ai-router] Erro ao carregar ai_configurations:", configError);
      return new Response(
        JSON.stringify({ success: false, error: "config_unavailable", message: "Configurações da CellHub IA indisponíveis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Determinar period_key atual
    const now = new Date();
    const isMonthly = configRow.free_tier_period === "monthly";
    const periodKey = isMonthly 
      ? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
      : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

    // 3. Contar uso gratuito do lojista no período
    const { count: usedFreeCount } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("api_tier", "free")
      .eq("period_key", periodKey)
      .eq("status", "success");

    const usedFree = usedFreeCount || 0;
    const freeLimit = configRow.free_tier_limit || 20;
    const remainingFree = Math.max(0, freeLimit - usedFree);

    // 4. Obter status da assinatura paga
    const { data: subscription } = await supabase
      .from("ai_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const hasPaidAccess = Boolean(
      subscription &&
      subscription.paid_ai_enabled &&
      ["active", "pending"].includes(subscription.subscription_status)
    );

    if (action === "check_quota") {
      return new Response(
        JSON.stringify({
          success: true,
          periodKey,
          periodType: configRow.free_tier_period,
          freeLimit,
          usedFree,
          remainingFree,
          hasPaidAccess,
          paidTierPrice: configRow.paid_tier_monthly_price || 9.90,
          currentTierWillUse: remainingFree > 0 ? "free" : hasPaidAccess ? "paid" : "none"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Roteamento de Tier
    let selectedTier: "free" | "paid" | null = null;
    let apiKey = "";

    if (configRow.free_tier_active && remainingFree > 0) {
      selectedTier = "free";
      apiKey = configRow.free_tier_api_key;
    } else if (configRow.paid_tier_active && hasPaidAccess) {
      selectedTier = "paid";
      apiKey = configRow.paid_tier_api_key;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "free_limit_reached",
          message: "Limite de análises gratuitas atingido. Para continuar utilizando a avaliação automática, ative a CellHub IA.",
          requires_upgrade: true,
          freeLimit,
          usedFree,
          remainingFree: 0,
          hasPaidAccess: false,
          paidTierPrice: configRow.paid_tier_monthly_price || 9.90
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Carregar dados da sessão
    let photosToAnalyze: { type: string; url?: string; name?: string; base64?: string }[] = body.photos || [];
    let allowedPresetsList = body.allowedPresets || [];
    let deviceBrand = body.brand || "Smartphone";
    let deviceModel = body.modelName || "";

    if (sessionId) {
      const { data: sessionData, error: sessionErr } = await supabase
        .from("ai_evaluation_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionErr || !sessionData) {
        return new Response(
          JSON.stringify({ success: false, error: "session_not_found", message: "Sessão de avaliação expirada ou inválida." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (sessionData.status === "cancelled") {
        return new Response(
          JSON.stringify({ success: false, error: "session_cancelled", message: "Esta sessão foi cancelada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      photosToAnalyze = sessionData.photos || [];
      allowedPresetsList = sessionData.allowed_presets || [];
      deviceBrand = sessionData.brand || deviceBrand;
      deviceModel = sessionData.model_name || deviceModel;

      await supabase
        .from("ai_evaluation_sessions")
        .update({ status: "analyzing", updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    if (!photosToAnalyze || photosToAnalyze.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "no_photos", message: "É necessário enviar pelo menos as 3 fotografias do aparelho." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Preparar conteúdo multimodal
    const allowedPresetsDescriptions = allowedPresetsList.map(p => `- ID: "${p.id}" | Nome: "${p.label}"`).join("\n");

    const systemPrompt = `Você é o módulo de análise visual da CellHub IA.
Sua função é analisar fotografias de aparelhos celulares (${deviceBrand} ${deviceModel}) e identificar SOMENTE condições físicas e avarias visivelmente comprováveis nas fotos.

REGRAS OBRIGATÓRIAS:
1. Você deve selecionar APENAS condições presentes na lista de presets permitidos abaixo. NUNCA invente um ID ou retorne IDs fora da lista.
2. NUNCA retorne valores financeiros ou estimativas em dinheiro. A CellHub cuida dos preços.
3. NUNCA tente determinar defeitos funcionais internos (bateria interna, Face ID/biometria eletrônica, Wi-Fi, conector interno, microfone, sensores) a menos que haja dano físico visível direto na lente/tela/conector.
4. Ignore reflexos de luz, poeira leve e artefatos de compressão da imagem quando não houver evidência clara de trinco ou risco.
5. Se não houver evidência visual clara, NÃO selecione a avaria.

LISTA DE PRESETS PERMITIDOS PARA ESTE APARELHO:
${allowedPresetsDescriptions}

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON PURO):
{
  "selected_preset_ids": ["id_1", "id_2"],
  "visual_summary": ["Descrição objetiva do que foi visualizado em cada foto (frente, lateral, traseira)"],
  "confidence": "high" | "medium" | "low"
}`;

    const contentsParts: any[] = [{ text: systemPrompt }];

    // Baixar fotos em paralelo para velocidade máxima
    const photoPromises = photosToAnalyze.map(async (photo) => {
      if (photo.base64) {
        const cleanBase64 = photo.base64.replace(/^data:image\/\w+;base64,/, "");
        return {
          inlineData: { mimeType: "image/jpeg", data: cleanBase64 }
        };
      } else if (photo.name) {
        try {
          const { data: fileData } = await supabase.storage
            .from("tradein-photos")
            .download(photo.name);

          if (fileData) {
            const imgBuffer = await fileData.arrayBuffer();
            return {
              inlineData: { mimeType: "image/jpeg", data: arrayBufferToBase64(imgBuffer) }
            };
          }
        } catch (e) {
          console.error(`[cellhub-ai-router] Erro no download do storage:`, e);
        }
      } else if (photo.url) {
        try {
          const imgResp = await fetch(photo.url);
          if (imgResp.ok) {
            const imgBuffer = await imgResp.arrayBuffer();
            return {
              inlineData: { mimeType: imgResp.headers.get("content-type") || "image/jpeg", data: arrayBufferToBase64(imgBuffer) }
            };
          }
        } catch (e) {
          console.error(`[cellhub-ai-router] Erro no download url:`, e);
        }
      }
      return null;
    });

    const resolvedPhotos = (await Promise.all(photoPromises)).filter(Boolean);
    resolvedPhotos.forEach(p => contentsParts.push(p));

    contentsParts.push({
      text: `Analise as fotografias acima para o aparelho ${deviceBrand} ${deviceModel}. Retorne o JSON com as avarias visíveis identificadas.`
    });

    // 8. Chamar API Gemini com Modelos Ultrarrápidos em cascata curta
    let geminiData: any = null;
    let successfulModel = "";
    let lastErrorText = "";

    for (const item of FAST_MODELS_CASCADE) {
      const geminiUrl = `https://generativelanguage.googleapis.com/${item.ver}/models/${item.model}:generateContent?key=${apiKey}`;
      console.log(`[cellhub-ai-router] Chamando ${item.ver}/${item.model}...`);

      try {
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: contentsParts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        });

        if (geminiResponse.ok) {
          geminiData = await geminiResponse.json();
          successfulModel = `${item.ver}/${item.model}`;
          console.log(`[cellhub-ai-router] Sucesso com ${successfulModel}!`);
          break;
        } else {
          lastErrorText = await geminiResponse.text();
          console.warn(`[cellhub-ai-router] ${item.model} HTTP ${geminiResponse.status}:`, lastErrorText.slice(0, 150));
        }
      } catch (reqErr: any) {
        lastErrorText = reqErr.message || "Erro de rede";
      }
    }

    if (!geminiData) {
      return new Response(
        JSON.stringify({ success: false, error: "ai_provider_error", message: "Instabilidade momentânea no processamento visual da IA. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedResult: { selected_preset_ids: string[]; visual_summary: string[]; confidence: string } = {
      selected_preset_ids: [],
      visual_summary: [],
      confidence: "medium"
    };

    try {
      if (candidateText) {
        const cleanJson = candidateText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        parsedResult = JSON.parse(cleanJson);
      }
    } catch (parseErr) {
      console.error("[cellhub-ai-router] Erro ao fazer parse do JSON do Gemini:", parseErr, candidateText);
    }

    // 9. Validação e Sanitização Estrita de Presets
    const validPresetIdsSet = new Set(allowedPresetsList.map(p => p.id));
    const rawIds = Array.isArray(parsedResult.selected_preset_ids) ? parsedResult.selected_preset_ids : [];
    const sanitizedPresetIds = Array.from(new Set(rawIds.filter(id => validPresetIdsSet.has(id))));

    const usageMetadata = geminiData.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    const costPerMillionInput = selectedTier === "paid" ? 3.50 : 0.075;
    const costPerMillionOutput = selectedTier === "paid" ? 10.50 : 0.30;
    const estimatedCostUsd = ((inputTokens * costPerMillionInput) + (outputTokens * costPerMillionOutput)) / 1_000_000;

    // 10. Registrar Log de Consumo
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      session_id: sessionId || null,
      provider: "gemini",
      api_tier: selectedTier,
      model: successfulModel,
      operation: "tradein_visual_evaluation",
      status: "success",
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      estimated_cost: estimatedCostUsd,
      period_key: periodKey
    });

    // 11. Atualizar sessão no banco
    if (sessionId) {
      await supabase
        .from("ai_evaluation_sessions")
        .update({
          status: "completed",
          detected_presets: sanitizedPresetIds,
          visual_summary: parsedResult.visual_summary || [],
          confidence: parsedResult.confidence || "high",
          used_tier: selectedTier,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tierUsed: selectedTier,
        modelUsed: successfulModel,
        detectedPresetIds: sanitizedPresetIds,
        visualSummary: parsedResult.visual_summary || [],
        confidence: parsedResult.confidence || "high",
        remainingFree: selectedTier === "free" ? Math.max(0, remainingFree - 1) : remainingFree,
        usedFree: selectedTier === "free" ? usedFree + 1 : usedFree,
        freeLimit
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[cellhub-ai-router] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message: error.message || "Erro interno no servidor de IA." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
