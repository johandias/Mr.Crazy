-- =====================================================================
-- MR.CRAZY - MIGRATION: CÓDIGO E LINK DE VERIFICAÇÃO DE E-MAIL (RESEND)
-- =====================================================================

-- Adiciona colunas para armazenamento de código de validação de 6 dígitos e expiração
ALTER TABLE public.mrcrazy_users 
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Índice para busca rápida de validação de código
CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_verification_code 
  ON public.mrcrazy_users(verification_code);
