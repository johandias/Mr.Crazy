import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { buildRealtimeSession } from "@/lib/realtime-session";
import { checkRateLimit } from "@/lib/rate-limiter";

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
  const sessionUser = await getCurrentSession();
  if (!sessionUser || sessionUser.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  // 1. Verificação de Limite de Taxa e Cota Diária de Sessões WebRTC
  const rateLimit = await checkRateLimit(sessionUser, "realtime");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, code: rateLimit.code },
      {
        status: rateLimit.status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 15),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        }
      }
    );
  }

  const user = await getCurrentUser();

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Conversa em tempo real não configurada." }, { status: 503 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/sdp") && !contentType.includes("text/plain")) {
      return NextResponse.json({ error: "Formato de sessão inválido." }, { status: 415 });
    }

    const sdp = await request.text();
    if (!sdp.trim() || sdp.length > MAX_SDP_LENGTH || !sdp.trimStart().startsWith("v=0")) {
      return NextResponse.json({ error: "Oferta WebRTC inválida." }, { status: 400 });
    }

    const url = new URL(request.url);
    const safetyIdentifier = createHash("sha256")
      .update(user?.email || sessionUser.email || "mr-crazy-authenticated-user")
      .digest("hex");

    const userRequestedModel = url.searchParams.get("model")?.trim();
    const envModel = process.env.OPENAI_REALTIME_MODEL?.trim();
    const candidateModels = Array.from(
      new Set([userRequestedModel, cachedWorkingModel, envModel, ...DEFAULT_REALTIME_MODELS])
    ).filter((m): m is string => Boolean(m));

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

        if (res.ok) {
          cachedWorkingModel = candidate;
          break;
        }

        // Se o modelo não foi encontrado na conta, tenta o próximo candidato
        const isModelNotFound =
          (res.status === 404 || res.status === 400) &&
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
      console.error("OpenAI Realtime session failed", status, responseBody.slice(0, 500));
      let providerError: { code?: string; param?: string; message?: string } = {};
      try {
        const parsed = JSON.parse(responseBody) as { error?: { code?: string; param?: string; message?: string } };
        providerError = parsed.error ?? {};
      } catch {
        providerError = {};
      }

      return NextResponse.json(
        {
          error: "Não foi possível abrir a conversa em tempo real.",
          providerStatus: status,
          providerCode: providerError.code,
          providerMessage: providerError.message,
          providerBody: responseBody.slice(0, 300),
          testedModel: usedModel
        },
        { status: 502 }
      );
    }

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "private, no-store",
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-Realtime-Model": usedModel
      }
    });
  } catch (error) {
    const isTimeout = (error instanceof DOMException && error.name === "TimeoutError") ||
      (error instanceof Error && error.name === "TimeoutError");
    console.error("OpenAI Realtime route failed", isTimeout ? "Request Timeout (16s)" : (error instanceof Error ? error.message : "unknown error"));
    return NextResponse.json(
      { error: isTimeout ? "Tempo limite ao conectar com a IA. Tente novamente." : "Falha ao preparar a conversa em tempo real." },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
