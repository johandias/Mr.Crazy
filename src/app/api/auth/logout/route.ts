import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login?reset=1", request.url));

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
