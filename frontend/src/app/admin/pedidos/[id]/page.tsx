"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminUpload } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/api";

const statuses = ["pending", "paid", "deposit_paid", "in_workshop", "ready", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("in_workshop");
  const [folio, setFolio] = useState("");

  const load = () => adminFetch(`/api/admin/orders/${params.id}/`).then((r) => r.json()).then(setOrder);

  useEffect(() => {
    load();
  }, [params.id]);

  if (!order) return <p>Cargando…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Pedido {order.number as string}</h1>
      <p className="mt-2 text-sm text-taupe">{order.email as string}</p>
      <p className="mt-4 font-serif text-xl">{formatCLP(order.total as number)}</p>
      <div className="mt-8 flex flex-wrap gap-2 bg-blanco p-4">
        <select className="border border-arena px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={async () => {
            await adminFetch(`/api/admin/orders/${params.id}/status/`, {
              method: "POST",
              body: JSON.stringify({ status, note: "Actualizado desde admin" }),
            });
            load();
          }}
        >
          Cambiar estado
        </Button>
      </div>
      <div className="mt-8 bg-blanco p-4">
        <p className="text-[10px] uppercase tracking-label">Documento tributario (PDF)</p>
        <input className="mt-2 border border-arena px-2 py-2 text-sm" placeholder="Folio" value={folio} onChange={(e) => setFolio(e.target.value)} />
        <input
          type="file"
          accept="application/pdf"
          className="mt-2 block text-sm"
          onChange={async (e) => {
            const fd = new FormData();
            fd.append("pdf", e.target.files![0]);
            fd.append("folio", folio);
            fd.append("type", String(order.doc_type || "boleta"));
            await adminUpload(`/api/admin/orders/${params.id}/upload_document/`, fd);
            load();
          }}
        />
      </div>
    </div>
  );
}
