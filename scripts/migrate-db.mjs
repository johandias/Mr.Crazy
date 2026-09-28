/**
 * Mr.Crazy — Script de Migração via Supabase REST API pura (sem SDK)
 * node scripts/migrate-db.mjs
 */

import { readFileSync } from "fs";

function loadEnv(filepath = ".env.local") {
  try {
    const content = readFileSync(filepath, "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
    return env;
  } catch (err) {
    console.error("Erro ao ler .env.local:", err.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const SERVICE_KEY = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "").trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Credenciais do Supabase não encontradas no .env.local");
  process.exit(1);
}

/**
 * Verifica se tabela existe tentando fazer um SELECT via REST API
 */
async function tableExists(tableName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    // 200 ou 204 = existe; 404 = não existe; 400 com "relation" = não existe
    if (res.status === 200 || res.status === 204 || res.status === 206) return true;
    if (res.status === 404) return false;
    const body = await res.text();
    if (body.includes("relation") && body.includes("does not exist")) return false;
    // RLS pode bloquear mas tabela existe
    return res.status !== 404;
  } catch {
    return false;
  }
}

/**
 * Tenta executar SQL via Supabase Management API v1
 * (requer access token de gestão, não service_role — pode falhar)
 */
async function executeSqlManagement(sql) {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: err.message };
  }
}

const TABLES_SQL = {
  mrcrazy_users: `
CREATE TABLE IF NOT EXISTS public.mrcrazy_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  nickname TEXT,
  age INTEGER,
  gender TEXT DEFAULT 'prefiro_nao_dizer',
  learning_level TEXT DEFAULT 'basic' CHECK (learning_level IN ('basic', 'intermediate', 'advanced')),
  self_assessed_level TEXT DEFAULT 'Iniciante',
  learning_style TEXT DEFAULT 'Conversação prática',
  main_difficulties TEXT[] DEFAULT '{}',
  learning_goal TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  assessment_score INTEGER DEFAULT 0,
  assessment_answers JSONB DEFAULT '[]',
  practice_time_seconds INTEGER DEFAULT 0,
  evolution_score INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  last_practice_date DATE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mrcrazy_users ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.mrcrazy_users(email);
GRANT ALL ON public.mrcrazy_users TO service_role;
  `,

  mrcrazy_module_progress: `
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
  `,

  mrcrazy_module_evaluations: `
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
  `,

  mrcrazy_user_usage: `
CREATE TABLE IF NOT EXISTS public.mrcrazy_user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  analyze_count INTEGER DEFAULT 0,
  speech_count INTEGER DEFAULT 0,
  realtime_count INTEGER DEFAULT 0,
  insights_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT mrcrazy_user_usage_user_date_unique UNIQUE (user_email, date)
);
ALTER TABLE public.mrcrazy_user_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_usage_user_email ON public.mrcrazy_user_usage(user_email);
GRANT ALL ON public.mrcrazy_user_usage TO service_role;
  `,

  mrcrazy_practice_sessions: `
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
  `
};

async function run() {
  console.log(`\n🚀 Mr.Crazy — Migração do Banco de Dados`);
  console.log(`   Projeto: ${PROJECT_REF}`);
  console.log(`   URL: ${SUPABASE_URL}\n`);

  // Primeiro testa a Management API
  console.log("🔍 Testando Management API...");
  const testResult = await executeSqlManagement("SELECT 1 as test");
  const hasManagementApi = testResult.ok;
  
  if (hasManagementApi) {
    console.log("✅ Management API disponível!\n");
    
    for (const [tableName, sql] of Object.entries(TABLES_SQL)) {
      process.stdout.write(`  📋 Criando ${tableName}... `);
      const result = await executeSqlManagement(sql);
      if (result.ok) {
        console.log("✅");
      } else {
        const exists = await tableExists(tableName);
        if (exists) {
          console.log("⚠️  (já existe)");
        } else {
          console.log(`❌ HTTP ${result.status}: ${result.body.slice(0, 200)}`);
        }
      }
    }
  } else {
    console.log(`⚠️  Management API indisponível (HTTP ${testResult.status})`);
    console.log("   → Verificando tabelas existentes via REST API...\n");
    
    for (const tableName of Object.keys(TABLES_SQL)) {
      process.stdout.write(`  🔍 ${tableName}... `);
      const exists = await tableExists(tableName);
      if (exists) {
        console.log("✅ Existe");
      } else {
        console.log("❌ NÃO EXISTE");
      }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("📋 SQL PARA CRIAR AS TABELAS MANUALMENTE:");
    console.log("   Acesse: https://supabase.com/dashboard/project/" + PROJECT_REF + "/sql/new");
    console.log("=".repeat(70));
    
    for (const [tableName, sql] of Object.entries(TABLES_SQL)) {
      console.log(`\n-- ${tableName.toUpperCase()}`);
      console.log(sql.trim());
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("\n⚡ COLE TODO O SQL ACIMA NO SQL EDITOR DO SUPABASE E EXECUTE.\n");
  }
}

run().catch(console.error);
