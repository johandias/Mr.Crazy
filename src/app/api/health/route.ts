import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  let dbStatus = "not_tested";
  let dbError: unknown = null;
  let rowCount: number | null = null;

  if (isSupabaseConfigured) {
    try {
      const { count, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .select("id", { count: "exact", head: true });

      if (error) {
        dbStatus = "error";
        dbError = {
          code: error.code,
          hint: error.hint
        };
      } else {
        dbStatus = "connected";
        rowCount = count ?? 0;
      }
    } catch (err) {
      dbStatus = "exception";
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    ok: dbStatus === "connected",
    isSupabaseConfigured,
    supabase: {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(anonKey),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      status: dbStatus,
      error: dbError,
      usersCount: rowCount
    }
  });
}
