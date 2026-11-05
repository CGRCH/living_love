"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { API_URL, formatCLP } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function SimulatedPaymentInner() {
  const params = useSearchParams();
  const paymentId = params.get("payment");
  const [done, setDone] = useState<{
    approved: boolean;
    orderNumber?: string;
    amount?: number;
  } | null>(null);

  const confirm = async (action: "approve" | "reject") => {
    const res = await fetch(`${API_URL}/api/payments/simulated/${paymentId}/confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    const approved = action === "approve" && res.ok && data.status === "approved";
    setDone({
      approved,
      orderNumber: data.order?.number,
      amount: data.order?.amount_due_now ?? data.order?.total,
    });
  };

  if (done && !done.approved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Pago no completado</h1>
        <p className="mt-4 text-sm text-taupe">El pago fue rechazado. Puedes intentar nuevamente desde tu carro.</p>
        <Link href="/carro" className="mt-8 inline-block underline">
          Volver al carro
        </Link>
      </div>
    );
  }

  if (done?.approved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Pago procesado</h1>
        {done.orderNumber && (
          <p className="mt-4 text-sm">
            Pedido <strong>{done.orderNumber}</strong>
            {done.amount ? ` · Abono ${formatCLP(done.amount)}` : null}
          </p>
        )}
        <Link href="/cuenta/pedidos" className="mt-8 inline-block underline">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">Pago simulado</h1>
      <p className="mt-4 text-sm text-taupe">Modo desarrollo — elige resultado</p>
      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={() => confirm("approve")}>Aprobar</Button>
        <Button variant="outline" onClick={() => confirm("reject")}>
          Rechazar
        </Button>
      </div>
    </div>
  );
}

export default function SimulatedPaymentPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Cargando pago…</div>}>
      <SimulatedPaymentInner />
    </Suspense>
  );
}
