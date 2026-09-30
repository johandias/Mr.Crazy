import { NextResponse } from "next/server";
import {
  findUserByEmail,
  registerNewUser,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getSessionMaxAge
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { checkPublicRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkPublicRateLimit(clientIp, "register_ip", 4, 300);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas contas criadas a partir deste IP recentemente. Por segurança, aguarde ${ipLimit.retryAfterSeconds} segundos antes de tentar novamente.` },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as Partial<{
      email: string;
      password: string;
      nickname?: string;
      age?: number | string;
      gender?: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";
    const nickname = typeof body.nickname === "string" ? body.nickname.trim().slice(0, 50) : undefined;
    const parsedAge = body.age ? Number.parseInt(String(body.age), 10) : undefined;
    const age = parsedAge && !Number.isNaN(parsedAge) ? parsedAge : undefined;
    const rawGender = typeof body.gender === "string" ? body.gender.trim().toLowerCase() : "";
    const validGenders = ["masculino", "feminino", "outro", "prefiro_nao_dizer"] as const;
    const gender = validGenders.includes(rawGender as (typeof validGenders)[number])
      ? (rawGender as (typeof validGenders)[number])
      : "prefiro_nao_dizer";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (!age || age < 10 || age > 120) {
      return NextResponse.json(
        { error: "Por favor, informe uma idade válida (entre 10 e 120 anos)." },
        { status: 400 }
      );
    }

    if (!rawGender) {
      return NextResponse.json(
        { error: "Por favor, selecione seu sexo/gênero." },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const { user, isPending, verificationCode } = await registerNewUser(
      email,
      password,
      nickname,
      age,
      gender
    );

    // Se for estudante pendente de ativação, dispara o e-mail via Resend com código e link
    if (isPending && verificationCode) {
      // Determina a URL base para o link de 1 clique
      let origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
      if (!origin) {
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
        const proto = request.headers.get("x-forwarded-proto") || "https";
        origin = host ? `${proto}://${host}` : "https://www.mrcrazy.fun";
      }
      const verifyUrl = `${origin.replace(/\/$/, "")}/verify?email=${encodeURIComponent(user.email)}&code=${encodeURIComponent(verificationCode)}`;

      // Envia o e-mail em segundo plano de forma segura
      await sendVerificationEmail({
        email: user.email,
        nickname: user.nickname,
        code: verificationCode,
        verifyUrl
      });

      return NextResponse.json({
        ok: true,
        status: user.status,
        needsVerification: true,
        email: user.email,
        message:
          "Conta criada com sucesso! Enviamos um código de 6 dígitos e um link de confirmação para o seu e-mail. Digite o código para validar sua conta."
      });
    }

    // Se for administrador (seed/direto), loga diretamente
    const response = NextResponse.json({
      ok: true,
      status: user.status,
      message: "Conta de administrador criada com sucesso!",
      redirectTo: user.role === "admin" ? "/admin" : "/practice"
    });

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status
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
    console.error("[POST /api/auth/register error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar o cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
