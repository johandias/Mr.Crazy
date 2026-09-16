import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { buildRealtimeSession } from "@/lib/realtime-session";
import { checkRateLimit } from "@/lib/rate-limiter";
import { describeRealtimeProviderError, parseRealtimeProviderError } from "@/lib/realtime-provider-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_SDP_LENGTH = 120_000;

let cachedWorkingModel: string | null = null;

const DEFAULT_REALTIME_MODELS = [
  "gpt-realtime-2.1-mini",
  "gpt-realtime-mini",
  "gpt-realtime-2.1",
  "gpt-4o-mini-realtime-preview",
  "gpt-4o-realtime-preview",
  "gpt-4o-mini-realtime-preview-2024-12-17",
  "gpt-4o-realtime-preview-2024-12-17"
];

export async function POST(request: Request) {
  const requestedId = request.headers.get("x-voice-request-id") ?? "";
  const diagnosticId = /^[a-f0-9-]{36}$/i.test(requestedId) ? requestedId : randomUUID();
  const started = Date.now();
  let stage = "authentication";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const failure = (error: string, status: number, details: Record<string, unknown> = {}, headers: Record<string, string> = {}) => {
    console.error("OpenAI Realtime session failed", { diagnosticId, stage, status, elapsedMs: Date.now() - started, ...details });
    return NextResponse.json({ error, diagnosticId, stage, ...details }, {
      status, headers: { "Cache-Control": "private, no-store", "X-Voice-Request-Id": diagnosticId, ...headers }
    });
  };
  try {
    const sessionUser = await getCurrentSession();
    if (!sessionUser || sessionUser.status !== "approved") {
      return failure("Sua sessão expirou. Entre novamente para usar a voz.", 401, { code: "authentication_required" });
    }

    stage = "configuration";
    if (!apiKey) {
      return failure("Conversa de voz não configurada. Entre em contato com o administrador.", 503, { code: "realtime_not_configured" });
    }

    // 1. Verificação de Limite de Taxa e Cota Diária de Sessões WebRTC
    stage = "rate_limit";
    const rateLimit = await checkRateLimit(sessionUser, "realtime");
    if (!rateLimit.allowed) {
      return failure(rateLimit.error ?? "Limite de sessões atingido.", rateLimit.status, { code: rateLimit.code }, {
        "Retry-After": String(rateLimit.retryAfterSeconds ?? 15),
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      });
    }

    stage = "profile";
    const user = await getCurrentUser();
    stage = "request_validation";
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/sdp") && !contentType.includes("text/plain")) {
      return failure("Formato de sessão inválido.", 415, { code: "invalid_content_type" });
    }

    const sdp = await request.text();
    if (!sdp.trim() || sdp.length > MAX_SDP_LENGTH || !sdp.trimStart().startsWith("v=0")) {
      return failure("Oferta WebRTC inválida.", 400, { code: "invalid_sdp_offer" });
    }

    const url = new URL(request.url);
    const safetyIdentifier = createHash("sha256")
      .update(user?.email || sessionUser.email || "mr-crazy-authenticated-user")
      .digest("hex");

    const userRequestedModel = url.searchParams.get("model")?.trim();
    const envModel = process.env.OPENAI_REALTIME_MODEL?.trim();
    const candidateModels = Array.from(
      new Set([userRequestedModel, envModel, cachedWorkingModel, ...DEFAULT_REALTIME_MODELS])
    ).filter((m): m is string => Boolean(m));

    stage = "openai_session";
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => {
      controller.abort(new DOMException("TimeoutError", "TimeoutError"));
    }, 16000);

    const onReqAbort = () => controller.abort(request.signal.reason);
    if (request.signal.aborted) {
      controller.abort(request.signal.reason);
    } else {
      request.signal.addEventListener("abort", onReqAbort, { once: true });
    }

    let response: Response | null = null;
    let responseBody = "";
    let providerRequestId: string | null = null;
    let usedModel = candidateModels[0] || "gpt-realtime-2.1-mini";

    try {
      // Itera sobre os modelos candidatos suportados pelo endpoint GA oficial da OpenAI (/v1/realtime/calls)
      for (const candidate of candidateModels) {
        if (controller.signal.aborted) break;
        usedModel = candidate;

        const candidateSession = buildRealtimeSession(
          url.searchParams.get("level"),
          url.searchParams.get("mode"),
          user,
          candidate,
          url.searchParams.get("moduleId")
        );

        const formData = new FormData();
        formData.set("sdp", sdp);
        formData.set("session", JSON.stringify(candidateSession));

        const res = await fetch("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Safety-Identifier": safetyIdentifier
          },
          body: formData,
          signal: controller.signal,
          cache: "no-store"
        });
        const body = await res.text();
        response = res;
        responseBody = body;
        providerRequestId = res.headers.get("x-request-id");

        if (res.ok) {
          cachedWorkingModel = candidate;
          break;
        }

        const attemptError = parseRealtimeProviderError(body, apiKey);
        console.warn("OpenAI Realtime attempt rejected", {
          diagnosticId, stage, model: candidate, status: res.status,
          providerRequestId, elapsedMs: Date.now() - started, ...attemptError
        });

        // Only model availability errors may try another conversation model.
        const isModelNotFound =
          (res.status === 404 || res.status === 400) &&
          !attemptError.param?.includes("transcription") &&
          (body.includes("model_not_found") ||
           body.includes("does not exist") ||
           body.includes("do not have access to it") ||
           body.includes("not supported with the current model"));

        if (isModelNotFound) {
          console.warn(`[Realtime] Model '${candidate}' not available on account, trying next candidate...`);
          continue;
        }

        break;
      }
    } finally {
      clearTimeout(timeoutTimer);
      request.signal.removeEventListener("abort", onReqAbort);
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 500;
      const providerError = parseRealtimeProviderError(responseBody, apiKey);
      console.error("OpenAI Realtime session failed", {
        diagnosticId, stage, elapsedMs: Date.now() - started, status, providerRequestId, model: usedModel, ...providerError
      });

      return NextResponse.json(
        {
          error: describeRealtimeProviderError(status, providerError),
          diagnosticId,
          stage,
          code: "provider_session_rejected",
          providerStatus: status,
          providerCode: providerError.code,
          ...(sessionUser.role === "admin" ? {
            providerMessage: providerError.message,
            providerParam: providerError.param,
            providerRequestId,
            testedModel: usedModel
          } : {})
        },
        { status: 502, headers: { "Cache-Control": "private, no-store", "X-Voice-Request-Id": diagnosticId } }
      );
    }

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "private, no-store",
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-Realtime-Model": usedModel,
        "X-Voice-Request-Id": diagnosticId
      }
    });
  } catch (error) {
    const isTimeout = (error instanceof DOMException && error.name === "TimeoutError") ||
      (error instanceof Error && error.name === "TimeoutError");
    console.error("Realtime route exception", { diagnosticId, stage, ...parseRealtimeProviderError(error instanceof Error ? error.message : "unknown error", apiKey) });
    return failure(
      isTimeout ? "Tempo limite ao conectar com a IA. Tente novamente." : "Falha ao preparar a conversa em tempo real.",
      isTimeout ? 504 : 500,
      { code: isTimeout ? "provider_timeout" : "session_internal_error", failureStage: stage }
    );
  }
}
