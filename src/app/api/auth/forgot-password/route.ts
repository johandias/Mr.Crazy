import { NextResponse } from "next/server";
import {
  createPasswordResetToken,
  regenerateVerificationCode
} from "@/lib/auth";
import {
  sendPasswordResetEmail,
  sendVerificationEmail
} from "@/lib/email";
import { checkPublicRateLimit, getClientIp } from "@/lib/rate-limiter";

function getRequestOrigin(request: Request): string {
  let origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  if (!origin) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    origin = host ? `${proto}://${host}` : "https://www.mrcrazy.fun";
  }
  return origin.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkPublicRateLimit(clientIp, "forgot_password_ip", 5, 300);
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
        { error: "Informe um e-mail válido para recuperar o acesso." },
        { status: 400 }
      );
    }

    const emailLimit = checkPublicRateLimit(email, "forgot_password_email", 3, 300);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Aguarde ${emailLimit.retryAfterSeconds} segundos antes de solicitar nova recuperação de senha para este e-mail.` },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }

    const origin = getRequestOrigin(request);
    const reset = await createPasswordResetToken(email);

    if (reset.success && reset.token && reset.user) {
      const resetUrl = `${origin}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(reset.token)}`;
      await sendPasswordResetEmail({
        email,
        nickname: reset.user.nickname,
        resetUrl
      });
    } else if (reset.user?.status === "pending") {
      const resend = await regenerateVerificationCode(email);
      if (resend.success && resend.code && resend.user) {
        const verifyUrl = `${origin}/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(resend.code)}`;
        await sendVerificationEmail({
          email,
          nickname: resend.user.nickname,
          code: resend.code,
          verifyUrl
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Se este e-mail existir no Mr.Crazy, enviaremos as instruções para recuperar o acesso."
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password error]:", err);
    return NextResponse.json(
      { error: "Não foi possível iniciar a recuperação de senha agora." },
      { status: 500 }
    );
  }
}
