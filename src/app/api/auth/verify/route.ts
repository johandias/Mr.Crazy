import { NextResponse } from "next/server";
import {
  verifyUserEmailCode,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getSessionMaxAge
} from "@/lib/auth";
import { checkPublicRateLimit, getClientIp, resetPublicRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkPublicRateLimit(clientIp, "verify_ip", 20, 300);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas a partir deste IP. Aguarde ${ipLimit.retryAfterSeconds} segundos antes de tentar novamente.` },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as Partial<{
      email: string;
      code: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const code = typeof body.code === "string" ? body.code.trim().slice(0, 10) : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Por favor, informe seu e-mail e o código de 6 dígitos." },
        { status: 400 }
      );
    }

    const codeLimit = checkPublicRateLimit(email, "verify_code", 6, 300);
    if (!codeLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas com código incorreto para este e-mail. Aguarde ${codeLimit.retryAfterSeconds} segundos antes de tentar novamente.` },
        { status: 429, headers: { "Retry-After": String(codeLimit.retryAfterSeconds) } }
      );
    }

    const result = await verifyUserEmailCode(email, code);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Código de verificação incorreto ou expirado." },
        { status: 400 }
      );
    }

    resetPublicRateLimit(email, "verify_code");

    const user = result.user;
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: "approved"
    });

    const response = NextResponse.json({
      ok: true,
      message: result.alreadyApproved
        ? "Conta já estava confirmada! Entrando..."
        : "Conta confirmada com sucesso! Bem-vindo ao Mr.Crazy.",
      redirectTo: "/practice"
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
      path: "/",
      maxAge: getSessionMaxAge()
    });

    return response;
  } catch (err) {
    console.error("[POST /api/auth/verify error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar a validação do código." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const code = (searchParams.get("code") || "").trim();

  let origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  if (!origin) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    origin = host ? `${proto}://${host}` : "https://www.mrcrazy.fun";
  }
  const base = origin.replace(/\/$/, "");

  if (!email || !code) {
    return NextResponse.redirect(`${base}/login?verifyError=missing`);
  }

  const codeLimit = checkPublicRateLimit(email, "verify_code", 6, 300);
  if (!codeLimit.allowed) {
    return NextResponse.redirect(`${base}/login?verifyError=rate_limit&email=${encodeURIComponent(email)}`);
  }

  try {
    const result = await verifyUserEmailCode(email, code);

    if (!result.success || !result.user) {
      return NextResponse.redirect(
        `${base}/login?verifyError=invalid&email=${encodeURIComponent(email)}`
      );
    }

    resetPublicRateLimit(email, "verify_code");

    const user = result.user;
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: "approved"
    });

    const redirectResponse = NextResponse.redirect(`${base}/practice`);

    redirectResponse.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
      path: "/",
      maxAge: getSessionMaxAge()
    });

    return redirectResponse;
  } catch (err) {
    console.error("[GET /api/auth/verify error]:", err);
    return NextResponse.redirect(
      `${base}/login?verifyError=server&email=${encodeURIComponent(email)}`
    );
  }
}
