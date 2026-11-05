"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminUpload } from "@/lib/admin-api";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/api";

import { orderStatusLabel } from "@/lib/order-status";
import { shippingMethodLabel, paymentKindLabel, paymentStatusLabel, paymentProviderLabel } from "@/lib/labels";

const statuses = [
  "pending",
  "paid",
  "deposit_paid",
  "in_workshop",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("");
  const [folio, setFolio] = useState("");

  const load = () =>
    adminFetch(`/api/admin/orders/${params.id}/`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        if (data.status) setStatus(String(data.status));
      });

  useEffect(() => {
    load();
  }, [params.id]);

  if (!order) return <p>Cargando…</p>;

  const items = (order.items as { name_snapshot: string; qty: number; unit_price: number }[]) || [];
  const payments =
    (order.payments as { provider: string; amount: number; status: string; payment_kind: string }[]) ||
    [];
  const address = order.shipping_address as { name?: string; street?: string } | undefined;

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Pedido {order.number as string}</h1>
      <p className="mt-2 text-sm text-taupe">{order.email as string}</p>
      <div className="mt-2">
        <OrderStatusBadge status={String(order.status)} />
      </div>

      <div className="mt-8 grid gap-4 bg-blanco p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-label text-taupe">Despacho</p>
          <p className="mt-2">{address?.name}</p>
          <p>{address?.street}</p>
          <p className="mt-1 text-taupe">{shippingMethodLabel(String(order.shipping_method))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-label text-taupe">Montos</p>
          <p className="mt-2">Subtotal: {formatCLP(order.subtotal as number)}</p>
          <p>Despacho: {formatCLP(order.shipping_cost as number)}</p>
          <p className="font-serif text-lg">Total: {formatCLP(order.total as number)}</p>
          {(order.deposit_amount as number) > 0 && (
            <>
              <p className="mt-2 text-champ">Abono: {formatCLP(order.deposit_amount as number)}</p>
              <p>Saldo: {formatCLP(order.balance_due as number)}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blanco p-4">
        <p className="text-[10px] uppercase tracking-label text-taupe">Productos</p>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={`${item.name_snapshot}-${item.qty}`} className="flex justify-between">
              <span>
                {item.name_snapshot} × {item.qty}
              </span>
              <span>{formatCLP(item.unit_price * item.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      {payments.length > 0 && (
        <div className="mt-6 bg-blanco p-4 text-sm">
          <p className="text-[10px] uppercase tracking-label text-taupe">Pagos</p>
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li key={`${p.provider}-${p.amount}`} className="flex justify-between">
                <span>
                  {paymentProviderLabel(p.provider)} ({paymentKindLabel(p.payment_kind)}) —{" "}
                  {paymentStatusLabel(p.status)}
                </span>
                <span>{formatCLP(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-2 bg-blanco p-4">
        <select className="border border-arena px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
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
          className="mt-2 block w-full text-sm file:mr-3 file:border file:border-arena file:bg-marfil file:px-3 file:py-2 file:text-xs file:uppercase"
          aria-label="Subir PDF tributario"
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
