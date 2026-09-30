import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { changeUserPassword } from "@/lib/auth";
import { checkPublicRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateLimit = checkPublicRateLimit(session.userId || session.email, "change_password", 5, 300);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas de alteração de senha. Aguarde ${rateLimit.retryAfterSeconds} segundos.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await request.json()) as Partial<{
      currentPassword: string;
      newPassword: string;
    }>;

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword.slice(0, 128) : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.slice(0, 128) : "";
    const result = await changeUserPassword(session.userId, currentPassword, newPassword, session.email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Não foi possível alterar a senha." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Senha alterada com sucesso."
    });
  } catch (err) {
    console.error("[POST /api/auth/change-password error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao alterar a senha." },
      { status: 500 }
    );
  }
}
