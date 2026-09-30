-- =====================================================================
-- MR.CRAZY - MIGRATION: TOKENS DE REDEFINIÇÃO DE SENHA
-- =====================================================================

ALTER TABLE public.mrcrazy_users
  ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mrcrazy_users_password_reset_token_hash
  ON public.mrcrazy_users(password_reset_token_hash)
  WHERE password_reset_token_hash IS NOT NULL;
