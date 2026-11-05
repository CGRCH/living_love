export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? true;
}

export async function logout() {
  await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
}

export async function register(data: Record<string, string>) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getSession() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const q = `/api/proxy?path=${encodeURIComponent(path)}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(q, { ...init, headers, credentials: "include" });
}
