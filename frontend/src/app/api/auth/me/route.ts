import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  const access = cookies().get("ll_access")?.value;
  if (!access) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const me = await fetch(`${API_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!me.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: await me.json() });
}
