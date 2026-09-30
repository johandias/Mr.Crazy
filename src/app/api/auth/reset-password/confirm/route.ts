import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";
import { checkPublicRateLimit, getClientIp, resetPublicRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkPublicRateLimit(clientIp, "reset_password_ip", 10, 300);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas a partir deste IP. Aguarde ${ipLimit.retryAfterSeconds} segundos.` },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as Partial<{
      email: string;
      token: string;
      password: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const token = typeof body.token === "string" ? body.token.trim().slice(0, 256) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";

    const tokenLimit = checkPublicRateLimit(email, "reset_password_token", 5, 300);
    if (!tokenLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas com token incorreto para este e-mail. Aguarde ${tokenLimit.retryAfterSeconds} segundos.` },
        { status: 429, headers: { "Retry-After": String(tokenLimit.retryAfterSeconds) } }
      );
    }

    const result = await resetPasswordWithToken(email, token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Link de redefinição inválido ou expirado." },
        { status: 400 }
      );
    }

    resetPublicRateLimit(email, "reset_password_token");

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso. Entre com sua nova senha.",
      redirectTo: "/login?passwordReset=1"
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password/confirm error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao redefinir senha." },
      { status: 500 }
    );
  }
}
