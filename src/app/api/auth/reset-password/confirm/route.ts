import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      email: string;
      token: string;
      password: string;
    }>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const result = await resetPasswordWithToken(email, token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Link de redefinição inválido ou expirado." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso. Entre com sua nova senha.",
      redirectTo: "/login?passwordReset=1"
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password/confirm error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao redefinir senha." },
      { status: 500 }
    );
  }
}
