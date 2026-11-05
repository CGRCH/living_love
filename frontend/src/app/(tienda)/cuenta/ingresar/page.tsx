"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email, password);
    if (!user) {
      setError("Credenciales inválidas");
      return;
    }
    router.push("/cuenta");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-serif text-4xl">Ingresar</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          type="email"
          className="w-full border border-arena px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border border-arena px-3 py-2"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" full>
          Ingresar
        </Button>
      </form>
      <p className="mt-6 text-sm text-taupe">
        ¿Nueva en Living Love?{" "}
        <Link href="/cuenta/registro" className="underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
