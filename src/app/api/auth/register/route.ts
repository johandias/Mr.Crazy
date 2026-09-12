import { NextResponse } from "next/server";
import {
  findUserByEmail,
  registerNewUser,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getSessionMaxAge
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      email: string;
      password: string;
      nickname?: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
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

    const { user, isPending } = await registerNewUser(email, password, nickname);

    const response = NextResponse.json({
      ok: true,
      status: user.status,
      message: isPending
        ? "Conta criada com sucesso! Aguardando a aprovação do administrador para liberar seu acesso."
        : "Conta de administrador criada com sucesso!",
      redirectTo: isPending ? "/login?pending=1" : user.role === "admin" ? "/admin" : "/practice"
    });

    // Se for admin, já loga direto
    if (!isPending) {
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
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao processar o cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}

