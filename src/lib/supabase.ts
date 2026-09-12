import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim() ||
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  "";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey)
);

// Client público (navegador e consultas gerais)
export const supabase = createClient(
  supabaseUrl || "https://placeholder-mrcrazy.supabase.co",
  supabaseAnonKey || supabaseServiceRoleKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "mrcrazy-auth-token"
    }
  }
);

// Client administrativo para rotas de servidor (ignora RLS quando service_role fornecida)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder-mrcrazy.supabase.co",
  supabaseServiceRoleKey || supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

