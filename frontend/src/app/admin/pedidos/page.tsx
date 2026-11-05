"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatCLP } from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<{ id: number; number: string; status: string; email: string; total: number }[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/orders/").then((r) => r.json()).then((d) => setOrders(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedidos</h1>
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
              <td className="uppercase">{o.status}</td>
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
