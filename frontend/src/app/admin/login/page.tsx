"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSession, login } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@livinglove.cl");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email, password);
    if (!user) {
      setError("Credenciales inválidas");
      return;
    }
    if (typeof user === "object" && user.role !== "admin") {
      setError("Se requiere cuenta de administración");
      return;
    }
    router.push("/admin");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-3xl">Administración</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input type="email" className="w-full border border-arena px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full border border-arena px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" full>Ingresar</Button>
      </form>
    </div>
  );
}
