import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getSessionMaxAge,
  findUserByEmail,
  verifyPassword,
  getLegacyAuthCredentials,
  ADMIN_EMAIL
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

    // 1. Verificação de credenciais de admin legadas / ambiente
    const legacy = getLegacyAuthCredentials();
    const isAdminLegacy =
      (emailOrUser === legacy.username.toLowerCase() || emailOrUser === ADMIN_EMAIL) &&
      password === legacy.password;

    if (isAdminLegacy) {
      const response = NextResponse.json({
        ok: true,
        role: "admin",
        status: "approved",
        redirectTo: "/admin"
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
          error: "Sua conta foi criada e está aguardando aprovação do administrador.",
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
    const defaultRedirect = user.role === "admin" ? "/admin" : "/practice";
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      status: user.status,
      redirectTo: defaultRedirect
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
  } catch {
    return NextResponse.json(
      { error: "Não foi possível validar o acesso no momento." },
      { status: 500 }
    );
  }
}
