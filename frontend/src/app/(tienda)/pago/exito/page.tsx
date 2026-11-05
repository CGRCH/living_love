"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">¡Gracias!</h1>
      <p className="mt-4 text-taupe">
        {order ? (
          <>
            Tu pedido <strong className="text-onix">{order}</strong> fue registrado. Te contactaremos por
            WhatsApp.
          </>
        ) : (
          "Tu pago fue registrado. Te contactaremos por WhatsApp."
        )}
      </p>
      <Link href="/cuenta/pedidos" className="mt-8 inline-block underline">
        Ver mis pedidos
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
