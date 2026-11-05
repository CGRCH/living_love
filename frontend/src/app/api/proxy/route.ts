import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ACCESS_COOKIE = "ll_access";
const REFRESH_COOKIE = "ll_refresh";

async function refreshAccess(refresh: string) {
  const res = await fetch(`${API_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function forwardRequest(req: NextRequest, method: string, access?: string) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ detail: "path requerido" }, { status: 400 });
  }
  const headers: Record<string, string> = {};
  if (access) headers.Authorization = `Bearer ${access}`;
  const contentType = req.headers.get("content-type");
  if (contentType && !contentType.includes("multipart")) {
    headers["Content-Type"] = contentType;
  }
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength) body = buf;
  }
  return fetch(`${API_URL}${path}`, { method, headers, body });
}

async function buildResponse(upstream: Response, newAccess?: string) {
  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf, { status: upstream.status });
  const ct = upstream.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);
  if (newAccess) {
    res.cookies.set(ACCESS_COOKIE, newAccess, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 900,
    });
  }
  return res;
}

async function withAuth(req: NextRequest, method: string) {
  const jar = cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  let upstream = await forwardRequest(req, method, access);
  if (upstream instanceof NextResponse) return upstream;
  if (upstream.status === 401 && jar.get(REFRESH_COOKIE)?.value) {
    const tokens = await refreshAccess(jar.get(REFRESH_COOKIE)!.value);
    if (tokens?.access) {
      access = tokens.access;
      upstream = await forwardRequest(req, method, access);
      if (upstream instanceof NextResponse) return upstream;
      return buildResponse(upstream, tokens.access);
    }
  }
  return buildResponse(upstream);
}

export async function GET(req: NextRequest) {
  return withAuth(req, "GET");
}

export async function POST(req: NextRequest) {
  return withAuth(req, "POST");
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, "PATCH");
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, "DELETE");
}
