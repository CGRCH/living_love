"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { fetchCommunes, fetchRegions } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type Address = {
  id: number;
  name: string;
  phone: string;
  street: string;
  number: string;
  apt: string;
  region: { id: number; name: string };
  commune: { id: number; name: string };
  is_default: boolean;
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [communes, setCommunes] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    apt: "",
    region_id: "",
    commune_id: "",
    is_default: true,
  });

  const load = () => authFetch("/api/me/addresses/").then((r) => r.json()).then((d) => setItems(d.results ?? d));

  useEffect(() => {
    load();
    fetchRegions().then((r) => setRegions(r.results ?? r));
  }, []);

  useEffect(() => {
    if (form.region_id) fetchCommunes(Number(form.region_id)).then((c) => setCommunes(c.results ?? c));
  }, [form.region_id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch("/api/me/addresses/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        region_id: Number(form.region_id),
        commune_id: Number(form.commune_id),
      }),
    });
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-3xl">Direcciones</h1>
      <ul className="mt-6 space-y-4">
        {items.map((a) => (
          <li key={a.id} className="border border-arena/40 p-4 text-sm">
            <strong>{a.name}</strong> — {a.street} {a.number}, {a.commune.name}
            {a.is_default && <span className="ml-2 text-champ">Predeterminada</span>}
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="mt-10 grid gap-3 md:grid-cols-2">
        <input className="border border-arena px-3 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-arena px-3 py-2 text-sm" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border border-arena px-3 py-2 text-sm" placeholder="Calle" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        <input className="border border-arena px-3 py-2 text-sm" placeholder="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
        <select
          className="border border-arena px-3 py-2 text-sm"
          value={form.region_id}
          onChange={(e) => setForm({ ...form, region_id: e.target.value })}
        >
          <option value="">Región</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className="border border-arena px-3 py-2 text-sm"
          value={form.commune_id}
          onChange={(e) => setForm({ ...form, commune_id: e.target.value })}
        >
          <option value="">Comuna</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit">Guardar dirección</Button>
      </form>
    </div>
  );
}
