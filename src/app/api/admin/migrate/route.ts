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
-- MR.CRAZY - MIGRATION: PROGRESSO E AVALIAÇÕES DE MÓDULOS
-- =====================================================================
ALTER TABLE public.mrcrazy_users
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assessment_answers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_password_reset_token_hash
ON public.mrcrazy_users(password_reset_token_hash)
WHERE password_reset_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mrcrazy_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.mrcrazy_users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    module_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    total_turns INTEGER NOT NULL DEFAULT 0,
    completed_missions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_module_progress UNIQUE (user_email, module_id)
);

ALTER TABLE public.mrcrazy_users 
DROP CONSTRAINT IF EXISTS mrcrazy_users_gender_check;
CREATE TABLE IF NOT EXISTS public.mrcrazy_module_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.mrcrazy_users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    module_id TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    pronunciation_score INTEGER NOT NULL DEFAULT 85 CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
    grammar_score INTEGER NOT NULL DEFAULT 85 CHECK (grammar_score >= 0 AND grammar_score <= 100),
    fluency_score INTEGER NOT NULL DEFAULT 85 CHECK (fluency_score >= 0 AND fluency_score <= 100),
    performance_level TEXT NOT NULL DEFAULT 'Bom' CHECK (performance_level IN ('Iniciante', 'Em Desenvolvimento', 'Bom', 'Excelente', 'Dominado')),
    summary_feedback TEXT NOT NULL,
    strengths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    improvement_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mrcrazy_users 
ADD CONSTRAINT mrcrazy_users_gender_check 
CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer'));
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON public.mrcrazy_module_progress(user_email, module_id);
CREATE INDEX IF NOT EXISTS idx_module_evaluations_user ON public.mrcrazy_module_evaluations(user_email, module_id);

UPDATE public.mrcrazy_users
SET onboarding_completed = true,
    learning_goal = 'Administração e testes do sistema'
WHERE email = 'johandias083@gmail.com' OR role = 'admin';
ALTER TABLE public.mrcrazy_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_module_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write for module progress" ON public.mrcrazy_module_progress;
CREATE POLICY "Allow public read/write for module progress"
    ON public.mrcrazy_module_progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write for module evaluations" ON public.mrcrazy_module_evaluations;
CREATE POLICY "Allow public read/write for module evaluations"
    ON public.mrcrazy_module_evaluations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

  return NextResponse.json({
    ok: true,
    sql: migrationSql,
    isSupabaseConfigured
  });
}
