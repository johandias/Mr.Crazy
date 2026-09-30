-- Mr.Crazy — Migração Completa do Banco de Dados
-- Cole este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/suawqtpbmigwymhfzukr/sql/new
-- E execute tudo de uma vez.

-- ============================================================
-- TABELA: mrcrazy_users
-- Adiciona colunas faltantes (idempotente)
-- ============================================================
ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS last_practice_date DATE;

-- Garante que todas as colunas existem
ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS learning_goal TEXT;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS assessment_answers JSONB DEFAULT '[]';

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS practice_time_seconds INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS evolution_score INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 1;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT;

ALTER TABLE IF EXISTS public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- ============================================================
-- TABELA: mrcrazy_module_progress (já existe, garante colunas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mrcrazy_module_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  module_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0,
  total_turns INTEGER DEFAULT 0,
  completed_missions TEXT[] DEFAULT '{}',
  last_practiced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT mrcrazy_module_progress_user_module_unique UNIQUE (user_email, module_id)
);
ALTER TABLE public.mrcrazy_module_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_module_progress_user_email ON public.mrcrazy_module_progress(user_email);
GRANT ALL ON public.mrcrazy_module_progress TO service_role;

-- ============================================================
-- TABELA: mrcrazy_module_evaluations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mrcrazy_module_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  module_id TEXT NOT NULL,
  overall_score NUMERIC(4,1) DEFAULT 0,
  pronunciation_score NUMERIC(4,1) DEFAULT 0,
  grammar_score NUMERIC(4,1) DEFAULT 0,
  fluency_score NUMERIC(4,1) DEFAULT 0,
  performance_level TEXT DEFAULT 'iniciante',
  summary_feedback TEXT DEFAULT '',
  strengths TEXT[] DEFAULT '{}',
  improvement_areas TEXT[] DEFAULT '{}',
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mrcrazy_module_evaluations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_module_evaluations_user_email ON public.mrcrazy_module_evaluations(user_email);
GRANT ALL ON public.mrcrazy_module_evaluations TO service_role;

-- ============================================================
-- TABELA: mrcrazy_user_usage (já existe, garante colunas)
-- ============================================================
ALTER TABLE IF EXISTS public.mrcrazy_user_usage
  ADD COLUMN IF NOT EXISTS insights_count INTEGER DEFAULT 0;

-- ============================================================
-- TABELA: mrcrazy_practice_sessions (NOVA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mrcrazy_practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  module_id TEXT,
  concept_index INTEGER DEFAULT 0,
  session_type TEXT DEFAULT 'voice' CHECK (session_type IN ('voice', 'text', 'exam')),
  duration_seconds INTEGER DEFAULT 0,
  turns_count INTEGER DEFAULT 0,
  correct_turns INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mrcrazy_practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_email ON public.mrcrazy_practice_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_started_at ON public.mrcrazy_practice_sessions(user_email, started_at DESC);
GRANT ALL ON public.mrcrazy_practice_sessions TO service_role;

-- ============================================================
-- INDEXES EXTRAS para mrcrazy_users
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.mrcrazy_users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.mrcrazy_users(status);
CREATE INDEX IF NOT EXISTS idx_users_learning_level ON public.mrcrazy_users(learning_level);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_password_reset_token_hash
  ON public.mrcrazy_users(password_reset_token_hash)
  WHERE password_reset_token_hash IS NOT NULL;

-- ============================================================
-- Confirma grants
-- ============================================================
GRANT ALL ON public.mrcrazy_users TO service_role;
GRANT ALL ON public.mrcrazy_module_progress TO service_role;
GRANT ALL ON public.mrcrazy_module_evaluations TO service_role;
GRANT ALL ON public.mrcrazy_user_usage TO service_role;
GRANT ALL ON public.mrcrazy_practice_sessions TO service_role;

SELECT 'Migração concluída com sucesso!' as status;
