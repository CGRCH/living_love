"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login, register } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form);
    await login(form.email, form.password);
    router.push("/cuenta");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-serif text-4xl">Crear cuenta</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {[
          ["first_name", "Nombre"],
          ["last_name", "Apellido"],
          ["email", "Email"],
          ["phone", "Teléfono"],
          ["password", "Contraseña"],
        ].map(([key, label]) => (
          <label key={key} className="block text-xs uppercase tracking-label text-taupe">
            {label}
            <input
              type={key === "password" ? "password" : key === "email" ? "email" : "text"}
              className="mt-1 w-full border border-arena px-3 py-2 text-sm normal-case"
              value={(form as Record<string, string>)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}
        <Button type="submit" full>
          Registrarme
        </Button>
      </form>
      <Link href="/cuenta/ingresar" className="mt-6 inline-block text-sm underline">
        Ya tengo cuenta
      </Link>
    </div>
  );
}
