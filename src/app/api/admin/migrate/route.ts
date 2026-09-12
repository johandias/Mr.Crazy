import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin" || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const migrationSql = `-- =====================================================================
-- MR.CRAZY - MIGRATION: IDADE, SEXO, OBJETIVO DE APRENDIZADO E ONBOARDING
-- =====================================================================
ALTER TABLE public.mrcrazy_users
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assessment_answers JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.mrcrazy_users 
DROP CONSTRAINT IF EXISTS mrcrazy_users_gender_check;

ALTER TABLE public.mrcrazy_users 
ADD CONSTRAINT mrcrazy_users_gender_check 
CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer'));

UPDATE public.mrcrazy_users
SET onboarding_completed = true,
    learning_goal = 'Administração e testes do sistema'
WHERE email = 'johandias083@gmail.com' OR role = 'admin';
`;

  return NextResponse.json({
    ok: true,
    sql: migrationSql,
    isSupabaseConfigured
  });
}
