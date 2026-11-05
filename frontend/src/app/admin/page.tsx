"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatCLP } from "@/lib/api";

type Dashboard = {
  sales_month: number;
  orders_month: number;
  open_quotes: number;
  avg_ticket: number;
  sales_chart: { month: string; total: number }[];
  top_products: { name_snapshot: string; units: number }[];
  recent_orders: { number: string; status: string; total: number; email: string }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard/").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p>Cargando panel…</p>;

  return (
    <div data-testid="admin-dashboard-ready">
      <p className="text-[10px] uppercase tracking-label text-taupe">
        {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <h1 className="font-serif text-4xl">Buenos días, Cesar</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          ["Ventas del mes", formatCLP(data.sales_month)],
          ["Pedidos", String(data.orders_month)],
          ["Cotizaciones abiertas", String(data.open_quotes)],
          ["Ticket promedio", formatCLP(data.avg_ticket)],
        ].map(([label, value]) => (
          <div key={label} className="bg-blanco p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-label text-taupe">{label}</p>
            <p className="mt-2 font-serif text-2xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="bg-blanco p-6">
          <p className="font-serif text-xl">Ventas 2026</p>
          <div className="mt-6 flex h-40 items-end gap-2">
            {data.sales_chart.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full bg-onix"
                  style={{ height: `${Math.max(8, m.total / 500000)}px` }}
                />
                <span className="text-[10px] text-taupe">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-onix p-6 text-blanco">
          <p className="font-serif text-xl">Top productos</p>
          <ul className="mt-6 space-y-4 text-sm">
            {data.top_products.map((p) => (
              <li key={p.name_snapshot}>
                <div className="flex justify-between">
                  <span>{p.name_snapshot}</span>
                  <span>{p.units} u.</span>
                </div>
                <div className="mt-1 h-1 bg-grafito">
                  <div className="h-full bg-champ" style={{ width: `${p.units * 8}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-10 bg-blanco p-6">
        <div className="flex justify-between">
          <p className="font-serif text-xl">Pedidos recientes</p>
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-label text-taupe">
            <tr>
              <th className="py-2">N°</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_orders.map((o) => (
              <tr key={o.number} className="border-t border-arena/30">
                <td className="py-3">{o.number}</td>
                <td>{o.email}</td>
                <td>{formatCLP(o.total)}</td>
                <td>
                  <span className="bg-marfil px-2 py-1 text-[10px] uppercase">{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
