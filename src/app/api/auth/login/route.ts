import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, getSessionMaxAge, isValidLogin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{ username: string; password: string }>;
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidLogin(username, password)) {
      return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, redirectTo: "/practice" });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: await createAuthToken(username),
      httpOnly: true,
      sameSite: "lax",
      secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
      path: "/",
      maxAge: getSessionMaxAge()
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível validar o acesso." }, { status: 400 });
  }
}
