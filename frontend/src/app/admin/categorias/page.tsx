"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<{ id: number; name: string; slug: string; order: number }[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", order: "0" });

  const load = () => adminFetch("/api/admin/categories/").then((r) => r.json()).then((d) => setItems(d.results ?? d));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Categorías</h1>
      <form
        className="mt-6 flex flex-wrap gap-2 bg-blanco p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await adminFetch("/api/admin/categories/", {
            method: "POST",
            body: JSON.stringify({ name: form.name, slug: form.slug, order: Number(form.order), is_active: true }),
          });
          load();
        }}
      >
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Button type="submit">Crear</Button>
      </form>
      <ul className="mt-8 divide-y bg-blanco">
        {items.map((c) => (
          <li key={c.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="font-serif">{c.name}</span>
            <span className="text-taupe">{c.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
