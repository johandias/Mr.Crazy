-- =====================================================================
-- MR.CRAZY - MIGRATION: IDADE, SEXO, OBJETIVO DE APRENDIZADO E ONBOARDING
-- =====================================================================

-- 1. ADICIONAR NOVAS COLUNAS NA TABELA mrcrazy_users
ALTER TABLE public.mrcrazy_users
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assessment_answers JSONB DEFAULT '[]'::jsonb;

-- 2. ATUALIZAR CONSTRAINT DE GÊNERO/SEXO SE NECESSÁRIO
ALTER TABLE public.mrcrazy_users 
DROP CONSTRAINT IF EXISTS mrcrazy_users_gender_check;

ALTER TABLE public.mrcrazy_users 
ADD CONSTRAINT mrcrazy_users_gender_check 
CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer'));

-- 3. MARCAR ADMIN COMO ONBOARDING JÁ CONCLUÍDO
UPDATE public.mrcrazy_users
SET onboarding_completed = true,
    learning_goal = 'Administração e testes do sistema'
WHERE email = 'johandias083@gmail.com' OR role = 'admin';
