"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<{ id: number; number: string; status: string; email: string }[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/orders/").then((r) => r.json()).then((d) => setOrders(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedidos</h1>
      <ul className="mt-8 divide-y divide-arena/40 bg-blanco">
        {orders.map((o) => (
          <li key={o.id} className="flex justify-between px-4 py-4 text-sm">
            <span>{o.number}</span>
            <span>{o.email}</span>
            <span className="uppercase">{o.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
