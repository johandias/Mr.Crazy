import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getSessionMaxAge,
  findUserByEmail,
  verifyPassword,
  ADMIN_EMAIL,
  isMasterAdmin
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      email?: string;
      username?: string;
      password?: string;
    }>;

    const emailOrUser = (body.email || body.username || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!emailOrUser || !password) {
      return NextResponse.json(
        { error: "Informe seu e-mail e senha para entrar." },
        { status: 400 }
      );
    }

    // 1. Verificação de credenciais de admin (suporta johandias083@gmail.com / 2020eumando e variáveis de ambiente)
    if (isMasterAdmin(emailOrUser, password)) {
      const response = NextResponse.json({
        ok: true,
        role: "admin",
        status: "approved",
        redirectTo: "/practice"
      });

      const token = createAuthToken({
        userId: "admin-system",
        email: ADMIN_EMAIL,
        role: "admin",
        status: "approved"
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
    }

    // 2. Busca do usuário
    const user = await findUserByEmail(emailOrUser);

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 3. Validação de senha
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 4. Checagem de aprovação do administrador
    if (user.status === "pending") {
      return NextResponse.json(
        {
          error: "Sua conta está aguardando liberação do administrador para entrar.",
          status: "pending"
        },
        { status: 403 }
      );
    }

    if (user.status === "rejected") {
      return NextResponse.json(
        {
          error: "Seu acesso foi suspenso ou recusado pelo administrador.",
          status: "rejected"
        },
        { status: 403 }
      );
    }

    // 5. Login aprovado
    const defaultRedirect =
      user.onboarding_completed || user.role === "admin" ? "/practice" : "/onboarding";
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      status: user.status,
      onboardingCompleted: Boolean(user.onboarding_completed || user.role === "admin"),
      redirectTo: defaultRedirect
    });

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      onboardingCompleted: Boolean(user.onboarding_completed || user.role === "admin")
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
  } catch {
    return NextResponse.json(
      { error: "Não foi possível validar o acesso no momento." },
      { status: 500 }
    );
  }
}
