"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminUpload } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";

export default function AdminProductEditPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [groups, setGroups] = useState<{ id: number; name: string; values: { id: number; label: string; price_delta: number }[] }[]>([]);
  const [newGroup, setNewGroup] = useState({ name: "Medida", type: "single" });
  const [newValue, setNewValue] = useState({ group: "", label: "", price_delta: "0", triggers_quote: false });

  const load = () => {
    adminFetch(`/api/admin/products/${params.slug}/`).then((r) => r.json()).then((p) => {
      setProduct(p);
      setGroups(p.option_groups || []);
    });
  };

  useEffect(() => {
    load();
  }, [params.slug]);

  if (!product) return <p>Cargando…</p>;

  const save = async () => {
    await adminFetch(`/api/admin/products/${params.slug}/`, {
      method: "PATCH",
      body: JSON.stringify(product),
    });
    load();
  };

  const FIELD_LABELS: Record<string, string> = {
    name: "Nombre",
    slug: "Slug",
    base_price: "Precio base",
    price_mode: "Modo de precio",
    lead_time_text: "Plazo de fabricación",
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">{product.name as string}</h1>
      <div className="mt-6 space-y-3 bg-blanco p-4">
        {["name", "slug", "base_price", "price_mode", "lead_time_text"].map((field) => (
          <label key={field} className="block text-xs uppercase tracking-label text-taupe">
            {FIELD_LABELS[field] ?? field}
            <input
              className="mt-1 w-full border border-arena px-2 py-2 text-sm normal-case"
              value={String(product[field] ?? "")}
              onChange={(e) => setProduct({ ...product, [field]: e.target.value })}
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(product.requires_deposit)}
            onChange={(e) => setProduct({ ...product, requires_deposit: e.target.checked })}
          />
          Abono 50% (a medida)
        </label>
        <Button onClick={save}>Guardar producto</Button>
        <label className="block text-xs uppercase tracking-label text-taupe">
          Imagen
          <input
            type="file"
            className="mt-1"
            onChange={async (e) => {
              const fd = new FormData();
              fd.append("image", e.target.files![0]);
              await adminUpload(`/api/admin/products/${params.slug}/upload_image/`, fd);
              load();
            }}
          />
        </label>
      </div>
      <h2 className="mt-10 font-serif text-xl">Opciones / recargos</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="border border-arena px-2 py-1 text-sm" placeholder="Grupo" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
        <Button
          variant="outline"
          onClick={async () => {
            await adminFetch("/api/admin/option-groups/", {
              method: "POST",
              body: JSON.stringify({ product: (product as { id: number }).id, name: newGroup.name, type: newGroup.type, required: true, order: groups.length }),
            });
            load();
          }}
        >
          Añadir grupo
        </Button>
      </div>
      {groups.map((g) => (
        <div key={g.id} className="mt-6 border border-arena/40 bg-blanco p-4">
          <p className="text-[10px] uppercase tracking-label">{g.name}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {g.values?.map((v) => (
              <li key={v.id}>
                {v.label} ({v.price_delta >= 0 ? "+" : ""}
                {v.price_delta})
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="border border-arena px-2 py-1 text-sm" placeholder="Etiqueta" onChange={(e) => setNewValue({ ...newValue, group: String(g.id), label: e.target.value })} />
            <Button
              variant="outline"
              onClick={async () => {
                await adminFetch("/api/admin/option-values/", {
                  method: "POST",
                  body: JSON.stringify({
                    group: g.id,
                    label: newValue.label,
                    price_delta: Number(newValue.price_delta),
                    triggers_quote: newValue.triggers_quote,
                    order: g.values?.length || 0,
                  }),
                });
                load();
              }}
            >
              Añadir valor
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
