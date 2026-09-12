-- =====================================================================
-- MR.CRAZY - MIGRATION: USUÁRIOS, APROVAÇÃO ADMIN E PERFIL PERSONALIZADO
-- =====================================================================

-- 1. TABELA PRINCIPAL DE USUÁRIOS DO MR.CRAZY
CREATE TABLE IF NOT EXISTS public.mrcrazy_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Dados Pessoais para Tratamento e Voz
    nickname TEXT,
    gender TEXT DEFAULT 'masculino' CHECK (gender IN ('masculino', 'feminino', 'outro')),
    
    -- Perfil Cognitivo e Pedagógico
    learning_level TEXT NOT NULL DEFAULT 'basic' CHECK (learning_level IN ('basic', 'intermediate', 'advanced')),
    self_assessed_level TEXT NOT NULL DEFAULT 'Iniciante com trava na fala',
    learning_style TEXT NOT NULL DEFAULT 'Conversação prática e descontraída com correções rápidas',
    main_difficulties TEXT[] NOT NULL DEFAULT ARRAY['pronúncia do th', 'conectar palavras', 'falar com confiança']::TEXT[],
    
    -- Métricas de Uso e Evolução
    practice_time_seconds INTEGER NOT NULL DEFAULT 0,
    evolution_score INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 1,
    
    -- Auditoria
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_email ON public.mrcrazy_users(email);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_status ON public.mrcrazy_users(status);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_role ON public.mrcrazy_users(role);

-- 3. RLS
ALTER TABLE public.mrcrazy_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for app integration"
    ON public.mrcrazy_users FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. SEED ADMIN AUTOMÁTICO (johandias083@gmail.com)
INSERT INTO public.mrcrazy_users (
    email,
    password_hash,
    role,
    status,
    nickname,
    gender,
    learning_level,
    self_assessed_level,
    learning_style
) VALUES (
    'johandias083@gmail.com',
    '2020eumando',
    'admin',
    'approved',
    'Johan (Admin)',
    'masculino',
    'advanced',
    'Fluente / Administrador',
    'Controle total do sistema'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = '2020eumando',
    role = 'admin',
    status = 'approved';

