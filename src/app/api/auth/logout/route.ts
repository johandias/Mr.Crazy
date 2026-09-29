import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isSwitch = url.searchParams.get("switch") === "1";
  const redirectTarget = isSwitch ? "/login?switch=1" : "/login?reset=1";
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const isSwitch = url.searchParams.get("switch") === "1";
  const response = NextResponse.json({ ok: true, redirectTo: isSwitch ? "/login?switch=1" : "/login?reset=1" });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
    path: "/",
    maxAge: 0
  });

  return response;
}
