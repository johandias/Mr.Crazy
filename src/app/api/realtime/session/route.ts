import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthenticated, getCurrentUser } from "@/lib/server-auth";
import { buildRealtimeSession } from "@/lib/realtime-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SDP_LENGTH = 120_000;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
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
      .update(user?.email || "mr-crazy-authenticated-user")
      .digest("hex");

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Safety-Identifier": safetyIdentifier
      },
      body: formData,
      cache: "no-store"
    });
    const responseBody = await response.text();

    if (!response.ok) {
      console.error("OpenAI Realtime session failed", response.status, responseBody.slice(0, 500));
      let providerError: { code?: string; param?: string } = {};
      try {
        const parsed = JSON.parse(responseBody) as { error?: { code?: string; param?: string } };
        providerError = parsed.error ?? {};
      } catch {
        providerError = {};
      }

      return NextResponse.json(
        {
          error: "Não foi possível abrir a conversa em tempo real.",
          providerStatus: response.status,
          providerCode: providerError.code,
          providerParam: providerError.param
        },
        { status: 502 }
      );
    }

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("OpenAI Realtime route failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Falha ao preparar a conversa em tempo real." }, { status: 500 });
  }
}
