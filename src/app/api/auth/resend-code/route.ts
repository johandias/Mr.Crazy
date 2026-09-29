import { NextResponse } from "next/server";
import { regenerateVerificationCode } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{ email: string }>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para reenviar o código." },
        { status: 400 }
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
