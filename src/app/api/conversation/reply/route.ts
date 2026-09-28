import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { getGeminiConversationReply, type BetaConversationTurn } from "@/lib/gemini-conversation";
import { acquireUserQueueSlot, checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeHistory(value: unknown): BetaConversationTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const turn = item as Partial<BetaConversationTurn>;
      const role = turn.role === "user" || turn.role === "crazy" ? turn.role : null;
      const text = typeof turn.text === "string" ? turn.text.trim().slice(0, 700) : "";
      return role && text ? { role, text } : null;
    })
    .filter((item): item is BetaConversationTurn => Boolean(item))
    .slice(-12);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(session, "analyze");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, code: rateLimit.code },
      { status: rateLimit.status, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 10) } }
    );
  }

  let releaseSlot: (() => void) | null = null;
  try {
    const userIdentifier = session.userId || session.email;
    releaseSlot = await acquireUserQueueSlot(userIdentifier, "beta-conversation", 1, 8_000);

    const body = (await request.json()) as { message?: unknown; history?: unknown };
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 700) : "";
    if (!message) return NextResponse.json({ error: "Mensagem obrigatória." }, { status: 400 });

    const user = await getCurrentUser();
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;
    const result = await getGeminiConversationReply(
      message,
      normalizeHistory(body.history),
      apiKey,
      user
        ? {
            nickname: user.nickname,
            level: user.learning_level,
            difficulties: Array.isArray(user.main_difficulties) ? user.main_difficulties : []
          }
        : undefined
    );

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    });
  } catch (error) {
    const isBusy = (error as { code?: string })?.code === "QUEUE_BUSY";
    return NextResponse.json(
      { error: isBusy ? "O Mr.Crazy ainda está respondendo sua mensagem anterior." : "Não consegui preparar a resposta agora." },
      { status: isBusy ? 429 : 500 }
    );
  } finally {
    releaseSlot?.();
  }
}
