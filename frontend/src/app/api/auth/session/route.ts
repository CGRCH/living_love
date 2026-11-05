import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCESS_COOKIE = "ll_access";
const REFRESH_COOKIE = "ll_refresh";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const meRes = await fetch(`${API_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${data.access}` },
  });
  const user = meRes.ok ? await meRes.json() : null;
  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(ACCESS_COOKIE, data.access, cookieOpts(15 * 60));
  response.cookies.set(REFRESH_COOKIE, data.refresh, cookieOpts(7 * 24 * 60 * 60));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
