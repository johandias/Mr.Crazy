-- =====================================================================
-- MR.CRAZY - SCHEMA DE PERSISTÊNCIA COMPLETO (SUPABASE POSTGRES)
-- =====================================================================

-- 1. TABELA DE PERFIL DE ALUNO E PROGRESSO
CREATE TABLE IF NOT EXISTS public.mrcrazy_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL DEFAULT 'Aluno',
    learning_level TEXT NOT NULL DEFAULT 'basic' CHECK (learning_level IN ('basic', 'intermediate', 'advanced')),
    selected_mode TEXT NOT NULL DEFAULT 'free-conversation',
    voice_id TEXT NOT NULL DEFAULT 'echo',
    xp INTEGER NOT NULL DEFAULT 0,
    crazy_level INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE SESSÕES DE TREINO
CREATE TABLE IF NOT EXISTS public.mrcrazy_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.mrcrazy_profiles(id) ON DELETE CASCADE,
    session_mode TEXT NOT NULL DEFAULT 'free-conversation',
    level TEXT NOT NULL DEFAULT 'basic',
    voice TEXT NOT NULL DEFAULT 'echo',
    turns_count INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    crazy_level_reached INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- 3. TABELA DE TURNOS DA CONVERSA (HISTÓRICO ESTILO WHATSAPP)
CREATE TABLE IF NOT EXISTS public.mrcrazy_conversation_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.mrcrazy_sessions(id) ON DELETE CASCADE,
    turn_index INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    text TEXT NOT NULL,
    pronunciation_score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE ERROS E TREINO FONÉTICO (EPÊNTESE, TH, R, L, ED)
CREATE TABLE IF NOT EXISTS public.mrcrazy_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.mrcrazy_sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.mrcrazy_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    word_or_phrase TEXT NOT NULL,
    correction_tip TEXT,
    mastered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABELA DE VOCABULÁRIO E EXPRESSÕES APRENDIDAS
CREATE TABLE IF NOT EXISTS public.mrcrazy_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.mrcrazy_profiles(id) ON DELETE CASCADE,
    english_term TEXT NOT NULL,
    portuguese_context TEXT NOT NULL,
    example_sentence TEXT,
    repetition_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_mrcrazy_sessions_profile_id ON public.mrcrazy_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_turns_session_id ON public.mrcrazy_conversation_turns(session_id, turn_index);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_mistakes_session_id ON public.mrcrazy_mistakes(session_id);
CREATE INDEX IF NOT EXISTS idx_mrcrazy_vocab_profile_id ON public.mrcrazy_vocabulary(profile_id);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.mrcrazy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrcrazy_vocabulary ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (PERMITE ANON E AUTHENTICATED)
DO $$
BEGIN
    -- PROFILES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_profiles' AND policyname = 'Allow public read profiles') THEN
        CREATE POLICY "Allow public read profiles" ON public.mrcrazy_profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_profiles' AND policyname = 'Allow public insert profiles') THEN
        CREATE POLICY "Allow public insert profiles" ON public.mrcrazy_profiles FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_profiles' AND policyname = 'Allow public update profiles') THEN
        CREATE POLICY "Allow public update profiles" ON public.mrcrazy_profiles FOR UPDATE USING (true);
    END IF;

    -- SESSIONS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_sessions' AND policyname = 'Allow public read sessions') THEN
        CREATE POLICY "Allow public read sessions" ON public.mrcrazy_sessions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_sessions' AND policyname = 'Allow public insert sessions') THEN
        CREATE POLICY "Allow public insert sessions" ON public.mrcrazy_sessions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_sessions' AND policyname = 'Allow public update sessions') THEN
        CREATE POLICY "Allow public update sessions" ON public.mrcrazy_sessions FOR UPDATE USING (true);
    END IF;

    -- TURNS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_conversation_turns' AND policyname = 'Allow public read turns') THEN
        CREATE POLICY "Allow public read turns" ON public.mrcrazy_conversation_turns FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_conversation_turns' AND policyname = 'Allow public insert turns') THEN
        CREATE POLICY "Allow public insert turns" ON public.mrcrazy_conversation_turns FOR INSERT WITH CHECK (true);
    END IF;

    -- MISTAKES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_mistakes' AND policyname = 'Allow public read mistakes') THEN
        CREATE POLICY "Allow public read mistakes" ON public.mrcrazy_mistakes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_mistakes' AND policyname = 'Allow public insert mistakes') THEN
        CREATE POLICY "Allow public insert mistakes" ON public.mrcrazy_mistakes FOR INSERT WITH CHECK (true);
    END IF;

    -- VOCABULARY
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_vocabulary' AND policyname = 'Allow public read vocabulary') THEN
        CREATE POLICY "Allow public read vocabulary" ON public.mrcrazy_vocabulary FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mrcrazy_vocabulary' AND policyname = 'Allow public insert vocabulary') THEN
        CREATE POLICY "Allow public insert vocabulary" ON public.mrcrazy_vocabulary FOR INSERT WITH CHECK (true);
    END IF;
END $$;
