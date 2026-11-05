"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessInner() {
  const params = useSearchParams();
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">¡Gracias!</h1>
      <p className="mt-4 text-taupe">
        Tu pedido {params.get("order")} fue registrado. Te contactaremos por WhatsApp.
      </p>
      <Link href="/cuenta" className="mt-8 inline-block underline">
        Ver pedidos
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Cargando…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
