import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { changeUserPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      currentPassword: string;
      newPassword: string;
    }>;

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const result = await changeUserPassword(session.userId, currentPassword, newPassword, session.email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Não foi possível alterar a senha." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Senha alterada com sucesso."
    });
  } catch (err) {
    console.error("[POST /api/auth/change-password error]:", err);
    return NextResponse.json(
      { error: "Erro interno ao alterar a senha." },
      { status: 500 }
    );
  }
}
