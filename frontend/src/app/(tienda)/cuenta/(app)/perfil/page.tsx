"use client";

import { useEffect, useState } from "react";
import { authFetch, getSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });

  useEffect(() => {
    getSession().then((s) => {
      if (s?.user) setForm({
        first_name: s.user.first_name || "",
        last_name: s.user.last_name || "",
        phone: s.user.phone || "",
      });
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch("/api/me/profile/", { method: "PATCH", body: JSON.stringify(form) });
  };

  return (
    <div>
      <h1 className="font-serif text-3xl">Perfil</h1>
      <form onSubmit={save} className="mt-8 max-w-md space-y-4">
        {(["first_name", "last_name", "phone"] as const).map((k) => (
          <input
            key={k}
            className="w-full border border-arena px-3 py-2 text-sm"
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
