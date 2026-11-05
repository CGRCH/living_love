"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { formatCLP } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type Order = {
  id: number;
  number: string;
  status: string;
  total: number;
  balance_due: number;
  deposit_amount: number;
  events: { status: string; note: string; created_at: string }[];
  tax_documents: { id: number; type: string; folio: string; download_url: string | null }[];
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);

  const load = () => {
    authFetch(`/api/me/orders/${params.id}/`)
      .then((r) => r.json())
      .then(setOrder);
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const payBalance = async () => {
    const res = await authFetch(`/api/me/orders/${params.id}/pay-balance/`, {
      method: "POST",
      body: JSON.stringify({ payment_provider: "simulated" }),
    });
    const data = await res.json();
    if (data.payment_redirect) window.location.href = data.payment_redirect;
  };

  if (!order) return <p>Cargando…</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedido {order.number}</h1>
      <p className="mt-2 text-sm uppercase text-taupe">{order.status}</p>
      <p className="mt-4 font-serif text-xl">{formatCLP(order.total)}</p>
      {order.balance_due > 0 && (
        <div className="mt-6 border border-champ/40 bg-marfil p-4">
          <p className="text-sm">Saldo pendiente: {formatCLP(order.balance_due)}</p>
          <Button className="mt-4" onClick={payBalance}>
            Pagar saldo (50%)
          </Button>
        </div>
      )}
      <h2 className="mt-10 text-[10px] uppercase tracking-label">Documentos</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {order.tax_documents?.map((d) => (
          <li key={d.id}>
            {d.type} {d.folio}{" "}
            {d.download_url ? (
              <a
                href={`/api/proxy?path=${encodeURIComponent(`/api/me/orders/${params.id}/documents/${d.id}/download/`)}`}
                className="underline"
              >
                Descargar PDF
              </a>
            ) : null}
          </li>
        ))}
        {!order.tax_documents?.length && <li className="text-taupe">Documento pendiente de emisión.</li>}
      </ul>
      <h2 className="mt-10 text-[10px] uppercase tracking-label">Historial</h2>
      <ul className="mt-3 space-y-2 text-sm text-taupe">
        {order.events?.map((e, i) => (
          <li key={i}>
            {new Date(e.created_at).toLocaleString("es-CL")} — {e.status}: {e.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
