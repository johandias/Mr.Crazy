import { NextResponse } from "next/server";
import {
  verifyUserEmailCode,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getSessionMaxAge
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      email: string;
      code: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Por favor, informe seu e-mail e o código de 6 dígitos." },
        { status: 400 }
      );
    }

    const result = await verifyUserEmailCode(email, code);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Código de verificação incorreto ou expirado." },
        { status: 400 }
      );
    }

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

  try {
    const result = await verifyUserEmailCode(email, code);

    if (!result.success || !result.user) {
      return NextResponse.redirect(
        `${base}/login?verifyError=invalid&email=${encodeURIComponent(email)}`
      );
    }

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
