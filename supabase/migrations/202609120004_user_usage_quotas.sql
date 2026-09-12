-- =====================================================================
-- MR.CRAZY - MIGRATION: CONTROLE DE USO, COTAS E CONSUMO DE TOKENS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.mrcrazy_user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.mrcrazy_users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    analyze_count INTEGER NOT NULL DEFAULT 0,
    speech_count INTEGER NOT NULL DEFAULT 0,
    realtime_count INTEGER NOT NULL DEFAULT 0,
    estimated_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_usage_date UNIQUE (user_id, usage_date)
);

-- Índices para consultas ultra-rápidas por usuário e data
CREATE INDEX IF NOT EXISTS idx_mrcrazy_user_usage_user_date ON public.mrcrazy_user_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_user_usage_date ON public.mrcrazy_user_usage(usage_date);

-- Habilitar RLS
ALTER TABLE public.mrcrazy_user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role and authenticated to manage usage" ON public.mrcrazy_user_usage;
CREATE POLICY "Allow service role and authenticated to manage usage"
    ON public.mrcrazy_user_usage FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
