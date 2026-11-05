"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminUpload } from "@/lib/admin-api";
import { formatCLP } from "@/lib/api";

export default function AdminShippingPage() {
  const [rates, setRates] = useState<{ id: number; region: string; commune: string | null; price: number }[]>([]);

  const load = () => adminFetch("/api/admin/shipping-rates/").then((r) => r.json()).then(setRates);

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Despachos</h1>
      <div className="mt-4 flex gap-4 text-xs uppercase tracking-label">
        <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/shipping-rates/export/`} className="underline">
          Exportar CSV
        </a>
        <label>
          Importar
          <input
            type="file"
            accept=".csv"
            className="ml-2"
            onChange={async (e) => {
              const fd = new FormData();
              fd.append("file", e.target.files![0]);
              await adminUpload("/api/admin/shipping-rates/import/", fd);
              load();
            }}
          />
        </label>
      </div>
      <table className="mt-8 w-full bg-blanco text-sm">
        <thead className="text-[10px] uppercase tracking-label text-taupe">
          <tr>
            <th className="p-2 text-left">Región</th>
            <th>Comuna</th>
            <th>Tarifa</th>
          </tr>
        </thead>
        <tbody>
          {rates.slice(0, 50).map((r) => (
            <tr key={r.id} className="border-t border-arena/30">
              <td className="p-2">{r.region}</td>
              <td>{r.commune || "Regional"}</td>
              <td>{r.price ? formatCLP(r.price) : "Gratis"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
