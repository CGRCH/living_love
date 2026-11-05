"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@livinglove.cl");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError("Credenciales inválidas");
      return;
    }
    localStorage.setItem("ll_admin_token", data.access);
    localStorage.setItem("ll_admin_refresh", data.refresh);
    router.push("/admin");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-3xl">Administración</h1>
      <form onSubmit={login} className="mt-8 space-y-4">
        <input
          className="w-full border border-arena px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="w-full border border-arena px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" full>
          Ingresar
        </Button>
      </form>
    </div>
  );
}
