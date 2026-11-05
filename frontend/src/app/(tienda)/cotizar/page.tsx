"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function QuotePage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    product: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/quotes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options: {} }),
    });
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Cotización enviada</h1>
        <p className="mt-4 text-taupe">Te responderemos a la brevedad.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-serif text-4xl">Solicitar cotización</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {[
          ["name", "Nombre"],
          ["email", "Email"],
          ["phone", "Teléfono"],
        ].map(([key, label]) => (
          <label key={key} className="block text-xs uppercase tracking-label text-taupe">
            {label}
            <input
              required
              className="mt-1 w-full border border-arena px-3 py-2 text-sm normal-case"
              value={(form as Record<string, string>)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="block text-xs uppercase tracking-label text-taupe">
          Mensaje
          <textarea
            className="mt-1 w-full border border-arena px-3 py-2 text-sm normal-case"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        <Button type="submit" full>
          Enviar
        </Button>
      </form>
    </div>
  );
}
