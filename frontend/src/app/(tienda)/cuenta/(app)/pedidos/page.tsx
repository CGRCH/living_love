"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { formatCLP } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<
    { id: number; number: string; status: string; total: number; balance_due: number }[]
  >([]);

  useEffect(() => {
    authFetch("/api/me/orders/").then((r) => r.json()).then((d) => setOrders(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Mis pedidos</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-[10px] uppercase tracking-label text-taupe">
          <tr>
            <th>Pedido</th>
            <th>Estado</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-arena/30">
              <td className="py-3">{o.number}</td>
              <td className="uppercase">{o.status}</td>
              <td>{formatCLP(o.total)}</td>
              <td>
                <Link href={`/cuenta/pedidos/${o.id}`} className="underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
