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

  let usersData: unknown = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .select("id, email, role, status, created_at");

      if (error) {
        dbStatus = "error";
        dbError = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        };
      } else {
        dbStatus = "connected";
        rowCount = data?.length ?? 0;
        usersData = data;
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
      urlSnippet: url ? url.slice(0, 30) + "..." : null,
      hasAnonKey: Boolean(anonKey),
      anonKeySnippet: anonKey ? anonKey.slice(0, 10) + "..." : null,
      hasServiceRoleKey: Boolean(serviceRoleKey),
      status: dbStatus,
      error: dbError,
      usersCount: rowCount,
      dbUsers: usersData
    }
  });
}
