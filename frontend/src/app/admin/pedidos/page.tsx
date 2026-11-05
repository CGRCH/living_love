"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch, adminDownload } from "@/lib/admin-api";
import { formatCLP } from "@/lib/api";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<{ id: number; number: string; status: string; email: string; total: number }[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/orders/").then((r) => r.json()).then((d) => setOrders(d.results ?? d));
  }, []);

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Pedidos</h1>
        <button
          type="button"
          className="border border-arena bg-blanco px-4 py-2 text-xs uppercase"
          onClick={() => adminDownload("/api/admin/orders/export_csv/", "pedidos.csv")}
        >
          Exportar CSV
        </button>
      </div>
      <table className="mt-8 w-full bg-blanco text-sm">
        <thead className="text-[10px] uppercase tracking-label text-taupe">
          <tr>
            <th className="p-2 text-left">N°</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-arena/30">
              <td className="p-2">{o.number}</td>
              <td>{o.email}</td>
              <td>{formatCLP(o.total)}</td>
              <td>
                <OrderStatusBadge status={o.status} />
              </td>
              <td>
                <Link href={`/admin/pedidos/${o.id}`} className="underline">
                  Detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
