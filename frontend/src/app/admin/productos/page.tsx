"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch, adminUpload } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/api";

type Product = {
  id: number;
  slug: string;
  name: string;
  base_price: number;
  price_mode: string;
  is_active: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category_id: "1",
    base_price: "0",
    price_mode: "show_price",
  });

  const load = () =>
    adminFetch("/api/admin/products/?page_size=100").then((r) => r.json()).then((d) => setProducts(d.results ?? d));

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminFetch("/api/admin/products/", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        category_id: Number(form.category_id),
        base_price: Number(form.base_price),
        price_mode: form.price_mode,
        is_active: true,
      }),
    });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl">Productos</h1>
        <div className="flex gap-2">
          <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/products/export_csv/`} className="text-xs uppercase tracking-label underline">
            Exportar CSV
          </a>
        </div>
      </div>
      <form onSubmit={create} className="mt-8 grid gap-3 border border-arena/40 bg-blanco p-4 md:grid-cols-3">
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Precio base" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
        <select className="border border-arena px-2 py-2 text-sm" value={form.price_mode} onChange={(e) => setForm({ ...form, price_mode: e.target.value })}>
          <option value="show_price">Mostrar precio</option>
          <option value="quote_only">Solo cotización</option>
        </select>
        <Button type="submit">Crear producto</Button>
        <label className="text-xs">
          Importar CSV
          <input
            type="file"
            accept=".csv"
            className="mt-1 block text-xs"
            onChange={async (e) => {
              const fd = new FormData();
              fd.append("file", e.target.files![0]);
              await adminUpload("/api/admin/products/import_csv/", fd);
              load();
            }}
          />
        </label>
      </form>
      <table className="mt-8 w-full bg-blanco text-left text-sm">
        <thead className="text-[10px] uppercase tracking-label text-taupe">
          <tr>
            <th className="p-3">Producto</th>
            <th>Precio</th>
            <th>Modo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-arena/30">
              <td className="p-3 font-serif">{p.name}</td>
              <td>{formatCLP(p.base_price)}</td>
              <td className="uppercase text-xs">{p.price_mode}</td>
              <td>
                <Link href={`/admin/productos/${p.slug}`} className="underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
