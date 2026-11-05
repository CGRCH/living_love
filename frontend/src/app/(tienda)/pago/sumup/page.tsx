"use client";

import Link from "next/link";

export default function SumUpPaymentPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">Pago SumUp</h1>
      <p className="mt-4 text-sm text-taupe">
        Si fue redirigido desde SumUp, complete el pago en su app o vuelva al checkout para reintentar.
      </p>
      <Link href="/checkout" className="mt-8 inline-block text-sm uppercase tracking-label underline">
        Volver al checkout
      </Link>
    </div>
  );
}
