"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";

export default function AdminFabricsPage() {
  const [items, setItems] = useState<{ id: number; name: string; family: string; hex: string }[]>([]);
  const [form, setForm] = useState({ name: "", family: "bouclé", hex: "#F7F3EC" });

  const load = () => adminFetch("/api/admin/fabrics/").then((r) => r.json()).then((d) => setItems(d.results ?? d));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Telas y colores</h1>
      <form
        className="mt-6 grid gap-2 bg-blanco p-4 md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await adminFetch("/api/admin/fabrics/", { method: "POST", body: JSON.stringify({ ...form, is_active: true }) });
          load();
        }}
      >
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Familia" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="#hex" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
        <Button type="submit">Añadir tela</Button>
      </form>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((f) => (
          <div key={f.id} className="border border-arena/40 bg-blanco p-3 text-sm">
            <div className="mb-2 h-10 w-full" style={{ backgroundColor: f.hex }} />
            <p className="font-medium">{f.name}</p>
            <p className="text-taupe">{f.family}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
