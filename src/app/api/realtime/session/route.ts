import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { buildRealtimeSession } from "@/lib/realtime-session";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_SDP_LENGTH = 120_000;

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
    const session = buildRealtimeSession(
      url.searchParams.get("level"),
      url.searchParams.get("mode"),
      user
    );

    const formData = new FormData();
    formData.set("sdp", sdp);
    formData.set("session", JSON.stringify(session));

    const safetyIdentifier = createHash("sha256")
      .update(user?.email || sessionUser.email || "mr-crazy-authenticated-user")
      .digest("hex");

    const realtimeModel = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-4o-mini-realtime-preview";

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

    let response: Response;
    let responseBody = "";
    try {
      // 1. Tenta o endpoint WebRTC oficial da OpenAI (/v1/realtime?model=...)
      response = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(realtimeModel)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/sdp",
          "OpenAI-Safety-Identifier": safetyIdentifier
        },
        body: sdp,
        signal: controller.signal,
        cache: "no-store"
      });
      responseBody = await response.text();

      // 2. Se o endpoint direto não responder OK, tenta /v1/realtime/calls com FormData
      if (!response.ok) {
        console.warn(`[Realtime] Direct endpoint returned ${response.status}: ${responseBody.slice(0, 150)}. Trying /v1/realtime/calls fallback...`);
        const formData = new FormData();
        formData.set("sdp", sdp);
        formData.set("session", JSON.stringify(session));

        const fallbackResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Safety-Identifier": safetyIdentifier
          },
          body: formData,
          signal: controller.signal,
          cache: "no-store"
        });
        const fallbackBody = await fallbackResponse.text();

        if (fallbackResponse.ok) {
          response = fallbackResponse;
          responseBody = fallbackBody;
        } else {
          // Se o fallback também falhou, mantém o erro mais descritivo
          console.error(`[Realtime] Fallback endpoint returned ${fallbackResponse.status}: ${fallbackBody.slice(0, 150)}`);
          if (fallbackBody) {
            response = fallbackResponse;
            responseBody = fallbackBody;
          }
        }
      }
    } finally {
      clearTimeout(timeoutTimer);
      request.signal.removeEventListener("abort", onReqAbort);
    }

    if (!response.ok) {
      console.error("OpenAI Realtime session failed", response.status, responseBody.slice(0, 500));
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
          providerStatus: response.status,
          providerCode: providerError.code,
          providerMessage: providerError.message,
          providerBody: responseBody.slice(0, 300)
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
        "X-RateLimit-Remaining": String(rateLimit.remaining)
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
