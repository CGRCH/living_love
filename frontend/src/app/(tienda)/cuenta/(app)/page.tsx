"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { formatCLP } from "@/lib/api";

export default function AccountHomePage() {
  const [orders, setOrders] = useState<{ number: string; status: string; total: number }[]>([]);

  useEffect(() => {
    authFetch("/api/me/orders/").then((r) => r.json()).then((d) => setOrders((d.results ?? d).slice(0, 3)));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Bienvenida</h1>
      <p className="mt-2 text-sm text-taupe">Gestiona pedidos, cotizaciones y direcciones.</p>
      <h2 className="mt-10 font-serif text-xl">Pedidos recientes</h2>
      <ul className="mt-4 divide-y divide-arena/40">
        {orders.map((o) => (
          <li key={o.number} className="flex justify-between py-4 text-sm">
            <Link href={`/cuenta/pedidos/${(o as { id: number }).id}`} className="font-medium">
              {o.number}
            </Link>
            <span className="uppercase text-taupe">{o.status}</span>
            <span>{formatCLP(o.total)}</span>
          </li>
        ))}
        {!orders.length && <li className="py-4 text-taupe">Aún no tienes pedidos.</li>}
      </ul>
    </div>
  );
}
