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

// Descobrir dinamicamente os modelos REAIS DE VISÃO MULTIMODAL disponíveis na chave
async function getWorkingVisionModels(apiKey: string): Promise<{ ver: string; model: string }[]> {
  const versions = ["v1beta", "v1"];
  const list: { ver: string; model: string }[] = [];

  for (const ver of versions) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.models)) {
          for (const m of data.models) {
            const cleanName = m.name.replace(/^models\//, "");
            // FILTRO CRÍTICO: Selecionar EXCLUSIVAMENTE modelos Gemini Multimodais (Visão Computacional)
            // Modelos 'gemma' ou embeddings são texto-puro e NÃO processam fotos.
            const isGeminiMultimodal = cleanName.startsWith("gemini-") &&
              !cleanName.includes("embedding") &&
              !cleanName.includes("aqa") &&
              !cleanName.includes("text");

            if (isGeminiMultimodal && m.supportedGenerationMethods?.includes("generateContent")) {
              list.push({ ver, model: cleanName });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[cellhub-ai-router] Erro ao listar ${ver}:`, e);
    }
  }

  // Priorizar modelos visuais de ponta da Google (Gemini 2.0 Flash e 1.5 Flash)
  list.sort((a, b) => {
    const score = (m: string) => {
      if (m === "gemini-2.0-flash") return 1;
      if (m.includes("2.0-flash")) return 2;
      if (m === "gemini-1.5-flash") return 3;
      if (m.includes("1.5-flash")) return 4;
      if (m === "gemini-1.5-pro") return 5;
      if (m.includes("1.5-pro")) return 6;
      return 10;
    };
    return score(a.model) - score(b.model);
  });

  return list;
}

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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, sessionId, userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId_required", message: "Identificação do lojista ausente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancelar Sessão
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
      return new Response(
        JSON.stringify({ success: false, error: "config_unavailable", message: "Configurações da CellHub IA indisponíveis." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Determinar period_key atual
    const now = new Date();
    const isMonthly = configRow.free_tier_period === "monthly";
    const periodKey = isMonthly 
      ? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
      : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

    // 3. Contar uso gratuito
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
          message: "Limite de análises gratuitas atingido. Ative a CellHub IA para análises ilimitadas.",
          requires_upgrade: true,
          freeLimit,
          usedFree,
          remainingFree: 0,
          hasPaidAccess: false,
          paidTierPrice: configRow.paid_tier_monthly_price || 9.90
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          JSON.stringify({ success: false, error: "session_not_found", message: "Sessão expirada ou não encontrada." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (sessionData.status === "cancelled") {
        return new Response(
          JSON.stringify({ success: false, error: "session_cancelled", message: "Esta sessão foi cancelada." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ success: false, error: "no_photos", message: "Envie as 3 fotos do aparelho." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Preparar conteúdo multimodal
    const allowedPresetsDescriptions = allowedPresetsList.map(p => `- ID: "${p.id}" | Nome: "${p.label}"`).join("\n");

    const systemPrompt = `Você é o auditor e perito visual da CellHub IA especializado em inspeção técnica de smartphones para Trade-In.
Você está avaliando as 3 fotografias enviadas para o seguinte aparelho: ${deviceBrand} ${deviceModel}.

🛑 ETAPA 1 - CLASSIFICAÇÃO RIGOROSA DO OBJETO:
Analise as fotos com atenção máxima:
- São de fato fotos de um SMARTPHONE / APARELHO CELULAR REAL (frente/tela, laterais ou traseira)?
- Se as fotos mostrarem QUALQUER OUTRO OBJETO (como mouse, teclado de computador, monitor, notebook, fone, mesa, parede, chão, papel, pessoa, foto preta, borrada ou objeto aleatório):
  -> Você DEVE OBRIGATORIAMENTE definir "is_valid_smartphone": false
  -> Você DEVE definir "detected_object_description": "[Descreva exatamente o que foi fotografado, ex: 'Mouse e teclado de computador', 'Mesa vazia', 'Monitor de PC']"
  -> Você DEVE definir "rejection_reason": "Fotos rejeitadas. Objeto fotografado é [descrever o objeto], não um smartphone."
  -> Você DEVE definir "selected_preset_ids": []
  -> Você DEVE definir "visual_summary": ["As fotos enviadas não são de um smartphone."]
  -> NUNCA marque uma foto de mouse, teclado ou outro objeto como 'sem avarias'!

✅ ETAPA 2 - IDENTIFICAÇÃO DE AVARIAS VISUAIS (Apenas se "is_valid_smartphone" for true):
- Se e somente se as fotos forem comprovadamente de um smartphone real, inspecione a tela frontal, traseira, vidro da câmera e bordas.
- Selecione APENAS os IDs de avarias permitidos abaixo:
${allowedPresetsDescriptions}

RETORNE EXCLUSIVAMENTE O JSON NO SEGUINTE FORMATO:
{
  "is_valid_smartphone": boolean,
  "detected_object_description": string,
  "rejection_reason": string | null,
  "selected_preset_ids": string[],
  "visual_summary": string[],
  "confidence": "high" | "medium" | "low"
}`;

    const contentsParts: any[] = [{ text: systemPrompt }];

    // Baixar fotos em paralelo
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
          console.error(`[cellhub-ai-router] Erro storage:`, e);
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
          console.error(`[cellhub-ai-router] Erro url:`, e);
        }
      }
      return null;
    });

    const resolvedPhotos = (await Promise.all(photoPromises)).filter(Boolean);
    resolvedPhotos.forEach(p => contentsParts.push(p));

    contentsParts.push({
      text: `Analise as imagens e determine se é um smartphone ${deviceBrand} ${deviceModel} e suas avarias. Retorne o JSON puro.`
    });

    // 8. Obter modelos ativos na chave e chamar o primeiro funcional
    const availableModels = await getWorkingVisionModels(apiKey);
    console.log(`[cellhub-ai-router] Modelos ativos na chave:`, availableModels.map(m => `${m.ver}/${m.model}`));

    const fallbackList = [
      ...availableModels,
      { ver: "v1beta", model: "gemini-2.0-flash" },
      { ver: "v1beta", model: "gemini-1.5-flash" },
      { ver: "v1", model: "gemini-1.5-flash" }
    ];

    let geminiData: any = null;
    let successfulModel = "";
    let lastErrorText = "";

    for (const item of fallbackList) {
      const geminiUrl = `https://generativelanguage.googleapis.com/${item.ver}/models/${item.model}:generateContent?key=${apiKey}`;
      console.log(`[cellhub-ai-router] Tentando: ${item.ver}/${item.model}...`);

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
          console.log(`[cellhub-ai-router] SUCESSO com ${successfulModel}!`);
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedResult: any = null;

    try {
      if (candidateText) {
        const cleanJson = candidateText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        parsedResult = JSON.parse(cleanJson);
      }
    } catch (parseErr) {
      console.error("[cellhub-ai-router] Erro ao fazer parse do JSON do Gemini:", parseErr, candidateText);
    }

    if (!parsedResult || typeof parsedResult !== "object") {
      parsedResult = {
        is_valid_smartphone: false,
        detected_object_description: "Objeto não identificado",
        rejection_reason: "Não foi possível confirmar que as fotos pertencem a um smartphone.",
        selected_preset_ids: [],
        visual_summary: [],
        confidence: "low"
      };
    }

    const detectedDesc = String(parsedResult.detected_object_description || "").trim();
    const detectedLower = detectedDesc.toLowerCase();

    // Termos que indicam objetos ou fotos inválidas
    const nonPhoneTerms = [
      "mouse", "teclado", "keyboard", "computador", "computer", "notebook", "laptop",
      "monitor", "mesa", "table", "desk", "cadeira", "parede", "wall", "chão", "floor",
      "pessoa", "person", "rosto", "face", "documento", "caixa", "box", "carro", "car",
      "fone", "headphone", "controle", "gamepad", "garrafa", "copo", "papel", "caneta",
      "objeto desconhecido", "não reconhecido", "não identificado", "ambiente"
    ];

    const hasNonPhoneTerm = nonPhoneTerms.some(term => detectedLower.includes(term));
    const rawIsValid = parsedResult.is_valid_smartphone;

    // A validação é estrita: precisa ser true e não pode conter pistas de itens proibidos
    const isValidSmartphone = (rawIsValid === true || rawIsValid === "true") && !hasNonPhoneTerm;

    let rejectionReason = parsedResult.rejection_reason || null;
    if (!isValidSmartphone && !rejectionReason) {
      rejectionReason = `As fotos enviadas não correspondem a um smartphone (Detectado: ${detectedDesc || "objeto não compatível"}).`;
    }

    const detectedObjectDescription = detectedDesc || (isValidSmartphone ? `${deviceBrand} ${deviceModel}` : "Objeto incompatível");

    console.log(`[cellhub-ai-router] Validação: isValidSmartphone=${isValidSmartphone}, Objeto="${detectedObjectDescription}", Motivo="${rejectionReason}"`);

    const validPresetIdsSet = new Set(allowedPresetsList.map(p => p.id));
    const rawIds = (isValidSmartphone && Array.isArray(parsedResult.selected_preset_ids)) ? parsedResult.selected_preset_ids : [];
    const sanitizedPresetIds = Array.from(new Set(rawIds.filter(id => validPresetIdsSet.has(id))));

    const usageMetadata = geminiData.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    const costPerMillionInput = selectedTier === "paid" ? 3.50 : 0.075;
    const costPerMillionOutput = selectedTier === "paid" ? 10.50 : 0.30;
    const estimatedCostUsd = ((inputTokens * costPerMillionInput) + (outputTokens * costPerMillionOutput)) / 1_000_000;

    const { error: logError } = await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      session_id: sessionId || null,
      provider: "gemini",
      api_tier: selectedTier,
      model: successfulModel,
      operation: "tradein_visual_evaluation",
      status: isValidSmartphone ? "success" : "rejected_non_phone",
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      estimated_cost: estimatedCostUsd,
      period_key: periodKey,
      error_message: isValidSmartphone ? null : rejectionReason
    });

    if (logError) {
      console.error("[cellhub-ai-router] Erro ao registrar log de consumo:", logError);
    }

    if (sessionId) {
      await supabase
        .from("ai_evaluation_sessions")
        .update({
          status: isValidSmartphone ? "completed" : "rejected",
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
        isValidSmartphone,
        detectedObjectDescription,
        rejectionReason,
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
