import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { listAllUsers, updateUserApprovalStatus } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin" || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const users = await listAllUsers();
    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json({ error: "Erro ao listar usuários." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin" || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<{
      userId: string;
      action: "approve" | "reject";
    }>;

    const userId = typeof body.userId === "string" ? body.userId : "";
    const action = body.action;

    if (!userId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const success = await updateUserApprovalStatus(userId, newStatus);

    if (!success) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 });
  }
}

