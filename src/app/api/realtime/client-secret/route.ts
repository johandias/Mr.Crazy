import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { buildRealtimeSession } from "@/lib/realtime-session";
import { checkRateLimit } from "@/lib/rate-limiter";
import { describeRealtimeProviderError, parseRealtimeProviderError } from "@/lib/realtime-provider-error";
import { getConfiguredRealtimeModel, logRealtimeModelNormalization } from "@/lib/realtime-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

type TokenPayload = {
  value?: string;
  client_secret?: { value?: string };
  [key: string]: unknown;
};

export async function GET(request: Request) {
  const requestedId = request.headers.get("x-voice-request-id") ?? "";
  const diagnosticId = /^[a-f0-9-]{36}$/i.test(requestedId) ? requestedId : randomUUID();
  const started = Date.now();
  let stage = "authentication";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const failure = (error: string, status: number, details: Record<string, unknown> = {}) => {
    console.error("OpenAI Realtime client secret failed", {
      diagnosticId,
      stage,
      status,
      elapsedMs: Date.now() - started,
      ...details
    });
    return NextResponse.json(
      { error, diagnosticId, stage, ...details },
      { status, headers: { "Cache-Control": "private, no-store", "X-Voice-Request-Id": diagnosticId } }
    );
  };

  try {
    const sessionUser = await getCurrentSession();
    if (!sessionUser || sessionUser.status !== "approved") {
      return failure("Sua sessao expirou. Entre novamente para usar a voz.", 401, { code: "authentication_required" });
    }

    stage = "configuration";
    if (!apiKey) {
      return failure("Conversa de voz nao configurada. Entre em contato com o administrador.", 503, { code: "realtime_not_configured" });
    }

    stage = "rate_limit";
    const rateLimit = await checkRateLimit(sessionUser, "realtime");
    if (!rateLimit.allowed) {
      return failure(rateLimit.error ?? "Limite de sessoes atingido.", rateLimit.status, { code: rateLimit.code });
    }

    stage = "profile";
    const user = await getCurrentUser();
    const url = new URL(request.url);
    const model = getConfiguredRealtimeModel();
    logRealtimeModelNormalization(diagnosticId);

    const safetyIdentifier = createHash("sha256")
      .update(user?.email || sessionUser.email || "mr-crazy-authenticated-user")
      .digest("hex");

    stage = "openai_client_secret";
    const session = buildRealtimeSession(
      url.searchParams.get("level"),
      url.searchParams.get("mode"),
      user,
      model,
      url.searchParams.get("moduleId")
    );

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(new DOMException("TimeoutError", "TimeoutError")), 12_000);
    const onReqAbort = () => controller.abort(request.signal.reason);
    if (request.signal.aborted) {
      controller.abort(request.signal.reason);
    } else {
      request.signal.addEventListener("abort", onReqAbort, { once: true });
    }

    let response: Response;
    let bodyText = "";
    try {
      response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": safetyIdentifier
        },
        body: JSON.stringify({ session }),
        signal: controller.signal,
        cache: "no-store"
      });
      bodyText = await response.text();
    } finally {
      clearTimeout(timeoutTimer);
      request.signal.removeEventListener("abort", onReqAbort);
    }

    if (!response.ok) {
      const providerError = parseRealtimeProviderError(bodyText, apiKey);
      return failure(describeRealtimeProviderError(response.status, providerError), 502, {
        code: "client_secret_rejected",
        providerStatus: response.status,
        providerCode: providerError.code,
        ...(sessionUser.role === "admin" ? {
          providerMessage: providerError.message,
          providerParam: providerError.param,
          providerRequestId: response.headers.get("x-request-id"),
          testedModel: model
        } : {})
      });
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(bodyText) as TokenPayload;
    } catch {
      return failure("A OpenAI retornou um token de voz invalido.", 502, { code: "invalid_client_secret_response", testedModel: model });
    }

    const value = payload.value ?? payload.client_secret?.value;
    if (!value) {
      return failure("A OpenAI nao retornou o token efemero de voz.", 502, { code: "missing_client_secret", testedModel: model });
    }

    return NextResponse.json(
      { value, expires_at: payload.expires_at, model, diagnosticId },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-Realtime-Model": model,
          "X-Voice-Request-Id": diagnosticId
        }
      }
    );
  } catch (error) {
    const isTimeout = (error instanceof DOMException && error.name === "TimeoutError") ||
      (error instanceof Error && error.name === "TimeoutError");
    return failure(
      isTimeout ? "Tempo limite ao criar token de voz. Tente novamente." : "Falha ao preparar o token de voz.",
      isTimeout ? 504 : 500,
      { code: isTimeout ? "client_secret_timeout" : "client_secret_internal_error", failureStage: stage }
    );
  }
}
