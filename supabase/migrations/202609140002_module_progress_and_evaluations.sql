-- =====================================================================
-- MR.CRAZY - MIGRATION: PROGRESSO POR MÓDULO E AVALIAÇÃO DE DESEMPENHO
-- =====================================================================

-- 1. TABELA DE PROGRESSO POR MÓDULO
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

-- 2. TABELA DE AVALIAÇÃO DE DESEMPENHO E FEEDBACK DO MÓDULO
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

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON public.mrcrazy_module_progress(user_email, module_id);
CREATE INDEX IF NOT EXISTS idx_module_evaluations_user ON public.mrcrazy_module_evaluations(user_email, module_id);
CREATE INDEX IF NOT EXISTS idx_module_evaluations_date ON public.mrcrazy_module_evaluations(evaluated_at);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.mrcrazy_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_module_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write for module progress" ON public.mrcrazy_module_progress;
CREATE POLICY "Allow public read/write for module progress"
    ON public.mrcrazy_module_progress FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write for module evaluations" ON public.mrcrazy_module_evaluations;
CREATE POLICY "Allow public read/write for module evaluations"
    ON public.mrcrazy_module_evaluations FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

