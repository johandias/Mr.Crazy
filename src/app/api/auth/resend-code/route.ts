import { NextResponse } from "next/server";
import { regenerateVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { checkPublicRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkPublicRateLimit(clientIp, "resend_code_ip", 5, 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas solicitações a partir deste IP. Aguarde ${ipLimit.retryAfterSeconds} segundos.` },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as Partial<{ email: string }>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para reenviar o código." },
        { status: 400 }
      );
    }

    const emailLimit = checkPublicRateLimit(email, "resend_code_email", 2, 60);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Aguarde ${emailLimit.retryAfterSeconds} segundos antes de solicitar um novo código por e-mail.` },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }

    const result = await regenerateVerificationCode(email);

    if (!result.success || !result.code || !result.user) {
      return NextResponse.json(
        { error: result.error || "Não foi possível reenviar o código para este e-mail." },
        { status: 400 }
      );
    }

    let origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
    if (!origin) {
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      origin = host ? `${proto}://${host}` : "https://www.mrcrazy.fun";
    }
    const verifyUrl = `${origin.replace(/\/$/, "")}/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(result.code)}`;

    await sendVerificationEmail({
      email,
      nickname: result.user.nickname,
      code: result.code,
      verifyUrl
    });

    return NextResponse.json({
      ok: true,
      message: "Novo código enviado com sucesso! Verifique sua caixa de entrada e spam."
    });
  } catch (err) {
    console.error("[POST /api/auth/resend-code error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao reenviar código de verificação." },
      { status: 500 }
    );
  }
}
