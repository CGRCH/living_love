"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function SimulatedPaymentInner() {
  const params = useSearchParams();
  const paymentId = params.get("payment");
  const [done, setDone] = useState(false);

  const confirm = async (action: "approve" | "reject") => {
    await fetch(`${API_URL}/api/payments/simulated/${paymentId}/confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setDone(true);
  };

  useEffect(() => {
    if (!paymentId) return;
  }, [paymentId]);

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Pago procesado</h1>
        <a href="/cuenta" className="mt-6 inline-block underline">
          Ver mi cuenta
        </a>
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
